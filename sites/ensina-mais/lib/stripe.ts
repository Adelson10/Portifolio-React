import Stripe from "stripe"
import type { Plano } from "@/lib/ai/model-por-plano"

let stripeSingleton: Stripe | null = null

// Instanciado sob demanda, não no escopo do módulo: `next build` carrega este arquivo pra
// coletar dados das rotas mesmo sem STRIPE_SECRET_KEY configurada, e o SDK do Stripe lança na
// hora da instanciação se a key estiver ausente.
export function getStripe(): Stripe {
  if (!stripeSingleton) stripeSingleton = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return stripeSingleton
}

/** Chave usada pelo cliente (`SettingsModal`) e pela rota de checkout pra escolher o Price 
 *  cada uma mapeia pro Price ID configurado no ambiente e pro `Plano` gravado em `assinaturas`
 *  quando o Stripe confirmar o pagamento (ver app/api/webhooks/stripe/route.ts). */
export const PRECOS = {
  basico_mensal: { priceId: process.env.STRIPE_PRICE_BASICO_MENSAL, plano: "basico" as Plano, label: "Básico  R$ 39,90/mês" },
  premium_mensal: { priceId: process.env.STRIPE_PRICE_PREMIUM_MENSAL, plano: "premium" as Plano, label: "Premium  R$ 89,90/mês" },
  premium_anual: { priceId: process.env.STRIPE_PRICE_PREMIUM_ANUAL, plano: "premium" as Plano, label: "Premium anual  R$ 899,90/ano" },
} as const

export type PrecoId = keyof typeof PRECOS

/** Price ID (Stripe) → Plano (nosso), pro webhook decidir o que gravar em `assinaturas`
 *  a partir do price que veio na subscription/checkout session. */
export const PRICE_PARA_PLANO: Record<string, Plano> = Object.fromEntries(
  Object.values(PRECOS)
    .filter((p): p is typeof p & { priceId: string } => Boolean(p.priceId))
    .map((p) => [p.priceId, p.plano])
)
