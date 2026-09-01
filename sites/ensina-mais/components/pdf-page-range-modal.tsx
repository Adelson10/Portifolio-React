"use client"

import { useEffect, useRef, useState } from "react"
import { XIcon, ScissorsIcon } from "@phosphor-icons/react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { abrirPdfNoNavegador, renderizarMiniaturaPdf, recortarPdf, comprimirPdfSeNecessario } from "@/lib/pdf-recorte"
import { TAMANHO_MAXIMO_ARQUIVO_BYTES, TAMANHO_MAXIMO_ARQUIVO_MB, MAX_PAGINAS_PDF } from "@/lib/ai/limites-arquivo"

const LARGURA_MINIATURA_PX = 110

interface PdfPageRangeModalProps {
  /** PDF original (mais de `MAX_PAGINAS_PDF` páginas)  `null` fecha o modal. */
  file: File | null
  numPaginas: number
  onConfirm: (arquivoRecortado: File) => void
  onCancel: () => void
}

/** Uma miniatura do grid  só renderiza a página (custosa: abre/decodifica no canvas) quando entra
 *  na viewport, via IntersectionObserver. Depois de renderizada uma vez, fica em cache no `src`
 *  local do próprio item (não desmonta), então rolar pra cima e pra baixo de novo não re-renderiza. */
function Miniatura({
  doc,
  numeroPagina,
  selecionada,
  onClick,
}: {
  doc: PDFDocumentProxy
  numeroPagina: number
  selecionada: boolean
  onClick: () => void
}) {
  const [src, setSrc] = useState<string | null>(null)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (src) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          renderizarMiniaturaPdf(doc, numeroPagina, LARGURA_MINIATURA_PX)
            .then(setSrc)
            .catch(() => {})
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, numeroPagina])

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      title={`Página ${numeroPagina}`}
      className={`relative flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-colors cursor-pointer ${
        selecionada ? "border-[var(--brand)] bg-[var(--brand)]/10" : "border-transparent hover:border-(--secundary)"
      }`}
    >
      <div className="w-full aspect-[3/4] rounded bg-(--secundary) flex items-center justify-center overflow-hidden">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`Página ${numeroPagina}`} className="w-full h-full object-contain" />
        ) : (
          <span className="text-[10px] text-gray-400">…</span>
        )}
      </div>
      <span className={`text-[11px] ${selecionada ? "text-[var(--brand)] font-semibold" : "text-gray-400"}`}>{numeroPagina}</span>
    </button>
  )
}

