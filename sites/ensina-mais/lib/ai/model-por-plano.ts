// Mapeia o plano de assinatura do usuário para o modelo de IA (e teto de tokens de
// saída) usado na geração. "gratis" é o fallback de quem não tem assinatura ativa
// (trial, 2 gerações/dia  ver lib/atividades/limites.ts); "basico" e "premium" vêm
// do webhook do Stripe (app/api/webhooks/stripe/route.ts) assim que o pagamento é
// confirmado.
export interface ConfigIA {
  /** "google" (Gemini, via `@google/genai`) ou "openai" (via SDK `openai`)  os geradores em
   *  `gerar-plano-aula.ts`/`gerar-questoes.ts`/`selecionar-habilidades-bncc.ts` usam este campo
   *  pra decidir qual client/formato de chamada usar. */
  provider: "google" | "openai"
  modelo: string
  // Ausente = usa o teto default da API para o modelo. Só "premium" define um valor
  // maior  ajuste este número conforme o teto real do modelo na doc do provedor (não
  // validado contra a doc oficial, é só um ponto de partida conservador).
  maxOutputTokens?: number
  apiKey: string
}

// Usa os aliases "-latest" (não versões datadas tipo "gemini-2.5-flash") pros modelos Gemini
// porque o Google aposenta modelos datados pra chaves de API novas sem aviso prévio no
// código  foi o que quebrou geração em produção (gemini-2.5-flash virou 404 "no
// longer available to new users"). Os aliases o Google mantém apontando pro modelo
// flash/flash-lite recomendado no momento, então não sofrem esse tipo de sunset.
//
// "premium" usa a OpenAI (gpt-5-mini) em vez do Gemini  modelo escolhido pra dar aos
// assinantes premium uma IA de qualidade/persona diferente da usada no trial grátis/básico.
// Era "gpt-5.4-mini" (US$0,75/US$4,50 por 1M)  trocado pro "gpt-5-mini" simples (US$0,25/US$2,00),
// 63% mais barato pelo mesmo formato de chamada (Responses API), sem precisar reintegrar nada.
const MODELO_POR_PLANO = {
  gratis: { provider: "google", modelo: "gemini-flash-lite-latest" },
  basico: { provider: "google", modelo: "gemini-flash-lite-latest" },
  premium: { provider: "openai", modelo: "gpt-5-mini", maxOutputTokens: 16384 },
} as const satisfies Record<string, Omit<ConfigIA, "apiKey">>

export type Plano = keyof typeof MODELO_POR_PLANO

function obterApiKey(config: Omit<ConfigIA, "apiKey">): string {
  if (config.provider === "openai") {
    const chave = process.env.OPENAI_API_KEY
    if (!chave) throw new Error("OPENAI_API_KEY não configurada")
    return chave
  }
  const chave = process.env.GEMINI_API_KEY
  if (!chave) throw new Error("GEMINI_API_KEY não configurada")
  return chave
}

export function obterConfigIA(plano: Plano = "gratis"): ConfigIA {
  const config = MODELO_POR_PLANO[plano]
  return { ...config, apiKey: obterApiKey(config) }
}

export function obterModeloIA(plano: Plano = "gratis"): string {
  return obterConfigIA(plano).modelo
}
