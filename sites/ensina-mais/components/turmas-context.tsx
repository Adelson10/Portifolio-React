"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { NIVEL_LABELS, type TurmaNivel } from "@/lib/turmas/niveis"

// Re-exportados daqui pra não quebrar os componentes que já importam de "@/components/turmas-context"
//  a definição real vive em lib/turmas/niveis.ts (fora de um módulo "use client") porque os route
// handlers de app/api/turmas também precisam desses valores; ver o comentário lá pro motivo.
export { NIVEL_LABELS }
export type { TurmaNivel }

export interface Turma {
  id: string
  /** Nome da matéria/disciplina (ex.: "Matemática"). */
  nome: string
  nivel: TurmaNivel
  serie: string | null
  periodo: string | null
  atividades: number
  provas: number
}

const NIVEIS_COM_PERIODO: TurmaNivel[] = ["superior", "pos_graduacao"]

export function usaPeriodo(nivel: TurmaNivel) {
  return NIVEIS_COM_PERIODO.includes(nivel)
}

export function serieOuPeriodo(turma: Pick<Turma, "serie" | "periodo">) {
  return turma.serie ?? turma.periodo ?? ""
}

/** Rótulo completo da turma: "série/período - nível - matéria" (ex.: "9º Ano - Fundamental
 *  II - Matemática")  usado onde a matéria importa (título da página, listas de turmas). */
export function turmaLabel(turma: Pick<Turma, "nome" | "nivel" | "serie" | "periodo">): string {
  return [serieOuPeriodo(turma), NIVEL_LABELS[turma.nivel], turma.nome].filter(Boolean).join(" - ")
}

/** Rótulo curto: "série/período - nível" (ex.: "9º Ano - Fundamental II"), sem a matéria  a
 *  barra lateral já filtra por turma, então repetir a matéria ali seria redundante. */
export function turmaLabelCurta(turma: Pick<Turma, "nivel" | "serie" | "periodo">): string {
  return [serieOuPeriodo(turma), NIVEL_LABELS[turma.nivel]].filter(Boolean).join(" - ")
}

export const SERIE_OPTIONS: Record<TurmaNivel, string[]> = {
  infantil: ["Berçário", "Maternal I", "Maternal II", "Pré I", "Pré II"],
  fundamental_1: ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano"],
  fundamental_2: ["6º Ano", "7º Ano", "8º Ano", "9º Ano"],
  medio: ["1º Ano", "2º Ano", "3º Ano"],
  tecnico: ["1º Ano", "2º Ano", "3º Ano", "4º Ano"],
  eja: ["1ª Etapa", "2ª Etapa", "3ª Etapa", "4ª Etapa"],
  superior: [],
  pos_graduacao: [],
}

export const PERIODO_OPTIONS = [
  "1º Período", "2º Período", "3º Período", "4º Período", "5º Período",
  "6º Período", "7º Período", "8º Período", "9º Período", "10º Período",
]

export function opcoesSerieOuPeriodo(nivel: TurmaNivel): string[] {
  return usaPeriodo(nivel) ? PERIODO_OPTIONS : SERIE_OPTIONS[nivel]
}

// Mock de backend em app/api/turmas  pra ligar no backend de verdade, troque essa
// base (ou apague app/api/turmas e aponte pra outra URL); o resto do app já fala com
// a API por fetch, então não muda mais nada fora daqui.
const TURMAS_API = "/api/turmas"

export interface NovaTurmaData {
  nome: string
  nivel: TurmaNivel
  serie?: string
  periodo?: string
}

/** Resposta de GET /api/atividades/limite  plano + cotas de geração (mensal/diária) e de
 *  busca ENEM/vestibular, todas relativas ao usuário logado (ver lib/atividades/limites.ts). */
export interface UsoInfo {
  plano: string
  usadas: number
  limite: number
  usadasDiario?: number
  limiteDiario?: number
  usadasVestibular: number
  limiteVestibular: number
}

