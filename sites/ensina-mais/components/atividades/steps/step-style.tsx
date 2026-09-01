"use client"

import { ClockCounterClockwiseIcon, FileIcon, ImageIcon, SquaresFourIcon, UploadIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { TAMANHO_MAXIMO_MODELO_DOCX_BYTES, TAMANHO_MAXIMO_MODELO_DOCX_MB } from "@/lib/ai/limites-arquivo"
import { RepeatingHeader, PAGE_WIDTH_PX } from "@/components/atividades/editor/a4-sheet"
import type { DocxElement, HeaderStyle, PageMargins } from "@/components/atividades/editor/activity-editor"

// Mesmo default de components/atividades/editor/formatting-presets.ts (TEMPLATE_MARGINS)  usado
// só quando o modelo (raro) não tem margens próprias no .docx.
const DEFAULT_PREVIEW_MARGINS: PageMargins = { top: 96, right: 96, bottom: 96, left: 96 }

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Modelo de estilo escolhido: um arquivo novo (ainda não enviado ao Storage) ou a referência
 *  de um modelo já enviado antes (reaproveitado  evita reupload e reduz custo de Storage). */
export type ModeloEstilo =
  | { tipo: "novo"; arquivo: File }
  | { tipo: "existente"; id: string; nome: string }

interface UltimoModelo {
  id: string
  nome: string
}

export type TipoLabelEstilo = "atividade" | "prova" | "plano-de-aula"

/** Artigo + substantivo de cada tipo, pra montar as frases do step ("estilo d[a prova]",
 *  "aparência e estrutura d[o plano de aula]" etc.) sem empilhar ternários pelo componente. */
const ARTIGO_TIPO: Record<TipoLabelEstilo, string> = {
  atividade: "a atividade",
  prova: "a prova",
  "plano-de-aula": "o plano de aula",
}

function montarStyleOptions(tipoLabel: TipoLabelEstilo) {
  return [
    {
      icon: UploadIcon,
      // Rótulo do upload é dinâmico (ver `titulo` mais abaixo)  description é só o fallback
      // exibido pra quem nunca enviou nem selecionou nenhum modelo ainda.
      description: "Faça o upload de um arquivo Word que será usado como referência de estilo e formatação.",
    },
    {
      icon: SquaresFourIcon,
      title: "Usar um modelo pronto",
      description: `Escolha entre os modelos disponíveis para definir a aparência e estrutura d${ARTIGO_TIPO[tipoLabel]}.`,
    },
  ]
}

export default function StepStyle({
  onSelectModel,
  modeloEstilo,
  onModeloChange,
  tipoLabel = "atividade",
}: {
  onSelectModel: () => void
  modeloEstilo: ModeloEstilo | null
  onModeloChange: (modelo: ModeloEstilo | null) => void
  tipoLabel?: TipoLabelEstilo
}) {
  const STYLE_OPTIONS = montarStyleOptions(tipoLabel)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ultimoModelo, setUltimoModelo] = useState<UltimoModelo | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  // Enquanto true, o botão de upload fica desabilitado  evita que o clique abra o file picker
  // (achando que não há último modelo) bem no instante em que o fetch abaixo ainda não respondeu
  // e for revelar que na verdade existe um.
  const [verificandoUltimoModelo, setVerificandoUltimoModelo] = useState(true)

  // Espelha a prop a cada render  usado dentro do .then() abaixo pra checar, no momento em
  // que a busca terminar, se o usuário já escolheu algo nesse meio tempo (evita sobrescrever).
  const modeloEstiloRef = useRef(modeloEstilo)
  modeloEstiloRef.current = modeloEstilo

  // Busca o último modelo enviado pelo usuário  permite reaproveitá-lo sem reenviar o mesmo
  // .docx a cada atividade nova (economiza upload/Storage) e já vem pré-selecionado por padrão.
  useEffect(() => {
    fetch("/api/modelos-template")
      .then((r) => r.ok ? r.json() : [])
      .then((lista: UltimoModelo[]) => {
        const data = lista[0] ?? null
        setUltimoModelo(data)
        if (data && !modeloEstiloRef.current) {
          onModeloChange({ tipo: "existente", id: data.id, nome: data.nome })
        }
      })
      .catch(() => {/* sem modelo anterior disponível */})
      .finally(() => setVerificandoUltimoModelo(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleUsarUltimoModelo() {
    if (!ultimoModelo) return
    setError(null)
    onModeloChange({ tipo: "existente", id: ultimoModelo.id, nome: ultimoModelo.nome })
  }

  // Sem modelo anterior: clique abre a seleção de arquivo direto, como sempre foi.
  // Com modelo anterior: clique abre um menu pra escolher entre reusar ou enviar um novo.
  function handleUploadClick() {
    if (verificandoUltimoModelo) return
    if (ultimoModelo) setMenuAberto((v) => !v)
    else fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // permite reenviar o mesmo arquivo depois de um erro
    if (!file) return

    const isDocx = file.name.toLowerCase().endsWith(".docx") && (!file.type || file.type === DOCX_MIME)
    if (!isDocx) {
      setError("Envie um arquivo .docx válido.")
      onModeloChange(null)
      return
    }
    if (file.size > TAMANHO_MAXIMO_MODELO_DOCX_BYTES) {
      setError(
        `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)} MB)  o limite é ${TAMANHO_MAXIMO_MODELO_DOCX_MB} MB.`
      )
      onModeloChange(null)
      return
    }

    // Só guarda o arquivo em memória aqui  o upload pro Storage só acontece no backend,
    // depois que a IA gerar as questões com sucesso (ver generator-modal.tsx e /api/atividades/gerar).
    setError(null)
    onModeloChange({ tipo: "novo", arquivo: file })
  }

  const arquivoNovoSelecionado = modeloEstilo?.tipo === "novo" ? modeloEstilo.arquivo : null
  const modeloExistenteSelecionado = modeloEstilo?.tipo === "existente" ? modeloEstilo : null

  return (
    <div className="flex-1 flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleFileChange}
      />
      <h2 className="text-sm font-bold">Como você deseja definir o estilo d{ARTIGO_TIPO[tipoLabel]}?</h2>

      {STYLE_OPTIONS.map((opt, i) => {
        const isUpload = i === 0
        if (!isUpload) {
          const isSelected = !!modeloEstilo
          return (
            <button
              key={i}
              type="button"
              onClick={onSelectModel}
              className={`flex gap-4 p-8 border-1 rounded-xl hover:bg-(--secundary) transition-colors text-left cursor-pointer ${
                isSelected ? "border-(--brand)" : "border-(--secundary)"
              }`}
            >
              <opt.icon size={38} className="m-2 shrink-0" />
              <div className="space-y-1.5">
                <h1 className="font-bold text-sm">{opt.title}</h1>
                <p className="text-xs text-(--foreground)/70">{opt.description}</p>
              </div>
            </button>
          )
        }

        const isSelected = !!arquivoNovoSelecionado || !!modeloExistenteSelecionado
        // Com último modelo disponível, o botão já nasce rotulado/selecionado para ele  sem
        // último modelo, mantém o rótulo genérico de sempre (enviar um documento do zero).
        const titulo = ultimoModelo ? "Selecionar último modelo" : "Selecionar um novo modelo"
        const subtitulo = modeloExistenteSelecionado?.nome ?? arquivoNovoSelecionado?.name ?? ultimoModelo?.nome ?? opt.description
        return (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={verificandoUltimoModelo}
              className={`flex w-full gap-4 p-8 border-1 rounded-xl hover:bg-(--secundary) transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                isSelected ? "border-(--brand)" : "border-(--secundary)"
              }`}
            >
              <opt.icon size={38} className="m-2 shrink-0" />
              <div className="space-y-1.5">
                <h1 className="font-bold text-sm">{titulo}</h1>
                <p className="text-xs text-(--foreground)/70">{subtitulo}</p>
              </div>
            </button>

            {menuAberto && ultimoModelo && (
              <>
                {/* Camada invisível pra fechar o menu ao clicar fora, sem precisar de lib extra */}
                <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                <div className="absolute left-0 right-0 top-full mt-2 z-20 bg-(--background) border border-(--secundary) rounded-xl shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      handleUsarUltimoModelo()
                      setMenuAberto(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-(--secundary) transition-colors cursor-pointer"
                  >
                    <ClockCounterClockwiseIcon size={18} className="shrink-0 text-(--foreground)/60" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">Selecionar último modelo</span>
                      <span className="block text-xs text-(--foreground)/60 truncate">{ultimoModelo.nome}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click()
                      setMenuAberto(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-(--secundary) transition-colors border-t border-(--secundary) cursor-pointer"
                  >
                    <FileIcon size={18} className="shrink-0 text-(--foreground)/60" />
                    <span className="text-sm font-medium">Selecionar um novo modelo</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-(--secundary)/50">
        <WarningCircleIcon size={14} className="shrink-0 mt-0.5 text-(--foreground)/50" />
        <p className="text-[11px] leading-relaxed text-(--foreground)/60">
          O arquivo enviado deve conter <strong>apenas o cabeçalho da página</strong> (logo, nome da
          escola, campos como Nome/Turma/Data)  use o recurso de Cabeçalho do Word (Inserir →
          Cabeçalho), sem digitar nada direto no corpo da página. Qualquer texto ou questão deixada
          no corpo do documento será repetida em todo arquivo gerado, inclusive no gabarito.
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-500">
          <WarningCircleIcon size={14} />
          {error}
        </p>
      )}
    </div>
  )
}

export function ModelSelector({
  modeloEstilo,
  onSelectTemplate,
  logoInstituicao,
  onLogoChange,
}: {
  /** Modelo de estilo atualmente escolhido (ver `ModeloEstilo`)  usado só pra destacar, na
   *  grade, qual modelo (próprio ou pronto) está selecionado no momento. */
  modeloEstilo: ModeloEstilo | null
  /** Escolha de um modelo real (próprio ou pronto de sistema  ambos são linhas em
   *  `modelos_template`, ver /api/modelos-template e /api/modelos-prontos). */
  onSelectTemplate: (id: string, nome: string) => void
  /** Logo da instituição (só tem efeito com um modelo pronto selecionado  substitui a caixa
   *  "LOGO" do cabeçalho na geração, ver lib/atividades/aplicar-logo-modelo.ts). Levantado pro
   *  GeneratorModal porque esse componente desmonta ao voltar pro fluxo normal. */
  logoInstituicao: File | null
  onLogoChange: (file: File | null) => void
}) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [meusModelos, setMeusModelos] = useState<UltimoModelo[]>([])
  const [modelosProntos, setModelosProntos] = useState<UltimoModelo[]>([])

  // Modelos que a pessoa já enviou (permissão de uso próprio) e os modelos prontos de sistema
  // (disponíveis pra qualquer usuário)  carregados em paralelo de endpoints separados porque
  // /api/modelos-template também alimenta o atalho "reaproveitar último modelo" no StepStyle.
  useEffect(() => {
    fetch("/api/modelos-template")
      .then((r) => r.ok ? r.json() : [])
      .then((lista: UltimoModelo[]) => setMeusModelos(lista))
      .catch(() => {/* sem modelos próprios disponíveis */})
    fetch("/api/modelos-prontos")
      .then((r) => r.ok ? r.json() : [])
      .then((lista: UltimoModelo[]) => setModelosProntos(lista))
      .catch(() => {/* sem modelos prontos disponíveis */})
  }, [])

  // O logo só faz sentido com um modelo pronto (tem a caixa "LOGO" no cabeçalho)  "Meus modelos"
  // já vêm com o logo real da instituição embutido no .docx que a pessoa mesma enviou.
  const modeloProntoSelecionado =
    modeloEstilo?.tipo === "existente" && modelosProntos.some((m) => m.id === modeloEstilo.id)

  const logoUrl = useMemo(() => (logoInstituicao ? URL.createObjectURL(logoInstituicao) : null), [logoInstituicao])
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl) }, [logoUrl])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onLogoChange(file)
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoChange}
      />

      <button
        type="button"
        onClick={() => logoInputRef.current?.click()}
        disabled={!modeloProntoSelecionado}
        className="flex items-center gap-3 px-4 py-3 border-1 border-(--secundary) rounded-xl hover:bg-(--secundary) transition-colors text-left w-full shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
        ) : (
          <ImageIcon size={20} className="shrink-0 text-(--foreground)/50" />
        )}
        <span className="text-sm text-(--foreground)/70">
          {modeloProntoSelecionado
            ? (logoUrl ? "Alterar logo da instituição" : "Adicionar logo da instituição")
            : "Selecione um modelo pronto para adicionar o logo da instituição"}
        </span>
      </button>

      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-5">
        {meusModelos.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-(--foreground)/60">Meus modelos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              {meusModelos.map((modelo) => {
                const isSelected = modeloEstilo?.tipo === "existente" && modeloEstilo.id === modelo.id
                return (
                  <button
                    key={modelo.id}
                    type="button"
                    onClick={() => onSelectTemplate(modelo.id, modelo.nome)}
                    className={`border-2 rounded-xl overflow-hidden transition-colors text-left cursor-pointer ${
                      isSelected ? "border-(--brand)" : "border-(--secundary)"
                    }`}
                  >
                    <ModeloPreviewThumb id={modelo.id} />
                    <div className="p-2 text-xs font-medium truncate">{modelo.nome}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {meusModelos.length > 0 && <h3 className="text-xs font-semibold text-(--foreground)/60">Modelos prontos</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
            {modelosProntos.map((modelo) => {
              const isSelected = modeloEstilo?.tipo === "existente" && modeloEstilo.id === modelo.id
              return (
                <button
                  key={modelo.id}
                  type="button"
                  onClick={() => onSelectTemplate(modelo.id, modelo.nome)}
                  className={`border-2 rounded-xl overflow-hidden transition-colors text-left cursor-pointer ${
                    isSelected ? "border-(--brand)" : "border-(--secundary)"
                  }`}
                >
                  <ModeloPreviewThumb id={modelo.id} />
                  <div className="p-2 text-xs font-medium">{modelo.nome}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Preview real do cabeçalho de um modelo (próprio ou pronto de sistema)  busca o `header` já
 *  parseado do .docx (ver GET /api/parse-modelo?modeloTemplateId=) e renderiza com o mesmo
 *  componente usado no editor de verdade (`RepeatingHeader`), escalado pra caber no card. Isso
 *  garante que o preview mostra exatamente o cabeçalho que vai sair no documento gerado 
 *  incluindo, nos modelos prontos, a caixa indicando onde entra o logo da instituição. */
function ModeloPreviewThumb({ id }: { id: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [dados, setDados] = useState<
    { header?: DocxElement[]; headerStyle?: HeaderStyle; margins?: PageMargins } | "erro" | null
  >(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setLargura(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelado = false
    fetch(`/api/parse-modelo?modeloTemplateId=${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((parsed) => { if (!cancelado) setDados(parsed) })
      .catch(() => { if (!cancelado) setDados("erro") })
    return () => { cancelado = true }
  }, [id])

  const semPreview = dados === "erro" || (dados !== null && !dados.header?.length)

  return (
    <div ref={containerRef} className="bg-white aspect-[3/4] overflow-hidden relative">
      {semPreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--secundary)">
          <FileIcon size={28} className="text-(--foreground)/40" />
        </div>
      )}
      {!semPreview && dados === null && (
        <div className="absolute inset-0 bg-(--secundary) animate-pulse" />
      )}
      {!semPreview && dados !== null && largura > 0 && (
        <div
          style={{ width: PAGE_WIDTH_PX, transform: `scale(${largura / PAGE_WIDTH_PX})`, transformOrigin: "top left" }}
        >
          <RepeatingHeader
            templateHeader={dados.header}
            headerStyle={dados.headerStyle}
            borderColor="border-[#1a1a1a]"
            effectiveMargins={dados.margins ?? DEFAULT_PREVIEW_MARGINS}
          />
        </div>
      )}
    </div>
  )
}
