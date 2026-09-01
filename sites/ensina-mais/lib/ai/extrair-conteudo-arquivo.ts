import { TAMANHO_MAXIMO_ARQUIVO_BYTES, TAMANHO_MAXIMO_ARQUIVO_MB, MAX_PAGINAS_PDF } from "./limites-arquivo"

export type ArquivoReferencia = { tipo: "pdf"; base64: string } | { tipo: "texto"; texto: string }

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/**
 * Extrai o conteúdo de um arquivo enviado pelo usuário como material de referência/
 * orientação para a IA. PDF vai como parte multimodal nativa (Gemini lê o documento
 * diretamente); .txt e .docx viram texto simples embutido no prompt. .doc legado
 * (binário antigo) não tem extração confiável sem uma lib pesada  é ignorado.
 *
 * Lança `Error` (com mensagem em português, pronta pra virar `{ error }` na resposta da API)
 * quando o arquivo estoura os limites de tamanho ou (no caso de PDF) de número de páginas 
 * ver `lib/ai/limites-arquivo.ts`.
 */
export async function extrairConteudoArquivo(file: File): Promise<ArquivoReferencia | null> {
  if (file.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
    const tamanhoMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`O arquivo enviado tem ${tamanhoMb} MB  o limite é ${TAMANHO_MAXIMO_ARQUIVO_MB} MB.`)
  }

  const mime = file.type

  if (mime === "application/pdf") {
    const buffer = Buffer.from(await file.arrayBuffer())

    const { PDFDocument } = await import("pdf-lib")
    let numeroPaginas: number
    try {
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
      numeroPaginas = pdf.getPageCount()
    } catch {
      throw new Error("Não foi possível ler o PDF enviado  verifique se o arquivo não está corrompido.")
    }
    if (numeroPaginas > MAX_PAGINAS_PDF) {
      throw new Error(`O PDF enviado tem ${numeroPaginas} páginas  o limite é ${MAX_PAGINAS_PDF} páginas.`)
    }

    return { tipo: "pdf", base64: buffer.toString("base64") }
  }

  if (mime === "text/plain") {
    return { tipo: "texto", texto: await file.text() }
  }

  if (mime === DOCX_MIME || file.name.toLowerCase().endsWith(".docx")) {
    const buffer = Buffer.from(await file.arrayBuffer())
    // .docx é um ZIP  sem essa checagem, um arquivo com extensão/Content-Type falsificados
    // entrava direto no parser do mammoth só por causa do nome. A assinatura local-file-header
    // (`PK\x03\x04`) é o mesmo bytes que o parser ZIP em app/api/parse-modelo/route.ts checa.
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
      throw new Error("O arquivo enviado não é um .docx válido.")
    }
    const mammoth = await import("mammoth")
    const { value } = await mammoth.extractRawText({ buffer })
    return { tipo: "texto", texto: value }
  }

  return null
}

/**
 * Faz o parse de um `ArquivoReferencia` já processado no cliente (via
 * `/api/arquivo-referencia/preparar`, disparado em paralelo enquanto o usuário configura o resto
 * do wizard  ver `components/generator-modal.tsx`) e enviado como JSON no campo
 * `arquivoPreprocessado` do FormData. Nunca confia cegamente no JSON do cliente: qualquer coisa
 * fora do shape esperado retorna `null`, e o chamador cai de volta pro fluxo normal
 * (`extrairConteudoArquivo` + `filtrarPaginasPdf` a partir do campo `arquivo` cru).
 */
export function tentarParsearArquivoPreprocessado(valor: FormDataEntryValue | null): ArquivoReferencia | null {
  if (typeof valor !== "string" || !valor) return null
  try {
    const parsed = JSON.parse(valor) as unknown
    if (typeof parsed !== "object" || parsed === null) return null
    const obj = parsed as Record<string, unknown>
    if (obj.tipo === "pdf" && typeof obj.base64 === "string") return { tipo: "pdf", base64: obj.base64 }
    if (obj.tipo === "texto" && typeof obj.texto === "string") return { tipo: "texto", texto: obj.texto }
    return null
  } catch {
    return null
  }
}
