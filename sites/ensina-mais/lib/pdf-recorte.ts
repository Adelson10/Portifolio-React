import type { PDFDocumentProxy } from "pdfjs-dist"

// Import dinâmico (só quando alguém realmente abre o modal de recorte, ver
// `components/pdf-page-range-modal.tsx`)  pdfjs-dist é uma dependência pesada e só faz sentido no
// bundle do cliente pra quem de fato anexa um PDF com mais de `MAX_PAGINAS_PDF` páginas.
let pdfjsPromise: ReturnType<typeof carregarPdfJsInterno> | null = null

async function carregarPdfJsInterno() {
  const pdfjs = await import("pdfjs-dist")
  // Worker próprio (não CDN)  evita depender de rede externa disponível/estável em produção.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString()
  return pdfjs
}

function carregarPdfJs() {
  if (!pdfjsPromise) pdfjsPromise = carregarPdfJsInterno()
  return pdfjsPromise
}

export interface PdfAberto {
  doc: PDFDocumentProxy
  /** Encerra o worker e libera a memória do documento. `PDFDocumentProxy` não expõe `destroy()`
   *  próprio (só `cleanup()`, mais leve)  quem termina o documento de fato é a loading task
   *  (`pdfjs.getDocument(...)`, antes do `.promise`), por isso ela precisa ficar guardada aqui. */
  fechar: () => void
}

/** Abre o PDF no navegador (pdfjs-dist)  usado tanto pra contar páginas quanto pra renderizar
 *  miniaturas. Não confundir com `extrairConteudoArquivo` (server-side, lib/ai/): aqui é só leitura
 *  pra UI, o conteúdo real que vai pra IA continua sendo extraído/validado no servidor como sempre. */
export async function abrirPdfNoNavegador(file: File): Promise<PdfAberto> {
  const pdfjs = await carregarPdfJs()
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument({ data: buffer })
  const doc = await task.promise
  return { doc, fechar: () => void task.destroy() }
}

/** Só o número de páginas  usado em `content-page.tsx` pra decidir se abre o modal de recorte
 *  (mais de `MAX_PAGINAS_PDF` páginas, ver `lib/ai/limites-arquivo.ts`) antes mesmo de montar o
 *  modal (que abre o PDF de novo por conta própria pra renderizar as miniaturas). */
export async function contarPaginasPdf(file: File): Promise<number> {
  const { doc, fechar } = await abrirPdfNoNavegador(file)
  const numPaginas = doc.numPages
  fechar()
  return numPaginas
}

/** Renderiza uma página do PDF já aberto (`abrirPdfNoNavegador`) como miniatura PNG (data URL),
 *  na largura alvo pedida  usada pelo grid de miniaturas do modal de seleção de páginas. */
export async function renderizarMiniaturaPdf(doc: PDFDocumentProxy, numeroPagina: number, larguraAlvoPx: number): Promise<string> {
  const page = await doc.getPage(numeroPagina)
  const viewportBase = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: larguraAlvoPx / viewportBase.width })

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(viewport.width))
  canvas.height = Math.max(1, Math.round(viewport.height))
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Não foi possível criar o canvas de miniatura.")

  await page.render({ canvasContext: ctx, canvas, viewport }).promise
  return canvas.toDataURL("image/png")
}

/**
 * Recorta o PDF pra manter só as páginas de `paginaInicio` a `paginaFim` (1-indexado, inclusive) 
 * inteiramente no navegador via `pdf-lib` (mesma lib usada server-side em
 * `lib/ai/extrair-conteudo-arquivo.ts`/`lib/ai/filtrar-paginas-pdf.ts`, que também roda em browser).
 * O PDF original NUNCA sai do cliente: só o resultado deste recorte é que segue pro fluxo normal de
 * upload (sujeito aos limites de `lib/ai/limites-arquivo.ts` de sempre, como qualquer outro PDF).
 */
