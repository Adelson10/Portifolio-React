"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeftIcon, CheckFatIcon, SlidersHorizontalIcon, FloppyDiskIcon, SpinnerGapIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import A4Sheet from "./a4-sheet"
import A4Zoom from "./a4-zoom"
import EditorSidebar from "./editor-sidebar"
import { renumberQuestoes, type QuestaoItem, type Dificuldade } from "./mock-questoes"
import type { QuestaoGerada } from "@/lib/ai/gerar-questoes"
import type { Plano } from "@/lib/ai/model-por-plano"
import { obterLimiteQuestoesPorGeracao } from "@/lib/atividades/limites"
import { useTurmas } from "@/components/turmas-context"

/** Cores fixas do realçador de texto do Word ("Cor de Realce do Texto"), equivalentes a `w:highlight`. */
export type HighlightColor =
  | "black" | "blue" | "cyan" | "darkBlue" | "darkCyan" | "darkGray" | "darkGreen" | "darkMagenta"
  | "darkRed" | "darkYellow" | "green" | "lightGray" | "magenta" | "red" | "white" | "yellow"

/** Hex equivalente de cada `HighlightColor`, usado para renderizar o realce no preview e no PDF. */
export const HIGHLIGHT_HEX: Record<HighlightColor, string> = {
  black: "#000000",
  blue: "#0000FF",
  cyan: "#00FFFF",
  darkBlue: "#00008B",
  darkCyan: "#008B8B",
  darkGray: "#808080",
  darkGreen: "#006400",
  darkMagenta: "#800080",
  darkRed: "#8B0000",
  darkYellow: "#808000",
  green: "#00FF00",
  lightGray: "#D3D3D3",
  magenta: "#FF00FF",
  red: "#FF0000",
  white: "#FFFFFF",
  yellow: "#FFFF00",
}

/** Elemento estrutural extraído de um docx (parágrafo, tabela, imagem, forma etc.), usado para renderizar o modelo no editor, no PDF e ao regerar o Word. */
export type DocxElement =
  // ── Texto ──────────────────────────────────────────────────────
  | { type: "image";            dataUrl: string; align?: "left" | "center" | "right"; widthPx?: number; heightPx?: number; x?: number; y?: number; behindDoc?: boolean; relativeHeight?: number; wrapType?: "none" | "square" | "tight" | "topAndBottom"; crop?: { l: number; r: number; t: number; b: number } }
  | { type: "paragraph";        text: string; align?: "left" | "center" | "right"; bold?: boolean; italic?: boolean; underline?: boolean; subscript?: boolean; superscript?: boolean; highlight?: HighlightColor; fontSize?: number; color?: string; isFormField?: boolean; lineSpacing?: number; fontFamily?: string; height?: number; spaceBefore?: number; spaceAfter?: number; characterSpacing?: number }
  | { type: "heading";          text: string; level: 1 | 2 | 3 | 4 | 5 | 6; align?: "left" | "center" | "right" }
  | { type: "run";              runs: { text: string; bold?: boolean; italic?: boolean; underline?: boolean; subscript?: boolean; superscript?: boolean; highlight?: HighlightColor; color?: string; fontSize?: number; fontFamily?: string; characterSpacing?: number }[]; spaceBefore?: number; spaceAfter?: number; lineSpacing?: number }

  // ── Estrutura ──────────────────────────────────────────────────
  | { type: "table";            rows: { height?: number; heightRule?: "atLeast" | "exact"; cells: { elements: DocxElement[]; colspan?: number; rowspan?: number; width?: number; vAlign?: "top" | "center" | "bottom" }[] }[]; borders?: boolean; borderColor?: string; borderWidth?: number; borderStyle?: string; floatY?: number; tblW?: number; tblpCenter?: boolean; floatLeftFromText?: number; floatRightFromText?: number; cellPad?: { top: number; right: number; bottom: number; left: number } }
  | { type: "bordered-section"; elements: DocxElement[] }
  | { type: "page-break" }
  | { type: "column-break" }
  | { type: "section";          columns: number; elements: DocxElement[] }

  // ── Visual ─────────────────────────────────────────────────────
  | { type: "horizontal-rule";  thickness?: number; color?: string }
  | { type: "text-box";         text: string; x: number; y: number; width: number; height: number; background?: string; fontFamily?: string; fontSize?: number; bold?: boolean; italic?: boolean; color?: string; align?: "left" | "center" | "right"; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; relativeHeight?: number; paddingH?: number; paddingV?: number }
  | { type: "shape";            shapeType: "rectangle" | "circle" | "triangle"; fill?: string; border?: string; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; width?: number; height?: number; x?: number; y?: number; relativeHeight?: number }

  // ── Listas ─────────────────────────────────────────────────────
  | { type: "bullet-list";      items: string[]; indent?: number }
  | { type: "numbered-list";    items: string[]; startAt?: number }

  // ── Formulário ─────────────────────────────────────────────────
  | { type: "form-field";       label?: string; lines?: number; lineLength?: number }
  | { type: "checkbox";         label?: string; checked?: boolean }

  // ── Cabeçalho / Rodapé ─────────────────────────────────────────
  | { type: "header";           elements: DocxElement[] }
  | { type: "footer";           elements: DocxElement[]; pageNumber?: boolean }

  // ── Especiais ──────────────────────────────────────────────────
  | { type: "table-of-contents" }
  | { type: "math";             formula: string }
  | { type: "qr-code";          value: string; size?: number }
  | { type: "paragraph-boundary" }

