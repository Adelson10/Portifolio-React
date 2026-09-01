import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getStripe } from "@/lib/stripe"

/** Agenda o cancelamento da assinatura paga do usuário pro fim do período já pago (não corta o
 *  acesso na hora  quem pagou o mês usa até o fim dele). Quem efetivamente grava `plano: "gratis"`
 *  em `assinaturas` é o webhook (`customer.subscription.deleted`, ver app/api/webhooks/stripe/route.ts),
 *  disparado pelo Stripe só quando o período realmente terminar. */
export async function POST() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("stripe_subscription_id")
    .eq("usuario_id", user.id)
    .maybeSingle()

  if (!assinatura?.stripe_subscription_id) {
    return Response.json({ error: "Nenhuma assinatura paga encontrada para cancelar." }, { status: 400 })
  }

  const subscription = await getStripe().subscriptions.update(assinatura.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  return Response.json({ currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000).toISOString() })
}
