"use client"

import { XIcon } from "@phosphor-icons/react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import StepConfig from "./atividades/steps/step-config"
import StepGenerate, { type GenerationStatus } from "./atividades/steps/step-generate"
import StepStyle, { ModelSelector, type ModeloEstilo } from "./atividades/steps/step-style"
import StepConfigPlano from "./plano-de-aula/step-config"
import StepGeneratePlano from "./plano-de-aula/step-generate"
import type { QuestaoGerada } from "@/lib/ai/gerar-questoes"
import type { PlanoAulaGerado } from "@/lib/ai/gerar-plano-aula"
import type { Plano } from "@/lib/ai/model-por-plano"
import type { ArquivoReferencia } from "@/lib/ai/extrair-conteudo-arquivo"
import { useTurmas } from "@/components/turmas-context"

export type GeneratorType = "atividade" | "plano-de-aula" | "provas"

const MODAL_CONFIG: Record<GeneratorType, { title: string; steps: string[] }> = {
  "atividade": {
    title: "Gerar Atividade",
    steps: ["Estilo", "Configurações", "Gerar"],
  },
  "provas": {
    title: "Gerar Prova",
    steps: ["Estilo", "Configurações", "Gerar"],
  },
  "plano-de-aula": {
    title: "Gerar Plano de Aula",
    steps: ["Estilo", "Configurações", "Gerar"],
  },
}

interface GeneratorModalProps {
  type: GeneratorType
  tema: string
  arquivo?: File | null
  turmaId?: string
  isOpen: boolean
  onClose: () => void
}

