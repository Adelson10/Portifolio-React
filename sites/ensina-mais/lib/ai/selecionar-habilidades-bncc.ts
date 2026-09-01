import { GoogleGenAI, Type } from "@google/genai"
import type { HabilidadeBNCC } from "@/lib/bncc/api-bncc-dev"
import { withRetry } from "./gemini-retry"
import { logUsoTokens } from "./log-uso-tokens"

interface SelecionarHabilidadesBNCCParams {
  modelo: string
  apiKey: string
  tema?: string
  questoes: { enunciado: string }[]
  /** Habilidades candidatas já filtradas por etapa/componente/ano ou área da turma (ver
   *  `lib/bncc/mapear-turma.ts` + `lib/bncc/api-bncc-dev.ts`)  a IA só pode escolher entre
   *  estas, nunca inventar um código novo (ver `responseSchema.enum` abaixo). */
  candidatas: HabilidadeBNCC[]
}

// Teto de segurança pro tamanho do enum no responseSchema  na prática, um componente+ano do
// Fundamental ou uma área do Médio já cai bem abaixo disso (ver comentário em `api-bncc-dev.ts`).
const MAX_CANDIDATAS = 80

/**
 * Depois que a atividade é gerada, pede pra IA identificar quais das habilidades BNCC
 * *candidatas* (já resolvidas contra a base oficial via api.bncc.dev, nunca pela memória do
 * modelo) o conteúdo das questões realmente trabalha. `responseSchema` restringe a saída a um
 * `enum` com exatamente os códigos de `candidatas`  estruturalmente impossível a IA devolver um
 * código que não veio da base oficial. O texto/descrição exibido depois vem sempre do item
 * candidato correspondente, nunca do que a IA escreveu (ver `activity-editor` / `generate-word`).
 *
 * "Melhor esforço": qualquer falha (rede, parse, indisponibilidade do Gemini) devolve `[]`  a
 * atividade já foi gerada com sucesso nesse ponto, sugerir BNCC é um bônus que não deve travar
 * nem invalidar a geração.
 */
export async function selecionarHabilidadesBNCC({
  modelo,
  apiKey,
  tema,
  questoes,
  candidatas,
}: SelecionarHabilidadesBNCCParams): Promise<HabilidadeBNCC[]> {
  if (candidatas.length === 0 || questoes.length === 0) return []
  const pool = candidatas.slice(0, MAX_CANDIDATAS)

  const enunciados = questoes.map((q, i) => `${i + 1}. ${q.enunciado}`).join("\n")
  const listaCandidatas = pool.map((h) => `${h.codigo}: ${h.texto}`).join("\n")

  const prompt = [
    `Conteúdo de uma atividade escolar${tema?.trim() ? ` sobre "${tema.trim()}"` : ""}:`,
    ``,
    enunciados,
    ``,
    `Lista fechada de habilidades oficiais da BNCC compatíveis com o nível/componente dessa turma (código: descrição)  você só pode escolher entre estas, nunca criar ou alterar um código:`,
    ``,
    listaCandidatas,
    ``,
    `Devolva os códigos dessa lista que essas questões realmente trabalham  só os que têm correspondência clara e direta com o conteúdo, sem forçar relação fraca. Se nenhuma bater bem, devolva uma lista vazia.`,
  ].join("\n")

  try {
    const ai = new GoogleGenAI({ apiKey })
    const inicio = new Date()
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: modelo,
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "Códigos BNCC (só desta lista) que a atividade trabalha.",
            items: { type: Type.STRING, enum: pool.map((h) => h.codigo) },
          },
        },
      })
    )
    logUsoTokens(`selecionarHabilidadesBNCC (${pool.length} candidatas)`, modelo, response.usageMetadata, inicio)
    const texto = response.text?.trim()
    if (!texto) return []

    const codigos: unknown = JSON.parse(texto)
    if (!Array.isArray(codigos)) return []

    // Resolve o texto sempre pelo item candidato (nunca por algo que a IA tenha escrito)  a
    // descrição exibida na atividade é sempre a oficial, mesmo se o modelo devolvesse algo fora
    // do enum (o `enum` já impede isso, mas o filtro abaixo é uma segunda trava sem custo).
    const porCodigo = new Map(pool.map((h) => [h.codigo, h]))
    const vistos = new Set<string>()
    return codigos
      .filter((c): c is string => typeof c === "string")
      .map((codigo) => porCodigo.get(codigo))
      .filter((h): h is HabilidadeBNCC => h !== undefined)
      .filter((h) => (vistos.has(h.codigo) ? false : (vistos.add(h.codigo), true)))
  } catch (err) {
    console.error("[selecionarHabilidadesBNCC] falha ao selecionar habilidades BNCC:", err)
    return []
  }
}
