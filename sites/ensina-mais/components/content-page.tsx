"use client"

import { ArticleIcon, ArticleNyTimesIcon, NotebookIcon, PaperclipIcon, PaperPlaneRightIcon, PencilSimpleIcon, TrashIcon, FunnelSimpleIcon, UsersIcon, PlusIcon, XIcon, type Icon } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import GeneratorModal, { type GeneratorType } from "@/components/generator-modal"
import PdfPageRangeModal from "@/components/pdf-page-range-modal"
import { useTurmas, turmaLabel } from "@/components/turmas-context"
import type { Plano } from "@/lib/ai/model-por-plano"
import { TAMANHO_MAXIMO_ARQUIVO_BYTES, TAMANHO_MAXIMO_ARQUIVO_MB, TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_BYTES, TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_MB, MAX_PAGINAS_PDF } from "@/lib/ai/limites-arquivo"
import { contarPaginasPdf, comprimirPdfSeNecessario } from "@/lib/pdf-recorte"

const MAX_RECENT = 3

const TABS: { label: string; href: string; icon?: Icon }[] = [
  { label: "Atividades", href: "/atividades", icon: NotebookIcon },
  { label: "Provas", href: "/provas", icon: ArticleIcon },
  { label: "Plano de Aula", href: "/plano-de-aula", icon: ArticleNyTimesIcon },
]

// Concordância do placeholder "Qual o tema {da|do} {title}?"  "Atividade"/"Prova" são
// femininos, mas "Plano de Aula" é masculino. Fallback "da" preserva o comportamento anterior
// pra qualquer título não mapeado aqui.
const PREPOSICAO_POR_TITLE: Record<string, string> = {
  "Atividade": "da",
  "Prova": "da",
  "Plano de Aula": "do",
}

const SORT_OPTIONS = [
  { label: "Recentes", value: "recentes" },
  { label: "Todos", value: "todos" },
  { label: "Mais Antigo", value: "mais-antigo" },
  { label: "Por Alfabeto", value: "alfabeto" },
]

const TYPE_BY_PATH: Record<string, string> = {
  "/atividades": "atividades",
  "/provas": "provas",
  "/plano-de-aula": "plano-de-aula",
}

const TIPO_TO_TYPE: Record<string, string> = {
  atividade: "atividades",
  prova: "provas",
  plano_aula: "plano-de-aula",
}

const ICON_BY_TYPE: Record<string, Icon> = {
  atividades: NotebookIcon,
  provas: ArticleIcon,
  "plano-de-aula": ArticleNyTimesIcon,
}

interface AtividadeRow {
  id: string
  tipo: keyof typeof TIPO_TO_TYPE
  titulo: string
  status: string
  created_at: string
}

interface Item {
  id: string
  title: string
  type: string
  icon: Icon
  date: string
  ts: number
}

function toItem(id: string, title: string, type: string, createdAt: string): Item {
  return {
    id,
    title,
    type,
    icon: ICON_BY_TYPE[type],
    date: new Date(createdAt).toLocaleDateString("pt-BR"),
    ts: new Date(createdAt).getTime(),
  }
}

interface ContentPageProps {
  title?: string
  showCreate?: boolean
  showTurmas?: boolean
  turmaId?: string
}