export interface BorderSide {
  color?: string
  width?: number
  space?: number
  style?: "solid" | "double" | "dashed" | "dotted"
}

export interface PageBorderProps {
  top?: BorderSide
  bottom?: BorderSide
  left?: BorderSide
  right?: BorderSide
}

export interface PageMargins {
  top: number      // px
  right: number    // px
  bottom: number   // px
  left: number     // px
  header?: number  // px  distância da borda superior ao cabeçalho (w:header)
  footer?: number  // px  distância da borda inferior ao rodapé (w:footer)
}

export interface HeaderStyle {
  fontFamily?: string
  fontSize?: number   // half-points
  lineRule?: number   // 240 = simples, 360 = 1.5x, 480 = duplo
}

/** Modelo (template) extraído do docx da instituição, usado como base para a atividade. */
export interface ModeloTemplate {
  elements: DocxElement[]
  hasBorder?: boolean
  pageBorder?: PageBorderProps
  pageBorderOffsetFrom?: "page" | "text"
  pageBackground?: string
  margins?: PageMargins
  fonts?: string[]
  header?: DocxElement[]
  headerStyle?: HeaderStyle
  footer?: { elements: DocxElement[]; pageNumber?: boolean }
}

/** Configuração completa da atividade editada no A4Sheet e usada para gerar o PDF/Word. */
export interface AtividadeConfig {
  formatacao: string
  fonteEscolhida: string
  dificuldade: Dificuldade
  /** Códigos da BNCC da atividade  pré-preenchidos automaticamente pela IA ao gerar (consultando
   *  a base oficial via api.bncc.dev, nunca inventados  ver lib/bncc/detectar-habilidades.ts),
   *  mas continuam editáveis pelo professor. A descrição oficial de cada código é resolvida na
   *  hora contra a mesma base ao exportar (ver generate-word.ts), então uma edição manual também
   *  é verificada de verdade, não só um texto solto. */
  codigosBNCC: string[]
  /** Se os códigos BNCC devem aparecer no rodapé (pré-visualização A4 e .docx exportado) 
   *  `true` por padrão (coluna `mostrar_bncc` nullable no Supabase; `null`/ausente = mostrar). */
  mostrarBNCC: boolean
  acessibilidade: {
    fonteGrande: boolean
    reduzirQuestoes: boolean
    altoContraste: boolean
    espacamento: boolean
    linguagemSimples: boolean
  }
  quantidadeQuestoes: number
  tiposQuestao: string[]
  /** Busca questões reais do ENEM/vestibulares na internet (com fonte citada) antes de gerar  ver `lib/ai/gerar-questoes.ts`. */
  usarBaseVestibular: boolean
  modeloTemplate: ModeloTemplate | null
  questoes?: QuestaoItem[]
}

const DEFAULT_CONFIG: AtividadeConfig = {
  formatacao: "abnt",
  fonteEscolhida: "Arial",
  dificuldade: "medio",
  codigosBNCC: [],
  mostrarBNCC: true,
  acessibilidade: {
    fonteGrande: false,
    reduzirQuestoes: false,
    altoContraste: false,
    espacamento: false,
    linguagemSimples: false,
  },
  quantidadeQuestoes: 3,
  tiposQuestao: ["multipla-escolha", "dissertativo", "verdade-falso"],
  usarBaseVestibular: false,
  modeloTemplate: null,
}