interface TurmasContextValue {
  turmas: Turma[]
  addTurma: (data: NovaTurmaData) => Promise<Turma>
  updateTurma: (id: string, data: NovaTurmaData) => Promise<Turma>
  removeTurma: (id: string) => Promise<void>
  novaTurmaOpen: boolean
  turmaEditando: Turma | null
  openNovaTurma: (turma?: Turma) => void
  closeNovaTurma: () => void
  /** Gaveta off-canvas da sidebar no mobile (abaixo do breakpoint `md:`)  no desktop a
   *  sidebar é sempre visível e esse estado não tem efeito nenhum. */
  sidebarMobileOpen: boolean
  openSidebarMobile: () => void
  closeSidebarMobile: () => void
  /** Plano + cotas de geração do usuário  fonte única compartilhada pela Sidebar (barra de
   *  uso) e pelas telas que geram atividade/prova/plano de aula, pra que gerar em qualquer uma
   *  delas atualize a barra de uso na hora, sem precisar recarregar a página (ver `refreshUso`). */
  uso: UsoInfo | null
  /** Rebusca /api/atividades/limite  chame logo após uma geração bem-sucedida (ela consome
   *  cota) pra refletir o novo uso imediatamente em vez de só no próximo mount da Sidebar. */
  refreshUso: () => Promise<void>
}

const TurmasContext = createContext<TurmasContextValue | null>(null)

/**
 * Fonte única dos dados de turma, compartilhada entre a sidebar, a lista "Minhas Turmas" e as
 * páginas /t/[id]/*  sem isso cada componente tinha seu próprio mock e uma turma criada não
 * aparecia nos outros lugares nem sobrevivia a navegar pra dentro dela.
 */
export function TurmasProvider({ children }: { children: ReactNode }) {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [novaTurmaOpen, setNovaTurmaOpen] = useState(false)
  const [turmaEditando, setTurmaEditando] = useState<Turma | null>(null)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [uso, setUso] = useState<UsoInfo | null>(null)

  useEffect(() => {
    fetch(TURMAS_API)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setTurmas(Array.isArray(data) ? data : []))
      .catch(() => setTurmas([]))
  }, [])

  async function refreshUso() {
    try {
      const res = await fetch("/api/atividades/limite")
      if (!res.ok) return
      const data = await res.json()
      if (typeof data.usadas === "number") setUso(data)
    } catch {
      /* mantém o último uso conhecido em caso de falha */
    }
  }

  // Carga inicial (chamada direta, não via `refreshUso`, pra ficar no mesmo formato ".then" do
  // efeito de `turmas` acima  chamar uma função async nomeada aqui dispara um falso positivo no
  // lint de "setState síncrono em efeito", já que ele não enxerga o `await` interno).
  useEffect(() => {
    fetch("/api/atividades/limite")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (typeof data?.usadas === "number") setUso(data) })
      .catch(() => {/* sem uso disponível ainda */})
  }, [])

  async function addTurma(data: NovaTurmaData): Promise<Turma> {
    const res = await fetch(TURMAS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const corpo = await res.json()
    // Sem checar `res.ok`, uma falha (ex.: 500/RLS) devolve `{ error: "..." }`  isso era
    // empurrado pra lista como se fosse uma Turma de verdade (sem `id`), o modal fechava
    // como se tivesse dado certo, e a sidebar quebrava tentando renderizar aquela entrada
    // (React reclamando de "key" undefined na nav).
    if (!res.ok) throw new Error(corpo?.error ?? "Não foi possível criar a turma.")
    const nova: Turma = corpo
    setTurmas((prev) => [...prev, nova])
    return nova
  }

  async function updateTurma(id: string, data: NovaTurmaData): Promise<Turma> {
    const res = await fetch(`${TURMAS_API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const corpo = await res.json()
    if (!res.ok) throw new Error(corpo?.error ?? "Não foi possível salvar as alterações.")
    const atualizada: Turma = corpo
    setTurmas((prev) => prev.map((t) => (t.id === id ? { ...t, ...atualizada } : t)))
    return atualizada
  }

  async function removeTurma(id: string) {
    const res = await fetch(`${TURMAS_API}/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Não foi possível remover a turma.")
    setTurmas((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <TurmasContext.Provider
      value={{
        turmas,
        addTurma,
        updateTurma,
        removeTurma,
        novaTurmaOpen,
        turmaEditando,
        openNovaTurma: (turma) => {
          setTurmaEditando(turma ?? null)
          setNovaTurmaOpen(true)
        },
        closeNovaTurma: () => {
          setNovaTurmaOpen(false)
          setTurmaEditando(null)
        },
        sidebarMobileOpen,
        openSidebarMobile: () => setSidebarMobileOpen(true),
        closeSidebarMobile: () => setSidebarMobileOpen(false),
        uso,
        refreshUso,
      }}
    >
      {children}
    </TurmasContext.Provider>
  )
}

export function useTurmas() {
  const ctx = useContext(TurmasContext)
  if (!ctx) throw new Error("useTurmas precisa ser usado dentro de um TurmasProvider")
  return ctx
}
