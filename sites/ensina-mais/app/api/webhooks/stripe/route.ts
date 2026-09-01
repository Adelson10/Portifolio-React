import type Stripe from "stripe"
import { getStripe, PRICE_PARA_PLANO } from "@/lib/stripe"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

/** Recebe eventos do Stripe e mantém `assinaturas.plano` em dia  é a única fonte que grava
 *  nessa tabela fora do estado inicial "sem registro" (fallback "gratis", ver
 *  lib/atividades/limites.ts e os 3 route handlers de geração). Usa o client service-role
 *  (lib/supabase-admin.ts) porque não há sessão de usuário aqui, só o evento do Stripe. */
export async function POST(request: Request) {
  const assinatura = request.headers.get("stripe-signature")
  const corpoCru = await request.text()
  if (!assinatura) return Response.json({ error: "Assinatura ausente" }, { status: 400 })

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(corpoCru, assinatura, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[/api/webhooks/stripe] assinatura inválida:", err)
    return Response.json({ error: "Assinatura inválida" }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  switch (event.type) {
    // Disparado quando a Checkout Session (app/api/stripe/checkout/route.ts) é concluída com
    // pagamento aprovado  é aqui que `stripe_customer_id`/`stripe_subscription_id` são
    // gravados pela primeira vez, já com o `plano` certo (a sessão não sabe o `usuario_id` de
    // outra forma, por isso o `metadata` na criação). Os eventos `customer.subscription.*`
    // abaixo tratam renovações e cancelamentos, e já encontram a linha por `stripe_subscription_id`.
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const usuarioId = session.metadata?.usuario_id
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id
      if (!usuarioId || !customerId || !subscriptionId) break

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = subscription.items.data[0]?.price.id
      const plano = priceId ? PRICE_PARA_PLANO[priceId] : undefined
      if (!plano) break

      const { error } = await admin.from("assinaturas").upsert(
        {
          usuario_id: usuarioId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plano,
          status: subscription.status,
          // Âncora fixa do reset de cota a cada 30 dias (ver inicioJanelaCota em
          // lib/atividades/limites.ts)  gravada só aqui, numa compra nova de verdade.
          // customer.subscription.updated (renovação/upgrade/downgrade) NUNCA sobrescreve isso,
          // senão o relógio de 30 dias reiniciaria a cada renovação em vez de só na compra.
          assinatura_iniciada_em: new Date(subscription.start_date * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "usuario_id" }
      )
      if (error) {
        console.error("[/api/webhooks/stripe] falha ao gravar assinatura:", error, { usuarioId, subscriptionId })
        return Response.json({ error: "Falha ao gravar assinatura" }, { status: 500 })
      }
      break
    }

    // Upgrade/downgrade de plano ou mudança de status (ex.: pagamento atrasado) em renovações
    // futuras  localiza a assinatura pelo `stripe_subscription_id` gravado acima.
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price.id
      const plano = priceId ? PRICE_PARA_PLANO[priceId] : undefined
      if (!plano) break

      const { error } = await admin
        .from("assinaturas")
        .update({ plano, status: subscription.status, updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id)
      if (error) {
        console.error("[/api/webhooks/stripe] falha ao atualizar assinatura:", error, { subscriptionId: subscription.id })
        return Response.json({ error: "Falha ao atualizar assinatura" }, { status: 500 })
      }
      break
    }

    // Cancelamento  o usuário volta pro trial grátis (nunca fica sem cota nenhuma).
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const { error } = await admin
        .from("assinaturas")
        .update({ plano: "gratis", status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id)
      if (error) {
        console.error("[/api/webhooks/stripe] falha ao cancelar assinatura:", error, { subscriptionId: subscription.id })
        return Response.json({ error: "Falha ao cancelar assinatura" }, { status: 500 })
      }
      break
    }
  }

  return Response.json({ recebido: true })
}
