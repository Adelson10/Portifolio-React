"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ArrowLeftIcon, FileDocIcon, SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react"
import Link from "next/link"
import {
  AnchorLayer,
  computeAnchorAreaHeight,
  computeAnchorsAndFlow,
  DocxElementRenderer,
  PageShell,
  RepeatingHeader,
  RepeatingFooter,
  ANCHOR_LAYER_MARGIN_BOTTOM_PX,
} from "../../atividades/editor/a4-sheet"
import A4Zoom from "../../atividades/editor/a4-zoom"
import { paginateBlocks, type FlowBlock } from "../../atividades/editor/pagination"
import type { DocxElement, ModeloTemplate, PageMargins } from "../../atividades/editor/activity-editor"
import { montarElementosPlano, type PlanoAulaData } from "@/lib/ai/plano-aula-elements"

// Mesma folha A4 e o mesmo motor de paginação/renderização/estilo (modelo .docx enviado no step
// "Estilo") de components/atividades/editor/ (a4-sheet.tsx + pagination.ts)  reaproveitados
// aqui via DocxElement/ModeloTemplate em vez de reimplementados, pra manter o plano de aula
// 100% consistente com o padrão já estabelecido pelas outras telas A4.
const PAGE_WIDTH_PX = 794
const PAGE_HEIGHT_PX = 1123
// Margens do preset ABNT  usadas só quando a atividade não tem modelo de estilo (ver
// `formatting-presets.ts`); com modelo, usamos as margens reais extraídas do .docx enviado.
const MARGENS_PADRAO: PageMargins = { top: 113, bottom: 76, left: 113, right: 76 }
const FONT_FAMILY = "Arial, Arimo, sans-serif"
const FONT_SIZE = "16px"
const LINE_HEIGHT = 1.5
const BORDER_COLOR = "border-[#1a1a1a]"
const PAPER_BG = "bg-white text-[#1a1a1a]"
// DocxElement "run" (usado pelos parágrafos com negrito) não aplica spaceAfter/spaceBefore no
// render  diferente de "paragraph"  então o espaçamento entre blocos é garantido aqui, no
// wrapper de cada bloco, em vez de depender do próprio elemento.
const BLOCK_SPACING_PX = 8

interface PlanoAulaEditorProps {
  turmaId?: string
  atividadeId: string
}

/** Texto corrido (parágrafo/negrito/lista) sai justificado, igual ao padrão ABNT usado por
 *  padrão nas atividades/provas novas (ver `textJustify` em formatting-presets.ts)  títulos
 *  ficam à esquerda como sempre, já que justificar uma linha só não muda nada visualmente mesmo. */
function justificarSeTextoCorrido(element: DocxElement): string {
  return element.type === "paragraph" || element.type === "run" || element.type === "bullet-list" ? "text-justify" : ""
}

/** Tela de visualização/exportação do plano de aula gerado  versão enxuta do `ActivityEditor`
 *  (sem edição/regeneração por seção), reaproveitando a folha A4 paginada de `a4-sheet.tsx` e,
 *  quando a atividade tem um modelo de estilo (.docx enviado no step "Estilo"), o corpo, o
 *  cabeçalho, o rodapé, as margens, a borda e a cor de página desse modelo  igual ao editor de
 *  atividades/provas (o modelo entra como base do documento, com o conteúdo da IA inserido
 *  logo em seguida). */
