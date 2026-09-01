import { Type } from "@google/genai"

/**
 * Converte um `responseSchema` no formato do Gemini (`Type.OBJECT`/`Type.ARRAY`/...  ver
 * `gerar-plano-aula.ts`, `gerar-questoes.ts`, `selecionar-habilidades-bncc.ts`) para JSON Schema
 * puro, no formato exigido pelo Structured Outputs da OpenAI (`text.format` com `strict: true`).
 *
 * Existe pra não duplicar à mão os mesmos schemas (alguns grandes, ex. `GERACAO_CONFIG` em
 * `gerar-questoes.ts`) uma vez para cada provedor  schemas duplicados divergem com o tempo.
 *
 * Todo objeto recebe `additionalProperties: false`, exigido pelo `strict` mode da OpenAI. O
 * `strict` mode também exige que TODA property de um objeto esteja listada em `required`  ao
 * contrário do Gemini, que trata ausência em `required` como "campo opcional" (ex.: `opcoes` e
 * `numeroLinhas` em `GERACAO_CONFIG.responseSchema`, `gerar-questoes.ts`). Pra preservar a mesma
 * semântica de "campo opcional" sob a regra da OpenAI, todo campo fora do `required` original do
 * Gemini entra no `required` convertido mesmo assim, mas seu `type` passa a aceitar `null`  o
 * modelo devolve `null` em vez de omitir a chave (ver normalização em `gerar-questoes.ts`).
 */

// Formato mínimo comum aos schemas do Gemini usados neste projeto  não é o tipo `Schema`
// completo do @google/genai (que tem dezenas de campos opcionais que este projeto não usa).
// Usa o enum `Type` (não literais de string) porque `Type` é um enum nominal do @google/genai 
// um literal "OBJECT" não seria atribuível a `Type.OBJECT` sem cast.
interface SchemaGemini {
  type: Type
  description?: string
  enum?: string[]
  items?: unknown
  // `unknown` (não `Record<string, SchemaGemini>`): os schemas montados em `gerar-plano-aula.ts`/
  // `gerar-questoes.ts` constroem `properties` dinamicamente (por seção marcada, ex.
  // `montarResponseSchema`), então o TypeScript só infere `Record<string, unknown>` ali  o
  // formato real (recursivamente `SchemaGemini`) só é garantido em runtime.
  properties?: Record<string, unknown>
  required?: string[]
}

const TIPO_JSON_SCHEMA: Record<Type, string> = {
  [Type.TYPE_UNSPECIFIED]: "string",
  [Type.STRING]: "string",
  [Type.NUMBER]: "number",
  [Type.INTEGER]: "integer",
  [Type.BOOLEAN]: "boolean",
  [Type.ARRAY]: "array",
  [Type.OBJECT]: "object",
  [Type.NULL]: "null",
}

export function paraJsonSchemaOpenAI(schema: unknown): Record<string, unknown> {
  const s = schema as SchemaGemini
  const base: Record<string, unknown> = { type: TIPO_JSON_SCHEMA[s.type] }
  if (s.description) base.description = s.description
  if (s.enum) base.enum = s.enum

  if (s.type === Type.OBJECT && s.properties) {
    const requiredOriginal = new Set(s.required ?? Object.keys(s.properties))
    base.properties = Object.fromEntries(
      Object.entries(s.properties).map(([chave, valor]) => {
        const convertido = paraJsonSchemaOpenAI(valor)
        // Campo opcional no Gemini (fora do `required` original)  aceita `null` em vez de ser
        // omitido, já que o `required` convertido abaixo lista todas as properties.
        if (!requiredOriginal.has(chave)) convertido.type = [convertido.type as string, "null"]
        return [chave, convertido]
      })
    )
    base.required = Object.keys(s.properties)
    base.additionalProperties = false
  }

  if (s.type === Type.ARRAY) {
    base.items = paraJsonSchemaOpenAI(s.items ?? { type: Type.STRING })
  }

  return base
}

