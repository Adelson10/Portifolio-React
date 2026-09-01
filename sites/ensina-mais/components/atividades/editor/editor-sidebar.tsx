"use client"

import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react"
import Link from "next/link"
import {
  TextTIcon,
  GraduationCapIcon,
  CertificateIcon,
  EyeSlashIcon,
  ListNumbersIcon,
  ListChecksIcon,
  ArrowsClockwiseIcon,
  FileDocIcon,
  CaretDownIcon,
  CaretUpIcon,
  XIcon,
  PlusIcon,
  CheckFatIcon,
  SpinnerGapIcon,
  RowsIcon,
  ImageIcon,
  UploadSimpleIcon,
  TrashIcon,
  MinusIcon,
  GlobeIcon,
} from "@phosphor-icons/react"
import type { AtividadeConfig } from "./activity-editor"
import { FORMATTING_PRESETS, getPreset } from "./formatting-presets"
import {
  IMAGEM_LARGURA_MIN,
  IMAGEM_LARGURA_MAX,
  IMAGEM_LARGURA_PADRAO,
  IMAGEM_LARGURA_STEP,
  IMAGEM_ALTURA_MIN,
  IMAGEM_ALTURA_MAX,
  IMAGEM_ALTURA_PADRAO,
  type QuestaoItem,
  type QuestaoImagemPosicao,
  type QuestaoImagemAjuste,
} from "./mock-questoes"

/** Mensagens cicladas por tempo decorrido enquanto `isGenerating` está ativo  ver o efeito em
 *  `EditorSidebar`. `depoisDeMs` é o tempo desde o clique em "Gerar" (não desde a etapa anterior). */
const ETAPAS_GERACAO: { texto: string; depoisDeMs: number }[] = [
  { texto: "Gerando...", depoisDeMs: 0 },
  { texto: "Gerando as questões com a IA...", depoisDeMs: 2500 },
  { texto: "Verificando habilidades da BNCC...", depoisDeMs: 10000 },
  { texto: "Montando o documento...", depoisDeMs: 16000 },
]

/* ─── Tipos ─────────────────────────────────────────────────── */

interface EditorSidebarProps {
  config: AtividadeConfig
  onUpdate: (partial: Partial<AtividadeConfig>) => void
  isGenerating: boolean
  onGenerate: () => void
  erroGerar: string | null
  /** Erro por cota do plano (403 do backend)  mostra CTA de upgrade em vez de só o texto do erro. */
  erroGerarLimite?: boolean
  onDownloadWord: () => void
  onDownloadGabaritoWord: () => void
  selectedQuestao: QuestaoItem | null
  onUpdateQuestao: (partial: Partial<QuestaoItem>) => void
  onDeselectQuestao: () => void
  onRegenerateQuestao: () => void
  isRegeneratingQuestao: boolean
  erroRegenerarQuestao: string | null
  /** Teto de questões por geração do plano atual (ex.: 2 no "gratis")  limita as opções do
   *  seletor "Quantidade de Questões" pra não oferecer um valor que o backend vai rejeitar
   *  (ver obterLimiteQuestoesPorGeracao em lib/atividades/limites.ts). */
  limiteQuestoes: number
  /** "atividade" (padrão) ou "prova"  a seção "Base de Questões" (busca ENEM/vestibular) só
   *  aparece pra prova (ver components/atividades/steps/step-config.tsx). */
  tipo?: "atividade" | "prova"
  /** No mobile a barra vira um painel full-screen off-canvas (no desktop não tem efeito 
   *  sempre visível, como hoje). Ver `ActivityEditor` (dono do estado). */
  mobileOpen: boolean
  onCloseMobile: () => void
}

/* ─── Barra lateral principal ───────────────────────────────── */

