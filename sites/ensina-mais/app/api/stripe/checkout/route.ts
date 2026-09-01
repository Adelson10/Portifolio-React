import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getStripe, PRECOS, type PrecoId } from "@/lib/stripe"

/** Cria uma Checkout Session (ui_mode: "elements") em modo assinatura e devolve o
 *  `clientSecret`  o cliente usa isso pra montar o formulário embutido
 *  (components/checkout-form.tsx) com `CheckoutElementsProvider`, em vez de redirecionar pro
 *  Checkout hospedado da Stripe. A Stripe cuida de criar o Customer (se `customer` não for
 *  passado) e a Subscription assim que o pagamento é confirmado  não precisamos mais criar
 *  nenhum dos dois manualmente aqui.
 *  Quem grava `assinaturas.plano` de fato é o webhook (checkout.session.completed, ver
 *  app/api/webhooks/stripe/route.ts) quando a sessão é concluída. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const precoId = body?.preco as PrecoId | undefined
  const preco = precoId ? PRECOS[precoId] : undefined
  if (!preco?.priceId) {
    return Response.json({ error: "Plano inválido ou não configurado no Stripe." }, { status: 400 })
  }

  // Reaproveita o Customer existente (se o usuário já assinou/cancelou antes)  senão a Stripe
  // cria um novo Customer automaticamente ao concluir a sessão, a partir de `customer_email`.
  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("stripe_customer_id")
    .eq("usuario_id", user.id)
    .maybeSingle()
  const customerId = assinatura?.stripe_customer_id as string | undefined

  const origin = new URL(request.url).origin

  const criarSessao = (customer: string | undefined) =>
    getStripe().checkout.sessions.create({
      ui_mode: "elements",
      mode: "subscription",
      line_items: [{ price: preco.priceId, quantity: 1 }],
      customer,
      customer_email: customer ? undefined : (user.email ?? undefined),
      // Só usado se algum método de pagamento redirecionar (ex.: autenticação 3DS externa) 
      // no caminho normal o pagamento é confirmado sem sair da página (ver checkout-form.tsx).
      return_url: `${origin}/pricing`,
      metadata: { usuario_id: user.id },
    })

  let session
  try {
    session = await criarSessao(customerId)
  } catch (err) {
    // Customer pode ter sido apagado direto no Stripe (ex.: dados de teste limpos) sem que
    // `assinaturas.stripe_customer_id` fosse atualizado  nesse caso cria um Customer novo em
    // vez de derrubar o checkout. O webhook grava o customer_id certo ao concluir a sessão.
    const ehCustomerInexistente =
      customerId &&
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "resource_missing" &&
      (err as { param?: string }).param === "customer"
    if (!ehCustomerInexistente) throw err
    session = await criarSessao(undefined)
  }

  if (!session.client_secret) {
    console.error("[/api/stripe/checkout] sessão sem client_secret:", { sessionId: session.id })
    return Response.json({ error: "Não foi possível iniciar o pagamento." }, { status: 502 })
  }

  return Response.json({ clientSecret: session.client_secret })
}