export async function recortarPdf(file: File, paginaInicio: number, paginaFim: number): Promise<File> {
  const { PDFDocument } = await import("pdf-lib")
  const buffer = await file.arrayBuffer()
  const original = await PDFDocument.load(buffer, { ignoreEncryption: true })

  const totalPaginas = original.getPageCount()
  const inicio = Math.max(1, Math.min(paginaInicio, totalPaginas))
  const fim = Math.max(inicio, Math.min(paginaFim, totalPaginas))
  const indices = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio - 1 + i)

  const recortado = await PDFDocument.create()
  const paginasCopiadas = await recortado.copyPages(original, indices)
  for (const pagina of paginasCopiadas) recortado.addPage(pagina)

  const bytes = await recortado.save()
  const nomeBase = file.name.replace(/\.pdf$/i, "")
  // `bytes` é Uint8Array<ArrayBufferLike> (pode ser SharedArrayBuffer)  BlobPart exige
  // especificamente ArrayBuffer, daí o cast (o buffer é sempre um ArrayBuffer comum na prática,
  // nunca compartilhado, já que veio de `PDFDocument.save()`).
  return new File([bytes as unknown as BlobPart], `${nomeBase}-p${inicio}-${fim}.pdf`, { type: "application/pdf" })
}

/** Níveis de rasterização tentados em sequência por `comprimirPdfSeNecessario`, da qualidade mais
 *  alta pra mais baixa. Cada nível reprocessa o documento inteiro (toda página vira uma imagem
 *  JPEG), então só compensa rodar isso quando o PDF já não coube no limite de tamanho: PDF
 *  escaneado costuma vir com JBIG2 (compressão específica pra scan P&B) nas imagens originais, que
 *  em qualidade alta pode ser mais eficiente que reencodar tudo como JPEG  por isso os níveis vão
 *  ficando mais agressivos até algum caber, em vez de ir direto no mais baixo (medido em cima de um
 *  PDF real: 150dpi/q0.75 ficou MAIOR que o original; só a partir de ~100dpi/q0.5 valeu a pena). */
const NIVEIS_COMPRESSAO: { dpi: number; qualidade: number }[] = [
  { dpi: 110, qualidade: 0.55 },
  { dpi: 80, qualidade: 0.4 },
]

async function rasterizarPdf(file: File, dpi: number, qualidade: number): Promise<Uint8Array> {
  const pdfjs = await carregarPdfJs()
  const { PDFDocument } = await import("pdf-lib")
  // Sempre lê o `File` de novo (em vez de receber um buffer compartilhado)  `pdfjs.getDocument`
  // pode transferir o `ArrayBuffer` pro worker, o que o deixaria inutilizável numa segunda chamada
  // (como acontece quando `comprimirPdfSeNecessario` tenta mais de um nível em sequência).
  const buffer = await file.arrayBuffer()
  const task = pdfjs.getDocument({ data: buffer })
  const doc = await task.promise
  const scale = dpi / 72

  const novo = await PDFDocument.create()
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(viewport.width))
    canvas.height = Math.max(1, Math.round(viewport.height))
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Não foi possível criar o canvas de rasterização.")
    await page.render({ canvasContext: ctx, canvas, viewport }).promise

    const jpegBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? blob.arrayBuffer().then(resolve, reject) : reject(new Error("Falha ao gerar JPEG da página."))),
        "image/jpeg",
        qualidade
      )
    })

    const imagem = await novo.embedJpg(jpegBytes)
    const viewportBase = page.getViewport({ scale: 1 })
    const novaPagina = novo.addPage([viewportBase.width, viewportBase.height])
    novaPagina.drawImage(imagem, { x: 0, y: 0, width: viewportBase.width, height: viewportBase.height })
  }

  task.destroy()
  return novo.save()
}

/**
 * Fallback de tamanho pra quando um PDF (já dentro de `MAX_PAGINAS_PDF`, recortado ou não) ainda
 * estoura `limiteBytes`: rasteriza cada página em JPEG e remonta o PDF do zero. Perde o texto
 * selecionável (as páginas viram imagem), mas reduz bastante o peso de PDF escaneado/com imagem
 * pesada  o caso mais comum de estourar o limite, já que texto puro dificilmente chega perto disso.
 * Tenta os níveis de `NIVEIS_COMPRESSAO` em ordem até um caber; se nenhum couber, devolve o
 * resultado do último nível mesmo assim  quem chama decide se ainda dá pra usar ou não.
 * Se o arquivo já cabe no limite, devolve ele mesmo sem processar nada.
 */
export async function comprimirPdfSeNecessario(file: File, limiteBytes: number): Promise<File> {
  if (file.size <= limiteBytes) return file

  const nomeBase = file.name.replace(/\.pdf$/i, "")
  let resultado: Uint8Array | null = null
  for (const { dpi, qualidade } of NIVEIS_COMPRESSAO) {
    resultado = await rasterizarPdf(file, dpi, qualidade)
    if (resultado.byteLength <= limiteBytes) break
  }

  return new File([resultado as unknown as BlobPart], `${nomeBase}-comprimido.pdf`, { type: "application/pdf" })
}
