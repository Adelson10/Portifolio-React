"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { createPortal } from "react-dom"
import { SpinnerGapIcon, DotsSixVerticalIcon } from "@phosphor-icons/react"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HIGHLIGHT_HEX, type AtividadeConfig, type DocxElement, type HeaderStyle, type PageBorderProps } from "./activity-editor"
import { getPreset, getPresetMargins, getPresetFontSize } from "./formatting-presets"
import { paginateBlocks, type FlowBlock } from "./pagination"
import {
  IMAGEM_LARGURA_MIN,
  IMAGEM_LARGURA_MAX,
  IMAGEM_LARGURA_PADRAO,
  IMAGEM_ALTURA_MIN,
  IMAGEM_ALTURA_MAX,
  IMAGEM_ALTURA_PADRAO,
  formatarRespostaGabarito,
  gabaritoPrecisaDeEnunciado,
  questaoComAlternativasReduzidas,
  type QuestaoItem,
  type QuestaoImagemAjuste,
} from "./mock-questoes"
import { resolverCodigosBNCC, type HabilidadeBNCC } from "@/lib/bncc/api-bncc-dev"

// ─── Dimensões da folha A4 a 96dpi ─────────────────────────────────────────────
export const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123

// Referência estável pra quando não há questões  um `?? []` literal criaria um array novo
// a cada render, o que quebraria a estabilidade de referência usada pelos useMemo/useEffect
// de paginação mais abaixo (causa loop infinito de re-render).
const EMPTY_QUESTOES: QuestaoItem[] = []

// ─── Mapeamento de fontes do Word para CSS + substitutos no Google Fonts ──────
// Fontes proprietárias (Times New Roman, Calibri) não estão no Google Fonts;
// carregamos equivalentes métricos como fallback para ambientes sem a fonte instalada.
const FONT_MAP: Record<string, { css: string; googleFont?: string }> = {
  "Times New Roman": { css: '"Times New Roman", Tinos, serif',             googleFont: "Tinos" },
  "Calibri":         { css: 'Calibri, Carlito, "Trebuchet MS", sans-serif', googleFont: "Carlito" },
  "Calibri Light":   { css: '"Calibri Light", Carlito, sans-serif',         googleFont: "Carlito" },
  "Arial":           { css: 'Arial, Arimo, sans-serif',                      googleFont: "Arimo" },
  "Verdana":         { css: 'Verdana, sans-serif' },
  "Georgia":         { css: 'Georgia, serif' },
  "Cambria":         { css: 'Cambria, Georgia, serif' },
  "Courier New":     { css: '"Courier New", Cousine, monospace',             googleFont: "Cousine" },
  "Garamond":        { css: 'Garamond, "EB Garamond", serif',               googleFont: "EB+Garamond" },
}

/** Retorna a declaração CSS font-family (com substitutos) para a fonte do Word informada. */
function fontCss(name: string): string {
  return FONT_MAP[name]?.css ?? `"${name}", sans-serif`
}