/** Barra lateral de configurações da atividade (formatação, dificuldade, BNCC, acessibilidade etc.). */
export default function EditorSidebar({
  config,
  onUpdate,
  isGenerating,
  onGenerate,
  erroGerar,
  erroGerarLimite,
  onDownloadWord,
  onDownloadGabaritoWord,
  selectedQuestao,
  onUpdateQuestao,
  onDeselectQuestao,
  onRegenerateQuestao,
  isRegeneratingQuestao,
  erroRegenerarQuestao,
  limiteQuestoes,
  tipo = "atividade",
  mobileOpen,
  onCloseMobile,
}: EditorSidebarProps) {
  // Geração é uma única requisição no servidor (sem progresso real vindo de volta  ver
  // `handleGenerate` em `activity-editor.tsx`), então essas mensagens são cicladas por tempo
  // decorrido, cronometradas pra bater com a ordem real do backend (gera com a IA → detecta BNCC
  // → monta o Word, ver app/api/atividades/gerar/route.ts). Só existem pra dar sensação de
  // progresso durante uma espera longa  sem isso o usuário via só "Gerando..." parado por dezenas
  // de segundos e achava que tinha travado/dado erro.
  const [etapaGeracao, setEtapaGeracao] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setEtapaGeracao(0)
      return
    }
    const timers = ETAPAS_GERACAO.slice(1).map((etapa, i) =>
      setTimeout(() => setEtapaGeracao(i + 1), etapa.depoisDeMs)
    )
    return () => timers.forEach(clearTimeout)
  }, [isGenerating])

  if (selectedQuestao) {
    return (
      <QuestionSettingsPanel
        questao={selectedQuestao}
        dificuldadeGlobal={config.dificuldade}
        onUpdate={onUpdateQuestao}
        onClose={onDeselectQuestao}
        onRegenerate={onRegenerateQuestao}
        isRegenerating={isRegeneratingQuestao}
        erro={erroRegenerarQuestao}
        mobileOpen={mobileOpen}
        onCloseMobile={onCloseMobile}
      />
    )
  }

  function updateAcessibilidade(partial: Partial<AtividadeConfig["acessibilidade"]>) {
    onUpdate({ acessibilidade: { ...config.acessibilidade, ...partial } })
  }

  function addBNCC(code: string) {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed || config.codigosBNCC.includes(trimmed)) return
    onUpdate({ codigosBNCC: [...config.codigosBNCC, trimmed] })
  }

  function removeBNCC(code: string) {
    onUpdate({ codigosBNCC: config.codigosBNCC.filter((c) => c !== code) })
  }

  function toggleTipo(id: string) {
    const next = config.tiposQuestao.includes(id)
      ? config.tiposQuestao.filter((t) => t !== id)
      : [...config.tiposQuestao, id]
    onUpdate({ tiposQuestao: next })
  }

  return (
    <aside
      className={`fixed inset-0 z-50 md:static md:z-auto w-full md:w-[272px] shrink-0 border-l border-(--secundary) flex flex-col bg-(--background) overflow-hidden transition-transform duration-200 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b border-(--secundary) shrink-0 flex items-center justify-between">
        <p className="text-sm font-semibold">Configurações</p>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden w-6 h-6 flex items-center justify-center rounded-md hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          <XIcon size={13} />
        </button>
      </div>

      {/* Seções roláveis */}
      <div className="flex-1 overflow-y-auto">

        {/* Formatação */}
        <Section icon={<TextTIcon size={14} />} title="Formatação">
          <select
            value={config.formatacao}
            onChange={(e) => {
              const preset = getPreset(e.target.value)
              onUpdate({ formatacao: preset.id, fonteEscolhida: preset.defaultFonte })
            }}
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          >
            {FORMATTING_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          {getPreset(config.formatacao).fontes.length > 1 && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-(--foreground)/50">Fonte</p>
              <select
                value={config.fonteEscolhida}
                onChange={(e) => onUpdate({ fonteEscolhida: e.target.value })}
                className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
              >
                {getPreset(config.formatacao).fontes.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}
        </Section>

        {/* Dificuldade */}
        <Section icon={<GraduationCapIcon size={14} />} title="Dificuldade">
          <select
            value={config.dificuldade}
            onChange={(e) =>
              onUpdate({ dificuldade: e.target.value as AtividadeConfig["dificuldade"] })
            }
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          >
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
            <option value="extremo">Extremo</option>
            <option value="superior">Nível Superior</option>
            <option value="pos">Pós-graduação</option>
          </select>
        </Section>

        {/* Base de questões reais  só existe pra prova (ver step-config.tsx) */}
        {tipo === "prova" && (
          <Section icon={<GlobeIcon size={14} />} title="Base de Questões">
            <ToggleRow
              label="Usar ENEM e vestibulares"
              description="Busca questões reais na internet, com fonte citada"
              checked={config.usarBaseVestibular}
              onChange={(v) => onUpdate({ usarBaseVestibular: v })}
            />
          </Section>
        )}

        {/* Códigos BNCC  pré-preenchidos automaticamente pela IA ao gerar (consultando a base
           oficial em api.bncc.dev, nunca inventados  ver lib/bncc/detectar-habilidades.ts), mas
           continuam editáveis: adicione ou remova livremente. A descrição oficial de cada código
           (exibida no rodapé do Word, ver generate-word.ts) é sempre resolvida na hora contra a
           mesma base, então um código adicionado manualmente também é verificado de verdade. */}
        <Section icon={<CertificateIcon size={14} />} title="Códigos BNCC">
          <ToggleRow
            label="Mostrar no rodapé"
            description="Pré-visualização e Word"
            checked={config.mostrarBNCC}
            onChange={(v) => onUpdate({ mostrarBNCC: v })}
          />
          <div className="mt-3">
            <ChipInput
              chips={config.codigosBNCC}
              placeholder="Ex: EF09MA01"
              onAdd={addBNCC}
              onRemove={removeBNCC}
              uppercase
            />
          </div>
          <p className="text-[10px] text-(--foreground)/40 mt-2 leading-relaxed">
            {config.codigosBNCC.length > 0
              ? "Preenchido automaticamente com base no conteúdo gerado, consultando a BNCC oficial. Edite livremente  cada código é verificado contra a base ao exportar."
              : "Preenchido automaticamente ao gerar a atividade, ou insira manualmente os códigos separados por Enter."}
          </p>
        </Section>

        {/* Acessibilidade */}
        <Section icon={<EyeSlashIcon size={14} />} title="Acessibilidade" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            <ToggleRow
              label="Fonte grande"
              description="Baixa visão"
              checked={config.acessibilidade.fonteGrande}
              onChange={(v) => updateAcessibilidade({ fonteGrande: v })}
            />
            <ToggleRow
              label="Reduzir alternativas"
              description="TEA / autismo"
              // Campo interno continua `reduzirQuestoes` (nome herdado) mesmo só reduzindo
              // alternativas agora  renomear quebraria o valor salvo de atividades já existentes.
              checked={config.acessibilidade.reduzirQuestoes}
              onChange={(v) => updateAcessibilidade({ reduzirQuestoes: v })}
            />
            <ToggleRow
              label="Alto contraste"
              description="Baixa visão"
              checked={config.acessibilidade.altoContraste}
              onChange={(v) => updateAcessibilidade({ altoContraste: v })}
            />
            <ToggleRow
              label="Espaçamento aumentado"
              description="Dislexia / TEA"
              checked={config.acessibilidade.espacamento}
              onChange={(v) => updateAcessibilidade({ espacamento: v })}
            />
            <ToggleRow
              label="Linguagem simplificada"
              description="Adapta o vocabulário"
              checked={config.acessibilidade.linguagemSimples}
              onChange={(v) => updateAcessibilidade({ linguagemSimples: v })}
            />
          </div>
        </Section>

        {/* Quantidade de questões */}
        <Section icon={<ListNumbersIcon size={14} />} title="Quantidade de Questões">
          <select
            value={config.quantidadeQuestoes}
            onChange={(e) => onUpdate({ quantidadeQuestoes: Number(e.target.value) })}
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          >
            {Array.from({ length: limiteQuestoes }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "questão" : "questões"}
              </option>
            ))}
          </select>
        </Section>

        {/* Tipos de questões */}
        <Section icon={<ListChecksIcon size={14} />} title="Tipos de Questões">
          <div className="flex flex-col gap-2.5">
            {TIPOS_QUESTAO.map(({ id, label }) => {
              const checked = config.tiposQuestao.includes(id)
              return (
                <div
                  key={id}
                  onClick={() => toggleTipo(id)}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                      checked
                        ? "bg-(--foreground) border-(--foreground)"
                        : "border-(--secundary) group-hover:border-(--foreground)/40"
                    }`}
                  >
                    {checked && (
                      <CheckFatIcon size={9} weight="fill" className="text-(--background)" />
                    )}
                  </span>
                  <span className="text-xs">{label}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* Espaçador para o conteúdo não ficar embaixo do rodapé fixo */}
        <div className="h-4" />
      </div>

      {/* Botões de ação fixos no rodapé */}
      <div className="shrink-0 border-t border-(--secundary) p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-2 bg-(--background)">
        {erroGerar && (
          <p className="text-[11px] text-red-400 leading-relaxed">{erroGerar}</p>
        )}
        {erroGerarLimite && (
          <Link href="/pricing" className="text-[11px] font-medium text-(--brand) hover:underline">
            Fazer upgrade de plano
          </Link>
        )}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-(--brand) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <SpinnerGapIcon size={14} className="animate-spin" />
              {ETAPAS_GERACAO[etapaGeracao].texto}
            </>
          ) : (
            <>
              <ArrowsClockwiseIcon size={14} />
              Gerar Atividade Completa
            </>
          )}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownloadGabaritoWord}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary) hover:bg-(--secundary) transition-colors cursor-pointer"
          >
            <CheckFatIcon size={13} />
            Baixar Gabarito
          </button>
          <button
            type="button"
            onClick={onDownloadWord}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary) hover:bg-(--secundary) transition-colors cursor-pointer"
          >
            <FileDocIcon size={13} />
            Baixar Prova
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ─── Painel de edição de uma questão ────────────────────────── */