export default function PlanoAulaEditor({ turmaId, atividadeId }: PlanoAulaEditorProps) {
  const [plano, setPlano] = useState<PlanoAulaData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modeloTemplate, setModeloTemplate] = useState<ModeloTemplate | null>(null)
  const [baixando, setBaixando] = useState(false)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    fetch(`/api/plano-de-aula/${atividadeId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: PlanoAulaData) => setPlano(data))
      .catch(() => setErro("Não foi possível carregar o plano de aula."))
      .finally(() => setCarregando(false))
  }, [atividadeId])

  // Modelo de estilo escolhido no step "Estilo" (se algum foi enviado/selecionado)  mesma rota
  // e mesma condição de "modelo válido" usada pelo ActivityEditor (ver /api/parse-modelo):
  // corpo do docx, cabeçalho ou rodapé já bastam, não precisa dos três.
  useEffect(() => {
    fetch(`/api/parse-modelo?atividadeId=${atividadeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ModeloTemplate | null) => {
        if (data?.elements?.length || data?.header?.length || data?.footer?.elements?.length) {
          setModeloTemplate(data)
        }
      })
      .catch(() => {/* sem modelo de estilo disponível  segue com o padrão ABNT */})
  }, [atividadeId])

  const effectiveMargins = modeloTemplate?.margins ?? MARGENS_PADRAO

  // Separa os elementos POSICIONADOS livremente do modelo (logo, caixa de texto, forma com x/y
  //  comuns em papel timbrado) do fluxo normal de parágrafos, igual ao `A4Sheet` (ver
  // `computeAnchorsAndFlow` em a4-sheet.tsx). Sem essa separação, um elemento posicionado caía
  // no fluxo comum e o `DocxElementRenderer` o renderizava ignorando x/y (essas coordenadas só
  // são respeitadas dentro da `AnchorLayer`)  aparecia esmagado no meio do texto em vez de no
  // lugar certo, diferente do que já acontecia em Atividade/Prova.
  const templateElements = useMemo(() => modeloTemplate?.elements ?? [], [modeloTemplate])
  const { anchorEls, flowEls } = useMemo(() => {
    const resultado = computeAnchorsAndFlow(templateElements)
    // Ao contrário do A4Sheet, não puxamos `anchorBaseEl` (o primeiro parágrafo) pra dentro da
    // AnchorLayer  aquele ajuste usa um deslocamento horizontal fixo (`left: 83`) calibrado pras
    // margens padrão do ActivityEditor, que não necessariamente batem com as do plano de aula (com
    // ou sem modelo). Devolve esse parágrafo pro fluxo normal, onde sempre renderizou certo  só
    // os elementos de fato posicionados (logo/forma/caixa de texto com x/y) vão pra AnchorLayer.
    const flowEls = resultado.anchorBaseEl ? [resultado.anchorBaseEl, ...resultado.flowEls] : resultado.flowEls
    return { anchorEls: resultado.anchorEls, flowEls }
  }, [templateElements])

  // Corpo do modelo primeiro (o arquivo .docx enviado), depois o conteúdo gerado pela IA  mesma
  // ordem do ActivityEditor (modelo como base, conteúdo gerado inserido em seguida).
  const blocos: FlowBlock[] = useMemo(() => {
    if (!plano) return []
    const templateEls = flowEls.map((element, i): FlowBlock => ({ kind: "docx", key: `tpl-${i}`, element }))
    const planoEls = montarElementosPlano(plano).map((element, i): FlowBlock => ({ kind: "docx", key: `el-${i}`, element }))
    return [...templateEls, ...planoEls]
  }, [plano, flowEls])
  const medicaoRefs = useRef<(HTMLDivElement | null)[]>([])
  const headerMeasureRef = useRef<HTMLDivElement>(null)
  const footerMeasureRef = useRef<HTMLDivElement>(null)
  const [paginas, setPaginas] = useState<FlowBlock[][]>([[]])

  useLayoutEffect(() => {
    if (blocos.length === 0) {
      setPaginas([[]])
      return
    }
    const headerH = headerMeasureRef.current?.getBoundingClientRect().height ?? 0
    const footerH = footerMeasureRef.current?.getBoundingClientRect().height ?? 0
    const alturaDisponivel = Math.max(100, PAGE_HEIGHT_PX - headerH - footerH)
    const alturas = medicaoRefs.current.map((el) => el?.getBoundingClientRect().height ?? 0)
    // A AnchorLayer (logo/caixas de texto flutuantes do modelo) só existe na página 1 e não faz
    // parte de `blocos`/`alturas`  sem reservar o espaço dela aqui, a página 1 parecia ter mais
    // espaço livre do que realmente tem e o conteúdo estufava a folha (mesma lógica do A4Sheet).
    const anchorReservadoPx = anchorEls.length > 0 ? computeAnchorAreaHeight(anchorEls) + ANCHOR_LAYER_MARGIN_BOTTOM_PX : 0
    setPaginas(paginateBlocks(blocos, alturas, alturaDisponivel, 0, anchorReservadoPx))
  }, [blocos, modeloTemplate, anchorEls])

  const backHref = turmaId ? `/t/${turmaId}/plano-de-aula` : "/"

  // Regenera o .docx no navegador a partir do que está na tela (modelo de estilo + ABNT), em vez
  // de baixar o arquivo estático gerado uma única vez no servidor (que nunca aplicou o modelo 
  // ver `generate-plano-word.ts`)  mesmo padrão do `handleDownloadWord` do ActivityEditor.
  async function handleDownloadWord() {
    if (!plano || baixando) return
    setBaixando(true)
    try {
      const { generatePlanoAulaWordBlob } = await import("./generate-plano-word")
      const blob = await generatePlanoAulaWordBlob(plano, modeloTemplate)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "plano-de-aula.docx"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
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
          <span className="flex-1 min-w-0 text-sm font-semibold truncate">{plano?.titulo ?? "Plano de aula"}</span>
          <button
            type="button"
            onClick={handleDownloadWord}
            disabled={!plano || baixando}
            className={`ml-auto flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed ${
              plano && !baixando
                ? "border-(--secundary) hover:bg-(--secundary)"
                : "border-(--secundary) opacity-40"
            }`}
          >
            {baixando ? <SpinnerGapIcon size={14} className="animate-spin" /> : <FileDocIcon size={14} />}
            {baixando ? "Gerando..." : "Baixar Word"}
          </button>
        </div>

        {/* Área rolável com a(s) folha(s) A4 */}
        <div className="flex-1 overflow-auto bg-(--bg-a4) py-10 px-6">
          <div className="w-full relative">
            {carregando && (
              <div
                className="mx-auto bg-white shadow-xl flex items-center justify-center"
                style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX, maxWidth: "100%" }}
              >
                <SpinnerGapIcon size={28} className="animate-spin text-(--brand)" />
              </div>
            )}

            {erro && !carregando && (
              <div
                className="mx-auto bg-white shadow-xl flex flex-col items-center justify-center gap-3 text-center px-8"
                style={{ width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX, maxWidth: "100%" }}
              >
                <WarningCircleIcon size={28} className="text-red-400" />
                <p className="text-sm text-(--foreground)/60">{erro}</p>
              </div>
            )}

            {plano && !carregando && !erro && (
              <>
                {/* Camada invisível de medição  nunca display:none (zeraria a altura). Mesma
                    técnica de a4-sheet.tsx: mede o cabeçalho, o rodapé e cada bloco pra decidir
                    onde cada página termina. */}
                <div style={{ position: "fixed", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }} aria-hidden>
                  <div style={{ width: PAGE_WIDTH_PX, fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT }}>
                    <div ref={headerMeasureRef}>
                      <RepeatingHeader templateHeader={modeloTemplate?.header} headerStyle={modeloTemplate?.headerStyle} borderColor={BORDER_COLOR} effectiveMargins={effectiveMargins} />
                    </div>
                    <div ref={footerMeasureRef}>
                      <RepeatingFooter templateFooter={modeloTemplate?.footer} pageNumber={1} borderColor={BORDER_COLOR} effectiveMargins={effectiveMargins} />
                    </div>
                  </div>
                  <div style={{ width: PAGE_WIDTH_PX - effectiveMargins.left - effectiveMargins.right, fontFamily: FONT_FAMILY, fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT }}>
                    {blocos.map((bloco, i) => (
                      <div
                        key={bloco.key}
                        ref={(el) => { medicaoRefs.current[i] = el }}
                        className={bloco.kind === "docx" ? justificarSeTextoCorrido(bloco.element) : ""}
                        style={{ display: "flow-root", paddingBottom: BLOCK_SPACING_PX }}
                      >
                        {bloco.kind === "docx" && <DocxElementRenderer element={bloco.element} borderColor={BORDER_COLOR} leftMarginPx={effectiveMargins.left} />}
                      </div>
                    ))}
                  </div>
                </div>

                <A4Zoom>
                  <div className="flex flex-col gap-6">
                    {paginas.map((blocosDaPagina, pageIndex) => (
                      <PageShell
                        key={pageIndex}
                        hasBorder={!!modeloTemplate?.hasBorder}
                        pageBorder={modeloTemplate?.pageBorder}
                        altoContraste={false}
                        paperBg={PAPER_BG}
                        fontFamily={FONT_FAMILY}
                        fontSize={FONT_SIZE}
                        lineHeight={LINE_HEIGHT}
                        pageBackground={modeloTemplate?.pageBackground}
                        contentPaddingLeft={effectiveMargins.left}
                        contentPaddingRight={effectiveMargins.right}
                        header={<RepeatingHeader templateHeader={modeloTemplate?.header} headerStyle={modeloTemplate?.headerStyle} borderColor={BORDER_COLOR} effectiveMargins={effectiveMargins} />}
                        footer={<RepeatingFooter templateFooter={modeloTemplate?.footer} pageNumber={pageIndex + 1} borderColor={BORDER_COLOR} effectiveMargins={effectiveMargins} />}
                      >
                        {pageIndex === 0 && anchorEls.length > 0 && (
                          <AnchorLayer anchorEls={anchorEls} anchorBaseEl={null} borderColor={BORDER_COLOR} leftMarginPx={effectiveMargins.left} />
                        )}
                        {blocosDaPagina.map((bloco) => (
                          <div
                            key={bloco.key}
                            className={bloco.kind === "docx" ? justificarSeTextoCorrido(bloco.element) : ""}
                            style={{ display: "flow-root", paddingBottom: BLOCK_SPACING_PX }}
                          >
                            {bloco.kind === "docx" && <DocxElementRenderer element={bloco.element} borderColor={BORDER_COLOR} leftMarginPx={effectiveMargins.left} />}
                          </div>
                        ))}
                      </PageShell>
                    ))}
                  </div>
                </A4Zoom>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