/** Monta a URL do Google Fonts para carregar os substitutos das fontes informadas. */
function buildGoogleFontsUrl(fonts: string[]): string | null {
  const families = [...new Set(fonts.map(f => FONT_MAP[f]?.googleFont).filter(Boolean))] as string[]
  if (families.length === 0) return null
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join("&")}&display=swap`
}

/** Separa elementos posicionados (anchors: text-box, imagem/forma com x/y) do fluxo normal
 *  de um template docx  anchors não têm como saber "em qual página cairiam" sem reimplementar
 *  o motor de layout do Word, então ficam sempre fixos na página 1 (ver `AnchorLayer`). */
export function computeAnchorsAndFlow(elements: DocxElement[]): {
  anchorEls: DocxElement[]
  anchorBaseEl: DocxElement | null
  flowEls: DocxElement[]
} {
  const isPositioned = (e: DocxElement) =>
    e.type === "text-box" ||
    (e.type === "image" && e.x !== undefined) ||
    (e.type === "shape" && e.x !== undefined && e.y !== undefined)

  // Ordena os anchors por relativeHeight (crescente), assim quem tem relativeHeight maior
  // renderiza por cima dos demais (mesmo comportamento do Word)
  const anchorEls = elements
    .filter(isPositioned)
    .sort((a, b) => {
      const ra = (a as { relativeHeight?: number }).relativeHeight ?? 0
      const rb = (b as { relativeHeight?: number }).relativeHeight ?? 0
      return ra - rb
    })

  // Exclui paragraph-boundary (marcadores de layout, não são conteúdo visual)
  const allFlowEls = elements.filter(e => !isPositioned(e) && e.type !== "paragraph-boundary")

  // Quando há anchors, o primeiro elemento com texto real pode ser o texto do parágrafo-âncora
  // e deve aparecer no topo da área de anchors (y≈0), não após ela.
  const anchorBaseEl = (() => {
    if (anchorEls.length === 0 || allFlowEls.length === 0) return null
    const el = allFlowEls[0]
    if (el.type !== "paragraph" && el.type !== "heading" && el.type !== "run") return null
    // "run" armazena conteúdo em .runs[], não em .text
    const hasContent = el.type === "run"
      ? el.runs.some(r => r.text)
      : !!(el as { text?: string }).text
    return hasContent ? el : null
  })()

  // Pula parágrafos vazios iniciais: no DOCX eles empurram o texto abaixo dos anchors flutuantes,
  // mas na renderização a área de anchors (height fixo) já faz esse papel.
  let flowStartIdx = anchorBaseEl ? 1 : 0
  if (anchorEls.length > 0) {
    while (flowStartIdx < allFlowEls.length) {
      const el = allFlowEls[flowStartIdx]
      if (el.type === "paragraph" && !(el as { text?: string }).text) {
        flowStartIdx++
      } else {
        break
      }
    }
  }
  const flowEls = allFlowEls.slice(flowStartIdx)

  return { anchorEls, anchorBaseEl, flowEls }
}

interface A4SheetProps {
  config: AtividadeConfig
  isGenerating?: boolean
  isLoadingModelo?: boolean
  /** "gabarito" troca o conteúdo das questões por número + resposta correta (mesmo cabeçalho/rodapé/modelo). */
  modo?: "questoes" | "gabarito"
  selectedQuestaoId?: string | null
  onSelectQuestao?: (id: string) => void
  onReorderQuestoes?: (newOrder: QuestaoItem[]) => void
  onUpdateQuestao?: (id: string, partial: Partial<QuestaoItem>) => void
}

/** Placeholder de carregamento exibido enquanto o .docx do modelo é buscado e parseado
 *  (ver /api/parse-modelo)  imita a silhueta da folha (cabeçalho + parágrafos + questões). */
function A4SheetSkeleton() {
  const bar = (widthClass: string) => (
    <div className={`h-3 rounded bg-black/10 dark:bg-white/10 ${widthClass}`} />
  )
  return (
    <div className="absolute inset-0 bg-white dark:bg-[#1a1a1a] flex flex-col gap-8 px-16 py-14 animate-pulse z-10">
      <div className="flex flex-col items-center gap-2">
        {bar("w-2/5")}
        {bar("w-1/3")}
      </div>
      <div className="flex flex-col gap-2.5">
        {bar("w-full")}
        {bar("w-full")}
        {bar("w-3/4")}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2.5">
          {bar("w-full")}
          {bar("w-5/6")}
          <div className="flex flex-col gap-2 pl-6 mt-1">
            {bar("w-1/2")}
            {bar("w-2/5")}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Folha A4 que renderiza a pré-visualização da atividade (modelo do docx + questões),
 *  paginada em múltiplas folhas quando o conteúdo ultrapassa uma página  cabeçalho e
 *  rodapé se repetem em todas as folhas; conteúdo normal flui e termina onde acabou. */
export default function A4Sheet({ config, isGenerating, isLoadingModelo, modo = "questoes", selectedQuestaoId = null, onSelectQuestao, onReorderQuestoes, onUpdateQuestao }: A4SheetProps) {
  const { acessibilidade, formatacao, fonteEscolhida, quantidadeQuestoes, modeloTemplate, codigosBNCC, mostrarBNCC } = config
  const { fonteGrande, altoContraste, espacamento } = acessibilidade

  // Resolve os códigos BNCC contra a base oficial (api.bncc.dev, CORS aberto) uma única vez aqui
  // no componente pai  os dois usos de RepeatingFooter abaixo (medição + páginas reais) só
  // recebem o resultado já pronto, pra não disparar a mesma busca em paralelo várias vezes.
  const [habilidadesBNCCResolvidas, setHabilidadesBNCCResolvidas] = useState<HabilidadeBNCC[]>([])
  useEffect(() => {
    if (!mostrarBNCC || codigosBNCC.length === 0) {
      setHabilidadesBNCCResolvidas([])
      return
    }
    let cancelado = false
    resolverCodigosBNCC(codigosBNCC).then((resolvidas) => {
      if (!cancelado) setHabilidadesBNCCResolvidas(resolvidas)
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarBNCC, codigosBNCC.join(",")])

  const questoes = config.questoes ?? EMPTY_QUESTOES
  // `.slice()` sempre cria um array novo  memoizado pra manter referência estável entre
  // renders (usado como dependência de useMemo/useEffect da paginação mais abaixo).
  // "Reduzir questões" (TEA/autismo) não reduz a quantidade de questões da prova  só o número de
  // alternativas de cada uma (ver questaoComAlternativasReduzidas em bodyBlocks, mais abaixo).
  const visibleQuestoes = useMemo(
    () => questoes.slice(0, quantidadeQuestoes),
    [questoes, quantidadeQuestoes]
  )

  // Reordenação acontece sobre o subconjunto visível (as `quantidadeQuestoes` primeiras); o restante é mantido no final.
  function handleReorderVisible(newVisibleOrder: QuestaoItem[]) {
    onReorderQuestoes?.([...newVisibleOrder, ...questoes.slice(visibleQuestoes.length)])
  }

  // ── Preset da norma selecionada ────────────────────────────────────────────
  const preset       = getPreset(formatacao)
  const presetMargens = getPresetMargins(preset)
  const fontSize     = getPresetFontSize(preset, fonteEscolhida)

  // ── Margens: template do docx tem prioridade sobre o preset ───────────────
  // Memoizado por referência estável  usado como dependência do efeito de paginação.
  const effectiveMargins = useMemo(() => {
    const templateMargins = modeloTemplate?.margins
    return {
      top:    templateMargins?.top    ?? presetMargens.top,
      bottom: templateMargins?.bottom ?? presetMargens.bottom,
      left:   templateMargins?.left   ?? presetMargens.left,
      right:  templateMargins?.right  ?? presetMargens.right,
    }
  }, [modeloTemplate, formatacao])

  // ── Tipografia ─────────────────────────────────────────────────────────────
  // fonteGrande acrescenta 2px ao tamanho base do preset
  const basePx = parseFloat(fontSize)
  const effectiveFontSize = fonteGrande ? `${basePx + 2}px` : fontSize

  // Espaçamento de acessibilidade tem prioridade; caso contrário usa o preset
  const cssLineHeight = espacamento
    ? 2
    : preset.espacamento >= 2   ? 2
    : preset.espacamento >= 1.5 ? 1.5
    : 1.25
  // No modo documento, o espaçamento de linha do MODELO é definido por elemento
  // (element.lineSpacing); herdar o do preset aqui vazaria para tipos que não
  // sobrescrevem (heading, bullet-list, text-box etc.), ignorando o docx original.
  const sheetLineHeight: number | "normal" = modeloTemplate ? "normal" : cssLineHeight

  const textAlignClass = preset.textJustify ? "text-justify" : ""

  const paperBg = altoContraste ? "bg-[#111] text-white" : "bg-white text-[#1a1a1a]"
  const borderColor = altoContraste ? "border-white" : "border-[#1a1a1a]"
  const mutedColor = altoContraste ? "text-gray-300" : "text-gray-500"

  const hasBorder = modeloTemplate?.hasBorder ?? false
  const pageBorder = modeloTemplate?.pageBorder

  // A fonte selecionada pelo usuário SEMPRE controla o sheet.
  // O template pode definir fontes para seus próprios elementos via element.fontFamily,
  // mas a fonte base da folha é sempre a escolhida no preset.
  const templateFonts = modeloTemplate?.fonts ?? []
  const sheetFontFamily = fontCss(fonteEscolhida)

  // Carrega fallbacks do Google Fonts para a fonte selecionada + fontes do template
  useEffect(() => {
    const fontsToLoad = [...new Set([fonteEscolhida, ...templateFonts])]
    const url = buildGoogleFontsUrl(fontsToLoad)
    if (!url) return
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = url
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonteEscolhida, templateFonts.join(",")])

  const templateHeader = modeloTemplate?.header
  const headerStyle    = modeloTemplate?.headerStyle
  const templateFooter = modeloTemplate?.footer

  // ── Elementos do template: separa anchors (posicionamento absoluto, só página 1)
  // do fluxo normal, que entra na paginação junto com as questões ───────────────
  // `?? []` sozinho criaria um array novo a cada render (referência instável), o que
  // faria os useMemo/useEffect abaixo re-rodarem infinitamente  por isso o useMemo aqui.
  const templateElements = useMemo(() => modeloTemplate?.elements ?? [], [modeloTemplate])
  const { anchorEls, anchorBaseEl, flowEls } = useMemo(
    () => computeAnchorsAndFlow(templateElements),
    [templateElements]
  )

  // ── Blocos paginável: cada um é atômico  vai inteiro pra uma página ou pra próxima,
  // nunca é dividido no meio (sem quebra de parágrafo/linha de tabela). Sem modelo docx,
  // não há nenhum cabeçalho de preenchimento  só as questões. ──────────────────────
  const bodyBlocks: FlowBlock[] = useMemo(() => {
    const docxBlocks: FlowBlock[] = modeloTemplate
      ? flowEls.map((element, i) => ({ kind: "docx" as const, key: `docx-${i}`, element }))
      : []
    // "Reduzir questões" (TEA/autismo) também reduz as alternativas de múltipla escolha/asserções
    // múltiplas pela metade  só na exibição (a cópia reduzida nunca é persistida), então desligar
    // o toggle restaura as alternativas originais sem perder nada.
    const questaoBlocks: FlowBlock[] = visibleQuestoes.map((questao) => ({
      kind: "questao" as const,
      key: questao.id,
      questao: acessibilidade.reduzirQuestoes ? questaoComAlternativasReduzidas(questao) : questao,
    }))
    return [...docxBlocks, ...questaoBlocks]
  }, [modeloTemplate, flowEls, visibleQuestoes, acessibilidade.reduzirQuestoes])

  const questionGapPx = espacamento ? 56 : 36 // gap-14 / gap-9 em px, aplicado como marginBottom de cada questão

  // ── Paginação: mede a altura real do cabeçalho, do rodapé e de cada bloco num
  // container invisível (nunca display:none, que zeraria a altura), então distribui
  // os blocos em folhas de 1123px sem quebrar nenhum bloco no meio. ──────────────
  const headerMeasureRef = useRef<HTMLDivElement>(null)
  const footerMeasureRef = useRef<HTMLDivElement>(null)
  const blockMeasureRefs = useRef<(HTMLDivElement | null)[]>([])
  const [pages, setPages] = useState<FlowBlock[][]>(() => [bodyBlocks])
  // A camada de medição é portada pra document.body (ver abaixo)  só pode montar depois da
  // hidratação (SSR não tem `document.body` disponível pro portal), senão o HTML do servidor
  // e o primeiro render do cliente divergem. Enquanto `mounted` é false os refs de medição
  // ficam null, por isso entra nas dependências dos efeitos abaixo: precisa remedir assim que
  // a camada realmente existir no DOM.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  function remeasureAndPaginate() {
    const headerH = headerMeasureRef.current?.getBoundingClientRect().height ?? 0
    const footerH = footerMeasureRef.current?.getBoundingClientRect().height ?? 0
    const heights = blockMeasureRefs.current.map((el) => el?.getBoundingClientRect().height ?? 0)
    const availableHeight = Math.max(100, PAGE_HEIGHT_PX - headerH - footerH)
    // A AnchorLayer (logo/caixas de texto flutuantes do modelo) só existe na página 1 e não
    // faz parte de `bodyBlocks`/`heights`  sem reservar o espaço dela aqui, a página 1
    // parecia ter mais espaço livre do que realmente tem e as questões estufavam a folha.
    const anchorReservedPx = anchorEls.length > 0 ? computeAnchorAreaHeight(anchorEls) + ANCHOR_LAYER_MARGIN_BOTTOM_PX : 0
    setPages(paginateBlocks(bodyBlocks, heights, availableHeight, 0, anchorReservedPx))
  }

  // useLayoutEffect roda antes do browser pintar  a paginação recalculada entra no
  // mesmo commit, sem "flash" visível no caso comum.
  useLayoutEffect(() => {
    remeasureAndPaginate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyBlocks, anchorEls, effectiveMargins, effectiveFontSize, sheetFontFamily, sheetLineHeight, templateHeader, templateFooter, modo, mounted])

  // Rede de segurança: fontes do Google Fonts e imagens de questão podem terminar de
  // carregar depois do primeiro paint e mudar a altura real do conteúdo  reforça com
  // uma nova medição quando isso acontecer (pode causar um reflow perceptível único).
  useEffect(() => {
    let cancelled = false
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => { if (!cancelled) remeasureAndPaginate() })
    }
    const container = headerMeasureRef.current?.parentElement
    let observer: ResizeObserver | null = null
    if (container && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => remeasureAndPaginate())
      observer.observe(container)
    }
    return () => {
      cancelled = true
      observer?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyBlocks, mounted])

  // ── Drag-and-drop das questões  um único DndContext no topo, envolvendo todas as
  // páginas: dnd-kit não exige que os itens do SortableContext sejam irmãos no DOM,
  // só que estejam sob o mesmo contexto com o array `items` na ordem lógica completa ──
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = visibleQuestoes.findIndex((q) => q.id === active.id)
    const newIndex = visibleQuestoes.findIndex((q) => q.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    handleReorderVisible(arrayMove(visibleQuestoes, oldIndex, newIndex))
  }

  function renderBlock(block: FlowBlock) {
    if (block.kind === "docx") {
      return <DocxElementRenderer element={block.element} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
    }
    if (modo === "gabarito") {
      return <GabaritoItem questao={block.questao} cssLineHeight={cssLineHeight} textAlignClass={textAlignClass} />
    }
    return (
      <SortableQuestionItem
        questao={block.questao}
        selected={block.questao.id === selectedQuestaoId}
        onSelect={() => onSelectQuestao?.(block.questao.id)}
        cssLineHeight={cssLineHeight}
        borderColor={borderColor}
        mutedColor={mutedColor}
        espacamento={espacamento}
        textAlignClass={textAlignClass}
        onUpdateQuestao={onUpdateQuestao}
      />
    )
  }

  return (
    <div id="a4-print-sheet" className="relative w-[794px]">
      {/* Skeleton exibido enquanto o .docx do modelo ainda está sendo buscado/parseado */}
      {isLoadingModelo && <A4SheetSkeleton />}

      {/* Sobreposição exibida durante a geração da atividade */}
      {!isLoadingModelo && isGenerating && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
          <SpinnerGapIcon size={36} className="animate-spin text-(--brand)" />
          <p className="text-sm font-medium text-(--foreground)">Gerando nova atividade...</p>
        </div>
      )}

      {/* Camada invisível de medição  nunca display:none (zeraria a altura). Mede o
          cabeçalho, o rodapé e cada bloco de conteúdo pra decidir onde cada página termina.
          Portada pra document.body: `position: fixed` só fica relativo à viewport (e
          `getBoundingClientRect()` só retorna a altura nativa, não escalada) enquanto não
          houver nenhum ancestral com `transform` no caminho  e o A4Sheet pode ser renderizado
          dentro de um wrapper com zoom/escala (ver A4Zoom), que criaria um novo containing
          block pra `position: fixed` e corromperia a medição se essa camada ficasse aninhada. */}
      {mounted && createPortal(
        <div style={{ position: "fixed", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }} aria-hidden>
          <div style={{ width: PAGE_WIDTH_PX, fontFamily: sheetFontFamily, fontSize: effectiveFontSize, lineHeight: sheetLineHeight }}>
            <div ref={headerMeasureRef}>
              <RepeatingHeader templateHeader={templateHeader} headerStyle={headerStyle} borderColor={borderColor} effectiveMargins={effectiveMargins} />
            </div>
            <div ref={footerMeasureRef}>
              <RepeatingFooter templateFooter={templateFooter} pageNumber={1} borderColor={borderColor} effectiveMargins={effectiveMargins} habilidadesBNCC={habilidadesBNCCResolvidas} />
            </div>
          </div>
          <div style={{ width: PAGE_WIDTH_PX - effectiveMargins.left - effectiveMargins.right, fontFamily: sheetFontFamily, fontSize: effectiveFontSize, lineHeight: sheetLineHeight }}>
            {bodyBlocks.map((block, i) => (
              <div
                key={block.key}
                ref={(el) => { blockMeasureRefs.current[i] = el }}
                // paddingBottom (não marginBottom)  margin nunca entra no getBoundingClientRect()
                // do próprio elemento, o que fazia a paginação medir menos altura do que a
                // realmente renderizada e estourar a página. Padding conta na altura medida.
                style={{ display: "flow-root", paddingBottom: block.kind === "questao" ? questionGapPx : undefined }}
              >
                {block.kind === "docx"
                  ? <DocxElementRenderer element={block.element} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
                  : modo === "gabarito"
                    ? <GabaritoItem questao={block.questao} cssLineHeight={cssLineHeight} textAlignClass={textAlignClass} />
                    : <QuestionItem questao={block.questao} cssLineHeight={cssLineHeight} borderColor={borderColor} mutedColor={mutedColor} espacamento={espacamento} textAlignClass={textAlignClass} />}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      <DndContext id="questoes-sortable" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleQuestoes.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-6">
            {pages.map((blocks, pageIndex) => (
              <PageShell
                key={pageIndex}
                hasBorder={hasBorder}
                pageBorder={pageBorder}
                altoContraste={altoContraste}
                paperBg={paperBg}
                fontFamily={sheetFontFamily}
                fontSize={effectiveFontSize}
                lineHeight={sheetLineHeight}
                pageBackground={modeloTemplate?.pageBackground}
                contentPaddingLeft={effectiveMargins.left}
                contentPaddingRight={effectiveMargins.right}
                header={<RepeatingHeader templateHeader={templateHeader} headerStyle={headerStyle} borderColor={borderColor} effectiveMargins={effectiveMargins} />}
                footer={<RepeatingFooter templateFooter={templateFooter} pageNumber={pageIndex + 1} borderColor={borderColor} effectiveMargins={effectiveMargins} habilidadesBNCC={habilidadesBNCCResolvidas} />}
              >
                {pageIndex === 0 && anchorEls.length > 0 && (
                  <AnchorLayer anchorEls={anchorEls} anchorBaseEl={anchorBaseEl} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
                )}
                {blocks.map((block) => (
                  <div key={block.key} style={{ display: "flow-root", paddingBottom: block.kind === "questao" ? questionGapPx : undefined }}>
                    {renderBlock(block)}
                  </div>
                ))}
              </PageShell>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ─── Folha individual (794×1123) ───────────────────────────────────────────────

/** Uma folha A4 completa: borda de página + cabeçalho/rodapé repetidos + zona de conteúdo. */
export function PageShell({
  children,
  header,
  footer,
  hasBorder,
  pageBorder,
  altoContraste,
  paperBg,
  fontFamily,
  fontSize,
  lineHeight,
  pageBackground,
  contentPaddingLeft,
  contentPaddingRight,
}: {
  children: React.ReactNode
  header: React.ReactNode
  footer: React.ReactNode
  hasBorder: boolean
  pageBorder?: PageBorderProps
  altoContraste: boolean
  paperBg: string
  fontFamily: string
  fontSize: string
  lineHeight: number | "normal"
  pageBackground?: string
  contentPaddingLeft: number
  contentPaddingRight: number
}) {
  return (
    <div
      className={`a4-page shadow-xl w-[794px] h-[1123px] relative flex flex-col ${paperBg}`}
      style={{
        fontFamily,
        fontSize,
        lineHeight,
        // Alto contraste (acessibilidade) tem prioridade sobre a cor de página do MODELO
        backgroundColor: !altoContraste ? pageBackground : undefined,
      }}
    >
      {/* Borda de página (originada de <w:pgBorders> no docx)  repete em toda folha */}
      {hasBorder && <PageBorderBox pageBorder={pageBorder} altoContraste={altoContraste} />}

      {header}

      <div className="flex-1" style={{ paddingLeft: contentPaddingLeft, paddingRight: contentPaddingRight }}>
        {children}
      </div>

      {footer}
    </div>
  )
}

// ─── Borda de página ──────────────────────────────────────────────────────────

/** Desenha a borda de página do modelo (equivalente a <w:pgBorders> do docx). */
function PageBorderBox({ pageBorder, altoContraste }: { pageBorder?: PageBorderProps; altoContraste: boolean }) {
  const fallbackColor = altoContraste ? "#ffffff" : "#1a1a1a"
  const top = pageBorder?.top
  const right = pageBorder?.right ?? top
  const bottom = pageBorder?.bottom ?? top
  const left = pageBorder?.left ?? top
  const insetTop    = top?.space    ?? 32
  const insetRight  = right?.space  ?? 32
  const insetBottom = bottom?.space ?? 32
  const insetLeft   = left?.space   ?? 32
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top:    insetTop,
        right:  insetRight,
        bottom: insetBottom,
        left:   insetLeft,
        borderTopWidth:    top?.width ?? 1,
        borderTopColor:    top?.color ?? fallbackColor,
        borderTopStyle:    (top?.style ?? "solid") as React.CSSProperties["borderTopStyle"],
        borderRightWidth:  right?.width ?? 1,
        borderRightColor:  right?.color ?? fallbackColor,
        borderRightStyle:  (right?.style ?? "solid") as React.CSSProperties["borderRightStyle"],
        borderBottomWidth: bottom?.width ?? 1,
        borderBottomColor: bottom?.color ?? fallbackColor,
        borderBottomStyle: (bottom?.style ?? "solid") as React.CSSProperties["borderBottomStyle"],
        borderLeftWidth:   left?.width ?? 1,
        borderLeftColor:   left?.color ?? fallbackColor,
        borderLeftStyle:   (left?.style ?? "solid") as React.CSSProperties["borderLeftStyle"],
      }}
    />
  )
}

// ─── Cabeçalho / rodapé repetidos ──────────────────────────────────────────────

/** Zona de cabeçalho (área da margem superior)  repete em todas as folhas. Só existe
 *  conteúdo aqui quando há um modelo docx real com cabeçalho; sem modelo, a zona fica em
 *  branco (nenhum texto de preenchimento é inventado). */
export function RepeatingHeader({
  templateHeader,
  headerStyle,
  borderColor,
  effectiveMargins,
}: {
  templateHeader?: DocxElement[]
  headerStyle?: HeaderStyle
  borderColor: string
  effectiveMargins: { top: number; left: number; right: number }
}) {
  return (
    <div
      style={{
        minHeight:    effectiveMargins.top,
        paddingLeft:  effectiveMargins.left,
        paddingRight: effectiveMargins.right,
        paddingTop:   8,
        paddingBottom: 4,
        display:      "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      {templateHeader && (() => {
        // Cabeçalhos de estilo (logo + campos soltos) costumam ser feitos com elementos
        // posicionados livremente (text-box/imagem/forma com x/y)  sem separar esses
        // "anchors" do fluxo normal, eles caíam na mesma coluna vertical de qualquer outro
        // parágrafo (empilhados um embaixo do outro), em vez de respeitar a posição 2D
        // desenhada no Word. Mesma separação já usada pra página 1 do corpo (AnchorLayer).
        const { anchorEls, anchorBaseEl, flowEls } = computeAnchorsAndFlow(templateHeader)
        return (
          <div style={{
            fontFamily: headerStyle?.fontFamily ? fontCss(headerStyle.fontFamily) : undefined,
            fontSize:   headerStyle?.fontSize   ? `${headerStyle.fontSize / 2}pt` : undefined,
            lineHeight: headerStyle?.lineRule   ? headerStyle.lineRule / 240       : undefined,
          }}>
            {anchorEls.length > 0 && (
              <AnchorLayer anchorEls={anchorEls} anchorBaseEl={anchorBaseEl} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
            )}
            {flowEls.map((el, i) => {
              // Normaliza tabelas do header: remove propriedades de float para que
              // renderizem como tabelas normais ocupando 100% da largura disponível.
              const normalized: DocxElement = el.type === "table"
                ? { ...el, tblpCenter: undefined, floatY: undefined, tblW: undefined }
                : el
              return <DocxElementRenderer key={i} element={normalized} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
            })}
          </div>
        )
      })()}
    </div>
  )
}

/** Zona de rodapé (área da margem inferior)  repete em todas as folhas, com a
 *  numeração real da página quando o modelo docx tem campo de número de página. */
export function RepeatingFooter({
  templateFooter,
  pageNumber,
  borderColor,
  effectiveMargins,
  habilidadesBNCC = [],
}: {
  templateFooter?: { elements: DocxElement[]; pageNumber?: boolean }
  pageNumber: number
  borderColor: string
  effectiveMargins: { bottom: number; left: number; right: number }
  /** Códigos BNCC já resolvidos contra a base oficial (ver `resolverCodigosBNCC` em A4Sheet) 
   *  vazio pra quem não usa BNCC (ex.: plano de aula, ver plano-aula-editor.tsx). */
  habilidadesBNCC?: HabilidadeBNCC[]
}) {
  return (
    <div
      style={{
        minHeight:    effectiveMargins.bottom,
        paddingLeft:  effectiveMargins.left,
        paddingRight: effectiveMargins.right,
        paddingTop:   4,
        paddingBottom: 8,
        display:      "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {templateFooter && (
        <>
          <div>
            {templateFooter.elements.map((el, i) => (
              <DocxElementRenderer key={i} element={el} borderColor={borderColor} leftMarginPx={effectiveMargins.left} />
            ))}
          </div>
          {templateFooter.pageNumber && <span>{pageNumber}</span>}
        </>
      )}
      {habilidadesBNCC.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 8 }} className="text-gray-500">
          <span style={{ fontWeight: 600 }}>BNCC: </span>
          {habilidadesBNCC.map((h) => h.codigo).join(", ")}
        </div>
      )}
    </div>
  )
}

// ─── Elementos posicionados (anchors)  só na página 1 ────────────────────────

/** Espaçamento abaixo da camada de anchors (equivalente à classe `mb-4`)  somado à altura
 *  da camada ao reservar espaço dela na paginação da página 1 (ver `remeasureAndPaginate`). */
export const ANCHOR_LAYER_MARGIN_BOTTOM_PX = 16

/** Altura total da área de anchors = max(y + height) de todos os elementos posicionados.
 *  Usada tanto para dimensionar a `AnchorLayer` quanto para reservar esse espaço na
 *  paginação da página 1 (a única onde ela aparece)  sem essa reserva, a paginação não
 *  sabia que a página 1 tem menos espaço livre que as demais e estufava as questões. */
export function computeAnchorAreaHeight(anchorEls: DocxElement[]): number {
  return anchorEls.reduce((max, el) => {
    const bottom = el.type === "text-box"
      ? el.y + el.height
      : el.type === "image" ? (el.y ?? 0) + (el.heightPx ?? 0)
      : el.type === "shape" ? (el.y ?? 0) + (el.height ?? 0)
      : 0
    return Math.max(max, bottom)
  }, 0)
}

/** Área de elementos posicionados/flutuantes do docx (text-box, imagem/forma com x/y).
 *  Sem uma reimplementação completa do motor de layout do Word não há como saber em qual
 *  página cairiam  ficam sempre fixos na página 1 (limitação explícita e permanente). */
export function AnchorLayer({
  anchorEls,
  anchorBaseEl,
  borderColor,
  leftMarginPx,
}: {
  anchorEls: DocxElement[]
  anchorBaseEl: DocxElement | null
  borderColor: string
  leftMarginPx: number
}) {
  const anchorAreaHeight = computeAnchorAreaHeight(anchorEls)

  return (
    <div className="relative mb-4" style={{ height: anchorAreaHeight || undefined, minHeight: anchorAreaHeight || 40 }}>

      {/* Texto do parágrafo-âncora: renderizado no topo da área com z-index baixo */}
      {anchorBaseEl && (
        <div className="absolute top-0" style={{ left: 83, zIndex: 1, lineHeight: anchorBaseEl.type === "paragraph" && anchorBaseEl.lineSpacing ? anchorBaseEl.lineSpacing : undefined }}>
          <DocxElementRenderer element={anchorBaseEl} borderColor={borderColor} leftMarginPx={leftMarginPx} />
        </div>
      )}

      {anchorEls.map((el, i) => {
        if (el.type === "text-box") {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.width,
                minHeight: el.height,
                fontFamily: el.fontFamily,
                fontSize: el.fontSize ? `${el.fontSize}pt` : undefined,
                fontWeight: el.bold ? "bold" : undefined,
                fontStyle: el.italic ? "italic" : undefined,
                color: el.color,
                textAlign: el.align as React.CSSProperties["textAlign"],
                background: el.background,
                borderWidth: el.borderWidth,
                borderStyle: (el.borderStyle ?? (el.borderWidth ? "solid" : undefined)) as React.CSSProperties["borderStyle"],
                borderColor: el.borderColor,
                borderRadius: el.borderRadius,
                padding: "2px 4px",
                boxSizing: "border-box",
                // `normal` (não `nowrap`)  texto de rótulo curto ("Nome:") já cabe numa linha e
                // não muda visualmente; texto de várias linhas real (ex.: bloco de endereço
                // institucional agrupado com uma logo) precisa quebrar em vez de ser cortado.
                whiteSpace: "normal",
                // Quebra o `line-height` herdado do container do cabeçalho (RepeatingHeader) 
                // aquele valor vem do `<w:spacing w:line=...>` do parágrafo que hospeda as âncoras
                // no docx original, que costuma ser ~0 porque esse parágrafo não tem texto visível
                // próprio (só as âncoras). Uma caixa de texto com conteúdo real de várias linhas
                // não deve herdar isso, senão as linhas ficam quase empilhadas umas nas outras.
                lineHeight: "normal",
              }}
            >
              {el.text || " "}
            </div>
          )
        }
        if (el.type === "image") {
          const behindDoc = (el as { behindDoc?: boolean }).behindDoc
          const crop = el.crop
          if (crop && el.widthPx && el.heightPx) {
            const visW = Math.max(0.01, 1 - crop.l - crop.r)
            const visH = Math.max(0.01, 1 - crop.t - crop.b)
            const fullW = Math.round(el.widthPx / visW)
            const fullH = Math.round(el.heightPx / visH)
            return (
              <div key={i} style={{ position: "absolute", left: el.x, top: el.y, width: el.widthPx, height: el.heightPx, overflow: "hidden", zIndex: behindDoc ? 0 : undefined }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={el.dataUrl} alt="" style={{ display: "block", width: fullW, height: fullH, marginLeft: -Math.round(crop.l * fullW), marginTop: -Math.round(crop.t * fullH), maxWidth: "none" }} />
              </div>
            )
          }
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={el.dataUrl}
              alt=""
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.widthPx,
                height: el.heightPx,
                objectFit: "contain",
                zIndex: behindDoc ? 0 : undefined,
              }}
            />
          )
        }
        if (el.type === "shape" && el.x !== undefined && el.y !== undefined) {
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                backgroundColor: el.fill ?? "transparent",
                borderWidth: el.borderWidth,
                borderStyle: (el.borderStyle ?? (el.borderWidth ? "solid" : undefined)) as React.CSSProperties["borderStyle"],
                borderColor: el.borderColor,
                borderRadius: el.shapeType === "circle" ? "50%" : el.borderRadius ? `${el.borderRadius}px` : undefined,
                boxSizing: "border-box",
              }}
            />
          )
        }
        return null
      })}
    </div>
  )
}

// ─── Renderizador de elementos do docx ────────────────────────────────────────

/** Renderiza um único elemento do docx (parágrafo, tabela, imagem, forma etc.) como JSX. */
export function DocxElementRenderer({
  element,
  borderColor,
  leftMarginPx = 113,
  inCell = false,
}: {
  element: DocxElement
  borderColor: string
  leftMarginPx?: number
  inCell?: boolean
}) {
  switch (element.type) {

    case "header":
      return (
        <div className="mb-3 pb-2 border-b border-current/20">
          {element.elements.map((el, i) => <DocxElementRenderer key={i} element={el} borderColor={borderColor} leftMarginPx={leftMarginPx} />)}
        </div>
      )

    case "footer":
      // Este é um elemento {type:"footer"} dentro do fluxo normal do corpo do docx 
      // diferente do footer de página (RepeatingFooter), que já mostra a numeração real.
      return (
        <div className="mt-3 pt-2 border-t border-current/20 flex items-center justify-between text-[10px] opacity-60">
          <div>{element.elements.map((el, i) => <DocxElementRenderer key={i} element={el} borderColor={borderColor} leftMarginPx={leftMarginPx} />)}</div>
          {element.pageNumber && <span>1</span>}
        </div>
      )

    case "bordered-section":
      return (
        <div className={`border ${borderColor} my-2 p-2`}>
          {element.elements.map((el, i) => <DocxElementRenderer key={i} element={el} borderColor={borderColor} leftMarginPx={leftMarginPx} />)}
        </div>
      )

    case "section":
      return (
        <div className="my-2" style={{ display: "grid", gridTemplateColumns: `repeat(${element.columns}, 1fr)`, gap: "1rem" }}>
          {element.elements.map((el, i) => <DocxElementRenderer key={i} element={el} borderColor={borderColor} leftMarginPx={leftMarginPx} />)}
        </div>
      )

    case "table": {
      const fallbackCssColor = borderColor.includes("white") ? "#ffffff"
        : (borderColor.match(/border-\[([^\]]+)\]/) ?? [])[1] ?? "#1a1a1a"
      const bColor = element.borderColor ?? fallbackCssColor
      const bWidth = element.borderWidth ?? 1
      const bStyle = element.borderStyle ?? "solid"
      const cp = element.cellPad ?? { top: 0, right: 7, bottom: 0, left: 7 }
      const cellPadding = `${cp.top}px ${cp.right}px ${cp.bottom}px ${cp.left}px`
      const baseCellStyle: React.CSSProperties = {
        padding: cellPadding,
        verticalAlign: "top",
        ...(element.borders ? { border: `${bWidth}px ${bStyle} ${bColor}` } : {}),
      }

      // Tabela flutuante: aplica a largura real e a centralização horizontal em relação à página
      const tableStyle: React.CSSProperties = { marginBottom: "0.75rem", borderCollapse: "collapse", tableLayout: "fixed" }
      tableStyle.marginTop = element.floatY !== undefined ? element.floatY : "0.75rem"
      if (element.tblpCenter && element.tblW) {
        const leftFromPage = Math.round((PAGE_WIDTH_PX - element.tblW) / 2)
        tableStyle.width = element.tblW
        tableStyle.marginLeft = leftFromPage - leftMarginPx
      } else {
        tableStyle.width = element.tblW ?? "100%"
      }

      return (
        <table style={tableStyle}>
          <tbody>
            {element.rows.map((row, ri) => (
              <tr key={ri} style={{ height: row.height }}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} colSpan={cell.colspan} style={{ ...baseCellStyle, width: cell.width, height: row.height, verticalAlign: cell.vAlign ?? "top", overflow: "hidden" }}>
                    {cell.elements.map((el, ei) => <DocxElementRenderer key={ei} element={el} borderColor={borderColor} leftMarginPx={leftMarginPx} inCell />)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    case "image": {
      const alignClass = element.align === "center" ? "flex justify-center" : element.align === "right" ? "flex justify-end" : "flex justify-start"
      const contentWidth = 602
      const scale = element.widthPx && element.widthPx > contentWidth ? contentWidth / element.widthPx : 1
      const displayWidth = element.widthPx ? Math.round(element.widthPx * scale) : undefined
      const displayHeight = element.heightPx ? Math.round(element.heightPx * scale) : undefined
      const crop = element.crop
      let imgNode: React.ReactNode
      if (crop && displayWidth && displayHeight) {
        const visW = Math.max(0.01, 1 - crop.l - crop.r)
        const visH = Math.max(0.01, 1 - crop.t - crop.b)
        const fullW = Math.round(displayWidth / visW)
        const fullH = Math.round(displayHeight / visH)
        imgNode = (
          <div style={{ width: displayWidth, height: displayHeight, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={element.dataUrl} alt="" style={{ display: "block", width: fullW, height: fullH, marginLeft: -Math.round(crop.l * fullW), marginTop: -Math.round(crop.t * fullH), maxWidth: "none" }} />
          </div>
        )
      } else {
        /* eslint-disable-next-line @next/next/no-img-element */
        imgNode = <img src={element.dataUrl} alt="" style={{ display: "block", width: displayWidth, height: displayHeight, maxWidth: "100%" }} />
      }
      return <div className={`${alignClass}${inCell ? "" : " my-1.5"}`}>{imgNode}</div>
    }

    case "heading": {
      const sizeClass = { 1: "text-2xl font-bold", 2: "text-xl font-bold", 3: "text-lg font-semibold", 4: "text-base font-semibold", 5: "text-sm font-semibold", 6: "text-xs font-semibold" }[element.level]
      const alignClass = element.align === "center" ? "text-center" : element.align === "right" ? "text-right" : "text-left"
      return <p className={`${sizeClass} ${alignClass} my-2`}>{element.text}</p>
    }

    case "run": {
      return (
        <p style={{ lineHeight: element.lineSpacing ?? undefined }}>
          {element.runs.map((run, i) => (
            <span key={i} style={{
              fontFamily: run.fontFamily ? fontCss(run.fontFamily) : undefined,
              fontWeight: run.bold ? "bold" : undefined,
              fontStyle: run.italic ? "italic" : undefined,
              textDecoration: run.underline ? "underline" : undefined,
              verticalAlign: run.superscript ? "super" : run.subscript ? "sub" : undefined,
              color: run.color,
              backgroundColor: run.highlight ? HIGHLIGHT_HEX[run.highlight] : undefined,
              fontSize: run.fontSize ? `${run.fontSize}pt` : (run.superscript || run.subscript ? "0.7em" : undefined),
            }}>
              {run.text}
            </span>
          ))}
        </p>
      )
    }

    case "paragraph": {
      if (!element.text) {
        return <div style={{ height: element.height ?? 0, flexShrink: 0 }} />
      }
      const alignClass = element.align === "center" ? "text-center" : element.align === "right" ? "text-right" : "text-left"
      const mt = element.spaceBefore ?? 0
      const mb = element.spaceAfter  ?? 0
      if (element.isFormField) {
        const colonIdx = element.text.indexOf(":")
        const label = colonIdx !== -1 ? element.text.slice(0, colonIdx + 1) : element.text
        return (
          <div className="flex items-baseline gap-2" style={{ marginTop: mt, marginBottom: mb }}>
            <span className="font-semibold whitespace-nowrap">{label}</span>
            <div className={`flex-1 border-b ${borderColor} opacity-60`} />
          </div>
        )
      }
      return (
        <p
          className={`${alignClass} ${element.bold ? "font-bold" : ""} ${element.italic ? "italic" : ""} ${element.underline ? "underline" : ""}`}
          style={{
            marginTop: mt,
            marginBottom: mb,
            lineHeight: element.lineSpacing ?? undefined,
            color: element.color,
            fontSize: element.fontSize ? `${element.fontSize}pt` : (element.superscript || element.subscript ? "0.7em" : undefined),
            fontFamily: element.fontFamily ? fontCss(element.fontFamily) : undefined,
            verticalAlign: element.superscript ? "super" : element.subscript ? "sub" : undefined,
            backgroundColor: element.highlight ? HIGHLIGHT_HEX[element.highlight] : undefined,
          }}
        >
          {element.text}
        </p>
      )
    }

    case "page-break":
      return <div className="border-t border-dashed border-current/20 my-4 text-[10px] text-center opacity-40">quebra de página</div>

    case "column-break":
      return <div className="border-t border-dotted border-current/10 my-2" />

    case "horizontal-rule":
      return <hr className="my-3" style={{ borderColor: element.color ?? "currentColor", borderTopWidth: element.thickness ?? 1, opacity: 0.4 }} />

    case "text-box": {
      const hasBorder = element.borderColor !== undefined || element.borderWidth !== undefined
      const tbStyle: React.CSSProperties = {
        display: "inline-block",
        boxSizing: "border-box",
        width: element.width ? `${element.width}px` : undefined,
        minHeight: element.height ? `${element.height}px` : undefined,
        background: element.background,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize ? `${element.fontSize}pt` : undefined,
        fontWeight: element.bold ? "bold" : undefined,
        fontStyle: element.italic ? "italic" : undefined,
        color: element.color,
        textAlign: element.align as React.CSSProperties["textAlign"],
        padding: "3px 8px",
        margin: "2px 4px 2px 0",
        verticalAlign: "middle",
        ...(hasBorder
          ? {
              borderWidth: element.borderWidth ?? 1,
              borderStyle: element.borderStyle ?? "solid",
              borderColor: element.borderColor,
              borderRadius: element.borderRadius,
            }
          : { border: `1px solid currentColor`, opacity: 0.7 }),
      }
      return <div style={tbStyle}>{element.text || " "}</div>
    }

    case "shape": {
      if (element.shapeType === "triangle") {
        return (
          <div className="my-2" style={{
            width: 0, height: 0,
            borderLeft: "40px solid transparent",
            borderRight: "40px solid transparent",
            borderBottom: `50px solid ${element.fill ?? "currentColor"}`,
          }} />
        )
      }
      const shapeStyle: React.CSSProperties = {
        display: "inline-block",
        width: element.width ?? 80,
        height: element.height ?? 50,
        backgroundColor: element.fill ?? "transparent",
        borderWidth: element.borderWidth ?? 1,
        borderStyle: (element.borderStyle ?? "solid") as React.CSSProperties["borderStyle"],
        borderColor: element.borderColor ?? element.border ?? "currentColor",
        borderRadius: element.shapeType === "circle" ? "50%" : element.borderRadius ? `${element.borderRadius}px` : undefined,
      }
      return <div className="my-2" style={shapeStyle} />
    }

    case "bullet-list":
      return (
        <ul className="list-disc pl-5 my-1.5 flex flex-col gap-0.5">
          {element.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )

    case "numbered-list":
      return (
        <ol className="list-decimal pl-5 my-1.5 flex flex-col gap-0.5" start={element.startAt}>
          {element.items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      )

    case "form-field":
      return (
        <div className="flex items-baseline gap-2 my-2">
          {element.label && <span className="font-semibold whitespace-nowrap">{element.label}:</span>}
          {Array.from({ length: element.lines ?? 1 }).map((_, i) => (
            <div key={i} className={`flex-1 border-b ${borderColor} opacity-60`} />
          ))}
        </div>
      )

    case "checkbox":
      return (
        <div className="flex items-center gap-2 my-1">
          <div className={`w-3.5 h-3.5 border ${borderColor} flex items-center justify-center text-[10px] shrink-0`}>
            {element.checked ? "✓" : ""}
          </div>
          {element.label && <span>{element.label}</span>}
        </div>
      )

    case "table-of-contents":
      return <div className="text-xs opacity-40 italic my-2 p-2 border border-dashed border-current/20">[Sumário]</div>

    case "math":
      return <p className="my-1.5 font-mono italic">{element.formula}</p>

    case "qr-code":
      return (
        <div className="w-20 h-20 border border-current/30 flex items-center justify-center text-[10px] opacity-40 my-2">
          QR
        </div>
      )

    default:
      return null
  }
}

// ─── Questão individual (drag-and-drop + seleção) ─────────────────────────────

interface QuestionItemBaseProps {
  questao: QuestaoItem
  cssLineHeight: number
  borderColor: string
  mutedColor: string
  espacamento: boolean
  textAlignClass: string
  onUpdateQuestao?: (id: string, partial: Partial<QuestaoItem>) => void
}

interface SortableQuestionItemProps extends QuestionItemBaseProps {
  selected: boolean
  onSelect: () => void
}

/** Envolve `QuestionItem` com drag-and-drop (dnd-kit) e seleção por clique. */
function SortableQuestionItem({ questao, selected, onSelect, ...questionItemProps }: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: questao.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      {...attributes}
      {...listeners}
      className={`relative rounded-md outline-none cursor-pointer group ${
        selected ? "ring-2 ring-(--brand)" : ""
      } ${isDragging ? "opacity-50 z-10" : ""}`}
    >
      <DotsSixVerticalIcon
        size={14}
        weight="bold"
        className="absolute -left-4 top-1 opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none"
      />
      <QuestionItem questao={questao} {...questionItemProps} />
    </div>
  )
}

// ─── Imagem redimensionável (alças ao clicar) ─────────────────────────────────

const RESIZE_HANDLES = ["e", "s", "w"] as const
type ResizeHandle = (typeof RESIZE_HANDLES)[number]

const RESIZE_HANDLE_CURSOR: Record<ResizeHandle, string> = {
  s: "cursor-ns-resize",
  e: "cursor-ew-resize",
  w: "cursor-ew-resize",
}

// Âncora fracionária (0–1) de cada alça dentro do retângulo visível da imagem, usada para
// posicionar a alça tanto no ponto médio de cada lado quanto nos cantos.
const RESIZE_HANDLE_ANCHOR: Record<ResizeHandle, { x: number; y: number }> = {
  e: { x: 1, y: 0.5 },
  s: { x: 0.5, y: 1 },
  w: { x: 0, y: 0.5 },
}

interface ResizableImageResize {
  larguraPx: number
  alturaPx: number
  offsetXPx: number
  offsetYPx: number
}

interface ResizableImageProps {
  src: string
  larguraPx: number
  alturaPx: number
  ajuste: QuestaoImagemAjuste
  offsetXPx: number
  offsetYPx: number
  onResize: (novo: ResizableImageResize) => void
}

/**
 * Imagem que, ao ser clicada, mostra uma borda de seleção com alças leste/oeste/sul (sem diagonais)
 * para redimensionar arrastando. Largura e altura são independentes: a alça oeste mantém a borda
 * direita fixa (compensando com offsetXPx), e a altura sempre cresce para baixo a partir do topo.
 */
function ResizableImage({ src, larguraPx, alturaPx, ajuste, offsetXPx, offsetYPx, onResize }: ResizableImageProps) {
  const [selecionada, setSelecionada] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ handle: ResizeHandle; startX: number; startY: number; larguraPx: number; alturaPx: number; offsetXPx: number; offsetYPx: number } | null>(null)

  useEffect(() => {
    if (!selecionada) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelecionada(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [selecionada])

  function handlePointerDown(e: ReactPointerEvent, handle: ResizeHandle) {
    e.stopPropagation()
    e.preventDefault()
    dragState.current = { handle, startX: e.clientX, startY: e.clientY, larguraPx, alturaPx, offsetXPx, offsetYPx }

    function handlePointerMove(ev: PointerEvent) {
      const state = dragState.current
      if (!state) return
      const dx = ev.clientX - state.startX
      const dy = ev.clientY - state.startY
      let novaLargura = state.larguraPx
      let novaAltura = state.alturaPx
      let novoOffsetX = state.offsetXPx

      if (state.handle === "e") {
        novaLargura = Math.min(IMAGEM_LARGURA_MAX, Math.max(IMAGEM_LARGURA_MIN, state.larguraPx + dx))
      } else if (state.handle === "w") {
        novaLargura = Math.min(IMAGEM_LARGURA_MAX, Math.max(IMAGEM_LARGURA_MIN, state.larguraPx - dx))
        novoOffsetX = state.offsetXPx + (state.larguraPx - novaLargura)
      } else if (state.handle === "s") {
        novaAltura = Math.min(IMAGEM_ALTURA_MAX, Math.max(IMAGEM_ALTURA_MIN, state.alturaPx + dy))
      }

      onResize({ larguraPx: novaLargura, alturaPx: novaAltura, offsetXPx: novoOffsetX, offsetYPx: state.offsetYPx })
    }

    function handlePointerUp() {
      dragState.current = null
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      style={{ width: larguraPx, height: alturaPx, marginLeft: offsetXPx, marginTop: offsetYPx }}
      onClick={(e) => { e.stopPropagation(); setSelecionada(true) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: ajuste, display: "block" }}
      />
      {selecionada && (
        <>
          <div className="absolute inset-0 ring-2 ring-(--brand) pointer-events-none" />
          {RESIZE_HANDLES.map((handle) => {
            const anchor = RESIZE_HANDLE_ANCHOR[handle]
            return (
              <div
                key={handle}
                onPointerDown={(e) => handlePointerDown(e, handle)}
                className={`absolute w-2.5 h-2.5 rounded-full bg-(--brand) border border-white ${RESIZE_HANDLE_CURSOR[handle]}`}
                style={{
                  left: `${anchor.x * 100}%`,
                  top: `${anchor.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            )
          })}
        </>
      )}
    </div>
  )
}

