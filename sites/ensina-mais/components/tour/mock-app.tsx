"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  SidebarSimpleIcon, UsersIcon, PlusIcon, UserCircleIcon, CaretDownIcon, CaretUpIcon,
  ArticleIcon, ArticleNyTimesIcon, NotebookIcon, PaperclipIcon, PaperPlaneRightIcon,
  PencilSimpleIcon, TrashIcon, FunnelSimpleIcon, XIcon,
  UploadIcon, SquaresFourIcon, WarningCircleIcon,
  CheckFatIcon, TextTIcon, GraduationCapIcon, CertificateIcon, EyeSlashIcon,
  ArrowsClockwiseIcon, FileDocIcon, RowsIcon, ImageIcon, UploadSimpleIcon,
  FloppyDiskIcon, SpinnerGapIcon,
} from "@phosphor-icons/react"
import LogoIcon from "@/assents/logo"
import { useTour } from "./tour-context"
import { TOUR_STEPS, type TourCena } from "./steps"

interface CenaSnapshot {
  cena: TourCena
  temTurma: boolean
  questaoSelecionada: boolean
  comImagem: boolean
  geradas: number
}

const GERAR_STEP_INDEX = TOUR_STEPS.findIndex((s) => s.acao === "gerar")

/** Deriva o que o MockApp deve mostrar a partir só do índice do passo atual - sem estado
 *  mutável próprio, então "Voltar" no tour sempre reproduz a cena certa de graça (ver o
 *  contexto no plano: nada aqui precisa de undo manual). */
function snapshotForStep(index: number): CenaSnapshot {
  const step = TOUR_STEPS[Math.min(index, TOUR_STEPS.length - 1)]
  const cena = step.cena
  let comImagem = false
  if (cena === "editorQuestao") {
    for (let i = index - 1; i >= 0 && TOUR_STEPS[i].cena === "editorQuestao"; i--) {
      if (TOUR_STEPS[i].acao === "enviarImagem") {
        comImagem = true
        break
      }
    }
  }
  return {
    cena,
    temTurma: cena !== "home" && cena !== "modal",
    questaoSelecionada: cena === "editorQuestao",
    comImagem,
    geradas: index >= GERAR_STEP_INDEX ? 16 : 15,
  }
}

/** Réplica falsa e independente do app, usada só enquanto o tutorial está ativo (ver
 *  tour-context.tsx). Nada aqui chama API, mexe no Supabase ou navega de verdade - é
 *  encenação pura, com os mesmos tokens visuais (var(--brand) etc.) e ícones do app real pra
 *  parecer autêntica sem estar de fato ligada a ele. Some por completo ao terminar/pular o
 *  tutorial, sem deixar nenhum rastro (nenhuma turma, nenhuma atividade). */
export default function MockApp() {
  const { active, stepIndex } = useTour()
  const snap = snapshotForStep(stepIndex)
  const [gerando, setGerando] = useState(false)
  const cenaAnteriorRef = useRef<TourCena | null>(null)

  useEffect(() => {
    if (snap.cena === "wizardGerar" && cenaAnteriorRef.current !== "wizardGerar") {
      setGerando(true)
      const t = setTimeout(() => setGerando(false), 1200)
      cenaAnteriorRef.current = snap.cena
      return () => clearTimeout(t)
    }
    cenaAnteriorRef.current = snap.cena
  }, [snap.cena])

  if (!active) return null

  const mostraTurma = snap.cena === "turma" || snap.cena === "wizardEstilo" || snap.cena === "wizardConfig" || snap.cena === "wizardGerar"
  const mostraEditor = snap.cena === "editor" || snap.cena === "editorQuestao"
  const mostraWizard = snap.cena === "wizardEstilo" || snap.cena === "wizardConfig" || snap.cena === "wizardGerar"

  return (
    <div className="fixed inset-0 z-[90] bg-(--background) overflow-hidden text-sm text-(--foreground)">
      <div className="relative flex h-full">
        <FakeSidebar temTurma={snap.temTurma} geradas={snap.geradas} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {snap.cena === "home" && <HomeScene temTurma={snap.temTurma} />}
          {mostraTurma && <TurmaScene />}
          {mostraEditor && <EditorScene questaoSelecionada={snap.questaoSelecionada} comImagem={snap.comImagem} />}
        </div>
      </div>
      {snap.cena === "modal" && <NovaTurmaModalFake />}
      {mostraWizard && <WizardModalFake cena={snap.cena} gerando={gerando} />}
    </div>
  )
}