export default function ContentPage({ title, showCreate = true, showTurmas = false, turmaId }: ContentPageProps) {
  const pathname = usePathname()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [activeSort, setActiveSort] = useState("recentes")
  const [items, setItems] = useState<Item[]>([])
  const { turmas, removeTurma, openNovaTurma, uso } = useTurmas()
  const plano: Plano = (uso?.plano as Plano | undefined) ?? "gratis"
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [tema, setTema] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  // PDF premium com mais de MAX_PAGINAS_PDF páginas aguardando o usuário escolher o intervalo de
  // páginas no PdfPageRangeModal antes de virar `selectedFile`  ver `handleFileChange`.
  const [pdfParaRecortar, setPdfParaRecortar] = useState<File | null>(null)
  const [numPaginasPdfParaRecortar, setNumPaginasPdfParaRecortar] = useState(0)
  // PDF grande demais em MB (qualquer plano, não só premium) sendo comprimido (rasterizado) em
  // segundo plano antes da verificação de tamanho abaixo  ver `handleFileChange`.
  const [comprimindoArquivo, setComprimindoArquivo] = useState(false)

  const turmaAtiva = turmaId ? turmas.find((t) => t.id === turmaId) ?? null : null
  const pageType = turmaAtiva ? pathname.split("/").pop() ?? "" : TYPE_BY_PATH[pathname]

  function carregarItens() {
    if (!turmaId) return
    fetch(`/api/atividades?turmaId=${turmaId}`)
      .then((res) => res.json() as Promise<AtividadeRow[]>)
      .then((atividades) => {
        setItems(atividades.map((a) => toItem(a.id, a.titulo, TIPO_TO_TYPE[a.tipo], a.created_at)))
      })
  }

  useEffect(carregarItens, [turmaId])

  const GENERATOR_TYPE_MAP: Record<string, GeneratorType> = {
    "atividades": "atividade",
    "plano-de-aula": "plano-de-aula",
    "provas": "provas",
  }
  const generatorType = GENERATOR_TYPE_MAP[pageType] ?? null

  function handleSend() {
    if (!generatorType || (!tema.trim() && !selectedFile)) return
    setModalOpen(true)
  }

  const visibleItems = (() => {
    const list = items.filter((i) => i.type === pageType)
    if (activeSort === "recentes") return list.sort((a, b) => b.ts - a.ts).slice(0, MAX_RECENT)
    if (activeSort === "mais-antigo") return list.sort((a, b) => a.ts - b.ts)
    if (activeSort === "alfabeto") return list.sort((a, b) => a.title.localeCompare(b.title))
    return list.sort((a, b) => b.ts - a.ts)
  })()

  function deleteItem() {
    if (!deleteConfirm) return
    if (showTurmas) {
      removeTurma(deleteConfirm).catch((err) => console.error("Falha ao remover turma:", err))
    } else {
      fetch(`/api/atividades/${deleteConfirm}`, { method: "DELETE" })
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirm))
    }
    setDeleteConfirm(null)
  }

  const ehPdf = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setFileError(null)
      setSelectedFile(null)
      return
    }

    // Premium + PDF grande demais em páginas: em vez do bloqueio direto por tamanho abaixo, deixa
    // passar (até um teto de sanidade pro navegador não travar renderizando) e abre o mockup de
    // seleção de páginas  o recorte por si só costuma resolver o limite de MB também, já que reduz
    // o arquivo proporcionalmente às páginas removidas (ver `pdf-page-range-modal.tsx`).
    if (ehPdf(file) && plano === "premium") {
      if (file.size > TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_BYTES) {
        setFileError(`Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB)  o limite é ${TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_MB} MB.`)
        setSelectedFile(null)
        e.target.value = ""
        return
      }
      try {
        const numPaginas = await contarPaginasPdf(file)
        if (numPaginas > MAX_PAGINAS_PDF) {
          setFileError(null)
          setPdfParaRecortar(file)
          setNumPaginasPdfParaRecortar(numPaginas)
          e.target.value = ""
          return
        }
      } catch {
        // PDF ilegível pro pdf.js  segue pro fluxo normal, o servidor acusa o problema na extração.
      }
    }

    // Fallback de tamanho pra qualquer plano (não só premium): PDF estourou os MB mas já está
    // dentro de `MAX_PAGINAS_PDF` (seja porque só tinha poucas páginas mesmo, seja porque já veio
    // recortado do fluxo premium acima)  tenta comprimir via rasterização antes de rejeitar.
    let arquivoFinal = file
    if (ehPdf(file) && file.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
      setComprimindoArquivo(true)
      try {
        arquivoFinal = await comprimirPdfSeNecessario(file, TAMANHO_MAXIMO_ARQUIVO_BYTES)
      } catch {
        // Rasterização falhou (PDF corrompido/ilegível pro pdf.js)  segue com o original, a
        // verificação de tamanho abaixo cobre o caso.
      }
      setComprimindoArquivo(false)
    }

    if (arquivoFinal.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
      const tamanhoMb = (arquivoFinal.size / (1024 * 1024)).toFixed(1)
      setFileError(`Arquivo muito grande (${tamanhoMb} MB)  o limite é ${TAMANHO_MAXIMO_ARQUIVO_MB} MB.`)
      setSelectedFile(null)
      e.target.value = ""
      return
    }
    setFileError(null)
    setSelectedFile(arquivoFinal)
  }

  function removerArquivo() {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl px-3 md:px-4 py-4 md:py-6 flex flex-col gap-6 md:gap-8">
        {!showTurmas && (
          <div className="flex gap-1 p-1.5 rounded-lg" style={{ background: "var(--secundary)" }}>
            {TABS.map((tab) => {
              const href = turmaAtiva ? `/t/${turmaAtiva.id}${tab.href}` : tab.href
              const isActive = turmaAtiva ? pathname === href : pathname === tab.href
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={`flex items-center gap-1.5 md:gap-2 justify-center py-1.5 md:py-2 rounded-md text-xs md:text-sm transition-all w-full ${
                    isActive ? "bg-(--background) font-bold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 font-semibold"
                  }`}
                >
                  {tab.icon && (
                    <tab.icon
                      size={20}
                      weight={isActive ? "fill" : "regular"}
                      color={isActive ? "var(--brand)" : undefined}
                    />
                  )}
                  {tab.label}
                </Link>
              )
            })}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl md:text-[2rem] font-semibold">
            {turmaAtiva ? turmaLabel(turmaAtiva) : "Olá, Professor!"}
          </h1>
          {!turmaAtiva && <p className="text-xs">Como posso ajudar você hoje?</p>}
        </div>

        {showCreate && !showTurmas && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-[8px] border-1 border-(--secundary) rounded-full p-[8px] bg-(--background) focus-within:border-[var(--brand)] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={comprimindoArquivo}
                className="text-gray-400 hover:text-[var(--brand)] transition-colors shrink-0 p-1.5 hover:bg-(--secundary) rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={selectedFile ? selectedFile.name : "Anexar arquivo"}
              >
                <PaperclipIcon size={20} weight="bold" className={selectedFile ? "text-[var(--brand)]" : ""} />
              </button>
              {selectedFile && (
                <span className="flex items-center gap-1 shrink-0 max-w-[80px] sm:max-w-[160px] bg-(--secundary) rounded-full pl-2.5 pr-1 py-1">
                  <span className="text-xs text-[var(--brand)] truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={removerArquivo}
                    className="shrink-0 p-0.5 rounded-full hover:bg-(--background) text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remover arquivo"
                  >
                    <XIcon size={12} weight="bold" />
                  </button>
                </span>
              )}
              <input
                type="text"
                name="tema"
                id="tema"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Qual o tema ${PREPOSICAO_POR_TITLE[title ?? ""] ?? "da"} ${title}?`}
                className="flex-1 min-w-0 outline-none text-sm bg-transparent placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!generatorType || (!tema.trim() && !selectedFile)}
                className="shrink-0 p-2 rounded-full bg-[var(--brand)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PaperPlaneRightIcon weight="fill" size={20} color="white" />
              </button>
            </div>
            {comprimindoArquivo && <p className="text-xs text-gray-400 px-3">Comprimindo arquivo grande…</p>}
            {fileError && <p className="text-xs text-red-500 px-3">{fileError}</p>}
          </div>
        )}

        {showTurmas && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Minhas Turmas</h2>
              <button
                type="button"
                onClick={() => openNovaTurma()}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-[var(--brand)] hover:bg-(--secundary) transition-colors cursor-pointer"
              >
                <PlusIcon size={14} weight="bold" />
                Nova Turma
              </button>
            </div>
            <div className="flex flex-col rounded-xl border-1 border-(--secundary) overflow-hidden">
              {turmas.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Nenhuma turma cadastrada.</p>
              )}
              {turmas.map((turma, index) => (
                <div
                  key={turma.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/t/${turma.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      router.push(`/t/${turma.id}`)
                    }
                  }}
                  className={`flex items-center px-3 md:px-[16px] py-3 md:py-[20px] gap-3 md:gap-8 hover:bg-(--secundary) transition-colors group cursor-pointer ${index !== turmas.length - 1 ? "border-b-1 border-(--secundary)" : ""}`}
                >
                  <span className="shrink-0 p-1.5 rounded-lg" style={{ background: "var(--secundary)" }}>
                    <UsersIcon size={18} weight="fill" color="var(--brand)" />
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">{turmaLabel(turma)}</span>
                  <div className="hidden md:flex shrink-0 items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <NotebookIcon size={13} />
                      {turma.atividades} atividades
                    </span>
                    <span className="flex items-center gap-1">
                      <ArticleIcon size={13} />
                      {turma.provas} provas
                    </span>
                  </div>
                  <div className="space-x-2 md:space-x-4 shrink-0">
                    <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openNovaTurma(turma)
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:text-(--brand) hover:bg-(--secundary) transition-colors group-hover:opacity-100 cursor-pointer"
                    title="Editar"
                  >
                    <PencilSimpleIcon size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteConfirm(turma.id)
                    }}
                    className="shrink-0 p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group-hover:opacity-100 cursor-pointer"
                    title="Excluir"
                  >
                    <TrashIcon size={16} weight="bold" />
                  </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showTurmas && (
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recentes</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-(--secundary) transition-colors text-gray-500 hover:text-gray-800 cursor-pointer"
              >
                <FunnelSimpleIcon size={14} weight="bold" />
                {SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Recentes"}
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 z-10 bg-(--secundary) dark:bg-(--background) border border-(--secundary) rounded-xl shadow-md min-w-[160px] overflow-hidden">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => { setActiveSort(o.value); setShowFilter(false) }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-(--secundary) cursor-pointer ${activeSort === o.value ? "font-semibold text-[var(--brand)]" : "text-gray-600 dark:text-gray-300"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={`flex flex-col rounded-xl border-1 border-(--secundary) overflow-hidden ${activeSort !== "recentes" ? "max-h-[60dvh] overflow-y-auto" : ""}`}>
            {visibleItems.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum item encontrado.</p>
            )}
            {visibleItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center px-3 md:px-[16px] py-3 md:py-[20px] gap-3 md:gap-8 hover:bg-(--secundary) transition-colors group ${index !== visibleItems.length - 1 ? "border-b-1 border-(--secundary)" : ""}`}
              >
                <span className="shrink-0 p-1.5 rounded-lg" style={{ background: "var(--secundary)" }}>
                  <item.icon size={18} weight="fill" />
                </span>
                {turmaId && (item.type === "atividades" || item.type === "provas" || item.type === "plano-de-aula") ? (
                  <Link
                    href={`/t/${turmaId}/${item.type}/editar/${item.id}`}
                    className="flex-1 text-sm font-medium truncate hover:text-(--brand) transition-colors"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span className="flex-1 text-sm font-medium truncate">{item.title}</span>
                )}
                <span className="shrink-0 text-xs text-gray-400">{item.date}</span>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(item.id)}
                  className="shrink-0 p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group-hover:opacity-100 cursor-pointer"
                  title="Excluir"
                >
                  <TrashIcon size={16} weight="bold" />
                </button>
              </div>
            ))}
          </div>
        </div>
        )}

      </div>

      {generatorType && (
        <GeneratorModal
          type={generatorType}
          tema={tema}
          arquivo={selectedFile}
          turmaId={turmaId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}

      <PdfPageRangeModal
        key={pdfParaRecortar ? `${pdfParaRecortar.name}-${pdfParaRecortar.size}-${pdfParaRecortar.lastModified}` : "nenhum"}
        file={pdfParaRecortar}
        numPaginas={numPaginasPdfParaRecortar}
        onConfirm={(arquivoRecortado) => {
          setSelectedFile(arquivoRecortado)
          setPdfParaRecortar(null)
        }}
        onCancel={() => {
          setPdfParaRecortar(null)
          if (fileInputRef.current) fileInputRef.current.value = ""
        }}
      />

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 dark:bg-black/60 md:p-4">
          <div className="bg-(--background) rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full md:max-w-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">Excluir item</h3>
              <p className="text-sm text-(--foreground)">Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-(--foreground) transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={deleteItem}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer"
                style={{ background: "var(--brand)" }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
