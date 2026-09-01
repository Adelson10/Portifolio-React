import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getStripe } from "@/lib/stripe"

/** Histórico de faturas (compras) do usuário  usado pela aba "Faturas" do SettingsModal.
 *  Busca direto no Stripe pelo `stripe_customer_id` gravado em `assinaturas` (ver
 *  app/api/webhooks/stripe/route.ts); quem nunca assinou não tem customer id, então volta lista vazia. */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("stripe_customer_id")
    .eq("usuario_id", user.id)
    .maybeSingle()

  if (!assinatura?.stripe_customer_id) {
    return Response.json({ faturas: [] })
  }

  const invoices = await getStripe().invoices.list({
    customer: assinatura.stripe_customer_id,
    limit: 24,
  })

  const faturas = invoices.data.map((inv) => ({
    id: inv.id,
    data: new Date(inv.created * 1000).toISOString(),
    valor: (inv.total ?? 0) / 100,
    moeda: inv.currency,
    status: inv.status,
    url: inv.hosted_invoice_url ?? inv.invoice_pdf ?? null,
  }))

  return Response.json({ faturas })
}