export default function GeneratorModal({ type, tema, arquivo, turmaId, isOpen, onClose }: GeneratorModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [view, setView] = useState<"flow" | "model-selector">("flow")
  const [modeloEstilo, setModeloEstilo] = useState<ModeloEstilo | null>(null)
  const [logoInstituicao, setLogoInstituicao] = useState<File | null>(null)
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10)
  const [tipos, setTipos] = useState<string[]>([])
  const [dificuldade, setDificuldade] = useState("medio")
  const [usarBaseVestibular, setUsarBaseVestibular] = useState(false)
  const [disciplina, setDisciplina] = useState("")
  const [dataAula, setDataAula] = useState("")
  const [duracaoMinutos, setDuracaoMinutos] = useState(50)
  const [formatoAula, setFormatoAula] = useState("expositiva")
  const [secoesPlano, setSecoesPlano] = useState<string[]>([])
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle")
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationErrorIsLimite, setGenerationErrorIsLimite] = useState(false)
  const [questoesGeradas, setQuestoesGeradas] = useState<QuestaoGerada[]>([])
  const [planoGerado, setPlanoGerado] = useState<PlanoAulaGerado | null>(null)
  const [atividadeGeradaId, setAtividadeGeradaId] = useState<string | null>(null)
  // Plano + cotas de geração, compartilhados com a Sidebar via TurmasContext  decide se mostra
  // "Usar questões reais do ENEM e vestibulares" (grátis não tem acesso) e quantas buscas restam
  // no mês (ver LIMITE_VESTIBULAR_MENSAL_POR_PLANO em lib/atividades/limites.ts). `refreshUso` é
  // chamado ao abrir o modal e após cada geração bem-sucedida, pra Sidebar e modal ficarem em
  // sincronia sem precisar recarregar a página.
  const { uso, refreshUso } = useTurmas()
  const plano: Plano = (uso?.plano as Plano | undefined) ?? "gratis"
  const usoVestibular = uso ? { usadas: uso.usadasVestibular, limite: uso.limiteVestibular } : null
  const config = MODAL_CONFIG[type]
  const totalSteps = config.steps.length
  const generateStepIndex = totalSteps - 1

  useEffect(() => {
    if (isOpen) refreshUso()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Pré-processa o arquivo de referência (extração + filtragem por tema, ver
  // lib/ai/filtrar-paginas-pdf.ts) assim que o modal abre, em paralelo enquanto o usuário passa
  // pelos steps "Estilo"/"Configurações"  esconde a latência da chamada extra à IA que a
  // filtragem por tema adiciona. `tema`/`arquivo` não mudam durante a vida do modal (definidos
  // antes de abrir, em content-page.tsx), então a checagem de identidade abaixo só existe como
  // rede de segurança. `gerarConteudo`/`gerarConteudoPlanoAula` aguardam essa promise (ver
  // `anexarArquivoOuPreprocessado`) em vez de reenviar o arquivo cru.
  const preProcessamentoRef = useRef<{ arquivo: File; tema: string; promise: Promise<ArquivoReferencia | null> } | null>(null)

  useEffect(() => {
    if (!isOpen || !arquivo) return
    const atual = preProcessamentoRef.current
    if (atual && atual.arquivo === arquivo && atual.tema === tema) return

    const promise = (async (): Promise<ArquivoReferencia | null> => {
      const formData = new FormData()
      formData.set("arquivo", arquivo)
      if (tema.trim()) formData.set("tema", tema)
      try {
        const res = await fetch("/api/arquivo-referencia/preparar", { method: "POST", body: formData })
        if (!res.ok) return null
        const resultado = await res.json()
        return resultado.arquivoReferencia ?? null
      } catch {
        // Falha silenciosa  anexarArquivoOuPreprocessado cai pro upload cru, comportamento de antes.
        return null
      }
    })()

    preProcessamentoRef.current = { arquivo, tema, promise }
  }, [isOpen, arquivo, tema])

  /** Usa o resultado do pré-processamento em segundo plano se ele bater com o arquivo/tema atuais;
   *  senão anexa o `File` cru (comportamento de antes desta otimização  sem regressão). */
  async function anexarArquivoOuPreprocessado(formData: FormData) {
    if (!arquivo) return
    const emAndamento = preProcessamentoRef.current
    const preprocessado =
      emAndamento && emAndamento.arquivo === arquivo && emAndamento.tema === tema ? await emAndamento.promise : null
    if (preprocessado) {
      formData.set("arquivoPreprocessado", JSON.stringify(preprocessado))
    } else {
      formData.set("arquivo", arquivo)
    }
  }

  function handleClose() {
    setStep(0)
    setView("flow")
    setModeloEstilo(null)
    setLogoInstituicao(null)
    setQuantidadeQuestoes(10)
    setTipos([])
    setDificuldade("medio")
    setUsarBaseVestibular(false)
    setDisciplina("")
    setDataAula("")
    setGenerationStatus("idle")
    setGenerationError(null)
    setGenerationErrorIsLimite(false)
    setQuestoesGeradas([])
    setPlanoGerado(null)
    setAtividadeGeradaId(null)
    onClose()
  }

  // As três geram de verdade via IA  cada uma numa rota própria (ver `gerarConteudo`).
  const podeGerar = type === "atividade" || type === "provas" || type === "plano-de-aula"
  const BASE_PATH: Record<GeneratorType, string> = {
    atividade: "atividades",
    provas: "provas",
    "plano-de-aula": "plano-de-aula",
  }
  const basePath = BASE_PATH[type]

  async function gerarConteudoPlanoAula() {
    if (!turmaId) return
    setGenerationStatus("loading")
    setGenerationError(null)
    setGenerationErrorIsLimite(false)

    const formData = new FormData()
    formData.set("turmaId", turmaId)
    if (tema.trim()) formData.set("titulo", tema)
    if (disciplina.trim()) formData.set("disciplina", disciplina)
    if (dataAula) formData.set("dataAula", dataAula)
    formData.set("duracaoMinutos", String(duracaoMinutos))
    formData.set("formatoAula", formatoAula)
    formData.set("secoes", JSON.stringify(secoesPlano))
    if (atividadeGeradaId) formData.set("atividadeId", atividadeGeradaId)
    await anexarArquivoOuPreprocessado(formData)
    // Mesmo mecanismo de estilo de atividade/prova (ver gerarConteudo abaixo)  ainda não é
    // aplicado na tela A4/Word do plano de aula, só fica salvo na atividade por enquanto.
    if (modeloEstilo?.tipo === "novo") formData.set("modeloDocx", modeloEstilo.arquivo)
    if (modeloEstilo?.tipo === "existente") formData.set("modeloTemplateId", modeloEstilo.id)
    if (logoInstituicao) formData.set("logoInstituicao", logoInstituicao)

    try {
      const res = await fetch("/api/plano-de-aula/gerar", { method: "POST", body: formData })
      const resultado = await res.json()
      if (resultado.error) {
        setGenerationError(resultado.error)
        setGenerationErrorIsLimite(!!resultado.limiteAtingido)
        setGenerationStatus("error")
        return
      }
      setAtividadeGeradaId(resultado.atividadeId)
      setPlanoGerado(resultado.plano ?? null)
      setGenerationStatus("done")
      // Essa geração acabou de consumir cota mensal/diária  atualiza a barra de uso da Sidebar na hora.
      refreshUso()
    } catch {
      setGenerationError("Não foi possível gerar o plano de aula.")
      setGenerationStatus("error")
    }
  }

  async function gerarConteudo() {
    if (!podeGerar || !turmaId) return
    if (type === "plano-de-aula") {
      await gerarConteudoPlanoAula()
      return
    }
    setGenerationStatus("loading")
    setGenerationError(null)
    setGenerationErrorIsLimite(false)

    const formData = new FormData()
    formData.set("turmaId", turmaId)
    formData.set("tipo", type === "provas" ? "prova" : "atividade")
    if (tema.trim()) formData.set("titulo", tema)
    formData.set("quantidadeQuestoes", String(quantidadeQuestoes))
    formData.set("tipos", JSON.stringify(tipos))
    formData.set("dificuldade", dificuldade)
    formData.set("usarBaseVestibular", String(usarBaseVestibular))
    if (atividadeGeradaId) formData.set("atividadeId", atividadeGeradaId)
    await anexarArquivoOuPreprocessado(formData)
    // Modelo novo: o .docx só é enviado ao Storage pelo backend depois que a IA gerar as questões
    // com sucesso. Modelo existente: só a referência viaja  nada é reenviado nem reupado.
    if (modeloEstilo?.tipo === "novo") formData.set("modeloDocx", modeloEstilo.arquivo)
    if (modeloEstilo?.tipo === "existente") formData.set("modeloTemplateId", modeloEstilo.id)
    if (logoInstituicao) formData.set("logoInstituicao", logoInstituicao)

    try {
      const res = await fetch("/api/atividades/gerar", { method: "POST", body: formData })
      const resultado = await res.json()
      if (resultado.error) {
        setGenerationError(resultado.error)
        setGenerationErrorIsLimite(!!resultado.limiteAtingido)
        setGenerationStatus("error")
        return
      }
      setAtividadeGeradaId(resultado.atividadeId)
      setQuestoesGeradas(resultado.questoes ?? [])
      setGenerationStatus("done")
      // Essa geração acabou de consumir cota (mensal/diária, e vestibular se usarBaseVestibular
      // estava ligado)  atualiza a barra de uso da Sidebar na hora.
      refreshUso()
    } catch {
      setGenerationError(type === "provas" ? "Não foi possível gerar a prova." : "Não foi possível gerar a atividade.")
      setGenerationStatus("error")
    }
  }

  useEffect(() => {
    if (podeGerar && view === "flow" && step === generateStepIndex && generationStatus === "idle") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara a geração ao entrar na etapa "Gerar"
      gerarConteudo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeGerar, view, step, generateStepIndex, generationStatus])

  function handleConcluir() {
    if (!podeGerar || !turmaId || !atividadeGeradaId) {
      handleClose()
      return
    }
    router.push(`/t/${turmaId}/${basePath}/editar/${atividadeGeradaId}`)
    handleClose()
  }

  function handleModeloChange(modelo: ModeloEstilo | null) {
    setModeloEstilo(modelo)
  }

  // Seleção de um modelo real  próprio (grade "Meus modelos") ou pronto de sistema (grade
  // "Modelos prontos")  ambos viram `modeloEstilo`, que é o que o backend usa de fato pra
  // gerar o documento (ver gerarConteudo abaixo).
  function handleTemplateSelect(id: string, nome: string) {
    setModeloEstilo({ tipo: "existente", id, nome })
  }

  // As três agora seguem a mesma forma  Estilo (0) → Configurações (1) → Gerar (2).
  const isStyleStepIncomplete = view === "flow" && step === 0 && !modeloEstilo

  const isConfigStepIncomplete =
    view === "flow" &&
    step === 1 &&
    (type === "plano-de-aula" ? secoesPlano.length === 0 : tipos.length === 0)

  const isGenerateStepIncomplete =
    view === "flow" && podeGerar && step === generateStepIndex && generationStatus !== "done"

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-(--background) border border-(--secundary) gap-8 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:p-8 rounded-t-2xl md:rounded-2xl shadow-xl w-full h-[92dvh] md:h-auto md:max-h-[90vh] md:w-[500px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{config.title}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-(--secundary) border-1 border-(--secundary) transition-colors text-(--foreground)/50 hover:text-(--foreground) cursor-pointer"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Indicadores de etapa  ocultos no modo modelo */}
        {view === "flow" && (
          <div className="flex">
            {config.steps.map((label, i) => {
              const isPast = i < step
              const isCurrent = i === step
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!isPast}
                  onClick={isPast ? () => setStep(i) : undefined}
                  className={[
                    "flex justify-center flex-1 border-b-2 transition-colors",
                    isCurrent ? "border-(--foreground) cursor-default" : "border-(--secundary)",
                    isPast ? "cursor-pointer hover:border-(--foreground) group" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-[14px] font-semibold whitespace-nowrap py-2 transition-colors",
                      isCurrent ? "" : "text-(--foreground)/40",
                      isPast ? "group-hover:text-(--foreground)" : "",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
          {view === "model-selector" ? (
            <ModelSelector
              modeloEstilo={modeloEstilo}
              onSelectTemplate={handleTemplateSelect}
              logoInstituicao={logoInstituicao}
              onLogoChange={setLogoInstituicao}
            />
          ) : (
            <StepContent
              type={type}
              step={step}
              onSelectModel={() => setView("model-selector")}
              modeloEstilo={modeloEstilo}
              onModeloChange={handleModeloChange}
              quantidadeQuestoes={quantidadeQuestoes}
              onQuantidadeQuestoesChange={setQuantidadeQuestoes}
              tipos={tipos}
              onTiposChange={setTipos}
              dificuldade={dificuldade}
              onDificuldadeChange={setDificuldade}
              usarBaseVestibular={usarBaseVestibular}
              onUsarBaseVestibularChange={setUsarBaseVestibular}
              plano={plano}
              usoVestibular={usoVestibular}
              disciplina={disciplina}
              onDisciplinaChange={setDisciplina}
              dataAula={dataAula}
              onDataAulaChange={setDataAula}
              duracaoMinutos={duracaoMinutos}
              onDuracaoMinutosChange={setDuracaoMinutos}
              formatoAula={formatoAula}
              onFormatoAulaChange={setFormatoAula}
              secoesPlano={secoesPlano}
              onSecoesPlanoChange={setSecoesPlano}
              generationStatus={podeGerar ? generationStatus : "idle"}
              questoesGeradas={podeGerar ? questoesGeradas : []}
              planoGerado={podeGerar ? planoGerado : null}
              generationError={podeGerar ? generationError : null}
              generationErrorIsLimite={podeGerar && generationErrorIsLimite}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
          {view === "model-selector" ? (
            <>
              <button
                type="button"
                onClick={() => setView("flow")}
                className="px-4 py-3 w-24 rounded-lg border-1 border-(--secundary) text-sm font-medium text-(--foreground)/60 hover:bg-(--secundary) transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!modeloEstilo}
                onClick={() => setView("flow")}
                className="border-1 border-(--secundary) px-4 py-3 w-24 rounded-lg text-sm font-medium text-white bg-(--brand) hover:bg-(--brand-secundary) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selecionar
              </button>
            </>
          ) : (
            <>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="w-28 border-1 border-(--secundary) px-4 py-3 rounded-lg text-sm font-medium text-(--foreground)/60 hover:bg-(--secundary) transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              )}
              {step === totalSteps - 1 && podeGerar && (
                <button
                  type="button"
                  disabled={generationStatus === "loading"}
                  onClick={gerarConteudo}
                  className="border-1 border-(--secundary) w-28 px-4 py-3 rounded-lg text-sm font-medium text-(--foreground)/60 hover:bg-(--secundary) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Regerar
                </button>
              )}
              <button
                type="button"
                disabled={isStyleStepIncomplete || isConfigStepIncomplete || isGenerateStepIncomplete}
                onClick={step === totalSteps - 1 ? handleConcluir : () => setStep((s) => s + 1)}
                className={`${step === 0 ? "ml-auto" : ""} w-28 px-4 py-3 rounded-lg text-sm font-medium text-white bg-(--brand) hover:bg-(--brand-secundary) transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {step === totalSteps - 1 ? "Concluir" : step === totalSteps - 2 ? "Gerar" : "Próximo"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface ConfigProps {
  quantidadeQuestoes: number
  onQuantidadeQuestoesChange: (n: number) => void
  tipos: string[]
  onTiposChange: (tipos: string[]) => void
  dificuldade: string
  onDificuldadeChange: (dificuldade: string) => void
  usarBaseVestibular: boolean
  onUsarBaseVestibularChange: (usar: boolean) => void
  plano: Plano
  usoVestibular: { usadas: number; limite: number } | null
}

interface StyleProps {
  onSelectModel: () => void
  modeloEstilo: ModeloEstilo | null
  onModeloChange: (modelo: ModeloEstilo | null) => void
}

interface GenerateProps {
  generationStatus: GenerationStatus
  questoesGeradas: QuestaoGerada[]
  planoGerado: PlanoAulaGerado | null
  generationError: string | null
  /** Erro por cota do plano (403 do backend)  mostra CTA de upgrade em vez de só o texto do erro. */
  generationErrorIsLimite: boolean
}

interface ConfigPlanoProps {
  disciplina: string
  onDisciplinaChange: (disciplina: string) => void
  dataAula: string
  onDataAulaChange: (data: string) => void
  duracaoMinutos: number
  onDuracaoMinutosChange: (n: number) => void
  formatoAula: string
  onFormatoAulaChange: (formato: string) => void
  secoesPlano: string[]
  onSecoesPlanoChange: (secoes: string[]) => void
}

interface StepContentProps extends ConfigProps, StyleProps, GenerateProps, ConfigPlanoProps {
  type: GeneratorType
  step: number
}

function StepContent({ type, step, ...rest }: StepContentProps) {
  if (type === "atividade") return <AtividadeStep step={step} {...rest} />
  if (type === "provas") return <ProvasStep step={step} {...rest} />
  return <PlanoStep step={step} {...rest} />
}

function toStepConfigProps({
  quantidadeQuestoes,
  onQuantidadeQuestoesChange,
  tipos,
  onTiposChange,
  dificuldade,
  onDificuldadeChange,
  usarBaseVestibular,
  onUsarBaseVestibularChange,
  plano,
  usoVestibular,
}: ConfigProps) {
  return {
    quantidade: quantidadeQuestoes,
    onQuantidadeChange: onQuantidadeQuestoesChange,
    tipos,
    onTiposChange,
    dificuldade,
    onDificuldadeChange,
    usarBaseVestibular,
    onUsarBaseVestibularChange,
    plano,
    usoVestibular,
  }
}

function AtividadeStep({
  step,
  generationStatus,
  questoesGeradas,
  generationError,
  generationErrorIsLimite,
  ...rest
}: { step: number } & StyleProps & ConfigProps & GenerateProps) {
  if (step === 0) return <StepStyle {...rest} />
  if (step === 1) return <StepConfig {...toStepConfigProps(rest)} />
  return <StepGenerate status={generationStatus} questoes={questoesGeradas} error={generationError} errorIsLimite={generationErrorIsLimite} />
}

function ProvasStep({
  step,
  generationStatus,
  questoesGeradas,
  generationError,
  generationErrorIsLimite,
  ...rest
}: { step: number } & StyleProps & ConfigProps & GenerateProps) {
  if (step === 0) return <StepStyle {...rest} tipoLabel="prova" />
  if (step === 1) return <StepConfig {...toStepConfigProps(rest)} tipoConteudo="prova" />
  return <StepGenerate status={generationStatus} questoes={questoesGeradas} error={generationError} errorIsLimite={generationErrorIsLimite} tipoLabel="prova" />
}

function PlanoStep({
  step,
  disciplina,
  onDisciplinaChange,
  dataAula,
  onDataAulaChange,
  duracaoMinutos,
  onDuracaoMinutosChange,
  formatoAula,
  onFormatoAulaChange,
  secoesPlano,
  onSecoesPlanoChange,
  generationStatus,
  planoGerado,
  generationError,
  generationErrorIsLimite,
  ...styleProps
}: { step: number } & StyleProps & ConfigPlanoProps & GenerateProps) {
  if (step === 0) return <StepStyle {...styleProps} tipoLabel="plano-de-aula" />
  if (step === 1) {
    return (
      <StepConfigPlano
        disciplina={disciplina}
        onDisciplinaChange={onDisciplinaChange}
        dataAula={dataAula}
        onDataAulaChange={onDataAulaChange}
        duracaoMinutos={duracaoMinutos}
        onDuracaoMinutosChange={onDuracaoMinutosChange}
        formatoAula={formatoAula}
        onFormatoAulaChange={onFormatoAulaChange}
        secoes={secoesPlano}
        onSecoesChange={onSecoesPlanoChange}
      />
    )
  }
  return <StepGeneratePlano status={generationStatus} plano={planoGerado} error={generationError} errorIsLimite={generationErrorIsLimite} />
}
