import fs from "node:fs"
import path from "node:path"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

/** Reconciliação manual: busca a assinatura direto na API do Stripe (fonte da verdade) e
 *  grava/atualiza a linha correspondente em `assinaturas` no Supabase  para os casos em que o
 *  webhook (app/api/webhooks/stripe/route.ts) não rodou ou falhou silenciosamente.
 *
 *  Uso:
 *    npm run sync-stripe -- --usuario-id=<uuid-do-supabase> --email=<email-no-stripe>
 *    npm run sync-stripe -- --usuario-id=<uuid-do-supabase> --subscription=sub_xxx
 */

for (const linha of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const match = linha.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] ??= match[2].trim()
}

const PRICE_PARA_PLANO: Record<string, string> = {
  ...(process.env.STRIPE_PRICE_BASICO_MENSAL ? { [process.env.STRIPE_PRICE_BASICO_MENSAL]: "basico" } : {}),
  ...(process.env.STRIPE_PRICE_PREMIUM_MENSAL ? { [process.env.STRIPE_PRICE_PREMIUM_MENSAL]: "premium" } : {}),
  ...(process.env.STRIPE_PRICE_PREMIUM_ANUAL ? { [process.env.STRIPE_PRICE_PREMIUM_ANUAL]: "premium" } : {}),
}

function pegarArg(nome: string): string | undefined {
  const prefixo = `--${nome}=`
  return process.argv.find((a) => a.startsWith(prefixo))?.slice(prefixo.length)
}

async function main() {
  const usuarioId = pegarArg("usuario-id")
  const email = pegarArg("email")
  const subscriptionIdArg = pegarArg("subscription")

  if (!usuarioId || (!email && !subscriptionIdArg)) {
    console.error("Uso: npm run sync-stripe -- --usuario-id=<uuid> [--email=<email> | --subscription=sub_xxx]")
    process.exit(1)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let subscription: Stripe.Subscription
  let customerId: string

  if (subscriptionIdArg) {
    subscription = await stripe.subscriptions.retrieve(subscriptionIdArg)
    customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  } else {
    const clientes = await stripe.customers.list({ email, limit: 1 })
    const cliente = clientes.data[0]
    if (!cliente) {
      console.error(`Nenhum customer no Stripe com email "${email}".`)
      process.exit(1)
    }
    customerId = cliente.id

    const assinaturas = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 })
    if (assinaturas.data.length === 0) {
      console.error(`Customer ${customerId} não tem nenhuma subscription no Stripe.`)
      process.exit(1)
    }
    // Prioriza uma assinatura ativa/em trial; senão pega a mais recente (ex.: cancelada).
    subscription =
      assinaturas.data.find((s) => s.status === "active" || s.status === "trialing") ?? assinaturas.data[0]

    if (assinaturas.data.length > 1) {
      console.warn(
        `Aviso: customer ${customerId} tem ${assinaturas.data.length} subscriptions. Usando ${subscription.id} (status: ${subscription.status}).`
      )
    }
  }

  const priceId = subscription.items.data[0]?.price.id
  const plano = priceId ? PRICE_PARA_PLANO[priceId] : undefined
  if (!plano) {
    console.error(`Price "${priceId}" não está mapeado em PRICE_PARA_PLANO (confira as envs STRIPE_PRICE_*).`)
    process.exit(1)
  }

  console.log("Gravando em `assinaturas`:", {
    usuario_id: usuarioId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    plano,
    status: subscription.status,
  })

  const { error } = await admin.from("assinaturas").upsert(
    {
      usuario_id: usuarioId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plano,
      status: subscription.status,
      // Âncora do reset de cota a cada 30 dias (ver inicioJanelaCota em
      // lib/atividades/limites.ts)  mesmo campo gravado pelo webhook em
      // checkout.session.completed (ver app/api/webhooks/stripe/route.ts).
      assinatura_iniciada_em: new Date(subscription.start_date * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "usuario_id" }
  )

  if (error) {
    console.error("Falha ao gravar no Supabase:", error)
    process.exit(1)
  }

  console.log("OK  assinatura sincronizada com sucesso.")
}

main()