// Numeral romano de cada afirmativa de "assercoes-multiplas"  lookup simples (mesmo padrão das
// letras A-F de múltipla escolha via String.fromCharCode), cobre o teto de 5 afirmativas do prompt.
const ROMANOS = ["I", "II", "III", "IV", "V", "VI"]

type QuestionItemProps = QuestionItemBaseProps

/** Renderiza uma questão (enunciado + alternativas/linhas de resposta conforme o tipo, layout e imagem opcionais). */
function QuestionItem({
  questao,
  cssLineHeight,
  borderColor,
  mutedColor,
  espacamento,
  textAlignClass,
  onUpdateQuestao,
}: QuestionItemProps) {
  const isHorizontal = questao.layout === "horizontal"
  const imagem = questao.imagem
  const imagemPosicao = imagem?.posicao ?? "acima-respostas"
  const imagemAlinhamento = imagem?.alinhamento ?? "esquerda"

  const imagemNode = imagem && (
    <ResizableImage
      src={imagem.src}
      larguraPx={imagem.larguraPx ?? IMAGEM_LARGURA_PADRAO}
      alturaPx={imagem.alturaPx ?? IMAGEM_ALTURA_PADRAO}
      ajuste={imagem.ajuste ?? "contain"}
      offsetXPx={imagem.offsetXPx ?? 0}
      offsetYPx={imagem.offsetYPx ?? 0}
      onResize={(novo) => onUpdateQuestao?.(questao.id, { imagem: { ...imagem, ...novo } })}
    />
  )

  // "acima-respostas": a imagem ocupa a largura toda e se alinha à esquerda ou à direita
  const imagemBlocoNode = imagem && (
    <div className={`flex my-2 ${imagemAlinhamento === "direita" ? "justify-end" : "justify-start"}`}>
      {imagemNode}
    </div>
  )

  const enunciadoNode = (
    <p className={`font-medium ${textAlignClass}`} style={{ lineHeight: cssLineHeight }}>
      <span className="font-bold">{questao.numero}.</span>{" "}
      {questao.enunciado}
    </p>
  )

  const respostasNode = (
    <>
      {/* Afirmativas numeradas em romano  só assercoes-multiplas, vêm antes das alternativas que as julgam */}
      {questao.tipo === "assercoes-multiplas" && questao.afirmativas && (
        <div className="mt-3 flex flex-col gap-1.5 pl-5">
          {questao.afirmativas.map((afirmativa, i) => (
            <p key={i}>
              <span className="font-semibold">{ROMANOS[i] ?? i + 1} -</span> {afirmativa}
            </p>
          ))}
        </div>
      )}

      {/* Alternativas de múltipla escolha (e de assercoes-multiplas, que reaproveita o mesmo formato lettrado) */}
      {(questao.tipo === "multipla-escolha" || questao.tipo === "assercoes-multiplas") && questao.opcoes && (
        <div className={`mt-3 flex gap-2.5 pl-5 ${isHorizontal ? "flex-row flex-wrap gap-x-6" : "flex-col"}`}>
          {questao.opcoes.map((opcao, i) => (
            <div key={i} className="flex items-center gap-3">
              <span>
                <span className="font-semibold">{String.fromCharCode(65 + i)})</span> {opcao}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Espaço para resposta dissertativa/matemática  estilo tabela, largura total, mais altura.
          Dissertativo ganha linhas visíveis (borda inferior); matemática só reserva o espaço em
          branco (sem linha), já que o aluno resolve o cálculo livremente no espaço. */}
      {(questao.tipo === "dissertativo" || questao.tipo === "matematica") && (
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {Array.from({ length: questao.numeroLinhas ?? (espacamento ? 4 : 5) }).map((_, i) => (
              <tr key={i} style={{ height: espacamento ? "2.1rem" : "1.8rem" }}>
                <td className={questao.tipo === "dissertativo" ? `border-b ${borderColor} opacity-30` : ""} style={{ padding: 0 }} />
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Verdadeiro ou falso */}
      {questao.tipo === "verdade-falso" && (
        <div className={`flex gap-1 mt-3 pl-5 ${isHorizontal ? "flex-row gap-x-6" : "flex-col"}`}>
          {(["Verdadeiro", "Falso"] as const).map((opcao) => (
            <div key={opcao} className="flex items-center gap-2">
              <span>( )</span>
              <span>{opcao}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )

  // Imagem ao lado da questão: enunciado + respostas ficam juntos numa coluna ao lado da imagem
  if (imagemPosicao === "lado-questao" && imagem) {
    return (
      <div className={`flex gap-4 items-start ${imagemAlinhamento === "direita" ? "flex-row-reverse" : "flex-row"}`}>
        <div className="shrink-0">{imagemNode}</div>
        <div className="flex-1 min-w-0">
          {enunciadoNode}
          {respostasNode}
        </div>
      </div>
    )
  }

  return (
    <div>
      {enunciadoNode}
      {imagemBlocoNode}
      {respostasNode}
    </div>
  )
}

interface GabaritoItemProps {
  questao: QuestaoItem
  cssLineHeight: number
  textAlignClass: string
}

/** Item do modo "gabarito": número + resposta correta (múltipla escolha ganha a letra da alternativa).
 *  Dissertativo/matemática também repetem o enunciado  sem ele a resposta fica sem contexto. */
function GabaritoItem({ questao, cssLineHeight, textAlignClass }: GabaritoItemProps) {
  const resposta = formatarRespostaGabarito(questao)
  const comEnunciado = gabaritoPrecisaDeEnunciado(questao.tipo)

  return (
    <div className={textAlignClass} style={{ lineHeight: cssLineHeight }}>
      <p className="font-medium">
        <span className="font-bold">{questao.numero}.</span> {comEnunciado ? questao.enunciado : resposta}
      </p>
      {comEnunciado && (
        <p className="mt-1">
          <span className="font-semibold">Resposta:</span> {resposta}
        </p>
      )}
    </div>
  )
}