/**
 * Reviver de `JSON.parse` que remove campos `null` do resultado  contrapartida de
 * `paraJsonSchemaOpenAI`: como o `strict` mode da OpenAI força campo opcional a virar
 * `tipo | null` em vez de simplesmente ausente (ver acima), a resposta da OpenAI devolve
 * `null` onde o Gemini simplesmente omitiria a chave. Usar como segundo argumento de
 * `JSON.parse(texto, removerNulosOpenAI)` faz o resultado bater com os tipos `campo?: T`
 * (não `T | null`) usados pelas interfaces deste projeto (`PlanoAulaGerado`, `QuestaoGerada`).
 */
export function removerNulosOpenAI(_chave: string, valor: unknown): unknown {
  return valor === null ? undefined : valor
}

/** Erro específico pra resposta cortada por `max_output_tokens`  classe própria (em vez de um
 *  `Error` genérico) pra permitir distinguir esse caso de forma robusta no catch das rotas de
 *  geração (`ehErroDeTruncamento`) e mostrar uma mensagem acionável em vez da genérica de sempre. */
export class RespostaTruncadaError extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = "RespostaTruncadaError"
  }
}

export function ehErroDeTruncamento(err: unknown): err is RespostaTruncadaError {
  return err instanceof RespostaTruncadaError
}

/** Lança um erro claro e específico quando a resposta da OpenAI foi cortada por bater no teto de
 *  `max_output_tokens` (`response.status === "incomplete"`)  chame logo após `responses.create`,
 *  ANTES de tentar `parsearJsonOpenAI`. Sem essa checagem, um corte no meio do JSON vira só um erro
 *  de sintaxe genérico e confuso lá na frente, sem indicar a causa real (nem dá pra distinguir de
 *  outras falhas de parse nos logs). Truncamento por `content_filter` não é coberto aqui  esse
 *  caso já vem sem `output_text` (`response.output_text` fica vazio) e cai no `throw` já existente
 *  logo abaixo da chamada ("A IA não retornou conteúdo"). */
export function verificarRespostaTruncada(response: {
  status?: string
  incomplete_details?: { reason?: string } | null
}): void {
  if (response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens") {
    throw new RespostaTruncadaError("A IA cortou a resposta por atingir o limite de tokens de saída  tente gerar menos itens de uma vez.")
  }
}

const ESCAPES_DE_CONTROLE: Record<string, string> = { "\n": "\\n", "\r": "\\r", "\t": "\\t", "\b": "\\b", "\f": "\\f" }

/** Escapa caracteres de controle (quebra de linha, tab etc.) que aparecem CRUS dentro de literais
 *  de string  via de regra o `strict` mode da OpenAI garante JSON válido, mas ocasionalmente o
 *  texto gerado (ex.: um enunciado com quebras de linha "soltas") sai com um caractere de controle
 *  não escapado dentro de uma string, o que `JSON.parse` rejeita. Preserva tudo fora de strings
 *  (espaçamento entre tokens) e sequências de escape já existentes (`\\n`, `\\"` etc.) intactas. */
function escaparControlesEmStrings(texto: string): string {
  let saida = ""
  let dentroDeString = false
  let escapado = false
  for (const char of texto) {
    if (dentroDeString) {
      if (escapado) {
        saida += char
        escapado = false
      } else if (char === "\\") {
        saida += char
        escapado = true
      } else if (char === '"') {
        saida += char
        dentroDeString = false
      } else if (char.charCodeAt(0) < 0x20) {
        saida += ESCAPES_DE_CONTROLE[char] ?? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
      } else {
        saida += char
      }
      continue
    }
    if (char === '"') dentroDeString = true
    saida += char
  }
  return saida
}

/** `JSON.parse(texto, removerNulosOpenAI)` com uma segunda tentativa (escapando caracteres de
 *  controle soltos dentro de strings) se a primeira falhar  ver `escaparControlesEmStrings`. Se
 *  as duas falharem, relança o erro ORIGINAL (a posição nele aponta pro texto de verdade, mais útil
 *  pro log do que a posição no texto já reescrito). */
export function parsearJsonOpenAI<T>(texto: string): T {
  try {
    return JSON.parse(texto, removerNulosOpenAI) as T
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err
    try {
      return JSON.parse(escaparControlesEmStrings(texto), removerNulosOpenAI) as T
    } catch {
      throw err
    }
  }
}