/* ─── Sidebar + Home ──────────────────────────────────────────── */

function FakeSidebar({ temTurma, geradas }: { temTurma: boolean; geradas: number }) {
  return (
    <aside className="w-64 shrink-0 flex flex-col gap-2 border-r border-(--secundary) bg-(--background) p-4">
      <div className="flex items-center justify-between min-h-[56px]">
        <span className="pl-3 flex"><LogoIcon w={28} h={28} /></span>
        <SidebarSimpleIcon size={20} className="text-(--foreground)/50" />
      </div>
      <hr className="border-t border-(--secundary)" />
      <nav className="flex-1 flex flex-col gap-2">
        <b className="text-(--brand)">Minhas Turmas</b>
        {temTurma && (
          <div className="relative">
            <div className="absolute left-0 inset-y-1 w-[6px] rounded-r-full bg-(--brand)" />
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold">
              <UsersIcon size={20} weight="fill" className="text-(--brand)" />
              <span>6º Ano - Fundamental II</span>
            </div>
          </div>
        )}
        <button
          type="button"
          data-tour="nova-turma"
          className="flex items-center w-full rounded-lg py-2 px-3 gap-3 text-sm font-medium text-(--brand) hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          <PlusIcon size={18} className="shrink-0" />
          <span>Nova Turma</span>
        </button>
      </nav>
      <div className="px-1 py-1.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-(--foreground)/50 mb-1.5">
          <span>Atividades este mês</span>
          <span className="font-medium tabular-nums">{geradas}/400</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-(--secundary) overflow-hidden">
          <div className="h-full rounded-full bg-(--brand) transition-all" style={{ width: `${Math.min(100, (geradas / 400) * 100)}%` }} />
        </div>
      </div>
      <button type="button" className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm hover:bg-(--secundary) transition-colors cursor-pointer">
        <UserCircleIcon size={22} className="shrink-0 text-(--brand)" />
        <span className="flex-1 text-left font-medium">Professor(a)</span>
        <CaretDownIcon size={14} />
      </button>
    </aside>
  )
}

