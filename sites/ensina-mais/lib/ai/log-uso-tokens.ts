import type { GenerateContentResponseUsageMetadata } from "@google/genai"
import type { ResponseUsage } from "openai/resources/responses/responses"

/**
 * Preço aproximado por 1M de tokens (USD), copiado à mão da tabela pública em
 * ai.google.dev/pricing (Gemini) e openai.com/api/pricing (OpenAI). Nenhuma das duas APIs
 * devolve custo em dinheiro na resposta  só contagem de tokens  então o cálculo de custo
 * daqui pra baixo é sempre uma estimativa.
 *
 * Os modelos Gemini usados no projeto são aliases "-latest" (ver `model-por-plano.ts`), então o
 * modelo real por trás do preço pode mudar sem aviso quando o Google atualizar o alias  se os
 * valores de custo aqui ficarem muito fora da realidade, é o primeiro lugar a conferir.
 *
 * "gpt-5-mini"/"gpt-5.4-mini": preços confirmados na página oficial da OpenAI (24/07/2026), com
 * desconto de 90% em tokens de cache (padrão da família GPT-5). "gpt-5-mini" é o modelo do
 * Premium desde 24/07/2026 (ver `model-por-plano.ts`)  "gpt-5.4-mini" fica cadastrado só pra
 * não perder o preço caso algum log antigo/relatório ainda referencie esse modelo.
 */
const PRECO_POR_MILHAO_USD: Record<string, { entrada: number; entradaCache: number; saida: number }> = {
  "gemini-flash-lite-latest": { entrada: 0.1, entradaCache: 0.025, saida: 0.4 },
  "gemini-flash-latest": { entrada: 0.3, entradaCache: 0.075, saida: 2.5 },
  "gpt-5-mini": { entrada: 0.25, entradaCache: 0.025, saida: 2.0 },
  "gpt-5.4-mini": { entrada: 0.75, entradaCache: 0.075, saida: 4.5 },
}

const FORMATO_HORA_BR = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/** "início 15:54:40, fim 15:55:54 (74s)"  `inicio` é opcional porque nem toda chamada mede
 *  tempo (ex.: chamadas antigas sem esse parâmetro); sem ele, não aparece nada no log. */
function formatarTempo(inicio: Date | undefined): string {
  if (!inicio) return ""
  const fim = new Date()
  const duracaoSegundos = Math.round((fim.getTime() - inicio.getTime()) / 1000)
  return `  início ${FORMATO_HORA_BR.format(inicio)}, fim ${FORMATO_HORA_BR.format(fim)} (${duracaoSegundos}s)`
}

function estimarCustoUSD(modelo: string, usage: GenerateContentResponseUsageMetadata): number | null {
  const preco = PRECO_POR_MILHAO_USD[modelo]
  if (!preco) return null

  const tokensCache = usage.cachedContentTokenCount ?? 0
  // `promptTokenCount` inclui os tokens servidos pelo cache  subtrai pra não cobrar duas vezes
  // (cache tem preço próprio, bem mais barato, calculado à parte abaixo).
  const tokensEntradaCobrados = (usage.promptTokenCount ?? 0) - tokensCache
  // `thoughtsTokenCount` (tokens de "raciocínio" do modelo, ex.: gemini-*-latest com thinking
  // ligado por padrão) é cobrado como saída mas NÃO entra em `candidatesTokenCount`  sem somar
  // aqui, o custo de modelos com thinking sai subestimado (é a diferença entre `totalTokenCount`
  // e prompt+candidates que aparecia no log antes desse ajuste).
  const tokensSaida = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0)

  return (
    (tokensEntradaCobrados / 1_000_000) * preco.entrada +
    (tokensCache / 1_000_000) * preco.entradaCache +
    (tokensSaida / 1_000_000) * preco.saida
  )
}

/**
 * Log de consumo/custo estimado de uma chamada ao Gemini  só console, nada persistido. Serve
 * pra ter uma noção de ordem de grandeza do custo por geração enquanto o controle de uso não
 * vira uma feature de verdade (tabela no banco + tela de consulta).
 *
 * Não cobre o custo do grounding (Google Search) usado em `buscarQuestoesReaisNaInternet`  esse
 * é cobrado por requisição, não por token, então some com o preço estimado aqui.
 */
export function logUsoTokens(
  rotulo: string,
  modelo: string,
  usage: GenerateContentResponseUsageMetadata | undefined,
  inicio?: Date
): void {
  if (!usage) {
    console.warn(`[IA] ${rotulo} (${modelo})  resposta sem usageMetadata${formatarTempo(inicio)}`)
    return
  }

  const custo = estimarCustoUSD(modelo, usage)
  const custoLabel = custo === null ? "custo desconhecido (modelo sem preço cadastrado)" : `~US$ ${custo.toFixed(6)}`

  console.warn(
    `[IA] ${rotulo} (${modelo})  entrada=${usage.promptTokenCount ?? 0} cache=${usage.cachedContentTokenCount ?? 0} ` +
      `saida=${usage.candidatesTokenCount ?? 0} pensamento=${usage.thoughtsTokenCount ?? 0} total=${usage.totalTokenCount ?? 0}  ${custoLabel}${formatarTempo(inicio)}`
  )
}

/** Equivalente a `logUsoTokens`, mas pro formato de `usage` da Responses API da OpenAI
 *  (`response.usage`)  usado pelos planos "premium" (ver `model-por-plano.ts`). */
export function logUsoTokensOpenAI(rotulo: string, modelo: string, usage: ResponseUsage | undefined, inicio?: Date): void {
  if (!usage) {
    console.warn(`[IA] ${rotulo} (${modelo})  resposta sem usage${formatarTempo(inicio)}`)
    return
  }

  const tokensCache = usage.input_tokens_details?.cached_tokens ?? 0
  const tokensEntradaCobrados = usage.input_tokens - tokensCache
  const preco = PRECO_POR_MILHAO_USD[modelo]
  const custo = preco
    ? (tokensEntradaCobrados / 1_000_000) * preco.entrada + (tokensCache / 1_000_000) * preco.entradaCache + (usage.output_tokens / 1_000_000) * preco.saida
    : null
  const custoLabel = custo === null ? "custo desconhecido (modelo sem preço cadastrado)" : `~US$ ${custo.toFixed(6)}`

  console.warn(
    `[IA] ${rotulo} (${modelo})  entrada=${usage.input_tokens} cache=${tokensCache} ` +
      `saida=${usage.output_tokens} raciocinio=${usage.output_tokens_details?.reasoning_tokens ?? 0} total=${usage.total_tokens}  ${custoLabel}${formatarTempo(inicio)}`
  )
}