export default function PdfPageRangeModal({ file, numPaginas, onConfirm, onCancel }: PdfPageRangeModalProps) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [erroAbertura, setErroAbertura] = useState<string | null>(null)
  // Seleção inicial: primeiras `MAX_PAGINAS_PDF` páginas  ponto de partida razoável, o professor
  // ajusta a partir daí. Só inicializadores (não reset em efeito): o pai (`content-page.tsx`) monta
  // uma instância nova deste componente por arquivo (via `key`), então um `file` novo já chega como
  // um componente novo, com este estado limpo por natureza.
  const [inicio, setInicio] = useState(1)
  const [fim, setFim] = useState(() => Math.min(MAX_PAGINAS_PDF, numPaginas))
  const [modoSelecao, setModoSelecao] = useState<"inicio" | "fim">("inicio")
  const [etapa, setEtapa] = useState<"recortando" | "comprimindo" | null>(null)
  const [erroRecorte, setErroRecorte] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    let cancelado = false
    let fecharDoc: (() => void) | null = null

    abrirPdfNoNavegador(file)
      .then(({ doc: d, fechar }) => {
        if (cancelado) return fechar()
        fecharDoc = fechar
        setDoc(d)
      })
      .catch(() => {
        if (!cancelado) setErroAbertura("Não foi possível abrir o PDF pra pré-visualização.")
      })

    return () => {
      cancelado = true
      fecharDoc?.()
    }
  }, [file])

  if (!file) return null

  function definirInicio(valor: number) {
    const v = Math.max(1, Math.min(valor, numPaginas))
    setInicio(v)
    if (fim < v) setFim(v)
    else if (fim - v + 1 > MAX_PAGINAS_PDF) setFim(v + MAX_PAGINAS_PDF - 1)
    setErroRecorte(null)
  }

  function definirFim(valor: number) {
    const v = Math.max(1, Math.min(valor, numPaginas))
    setFim(v)
    if (inicio > v) setInicio(v)
    else if (v - inicio + 1 > MAX_PAGINAS_PDF) setInicio(v - MAX_PAGINAS_PDF + 1)
    setErroRecorte(null)
  }

  function onClickMiniatura(pagina: number) {
    setErroRecorte(null)
    if (modoSelecao === "inicio") {
      setInicio(pagina)
      setFim(pagina)
      setModoSelecao("fim")
    } else {
      if (pagina >= inicio) {
        setFim(Math.min(pagina, inicio + MAX_PAGINAS_PDF - 1))
      } else {
        setInicio(Math.max(pagina, inicio - (MAX_PAGINAS_PDF - 1)))
        setFim(inicio)
      }
      setModoSelecao("inicio")
    }
  }

  async function confirmar() {
    setEtapa("recortando")
    setErroRecorte(null)
    try {
      let arquivoRecortado = await recortarPdf(file!, inicio, fim)
      if (arquivoRecortado.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
        setEtapa("comprimindo")
        arquivoRecortado = await comprimirPdfSeNecessario(arquivoRecortado, TAMANHO_MAXIMO_ARQUIVO_BYTES)
      }
      if (arquivoRecortado.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
        const tamanhoMb = (arquivoRecortado.size / (1024 * 1024)).toFixed(1)
        setErroRecorte(`Mesmo comprimido, o PDF com essas páginas ficou com ${tamanhoMb} MB  o limite é ${TAMANHO_MAXIMO_ARQUIVO_MB} MB. Selecione um intervalo menor.`)
        setEtapa(null)
        return
      }
      onConfirm(arquivoRecortado)
    } catch {
      setErroRecorte("Não foi possível recortar o PDF. Tente selecionar um intervalo menor.")
      setEtapa(null)
    }
  }

  const paginas = Array.from({ length: numPaginas }, (_, i) => i + 1)
  const totalSelecionadas = fim - inicio + 1

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
      <div className="bg-(--background) border border-(--secundary) gap-4 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:p-6 rounded-t-2xl md:rounded-2xl shadow-xl w-full h-[92dvh] md:h-auto md:max-h-[85vh] md:w-[560px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold">Selecionar páginas do PDF</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Esse arquivo tem {numPaginas} páginas  escolha até {MAX_PAGINAS_PDF} páginas para usar como referência.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-(--secundary) border-1 border-(--secundary) transition-colors text-(--foreground)/50 hover:text-(--foreground) cursor-pointer shrink-0"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs">
            De
            <input
              type="number"
              min={1}
              max={numPaginas}
              value={inicio}
              onChange={(e) => definirInicio(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 rounded-lg border border-(--secundary) bg-(--background) text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            até
            <input
              type="number"
              min={1}
              max={Math.min(numPaginas, inicio + MAX_PAGINAS_PDF - 1)}
              value={fim}
              onChange={(e) => definirFim(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 rounded-lg border border-(--secundary) bg-(--background) text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <span className="text-xs text-gray-400 ml-auto">{totalSelecionadas} de {MAX_PAGINAS_PDF} páginas selecionadas</span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-(--secundary) p-2">
          {erroAbertura && <p className="text-xs text-red-500 p-2">{erroAbertura}</p>}
          {!doc && !erroAbertura && <p className="text-xs text-gray-400 p-2">Carregando prévia das páginas…</p>}
          {doc && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {paginas.map((p) => (
                <Miniatura key={p} doc={doc} numeroPagina={p} selecionada={p >= inicio && p <= fim} onClick={() => onClickMiniatura(p)} />
              ))}
            </div>
          )}
        </div>

        {erroRecorte && <p className="text-xs text-red-500 shrink-0">{erroRecorte}</p>}

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-(--secundary) text-sm font-medium hover:bg-(--secundary) transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={etapa !== null || !doc}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ScissorsIcon size={16} weight="bold" />
            {etapa === "comprimindo" ? "Comprimindo…" : etapa === "recortando" ? "Recortando…" : "Usar essas páginas"}
          </button>
        </div>
      </div>
    </div>
  )
}