function HomeScene({ temTurma }: { temTurma: boolean }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Olá, Professor!</h1>
          <p className="text-xs">Como posso ajudar você hoje?</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Minhas Turmas</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-(--brand) px-3 py-1.5 rounded-full">
              <PlusIcon size={14} weight="bold" /> Nova Turma
            </span>
          </div>
          <div className="flex flex-col rounded-xl border border-(--secundary) overflow-hidden">
            {!temTurma ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma turma cadastrada.</p>
            ) : (
              <div className="flex items-center px-4 py-5 gap-8">
                <span className="shrink-0 p-1.5 rounded-lg bg-(--secundary)"><UsersIcon size={18} weight="fill" className="text-(--brand)" /></span>
                <span className="flex-1 text-sm font-medium">6º Ano - Fundamental II - Matemática</span>
                <span className="flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><NotebookIcon size={13} /> 0 atividades</span>
                  <span className="flex items-center gap-1"><ArticleIcon size={13} /> 0 provas</span>
                </span>
                <span className="flex gap-4 text-(--foreground)/60">
                  <PencilSimpleIcon size={16} weight="bold" />
                  <TrashIcon size={16} weight="bold" />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Turma ────────────────────────────────────────────────────── */

function TurmaScene() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 flex flex-col gap-8">
        <div data-tour="abas" className="flex gap-1 p-1.5 rounded-lg bg-(--secundary)">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-(--background) text-sm font-bold">
            <NotebookIcon size={20} weight="fill" className="text-(--brand)" /> Atividades
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold text-gray-500">
            <ArticleIcon size={20} /> Provas
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold text-gray-500">
            <ArticleNyTimesIcon size={20} /> Plano de Aula
          </div>
        </div>
        <h1 className="text-3xl font-semibold">6º Ano - Fundamental II - Matemática</h1>
        <div data-tour="campo-tema" className="flex items-center gap-2 p-2 border border-(--secundary) rounded-full">
          <span className="p-1.5 rounded-full text-gray-400"><PaperclipIcon size={20} weight="bold" /></span>
          <span className="flex-1 text-sm">Regra de três</span>
          <span className="w-9 h-9 rounded-full bg-(--brand) flex items-center justify-center">
            <PaperPlaneRightIcon weight="fill" size={20} className="text-white" />
          </span>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recentes</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500"><FunnelSimpleIcon size={14} weight="bold" /> Recentes</span>
          </div>
          <div className="flex flex-col rounded-xl border border-(--secundary) overflow-hidden">
            <p className="text-sm text-gray-400 text-center py-6">Nenhum item encontrado.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal "Nova turma" ───────────────────────────────────────── */

function NovaTurmaModalFake() {
  return (
    <div className="fixed inset-0 z-[195] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-(--background) rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Nova turma</h3>
          <XIcon size={16} className="text-(--foreground)/50" />
        </div>
        <div data-tour="campos-turma" className="flex flex-col gap-4">
          <FakeField label="Nome da Disciplina" value="Matemática" />
          <FakeField label="Nível" value="Fundamental II" />
          <FakeField label="Série/Ano" value="6º Ano" />
        </div>
        <div className="flex gap-3 justify-end pt-1">
          <span className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500">Cancelar</span>
          <button type="button" data-tour="criar-turma" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-(--brand) cursor-pointer">
            Criar turma
          </button>
        </div>
      </div>
    </div>
  )
}

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-(--foreground)/70">{label}</span>
      <div className="flex items-center justify-between text-sm border border-(--secundary) rounded-lg px-3 py-2">
        {value}
        <CaretDownIcon size={10} className="text-gray-400" />
      </div>
    </div>
  )
}

/* ─── Assistente de geração (wizard) ───────────────────────────── */