interface QuestionSettingsPanelProps {
  questao: QuestaoItem
  dificuldadeGlobal: AtividadeConfig["dificuldade"]
  onUpdate: (partial: Partial<QuestaoItem>) => void
  onClose: () => void
  onRegenerate: () => void
  isRegenerating: boolean
  erro: string | null
  mobileOpen: boolean
  onCloseMobile: () => void
}

/** Painel exibido no lugar da barra lateral padrão quando uma questão é selecionada no A4Sheet. */
function QuestionSettingsPanel({ questao, dificuldadeGlobal, onUpdate, onClose, onRegenerate, isRegenerating, erro, mobileOpen, onCloseMobile }: QuestionSettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Pool de alternativas já vistas pra cada questão (por id)  nunca encolhe, só cresce.
  // Permite reduzir o número de alternativas exibidas e depois voltar a aumentar sem perder o
  // texto das falsas que foram tiradas, mesmo que "opcoes" (o que de fato é exibido/exportado)
  // já tenha sido truncado nesse meio tempo.
  const poolAlternativasRef = useRef<Map<string, string[]>>(new Map())

  function obterPoolAlternativas(): string[] {
    const atual = questao.opcoes ?? []
    const cache = poolAlternativasRef.current.get(questao.id)
    // Cache só é válido se ainda contém a alternativa correta atual  se o gabarito mudou (ex.:
    // questão foi regerada pela IA com outro texto), o pool antigo não faz mais sentido.
    const cacheValido = cache && cache.includes(questao.gabarito)
    const pool = cacheValido && cache.length >= atual.length ? cache : atual
    poolAlternativasRef.current.set(questao.id, pool)
    return pool
  }

  // Mantém a alternativa correta sempre presente e completa/reduz as falsas até bater com
  // `quantidade`, preservando a ordem original do pool.
  function handleAlternativasCountChange(quantidade: number) {
    const pool = obterPoolAlternativas()
    const indiceCorreta = pool.indexOf(questao.gabarito)
    const indices = new Set<number>()
    if (indiceCorreta !== -1) indices.add(indiceCorreta)
    for (let i = 0; indices.size < quantidade && i < pool.length; i++) indices.add(i)
    onUpdate({ opcoes: pool.filter((_, i) => indices.has(i)) })
  }

  // Lê as dimensões naturais da imagem antes de aplicá-la, para que a largura/altura iniciais
  // preservem a proporção original (sem distorcer) até o usuário redimensionar manualmente.
  // Sempre presas aos limites min/max  sem isso, uma imagem muito "esticada" (ex.: bem larga e
  // baixa) nasceria com uma dimensão quase zero e pareceria sumir/ficar com tamanho inválido.
  function aplicarNovaImagem(src: string) {
    const img = new Image()
    img.onload = () => {
      const naturalW = img.naturalWidth || IMAGEM_LARGURA_PADRAO
      const naturalH = img.naturalHeight || IMAGEM_ALTURA_PADRAO
      const larguraBase = Math.min(IMAGEM_LARGURA_PADRAO, naturalW)
      const alturaBase = larguraBase * (naturalH / naturalW)
      const larguraPx = Math.round(Math.min(IMAGEM_LARGURA_MAX, Math.max(IMAGEM_LARGURA_MIN, larguraBase)))
      const alturaPx = Math.round(Math.min(IMAGEM_ALTURA_MAX, Math.max(IMAGEM_ALTURA_MIN, alturaBase)))
      onUpdate({ imagem: { tipo: "upload", src, larguraPx, alturaPx } })
    }
    img.onerror = () => {
      onUpdate({ imagem: { tipo: "upload", src, larguraPx: IMAGEM_LARGURA_PADRAO, alturaPx: IMAGEM_ALTURA_PADRAO } })
    }
    img.src = src
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        aplicarNovaImagem(reader.result)
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <aside
      className={`fixed inset-0 z-50 md:static md:z-auto w-full md:w-[272px] shrink-0 border-l border-(--secundary) flex flex-col bg-(--background) overflow-hidden transition-transform duration-200 md:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Cabeçalho */}
      <div className="px-4 py-3 border-b border-(--secundary) shrink-0 flex items-center justify-between">
        <p className="text-sm font-semibold">Questão {questao.numero}</p>
        <button
          type="button"
          onClick={() => { onClose(); onCloseMobile() }}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          <XIcon size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* Layout */}
        <Section icon={<RowsIcon size={14} />} title="Layout">
          <div className="grid grid-cols-2 gap-2">
            {(["vertical", "horizontal"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onUpdate({ layout: opt })}
                className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  (questao.layout ?? "vertical") === opt
                    ? "border-(--brand) bg-(--brand)/10 text-(--brand)"
                    : "border-(--secundary) hover:bg-(--secundary)"
                }`}
              >
                {opt === "vertical" ? "Vertical" : "Horizontal"}
              </button>
            ))}
          </div>
        </Section>

        {/* Enunciado */}
        <Section icon={<TextTIcon size={14} />} title="Enunciado">
          <textarea
            value={questao.enunciado}
            onChange={(e) => onUpdate({ enunciado: e.target.value })}
            rows={4}
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors resize-none"
          />
        </Section>

        {/* Imagem */}
        <Section icon={<ImageIcon size={14} />} title="Adicionar imagem">
          {questao.imagem ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={questao.imagem.src} alt="" className="w-12 h-12 object-cover rounded-md border border-(--secundary)" />
                <div className="flex-1 min-w-0 text-[10px] text-(--foreground)/50 truncate">
                  Enviada do computador
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate({ imagem: undefined })}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-(--secundary) transition-colors shrink-0 cursor-pointer"
                >
                  <TrashIcon size={13} className="text-(--foreground)/50" />
                </button>
              </div>
              <select
                value={questao.imagem.posicao ?? "acima-respostas"}
                onChange={(e) =>
                  // Zera o deslocamento das alças: ele foi calculado pro layout anterior e não faz mais sentido aqui
                  onUpdate({
                    imagem: { ...questao.imagem!, posicao: e.target.value as QuestaoImagemPosicao, offsetXPx: 0, offsetYPx: 0 },
                  })
                }
                className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
              >
                <option value="acima-respostas">Em cima das respostas</option>
                <option value="lado-questao">Do lado da questão</option>
              </select>

              {/* Tamanho da imagem  o mesmo valor pode ser ajustado arrastando as alças dela no A4.
                  Escala largura e altura juntas (mantendo a proporção atual da caixa) para que o
                  espaço reservado encolha nos dois eixos, como já acontece ao arrastar as alças. */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-(--secundary) px-2 py-1.5">
                <button
                  type="button"
                  disabled={(questao.imagem.larguraPx ?? IMAGEM_LARGURA_PADRAO) <= IMAGEM_LARGURA_MIN}
                  onClick={() => {
                    const atualL = questao.imagem!.larguraPx ?? IMAGEM_LARGURA_PADRAO
                    const atualA = questao.imagem!.alturaPx ?? IMAGEM_ALTURA_PADRAO
                    const novaL = Math.max(IMAGEM_LARGURA_MIN, atualL - IMAGEM_LARGURA_STEP)
                    const escala = novaL / atualL
                    const novaA = Math.round(Math.min(IMAGEM_ALTURA_MAX, Math.max(IMAGEM_ALTURA_MIN, atualA * escala)))
                    onUpdate({ imagem: { ...questao.imagem!, larguraPx: novaL, alturaPx: novaA } })
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-(--secundary) transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <MinusIcon size={12} />
                </button>
                <span className="text-xs">{questao.imagem.larguraPx ?? IMAGEM_LARGURA_PADRAO}px</span>
                <button
                  type="button"
                  disabled={(questao.imagem.larguraPx ?? IMAGEM_LARGURA_PADRAO) >= IMAGEM_LARGURA_MAX}
                  onClick={() => {
                    const atualL = questao.imagem!.larguraPx ?? IMAGEM_LARGURA_PADRAO
                    const atualA = questao.imagem!.alturaPx ?? IMAGEM_ALTURA_PADRAO
                    const novaL = Math.min(IMAGEM_LARGURA_MAX, atualL + IMAGEM_LARGURA_STEP)
                    const escala = novaL / atualL
                    const novaA = Math.round(Math.min(IMAGEM_ALTURA_MAX, Math.max(IMAGEM_ALTURA_MIN, atualA * escala)))
                    onUpdate({ imagem: { ...questao.imagem!, larguraPx: novaL, alturaPx: novaA } })
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-(--secundary) transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <PlusIcon size={12} />
                </button>
              </div>

              {/* Alinhamento  lado da imagem (posição "lado-questao") ou alinhamento horizontal (posições empilhadas) */}
              <div className="grid grid-cols-2 gap-2">
                {(["esquerda", "direita"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onUpdate({ imagem: { ...questao.imagem!, alinhamento: opt, offsetXPx: 0, offsetYPx: 0 } })}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      (questao.imagem!.alinhamento ?? "esquerda") === opt
                        ? "border-(--brand) bg-(--brand)/10 text-(--brand)"
                        : "border-(--secundary) hover:bg-(--secundary)"
                    }`}
                  >
                    {opt === "esquerda" ? "Esquerda" : "Direita"}
                  </button>
                ))}
              </div>

              {/* Ajuste (object-fit)  só faz diferença visual quando largura/altura não têm mais a proporção original */}
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-(--foreground)/40">Ajuste (corte)</p>
                <select
                  value={questao.imagem.ajuste ?? "contain"}
                  onChange={(e) =>
                    onUpdate({
                      imagem: { ...questao.imagem!, ajuste: e.target.value as QuestaoImagemAjuste },
                    })
                  }
                  className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
                >
                  <option value="contain">Conter (mostra tudo, sem cortar)</option>
                  <option value="cover">Cobrir (preenche e corta as bordas)</option>
                  <option value="fill">Preencher (distorce pra caber)</option>
                  <option value="scale-down">Reduzir se necessário</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-(--secundary) hover:bg-(--secundary) transition-colors cursor-pointer"
              >
                <UploadSimpleIcon size={13} /> Enviar do computador
              </button>
            </div>
          )}
        </Section>

        {/* Tipo de questão */}
        <Section icon={<ListChecksIcon size={14} />} title="Tipo de questão">
          <select
            value={questao.tipo}
            onChange={(e) => onUpdate({ tipo: e.target.value as QuestaoItem["tipo"] })}
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          >
            {TIPOS_QUESTAO.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          {(questao.tipo === "multipla-escolha" || questao.tipo === "assercoes-multiplas") && (() => {
            const pool = obterPoolAlternativas()
            const quantidadeAtual = questao.opcoes?.length ?? pool.length
            return (
              <div className="flex flex-col gap-1 mt-3">
                <p className="text-[11px] text-(--foreground)/50">Número de alternativas</p>
                <select
                  value={quantidadeAtual}
                  onChange={(e) => handleAlternativasCountChange(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
                >
                  {Array.from({ length: Math.max(pool.length, 1) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            )
          })()}
        </Section>

        {/* Dificuldade */}
        <Section icon={<GraduationCapIcon size={14} />} title="Dificuldade">
          <select
            value={questao.dificuldade ?? dificuldadeGlobal}
            onChange={(e) => onUpdate({ dificuldade: e.target.value as QuestaoItem["dificuldade"] })}
            className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          >
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
            <option value="extremo">Extremo</option>
            <option value="superior">Nível Superior</option>
            <option value="pos">Pós-graduação</option>
          </select>
        </Section>

        {/* Número de linhas  só faz sentido para dissertativo/matematica */}
        {(questao.tipo === "dissertativo" || questao.tipo === "matematica") && (
          <Section icon={<ListNumbersIcon size={14} />} title="Número de linhas">
            <select
              value={questao.numeroLinhas ?? 5}
              onChange={(e) => onUpdate({ numeroLinhas: Number(e.target.value) })}
              className="w-full text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            >
              {Array.from({ length: 8 }, (_, i) => i + 3).map((n) => (
                <option key={n} value={n}>{n} linhas</option>
              ))}
            </select>
          </Section>
        )}

        {/* Espaçador para o conteúdo não ficar embaixo do rodapé fixo */}
        <div className="h-4" />
      </div>

      {/* Botão Regerar fixo no rodapé */}
      <div className="shrink-0 border-t border-(--secundary) p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-(--background)">
        {erro && <p className="mb-2 text-[11px] text-red-500">{erro}</p>}
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-(--brand) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegenerating ? (
            <SpinnerGapIcon size={14} className="animate-spin" />
          ) : (
            <ArrowsClockwiseIcon size={14} />
          )}
          {isRegenerating ? "Regerando..." : "Regerar"}
        </button>
      </div>
    </aside>
  )
}

/* ─── Seção sanfonada (accordion) ────────────────────────────── */

interface SectionProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ icon, title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-(--secundary)">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-(--secundary)/40 transition-colors text-left cursor-pointer"
      >
        <span className="text-(--foreground)/50">{icon}</span>
        <span className="text-xs font-semibold flex-1">{title}</span>
        {open ? (
          <CaretUpIcon size={11} className="text-(--foreground)/40" />
        ) : (
          <CaretDownIcon size={11} className="text-(--foreground)/40" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

/* ─── Linha com interruptor (toggle) ─────────────────────────── */

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-[10px] text-(--foreground)/40">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors cursor-pointer ${
          checked ? "bg-(--brand)" : "bg-(--secundary)"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-(--secundary) rounded-full shadow-sm transition-transform ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </div>
  )
}

/* ─── Campo de chips ─────────────────────────────────────────── */

interface ChipInputProps {
  chips: string[]
  placeholder: string
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  uppercase?: boolean
}

function ChipInput({ chips, placeholder, onAdd, onRemove, uppercase }: ChipInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const val = inputRef.current?.value ?? ""
      if (val.trim()) {
        onAdd(val)
        if (inputRef.current) inputRef.current.value = ""
      }
    }
  }

  function handleAdd() {
    const val = inputRef.current?.value ?? ""
    if (val.trim()) {
      onAdd(val)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Chips adicionados */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip}
              className="flex items-center gap-1 text-[10px] bg-(--secundary) rounded-md px-2 py-1"
            >
              {uppercase ? chip.toUpperCase() : chip}
              <button
                type="button"
                onClick={() => onRemove(chip)}
                className="text-(--foreground)/40 hover:text-(--foreground) transition-colors ml-0.5 cursor-pointer"
              >
                <XIcon size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo de entrada */}
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className={`flex-1 min-w-0 text-xs rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors ${
            uppercase ? "uppercase" : ""
          }`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-(--secundary) hover:bg-(--secundary) transition-colors shrink-0 cursor-pointer"
        >
          <PlusIcon size={13} className="text-(--foreground)/60" />
        </button>
      </div>
    </div>
  )
}

/* ─── Constantes ─────────────────────────────────────────────── */

const TIPOS_QUESTAO = [
  { id: "multipla-escolha", label: "Múltipla escolha" },
  { id: "verdade-falso", label: "Verdadeiro ou falso" },
  { id: "dissertativo", label: "Dissertativo" },
  { id: "completar-lacunas", label: "Completar lacunas" },
  { id: "matematica", label: "Matemática" },
  { id: "assercoes-multiplas", label: "Asserções múltiplas" },
]