interface ActivityEditorProps {
  turmaId?: string
  atividadeId?: string
  /** "atividade" (padrão) ou "prova"  só afeta rótulos e as rotas de navegação (voltar,
   *  redirecionamento após gerar); a persona da IA já é decidida no backend a partir do
   *  registro salvo em `atividades.tipo`. */
  tipo?: "atividade" | "prova"
}

/** Tela principal do editor de atividades/provas: folha A4 (pré-visualização) + barra lateral de configurações. */
export default function ActivityEditor({ turmaId, atividadeId, tipo = "atividade" }: ActivityEditorProps) {
  const router = useRouter()
  const [config, setConfig] = useState<AtividadeConfig>(DEFAULT_CONFIG)
  const [titulo, setTitulo] = useState<string | null>(null)
  const [atividadeIdAtual, setAtividadeIdAtual] = useState<string | undefined>(atividadeId)
  const [isGenerating, setIsGenerating] = useState(false)
  const [erroGerar, setErroGerar] = useState<string | null>(null)
  const [erroGerarLimite, setErroGerarLimite] = useState(false)
  const [isLoadingModelo, setIsLoadingModelo] = useState(true)
  // Plano + cotas de geração, compartilhados com a Sidebar via TurmasContext  usado aqui só pra
  // limitar as opções de "Quantidade de Questões" (ver EditorSidebar); quem bloqueia a geração de
  // verdade é /api/atividades/gerar. `refreshUso` é chamado após gerar com sucesso pra a barra de
  // uso da Sidebar refletir a cota consumida na hora, sem precisar recarregar a página.
  const { uso, refreshUso } = useTurmas()
  const plano: Plano = (uso?.plano as Plano | undefined) ?? "gratis"
  // "gabarito" troca a folha A4 para mostrar só número + resposta correta de cada questão
  const [modo, setModo] = useState<"questoes" | "gabarito">("questoes")
  // Seleção de questão é estado de UI efêmero  não faz parte do AtividadeConfig exportado no Word
  const [selectedQuestaoId, setSelectedQuestaoId] = useState<string | null>(null)
  const [regenerandoQuestaoId, setRegenerandoQuestaoId] = useState<string | null>(null)
  const [erroRegenerarQuestao, setErroRegenerarQuestao] = useState<string | null>(null)
  // No mobile a barra de configurações vira um painel full-screen off-canvas (ver EditorSidebar)
  //  no desktop essa flag não tem efeito, a barra é sempre visível como hoje.
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  // Salva as questões (texto, imagem, layout, dificuldade por questão, ordem) e as preferências
  // da atividade (formatação, fonte, acessibilidade, BNCC)  sem isso, qualquer edição feita no
  // editor (fora do fluxo "Gerar", que regera tudo via IA) só existia em memória e sumia num
  // refresh. Salvo só sob demanda: um botão "Salvar" aparece na barra superior quando há
  // mudança pendente, e o usuário clica pra gravar  nada é salvo sozinho em segundo plano
  // (cada save é um "apagar e reinserir" de todas as questões + suas imagens, que podem ser
  // base64 grandes; salvar automaticamente gastaria requisições à toa).
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle")
  // true quando há mudanças ainda não gravadas no banco  controla se o botão "Salvar" aparece.
  // Marcado pelos handlers de edição do usuário (nunca pelo carregamento inicial via
  // `updateConfig`, senão o botão apareceria assim que a atividade existente termina de carregar).
  const [dirty, setDirty] = useState(false)
  // Evita duas gravações concorrentes (ex.: duplo clique no botão)  sem isso, dois "apagar e
  // reinserir" simultâneos podem se cruzar e deixar questões duplicadas.
  const salvandoRef = useRef(false)
  // Só permite salvar depois que o fetch de questões existentes (se houver atividadeId) já
  // resolveu  sem isso, um save disparado cedo demais poderia gravar o DEFAULT_CONFIG (mock)
  // por cima das questões reais, antes delas sequer chegarem.
  const [prontoParaSalvar, setProntoParaSalvar] = useState(!atividadeId)

  const basePath = tipo === "prova" ? "provas" : "atividades"
  const questoesAtuais = config.questoes ?? []
  const selectedQuestao = questoesAtuais.find((q) => q.id === selectedQuestaoId) ?? null
  // Teto de questões por geração do plano atual (só "gratis" tem teto reduzido  ver
  // lib/atividades/limites.ts)  limita as opções do seletor no sidebar pra não oferecer uma
  // quantidade que /api/atividades/gerar vai rejeitar.
  const limiteQuestoes = obterLimiteQuestoesPorGeracao(plano) ?? 25

  // Se o plano (recém-carregado) tiver um teto menor que a quantidade já selecionada  ex.:
  // downgrade de plano, ou o valor padrão do editor excede o teto do "gratis"  ajusta pro
  // máximo permitido, mesma lógica do StepConfig no assistente de geração.
  useEffect(() => {
    if (config.quantidadeQuestoes > limiteQuestoes) {
      setConfig((prev) => ({ ...prev, quantidadeQuestoes: limiteQuestoes }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limiteQuestoes])

  // Carrega o modelo de estilo ao abrir o editor  o modelo específico da atividade (enviado no
  // step-style) quando houver, senão o modelo padrão do sistema (ver /api/parse-modelo).
  useEffect(() => {
    setIsLoadingModelo(true)
    const url = atividadeId ? `/api/parse-modelo?atividadeId=${atividadeId}` : "/api/parse-modelo"
    fetch(url)
      .then((r) => r.ok ? r.json() : null)
      .then((data: ModeloTemplate | null) => {
        if (data?.elements?.length || data?.header?.length || data?.footer?.elements?.length) {
          setConfig((prev) => ({ ...prev, modeloTemplate: data }))
        }
      })
      .catch(() => {/* sem template disponível */})
      .finally(() => setIsLoadingModelo(false))
  }, [atividadeId])

  useEffect(() => {
    setAtividadeIdAtual(atividadeId)
  }, [atividadeId])

  // Carrega o título, as questões e a configuração escolhida no assistente de geração
  // (quantidade, dificuldade, tipos) quando a atividade já existe  sem isso o editor sempre
  // caía nos valores padrão (3 questões, médio), mesmo quando outra coisa foi pedida.
  useEffect(() => {
    if (!atividadeId) return
    fetch(`/api/atividades/${atividadeId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: {
        titulo: string
        questoes: QuestaoItem[]
        quantidadeQuestoes?: number
        dificuldade?: Dificuldade
        tiposQuestao?: string[]
        formatacao?: string
        fonteEscolhida?: string
        acessibilidade?: AtividadeConfig["acessibilidade"]
        codigosBNCC?: string[]
        mostrarBNCC?: boolean
      } | null) => {
        if (!data) return
        setTitulo(data.titulo)
        updateConfig({
          ...(data.questoes.length && { questoes: data.questoes }),
          ...(data.quantidadeQuestoes && { quantidadeQuestoes: data.quantidadeQuestoes }),
          ...(data.dificuldade && { dificuldade: data.dificuldade }),
          ...(data.tiposQuestao?.length && { tiposQuestao: data.tiposQuestao }),
          ...(data.formatacao && { formatacao: data.formatacao }),
          ...(data.fonteEscolhida && { fonteEscolhida: data.fonteEscolhida }),
          ...(data.acessibilidade && { acessibilidade: data.acessibilidade }),
          ...(data.codigosBNCC?.length && { codigosBNCC: data.codigosBNCC }),
          ...(typeof data.mostrarBNCC === "boolean" && { mostrarBNCC: data.mostrarBNCC }),
        })
      })
      .catch(() => {/* mantém o mock em caso de falha */})
      .finally(() => setProntoParaSalvar(true))
  }, [atividadeId])

  // Grava no banco o estado atual (questões + formatação/fonte/acessibilidade/BNCC)  ver PUT em
  // /api/atividades/[id]. Só chamado pelo clique no botão "Salvar" (ver JSX abaixo)  nada
  // dispara isso sozinho. Guardas: precisa existir uma atividade no banco (atividadeIdAtual), o
  // carregamento inicial já ter terminado (prontoParaSalvar), haver mudança pendente (dirty) e
  // não haver outro save em andamento (salvandoRef).
  async function salvarAgora() {
    if (!atividadeIdAtual || !prontoParaSalvar || !dirty || salvandoRef.current) return
    salvandoRef.current = true
    setSaveState("saving")
    try {
      const res = await fetch(`/api/atividades/${atividadeIdAtual}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questoes: questoesAtuais,
          formatacao: config.formatacao,
          fonteEscolhida: config.fonteEscolhida,
          acessibilidade: config.acessibilidade,
          codigosBNCC: config.codigosBNCC,
          mostrarBNCC: config.mostrarBNCC,
        }),
      })
      if (!res.ok) throw new Error()
      setDirty(false)
      setSaveState("idle")
    } catch {
      setSaveState("error") // dirty continua true  botão "Salvar" segue visível pra tentar de novo
    } finally {
      salvandoRef.current = false
    }
  }

  function updateConfig(partial: Partial<AtividadeConfig>) {
    setConfig((prev) => ({ ...prev, ...partial }))
  }

  /** Mesmo que `updateConfig`, mas marca a flag de "mudança pendente" (mostra o botão "Salvar") 
   *  usada nos handlers de edição do usuário (nunca no carregamento inicial da atividade, ver
   *  efeito acima). */
  function handleUserConfigChange(partial: Partial<AtividadeConfig>) {
    updateConfig(partial)
    setDirty(true)
  }

  function handleSelectQuestao(id: string | null) {
    setSelectedQuestaoId(id)
    if (id) setMobilePanelOpen(true)
  }

  function handleReorderQuestoes(newOrder: QuestaoItem[]) {
    handleUserConfigChange({ questoes: renumberQuestoes(newOrder) })
  }

  function handleUpdateQuestao(id: string, partial: Partial<QuestaoItem>) {
    handleUserConfigChange({ questoes: questoesAtuais.map((q) => (q.id === id ? { ...q, ...partial } : q)) })
  }

  async function handleRegenerateQuestao(id: string) {
    const alvo = questoesAtuais.find((q) => q.id === id)
    if (!alvo) return

    setRegenerandoQuestaoId(id)
    setErroRegenerarQuestao(null)
    try {
      const evitarTemas = questoesAtuais.filter((q) => q.id !== id).map((q) => q.enunciado)
      const res = await fetch("/api/questoes/regenerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turmaId,
          atividadeId: atividadeIdAtual,
          titulo,
          tipo: alvo.tipo,
          dificuldade: alvo.dificuldade ?? config.dificuldade,
          usarBaseVestibular: config.usarBaseVestibular,
          evitarTemas,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Não foi possível regenerar a questão.")

      const nova: QuestaoGerada = data.questao
      handleUpdateQuestao(id, {
        tipo: nova.tipo,
        enunciado: nova.enunciado,
        opcoes: nova.opcoes,
        afirmativas: nova.afirmativas,
        gabarito: nova.gabarito,
        numeroLinhas: nova.numeroLinhas,
      })
    } catch (err) {
      setErroRegenerarQuestao(err instanceof Error ? err.message : "Não foi possível regenerar a questão.")
    } finally {
      setRegenerandoQuestaoId(null)
    }
  }

  async function handleGenerate() {
    if (!turmaId) return

    setIsGenerating(true)
    setErroGerar(null)
    setErroGerarLimite(false)
    try {
      const formData = new FormData()
      formData.set("turmaId", turmaId)
      formData.set("tipo", tipo)
      if (titulo?.trim()) formData.set("titulo", titulo)
      formData.set("quantidadeQuestoes", String(config.quantidadeQuestoes))
      formData.set("tipos", JSON.stringify(config.tiposQuestao))
      formData.set("dificuldade", config.dificuldade)
      formData.set("usarBaseVestibular", String(config.usarBaseVestibular))
      if (atividadeIdAtual) formData.set("atividadeId", atividadeIdAtual)

      const res = await fetch("/api/atividades/gerar", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok || data.error) {
        setErroGerarLimite(!!data.limiteAtingido)
        throw new Error(data.error ?? (tipo === "prova" ? "Não foi possível gerar a prova." : "Não foi possível gerar a atividade."))
      }

      const questoesGeradas = renumberQuestoes(
        (data.questoes as QuestaoGerada[]).map((q) => ({
          id: crypto.randomUUID(),
          numero: 0,
          tipo: q.tipo,
          enunciado: q.enunciado,
          opcoes: q.opcoes,
          afirmativas: q.afirmativas,
          gabarito: q.gabarito,
          numeroLinhas: q.numeroLinhas,
        }))
      )
      updateConfig({ questoes: questoesGeradas, codigosBNCC: (data.codigosBNCC as string[]) ?? [] })
      setTitulo(data.titulo)

      if (!atividadeIdAtual && data.atividadeId) {
        setAtividadeIdAtual(data.atividadeId)
        router.replace(`/t/${turmaId}/${basePath}/editar/${data.atividadeId}`)
      }
      // Essa geração acabou de consumir cota  atualiza a barra de uso da Sidebar na hora,
      // em vez de só no próximo mount dela (ver TurmasContext.refreshUso).
      refreshUso()
    } catch (err) {
      setErroGerar(err instanceof Error ? err.message : (tipo === "prova" ? "Não foi possível gerar a prova." : "Não foi possível gerar a atividade."))
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownloadWord() {
    const { generateWordBlob } = await import("./generate-word")
    const blob = await generateWordBlob(config)
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = tipo === "prova" ? "prova.docx" : "atividade.docx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function handleDownloadGabaritoWord() {
    const { generateWordBlob } = await import("./generate-word")
    const blob = await generateWordBlob(config, "gabarito")
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "gabarito.docx"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const backHref = turmaId ? `/t/${turmaId}/${basePath}` : "/"

  return (
    <div className="flex h-full overflow-hidden">
      {/* Área do documento A4 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-(--secundary) shrink-0 bg-(--background)">
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-(--foreground)/50 hover:text-(--foreground) transition-colors"
          >
            <ArrowLeftIcon size={15} />
            Voltar
          </Link>
          <div className="w-px h-4 bg-(--secundary)" />
          <span className="flex-1 min-w-0 text-sm font-semibold truncate">{titulo ?? (tipo === "prova" ? "Nova prova" : "Nova atividade")}</span>
          {atividadeIdAtual && (dirty || saveState === "error") && (
            <button
              type="button"
              onClick={salvarAgora}
              disabled={saveState === "saving"}
              className={`shrink-0 flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                saveState === "error"
                  ? "bg-red-500 text-white hover:opacity-90"
                  : "bg-(--brand) text-white hover:opacity-90"
              }`}
            >
              {saveState === "saving" ? (
                <SpinnerGapIcon size={14} className="animate-spin" />
              ) : (
                <FloppyDiskIcon size={14} weight="bold" />
              )}
              {saveState === "saving" ? "Salvando..." : saveState === "error" ? "Tentar de novo" : "Salvar Atualização"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setModo((m) => (m === "gabarito" ? "questoes" : "gabarito"))}
            className={`ml-auto flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              modo === "gabarito"
                ? "bg-(--brand) text-white border-(--brand)"
                : "border-(--secundary) hover:bg-(--secundary)"
            }`}
          >
            <CheckFatIcon size={14} weight={modo === "gabarito" ? "fill" : "regular"} />
            Gabarito
          </button>
          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="md:hidden flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-(--secundary) hover:bg-(--secundary) transition-colors cursor-pointer"
          >
            <SlidersHorizontalIcon size={14} />
            Configurações
          </button>
        </div>

        {/* Área rolável com a folha A4 */}
        <div className="flex-1 overflow-auto bg-(--bg-a4) py-10 px-6">
          <A4Zoom>
            <A4Sheet
              config={config}
              isGenerating={isGenerating}
              isLoadingModelo={isLoadingModelo}
              modo={modo}
              selectedQuestaoId={selectedQuestaoId}
              onSelectQuestao={handleSelectQuestao}
              onReorderQuestoes={handleReorderQuestoes}
              onUpdateQuestao={handleUpdateQuestao}
            />
          </A4Zoom>
        </div>
      </div>

      {/* Barra lateral de configurações  vira gaveta full-screen no mobile (ver EditorSidebar) */}
      <EditorSidebar
        tipo={tipo}
        config={config}
        onUpdate={handleUserConfigChange}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        erroGerar={erroGerar}
        erroGerarLimite={erroGerarLimite}
        onDownloadWord={handleDownloadWord}
        onDownloadGabaritoWord={handleDownloadGabaritoWord}
        selectedQuestao={selectedQuestao}
        onUpdateQuestao={(partial) => selectedQuestao && handleUpdateQuestao(selectedQuestao.id, partial)}
        onDeselectQuestao={() => handleSelectQuestao(null)}
        onRegenerateQuestao={() => selectedQuestao && handleRegenerateQuestao(selectedQuestao.id)}
        isRegeneratingQuestao={selectedQuestao?.id === regenerandoQuestaoId}
        erroRegenerarQuestao={erroRegenerarQuestao}
        limiteQuestoes={limiteQuestoes}
        mobileOpen={mobilePanelOpen}
        onCloseMobile={() => setMobilePanelOpen(false)}
      />
    </div>
  )
}