function WizardModalFake({ cena, gerando }: { cena: TourCena; gerando: boolean }) {
  const wizardStep = cena === "wizardEstilo" ? 0 : cena === "wizardConfig" ? 1 : 2
  const rotulo = wizardStep === 0 ? "Próximo" : wizardStep === 1 ? "Gerar" : "Concluir"

  return (
    <div className="fixed inset-0 z-[195] flex items-center justify-center bg-black/40 p-4">
      <div className="w-[500px] max-w-full bg-(--background) border border-(--secundary) rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Gerar Atividade</h2>
          <span className="p-1.5 border border-(--secundary) rounded-lg text-(--foreground)/50"><XIcon size={18} /></span>
        </div>
        <div className="flex">
          {["Estilo", "Configurações", "Gerar"].map((label, i) => (
            <div
              key={label}
              className={`flex-1 flex justify-center border-b-2 py-2 text-sm font-semibold ${
                i === wizardStep ? "border-(--foreground)" : "border-(--secundary) text-(--foreground)/40"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
        {cena === "wizardEstilo" && <EstiloBody />}
        {cena === "wizardConfig" && <ConfigBody />}
        {cena === "wizardGerar" && <GerarBody gerando={gerando} />}
        <div className="flex items-center justify-between gap-3">
          {wizardStep > 0 && (
            <span className="w-28 border border-(--secundary) px-4 py-3 rounded-lg text-sm font-medium text-(--foreground)/60 text-center">
              Voltar
            </span>
          )}
          <button
            type="button"
            data-tour="avancar-wizard"
            disabled={gerando}
            className={`${wizardStep === 0 ? "ml-auto" : ""} w-28 px-4 py-3 rounded-lg text-sm font-medium text-white bg-(--brand) cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {rotulo}
          </button>
        </div>
      </div>
    </div>
  )
}

function EstiloBody() {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <h2 className="text-sm font-bold">Como você deseja definir o estilo da atividade?</h2>
      <button
        type="button"
        data-tour="selecionar-proprio-modelo"
        className="flex gap-4 p-5 border border-(--secundary) rounded-xl text-left cursor-pointer hover:bg-(--secundary) transition-colors"
      >
        <UploadIcon size={30} className="m-1 shrink-0" />
        <div className="space-y-1">
          <h1 className="font-bold text-sm">Selecionar um novo modelo</h1>
          <p className="text-xs text-(--foreground)/70">Envie um .docx com apenas o cabeçalho da sua escola.</p>
        </div>
      </button>
      <button
        type="button"
        data-tour="modelo-pronto"
        className="flex gap-4 p-5 border border-(--brand) rounded-xl text-left cursor-pointer hover:bg-(--secundary) transition-colors"
      >
        <SquaresFourIcon size={30} className="m-1 shrink-0" />
        <div className="space-y-1">
          <h1 className="font-bold text-sm">Usar um modelo pronto</h1>
          <p className="text-xs text-(--foreground)/70">Escolha entre os modelos disponíveis para definir a aparência e estrutura da atividade.</p>
        </div>
      </button>
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-(--secundary)/50">
        <WarningCircleIcon size={14} className="shrink-0 mt-0.5 text-(--foreground)/50" />
        <p className="text-[11px] leading-relaxed text-(--foreground)/60">
          O arquivo enviado deve conter <strong>apenas o cabeçalho da página</strong> (logo, nome da escola, campos como Nome/Turma/Data) - use o recurso de Cabeçalho do Word (Inserir → Cabeçalho).
        </p>
      </div>
    </div>
  )
}

function ConfigBody() {
  const tipos: [string, boolean][] = [
    ["Múltipla escolha", true],
    ["Matemática (fórmulas e cálculo)", true],
    ["Verdadeiro ou falso", false],
    ["Dissertativo", false],
  ]
  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Quantidade de Questões</p>
          <div className="flex items-center justify-between text-sm border border-(--secundary) rounded-xl p-2.5">
            5 Questões <CaretDownIcon size={10} className="text-gray-400" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Nível de Dificuldade</p>
          <div className="flex items-center justify-between text-sm border border-(--secundary) rounded-xl p-2.5">
            Médio <CaretDownIcon size={10} className="text-gray-400" />
          </div>
        </div>
      </div>
      <div data-tour="tipos" className="flex flex-col gap-2">
        <p className="text-sm font-semibold">
          Tipos de Questões <span className="font-normal text-(--foreground)/40">(selecione ao menos um)</span>
        </p>
        {tipos.map(([label, checked]) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${checked ? "bg-(--foreground) border-(--foreground)" : "border-(--secundary)"}`}>
              {checked && <CheckFatIcon size={12} weight="fill" className="text-(--background)" />}
            </span>
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GerarBody({ gerando }: { gerando: boolean }) {
  if (gerando) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10 text-center">
        <SpinnerGapIcon size={28} className="animate-spin text-(--brand)" />
        <p className="text-sm font-medium">Gerando as questões com a IA...</p>
      </div>
    )
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 text-center">
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center text-(--brand)"
        style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
      >
        <CheckFatIcon size={24} weight="fill" />
      </span>
      <p className="text-sm font-semibold">5 questões prontas!</p>
      <p className="text-xs text-(--foreground)/60">Habilidades da BNCC detectadas: EF06MA13, EF06MA26</p>
    </div>
  )
}

/* ─── Editor ───────────────────────────────────────────────────── */

function EditorScene({ questaoSelecionada, comImagem }: { questaoSelecionada: boolean; comImagem: boolean }) {
  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg-a4)" }}>
        <div className="flex items-center gap-3 px-4 py-3 bg-(--background) border-b border-(--secundary)">
          <span className="flex-1 text-sm font-semibold">Regra de 3</span>
          <button
            type="button"
            data-tour="salvar"
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-(--brand) text-white cursor-pointer"
          >
            <FloppyDiskIcon size={14} weight="bold" /> Salvar Atualização
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-(--secundary)">
            <CheckFatIcon size={14} /> Gabarito
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex justify-center">
          <div className="w-full max-w-[620px] bg-white shadow p-12 text-[#1a1a1a]" style={{ fontFamily: "Arial, sans-serif", fontSize: 13, lineHeight: 1.5 }}>
            <div className="flex items-center justify-center gap-3.5 pb-4">
              <span className="w-24 h-8 border border-dashed border-gray-400 flex items-center justify-center text-[9px] tracking-widest text-gray-500">LOGO</span>
              <span className="w-24 h-8 border border-dashed border-gray-400 flex items-center justify-center text-[9px] tracking-widest text-gray-500">LOGO</span>
            </div>
            <table className="w-full border-collapse text-[11px] mb-5">
              <tbody>
                <tr>
                  <td className="border border-[#1a1a1a] p-1 font-bold text-center">Etec de Novo Horizonte</td>
                  <td className="border border-[#1a1a1a] p-1 font-bold">Curso:</td>
                  <td className="border border-[#1a1a1a] p-1 font-bold">Componente Curricular:</td>
                </tr>
                <tr>
                  <td className="border border-[#1a1a1a] p-1 font-bold">Módulo/Série:</td>
                  <td className="border border-[#1a1a1a] p-1 font-bold">Professor(a):</td>
                  <td className="border border-[#1a1a1a] p-1 font-bold">Data:____/____/____ Menção:</td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-[#1a1a1a] p-1 font-bold">Aluno (a):</td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-[#1a1a1a] p-1 font-bold">Instruções:</td>
                </tr>
              </tbody>
            </table>
            <p className="text-center font-bold mb-5">AVALIAÇÃO ESCRITA</p>
            <p className="text-justify mb-6">
              <strong>1.</strong> A professora Mariana precisa distribuir lápis para seus alunos. Ela sabe que, com 2 caixas, ela consegue distribuir 10 lápis. Quantos lápis ela terá se comprar 5 caixas iguais? (Considere que a relação entre caixas e lápis é proporcional).
            </p>
            <div data-tour="questao" className={`p-2 border-2 rounded cursor-pointer ${questaoSelecionada ? "border-(--brand)" : "border-transparent"}`}>
              <p className="mb-2"><strong>2.</strong> Se 1 caderno custa 3 reais, quanto custarão 4 cadernos iguais a esse?</p>
              <p className="mb-1 pl-4"><strong>A)</strong> 3 reais</p>
              <p className="mb-1 pl-4"><strong>B)</strong> 7 reais</p>
              <p className="mb-1 pl-4"><strong>C)</strong> 10 reais</p>
              <p className="mb-1 pl-4"><strong>D)</strong> 12 reais</p>
              <p className="pl-4"><strong>E)</strong> 15 reais</p>
            </div>
          </div>
        </div>
      </div>
      {questaoSelecionada ? <QuestionPanelFake comImagem={comImagem} /> : <ConfigPanelFake />}
    </div>
  )
}

function ConfigPanelFake() {
  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-l border-(--secundary) bg-(--background) overflow-hidden">
      <div className="px-4 py-3 border-b border-(--secundary) text-sm font-semibold">Configurações</div>
      <div className="flex-1 overflow-y-auto">
        <FakeSection icon={<TextTIcon size={14} />} label="Formatação" />
        <FakeSection icon={<GraduationCapIcon size={14} />} label="Dificuldade" />
        <FakeSection icon={<CertificateIcon size={14} />} label="Códigos BNCC" />
        <div data-tour="acessibilidade" className="border-b border-(--secundary)">
          <div className="flex items-center gap-2 px-4 py-3">
            <EyeSlashIcon size={14} className="text-(--foreground)/50" />
            <span className="flex-1 text-xs font-semibold">Acessibilidade</span>
            <CaretUpIcon size={11} className="text-(--foreground)/40" />
          </div>
          <div className="px-4 pb-4 flex flex-col gap-3">
            <FakeToggle label="Fonte grande" desc="Baixa visão" on />
            <FakeToggle label="Reduzir alternativas" desc="TEA / autismo" />
            <FakeToggle label="Alto contraste" desc="Baixa visão" />
          </div>
        </div>
      </div>
      <div className="border-t border-(--secundary) p-3 flex flex-col gap-2">
        <span className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-(--brand) text-white text-xs font-semibold">
          <ArrowsClockwiseIcon size={14} /> Gerar Atividade Completa
        </span>
        <div data-tour="baixar" className="grid grid-cols-2 gap-2">
          <span className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary)">
            <CheckFatIcon size={13} /> Baixar Gabarito
          </span>
          <span className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary)">
            <FileDocIcon size={13} /> Baixar Prova
          </span>
        </div>
      </div>
    </aside>
  )
}

function FakeSection({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-(--secundary)">
      <span className="text-(--foreground)/50">{icon}</span>
      <span className="flex-1 text-xs font-semibold">{label}</span>
      <CaretDownIcon size={11} className="text-(--foreground)/40" />
    </div>
  )
}

function FakeToggle({ label, desc, on }: { label: string; desc: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[10px] text-(--foreground)/40">{desc}</span>
      </span>
      <span className={`relative w-9 h-5 rounded-full shrink-0 ${on ? "bg-(--brand)" : "bg-(--secundary)"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${on ? "left-4" : "left-0.5"}`} />
      </span>
    </div>
  )
}

function QuestionPanelFake({ comImagem }: { comImagem: boolean }) {
  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-l border-(--secundary) bg-(--background) overflow-hidden">
      <div className="px-4 py-3 border-b border-(--secundary) flex items-center justify-between">
        <span className="text-sm font-semibold">Questão 2</span>
        <XIcon size={13} className="text-(--foreground)/50" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-(--secundary) p-4">
          <div className="flex items-center gap-2 mb-3">
            <RowsIcon size={14} className="text-(--foreground)/50" />
            <span className="flex-1 text-xs font-semibold">Layout</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span
              className="p-2 text-center border border-(--brand) rounded-lg text-xs font-medium text-(--brand)"
              style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
            >
              Vertical
            </span>
            <span className="p-2 text-center border border-(--secundary) rounded-lg text-xs font-medium">Horizontal</span>
          </div>
        </div>
        <div data-tour="imagem" className="border-b border-(--secundary) p-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={14} className="text-(--foreground)/50" />
            <span className="flex-1 text-xs font-semibold">Adicionar imagem</span>
          </div>
          {!comImagem ? (
            <span className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary)">
              <UploadSimpleIcon size={13} /> Enviar do computador
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-12 h-12 border border-(--secundary) rounded-md bg-(--secundary) flex items-center justify-center text-(--foreground)/40">
                <ImageIcon size={18} />
              </span>
              <span className="flex-1 text-[10px] text-(--foreground)/50">Enviada do computador</span>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-(--secundary) p-3">
        <button
          type="button"
          data-tour="regerar"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-(--brand) cursor-pointer"
        >
          <ArrowsClockwiseIcon size={14} /> Regerar
        </button>
      </div>
    </aside>
  )
}
