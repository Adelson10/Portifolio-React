import { GoogleGenAI, Type } from "@google/genai"
import { PDFDocument } from "pdf-lib"
import { extractText, getDocumentProxy } from "unpdf"
import type { ArquivoReferencia } from "./extrair-conteudo-arquivo"
import { obterConfigIA } from "./model-por-plano"
import { logUsoTokens } from "./log-uso-tokens"

/** Abaixo desse número de páginas, o ganho de tokens não paga a latência/custo extra de uma
 *  chamada a mais ao Gemini  manda o PDF original direto. */
const LIMIAR_MIN_PAGINAS = 8

/** Caracteres de cada página usados no prompt de seleção  só o suficiente pra reconhecer do
 *  que a página trata (título, início do conteúdo), não o texto inteiro. */
const CARACTERES_POR_PAGINA = 500

const SEM_TEXTO_EXTRAIDO = "[sem texto extraído  pode conter apenas fórmulas/figuras]"

/**
 * Extrai o texto completo (todas as páginas mescladas) de um PDF em base64  usado pelo caminho
 * OpenAI (`gerar-questoes.ts`/`gerar-plano-aula.ts`) pra embutir o material de referência como
 * texto simples no prompt, em vez de anexo nativo (`input_file`). A Responses API cobra um PDF
 * anexado como texto extraído + imagem de cada página (mesmo em `detail: "low"`, na prática não
 * reduziu o custo  ver conversa de debug), bem mais caro que a taxa fixa de ~258 tokens/página
 * que o Gemini cobra pro mesmo arquivo via `inlineData`.
 */
export async function extrairTextoCompletoPdf(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, "base64")
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return Array.isArray(text) ? text.join("\n\n") : text
}

export interface FiltrarPaginasPdfParams {
  arquivo: Extract<ArquivoReferencia, { tipo: "pdf" }>
  tema: string
}

export interface FiltrarPaginasPdfResultado {
  /** PDF original ou filtrado  sempre um `ArquivoReferencia` válido pra geração seguir. */
  arquivo: ArquivoReferencia
  filtrado: boolean
  totalPaginas?: number
  paginasSelecionadas?: number[]
}

function montarSnippet(textoPagina: string): string {
  const limpo = textoPagina.trim().replace(/\s+/g, " ")
  if (!limpo) return SEM_TEXTO_EXTRAIDO
  return limpo.length > CARACTERES_POR_PAGINA ? `${limpo.slice(0, CARACTERES_POR_PAGINA)}…` : limpo
}

function montarPromptSelecao(tema: string, textoPorPagina: string[]): string {
  const paginas = textoPorPagina
    .map((texto, i) => `Página ${i + 1}: ${montarSnippet(texto)}`)
    .join("\n\n")

  return [
    `Tema pedido pelo usuário: "${tema}"`,
    ``,
    `Abaixo está um resumo de cada página de um documento PDF de referência (trecho inicial de cada uma).`,
    `Identifique quais páginas têm conteúdo relevante ao tema acima  texto, exercícios, definições, exemplos ou dados relacionados.`,
    ``,
    paginas,
    ``,
    `Retorne a lista de números de página relevantes. Inclua uma página sempre que houver qualquer chance de relevância ao tema  é preferível incluir uma página a mais do que deixar de fora conteúdo necessário. Se o tema cobrir o documento inteiro, retorne todas as páginas.`,
  ].join("\n")
}

function validarPaginasSelecionadas(bruto: unknown, totalPaginas: number): number[] {
  if (!Array.isArray(bruto)) return []
  const validas = bruto.filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= totalPaginas)
  return [...new Set(validas)].sort((a, b) => a - b)
}

/**
 * Quando há `tema` explícito e o PDF de referência é grande, filtra o documento para só as
 * páginas relevantes ao tema antes de mandar pro modelo de geração (mais caro)  o Gemini Flash-
 * Lite (sempre o modelo mais barato, independente do plano de quem está gerando) decide quais
 * páginas manter a partir do texto extraído; a geração final continua usando o PDF nativo
 * (visual), não o texto extraído aqui, que serve só pra essa triagem.
 *
 * Nunca lança  qualquer falha (parsing, chamada ao Gemini, resposta inválida) cai de volta pro
 * PDF original, pra essa otimização de custo nunca bloquear uma geração.
 */
export async function filtrarPaginasPdf(params: FiltrarPaginasPdfParams): Promise<FiltrarPaginasPdfResultado> {
  const { arquivo, tema } = params
  const semFiltro: FiltrarPaginasPdfResultado = { arquivo, filtrado: false }

  const temaLimpo = tema.trim()
  if (!temaLimpo) {
    console.warn("[filtrarPaginasPdf] pulado: sem tema digitado (arquivo inteiro vai pro prompt)")
    return semFiltro
  }

  try {
    const buffer = Buffer.from(arquivo.base64, "base64")
    const pdfOriginal = await getDocumentProxy(new Uint8Array(buffer))
    const totalPaginas = pdfOriginal.numPages

    if (totalPaginas <= LIMIAR_MIN_PAGINAS) {
      console.warn(`[filtrarPaginasPdf] pulado: só ${totalPaginas} páginas (limiar é ${LIMIAR_MIN_PAGINAS})`)
      return semFiltro
    }

    const { text: textoPorPagina } = await extractText(pdfOriginal, { mergePages: false })

    const { modelo, apiKey } = obterConfigIA("gratis")
    const ai = new GoogleGenAI({ apiKey })

    const inicio = new Date()
    const response = await ai.models.generateContent({
      model: modelo,
      contents: montarPromptSelecao(temaLimpo, textoPorPagina),
      config: {
        temperature: 0,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.INTEGER } },
      },
    })

    logUsoTokens("filtrarPaginasPdf", modelo, response.usageMetadata, inicio)

    const texto = response.text
    if (!texto) return semFiltro

    // responseMimeType+responseSchema já forçam JSON puro, mas removemos eventuais cercas de
    // código (```json ... ```) como salvaguarda  mesmo padrão de gerar-questoes.ts.
    const jsonLimpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")
    const paginasSelecionadas = validarPaginasSelecionadas(JSON.parse(jsonLimpo), totalPaginas)

    console.warn(`[filtrarPaginasPdf] ${paginasSelecionadas.length}/${totalPaginas} páginas selecionadas:`, paginasSelecionadas)

    // Nada selecionado (resposta vazia/inútil) ou cobriu o documento inteiro  não vale reconstruir.
    if (paginasSelecionadas.length === 0 || paginasSelecionadas.length >= totalPaginas) return semFiltro

    const pdfLibOriginal = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const pdfFiltrado = await PDFDocument.create()
    const paginasCopiadas = await pdfFiltrado.copyPages(pdfLibOriginal, paginasSelecionadas.map((n) => n - 1))
    for (const pagina of paginasCopiadas) pdfFiltrado.addPage(pagina)

    const bytesFiltrados = await pdfFiltrado.save()

    return {
      arquivo: { tipo: "pdf", base64: Buffer.from(bytesFiltrados).toString("base64") },
      filtrado: true,
      totalPaginas,
      paginasSelecionadas,
    }
  } catch (err) {
    // Extração/classificação falhou por qualquer motivo  segue com o PDF original.
    if (process.env.DEBUG_FILTRO_PDF) console.error("[filtrarPaginasPdf] falhou, usando PDF original:", err)
    return semFiltro
  }
}
