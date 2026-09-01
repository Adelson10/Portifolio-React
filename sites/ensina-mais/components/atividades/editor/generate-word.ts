import {
  Document,
  Header,
  HeadingLevel,
  HeightRule,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
  PageNumber,
  Footer,
  PageBorderOffsetFrom,
  TableAnchorType,
  RelativeHorizontalPosition,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  TextWrappingSide,
  WpsShapeRun,
  BuilderElement,
} from "docx"
import type { AtividadeConfig, DocxElement, BorderSide, ModeloTemplate } from "./activity-editor"
import {
  IMAGEM_LARGURA_PADRAO,
  IMAGEM_ALTURA_PADRAO,
  formatarRespostaGabarito,
  gabaritoPrecisaDeEnunciado,
  questaoComAlternativasReduzidas,
  type QuestaoItem,
  type QuestaoImagem,
  type QuestaoImagemAlinhamento,
} from "./mock-questoes"
import { getPreset, getPresetMargins, getPresetFontSize } from "./formatting-presets"
import { resolverCodigosBNCC, type HabilidadeBNCC } from "@/lib/bncc/api-bncc-dev"

/* ─── Correção da geometria da forma (shape) ─────────────────── */
// O WpsShapeRun fixa prst="rect" no PresetGeometry. Aqui percorremos a árvore
// interna de XmlComponent (rootKey é propriedade pública de runtime) para trocar
// o atributo prst e injetar os valores de ajuste do roundRect quando necessário.

function findByRootKey(node: unknown, key: string): Record<string, unknown> | null {
  if (!node || typeof node !== "object") return null
  const n = node as Record<string, unknown>
  if (n["rootKey"] === key) return n
  if (Array.isArray(n["root"])) {
    for (const child of n["root"] as unknown[]) {
      const found = findByRootKey(child, key)
      if (found) return found
    }
  }
  return null
}

function patchShapeGeometry(
  shapeRun: WpsShapeRun,
  shapeType: "rectangle" | "circle" | "triangle",
  borderRadius?: number,
  width?: number,
  height?: number,
): void {
  const prst =
    shapeType === "circle" ? "ellipse" :
    shapeType === "triangle" ? "triangle" :
    borderRadius ? "roundRect" : "rect"

  if (prst === "rect") return

  // Percorre a árvore interna da lib docx (rootKey é propriedade pública de runtime).
  // Se a estrutura mudar em updates da lib, o patch simplesmente não se aplica  o shape
  // renderiza como rect em vez de crashar.
  try {
    const prstGeomNode = findByRootKey(shapeRun, "a:prstGeom")
    if (!prstGeomNode) return

    const rootArr = prstGeomNode["root"] as unknown[]

    // root[0] = PresetGeometryAttributes; seu .root é o objeto de configuração simples { prst: "rect" }
    const attrsNode = rootArr[0] as Record<string, unknown>
    if (attrsNode?.["root"] && typeof attrsNode["root"] === "object") {
      (attrsNode["root"] as Record<string, string>)["prst"] = prst
    }

    // roundRect: adiciona <a:gd name="adj" fmla="val N"/> ao a:avLst (root[1])
    if (prst === "roundRect" && borderRadius !== undefined && width && height) {
      const adjVal = Math.min(100000, Math.round((borderRadius / Math.min(width, height)) * 100000))
      const avLst = rootArr[1] as Record<string, unknown>
      if (avLst && Array.isArray(avLst["root"])) {
        ;(avLst["root"] as unknown[]).push(
          new BuilderElement<{ name: string; fmla: string }>({
            name: "a:gd",
            attributes: {
              name: { key: "name", value: "adj" },
              fmla: { key: "fmla", value: `val ${adjVal}` },
            },
          })
        )
      }
    }
  } catch {
    // Falha silenciosa  o shape exporta como rect, sem crashar o .docx inteiro
  }
}

/* ─── Auxiliares de borda ────────────────────────────────────── */

/** Converte um BorderSide (usado no editor) para o formato de borda esperado pela lib docx. */
function sideToDocxBorder(side?: BorderSide) {
  if (!side) return undefined
  const styleMap: Record<string, (typeof BorderStyle)[keyof typeof BorderStyle]> = {
    solid: BorderStyle.SINGLE, double: BorderStyle.DOUBLE,
    dashed: BorderStyle.DASHED, dotted: BorderStyle.DOTTED,
  }
  return {
    style: styleMap[side.style ?? "solid"] ?? BorderStyle.SINGLE,
    // width: armazenado em px no BorderSide; o docx espera oitavos de ponto (sz)
    size: side.width !== undefined ? Math.round(side.width * 72 / 96 * 8) : 6,
    color: (side.color ?? "#000000").replace("#", ""),
    // space: armazenado em px no BorderSide; o w:space do docx espera pontos
    space: side.space !== undefined ? Math.round(side.space * 72 / 96) : 24,
  }
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }

function noBorders() {
  return { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }
}

function bottomLine(color = "AAAAAA") {
  return {
    top: NO_BORDER,
    left: NO_BORDER,
    right: NO_BORDER,
    bottom: { style: BorderStyle.SINGLE, size: 4, color },
  }
}

function spacer(before = 0, after = 120) {
  return { before, after }
}

function answerLine(indentLeft = 360) {
  return new Paragraph({
    indent: { left: indentLeft },
    spacing: { before: 60, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BBBBBB" } },
    children: [],
  })
}


/* ─── Contexto de formatação derivado do preset selecionado ─── */

export interface DocxFormatCtx {
  font: string   // ex.: "Arial", "Times New Roman"
  size: number   // meio-pontos: 24 = 12pt, 22 = 11pt
  lineRule: number         // 240 = simples, 360 = 1.5×, 480 = duplo
  align: typeof AlignmentType[keyof typeof AlignmentType]
}

/* ─── Converte elementos do template docx em children da docx-js ─── */

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
} as const

/** Borda inferior (em px, relativa ao topo do corpo) de um elemento âncora  mesma fórmula de
 *  `rowHeight` usada em app/api/parse-modelo/route.ts pra acumular `anchorRowY`, o que faz o
 *  valor aqui reconstruir exatamente a altura de linha que o parser original assumiu pra cada
 *  grupo de anchors (ver `flushAnchorGroup`/`anchorBaselinePx` abaixo). */
function anchorBottomPx(el: DocxElement): number {
  if (el.type === "text-box") {
    const hasBorder = (el.borderWidth ?? 0) > 0
    return el.y + el.height + (hasBorder ? 10 : 0)
  }
  if (el.type === "shape" && el.y !== undefined) {
    return el.y + (el.height ?? 0) + (el.borderWidth ?? 0) * 2
  }
  if (el.type === "image" && el.y !== undefined) {
    if ((el as { behindDoc?: boolean }).behindDoc) return 0 // atrás do texto  não empurra o fluxo
    return el.y + (el.heightPx ?? 0)
  }
  return 0
}

// Retorna o(s) Run(s) flutuante(s) para elementos âncora (imagem/text-box com posição absoluta).
// Usado pela lógica de agrupamento de parágrafos para combinar vários anchors do mesmo
// parágrafo de origem em um único <w:p>, preservando a estrutura original do MODELO.
function buildDocxAnchorRun(el: DocxElement): (ImageRun | WpsShapeRun)[] {
  if (el.type === "image" && el.x !== undefined && el.y !== undefined) {
    const pxToEmu = (px: number) => Math.round(px * 9525)
    const base64 = el.dataUrl.split(",")[1] ?? ""
    const mimeType = el.dataUrl.split(";")[0].split("/")[1] ?? "png"
    const type = (mimeType === "jpeg" ? "jpg" : mimeType) as "png" | "jpg" | "gif"
    const rawWrap = (el as { wrapType?: string }).wrapType ?? "none"
    const wrapTypeVal =
      rawWrap === "square" || rawWrap === "tight" ? TextWrappingType.SQUARE :
      rawWrap === "topAndBottom" ? TextWrappingType.TOP_AND_BOTTOM :
      TextWrappingType.NONE
    return [new ImageRun({
      data: Buffer.from(base64, "base64"),
      transformation: { width: el.widthPx ?? 300, height: el.heightPx ?? 100 },
      type,
      floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: pxToEmu(el.x) },
        verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: pxToEmu(el.y) },
        wrap: { type: wrapTypeVal, side: TextWrappingSide.BOTH_SIDES },
        behindDocument: (el as { behindDoc?: boolean }).behindDoc ?? false,
        zIndex: (el as { relativeHeight?: number }).relativeHeight,
      },
    })]
  }
  if (el.type === "shape" && el.x !== undefined && el.y !== undefined && el.width && el.height) {
    const pxToEmu = (px: number) => Math.round(px * 9525)
    // borderStyle sempre é definido quando existe uma borda (mesmo com cor/largura padrão),
    // por isso é incluído na verificação para não perder bordas sem cor ou largura explícitas.
    const hasBorder = !!(el.borderColor || el.borderWidth || el.borderStyle)
    const bColorStr = el.borderColor ? el.borderColor.replace("#", "") : "000000"
    const shapeRun = new WpsShapeRun({
      type: "wps",
      transformation: { width: el.width, height: el.height },
      children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [] })],
      bodyProperties: {},
      ...(hasBorder ? {
        outline: {
          width: Math.round((el.borderWidth ?? 1) * 9525),
          ...(el.borderStyle === "double" ? { compoundLine: "DOUBLE" as const } : {}),
          type: "solidFill" as const,
          solidFillType: "rgb" as const,
          value: bColorStr,
        },
        ...(el.fill ? { solidFill: { type: "rgb" as const, value: el.fill.replace("#", "") } } : {}),
      } : el.fill ? {
        solidFill: { type: "rgb" as const, value: el.fill.replace("#", "") },
      } : {
        // Sem preenchimento e sem borda: o ShapeProperties só adiciona <a:noFill/> quando existe
        // outline, então usamos um outline invisível (traço zero) para forçar corpo transparente no Word.
        outline: { width: 1, type: "noFill" as const },
      }),
      floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: pxToEmu(el.x) },
        verticalPosition: { relative: VerticalPositionRelativeFrom.MARGIN, offset: pxToEmu(el.y) },
        wrap: { type: TextWrappingType.NONE },
        allowOverlap: true,
        behindDocument: false,
        zIndex: el.relativeHeight,
      },
    })
    patchShapeGeometry(shapeRun, el.shapeType, el.borderRadius, el.width, el.height)
    return [shapeRun]
  }
  if (el.type === "text-box" && el.x !== undefined && el.y !== undefined) {
    const pxToEmu = (px: number) => Math.round(px * 9525)
    const hasBorder = !!(el.borderColor || el.borderWidth)
    const bColorStr = el.borderColor ? el.borderColor.replace("#", "") : "000000"
    const padHEmu = hasBorder ? pxToEmu(el.paddingH ?? 9.6) : 0
    const padVEmu = hasBorder ? pxToEmu(el.paddingV ?? 4.8) : 0
    const align = el.align === "center" ? AlignmentType.CENTER : el.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT
    const tbRun = new WpsShapeRun({
      type: "wps",
      transformation: { width: el.width, height: el.height },
      children: [new Paragraph({
        alignment: align,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({
          text: el.text || " ",
          font: el.fontFamily ?? "Arial",
          size: el.fontSize ? el.fontSize * 2 : 22,
          bold: el.bold,
          italics: el.italic,
          color: el.color ? el.color.replace("#", "") : undefined,
        })],
      })],
      bodyProperties: { margins: { left: padHEmu, right: padHEmu, top: padVEmu, bottom: padVEmu } },
      ...(hasBorder ? {
        outline: { width: Math.round((el.borderWidth ?? 1) * 9525), type: "solidFill" as const, solidFillType: "rgb" as const, value: bColorStr },
        ...(el.background ? { solidFill: { type: "rgb" as const, value: el.background.replace("#", "") } } : {}),
      } : {
        solidFill: { type: "rgb" as const, value: el.background ? el.background.replace("#", "") : "FFFFFF" },
      }),
      floating: {
        horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, offset: pxToEmu(el.x) },
        verticalPosition: { relative: VerticalPositionRelativeFrom.MARGIN, offset: pxToEmu(el.y) },
        wrap: { type: TextWrappingType.NONE },
        allowOverlap: true,
        behindDocument: false,
        zIndex: el.relativeHeight,
      },
    })
    patchShapeGeometry(tbRun, "rectangle", el.borderRadius, el.width, el.height)
    return [tbRun]
  }
  return []
}

const DEFAULT_CTX: DocxFormatCtx = { font: "Arial", size: 22, lineRule: 240, align: AlignmentType.LEFT }

/** `forceAlign`: sobrescreve o alinhamento de paragraph/run/bullet-list quando o elemento não
 *  define o seu próprio (`el.align`)  usado pelo Plano de Aula pra justificar o conteúdo gerado
 *  pela IA (mesmo critério do `justificarSeTextoCorrido` na prévia em tela, ver
 *  `generate-plano-word.ts`). `undefined` (padrão) preserva o comportamento de sempre: elementos
 *  do MODELO nunca são forçados a um alinhamento que não tinham no docx original. */
export function elementToDocxChildren(
  el: DocxElement,
  inCell = false,
  ctx: DocxFormatCtx = DEFAULT_CTX,
  forceAlign?: typeof AlignmentType[keyof typeof AlignmentType]
): (Paragraph | Table)[] {
  switch (el.type) {

    case "image": {
      const base64 = el.dataUrl.split(",")[1] ?? ""
      const mimeType = el.dataUrl.split(";")[0].split("/")[1] ?? "png"
      const type = (mimeType === "jpeg" ? "jpg" : mimeType) as "png" | "jpg" | "gif"
      const align = el.align === "center" ? AlignmentType.CENTER : el.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT

      // Dimensões visíveis  já consideram o corte (widthPx/heightPx = tamanho exibido)
      const imgW = el.widthPx ?? 300
      const imgH = el.heightPx ?? 100

      // Imagem ancorada (com posição absoluta) → usa flutuante
      if (el.x !== undefined && el.y !== undefined) {
        const runs = buildDocxAnchorRun(el)
        return [new Paragraph({ spacing: { before: 0, after: 0 }, children: runs })]
      }

      // Imagem inline (fluxo normal)
      return [new Paragraph({
        alignment: align,
        spacing: spacer(0, 80),
        children: [new ImageRun({ data: Buffer.from(base64, "base64"), transformation: { width: imgW, height: imgH }, type })],
      })]
    }

    case "heading": {
      const align = el.align === "center" ? AlignmentType.CENTER : el.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT
      return [new Paragraph({
        heading: HEADING_MAP[el.level],
        alignment: align,
        spacing: spacer(160, 80),
        children: [new TextRun({ text: el.text, font: ctx.font })],
      })]
    }

    case "run": {
      const pxToTw = (px: number) => Math.round(px * 1440 / 96)
      return [new Paragraph({
        alignment: forceAlign,
        spacing: {
          ...(el.lineSpacing && el.lineSpacing !== 1 && { line: Math.round(240 * el.lineSpacing), lineRule: "auto" as const }),
        },
        children: el.runs.map(run => new TextRun({
          text: run.text,
          bold: run.bold,
          italics: run.italic,
          underline: run.underline ? {} : undefined,
          subScript: run.subscript,
          superScript: run.superscript,
          highlight: run.highlight,
          color: run.color?.replace("#", ""),
          size: run.fontSize ? run.fontSize * 2 : ctx.size,
          font: run.fontFamily ?? ctx.font,
          characterSpacing: run.characterSpacing,
        })),
      })]
    }

    case "paragraph": {
      if (!el.text) {
        return [new Paragraph({ spacing: { before: 0, after: el.height ? Math.round(el.height * 1440 / 96) : 0 }, children: [] })]
      }
      const align = el.align === "center" ? AlignmentType.CENTER : el.align === "right" ? AlignmentType.RIGHT : (forceAlign ?? AlignmentType.LEFT)
      const font = el.fontFamily ?? ctx.font
      const pxToTw = (px: number) => Math.round(px * 1440 / 96)
      if (el.isFormField) {
        const colonIdx = el.text.indexOf(":")
        const label = colonIdx !== -1 ? el.text.slice(0, colonIdx + 1) + " " : el.text + " "
        return [new Paragraph({
          children: [
            new TextRun({ text: label, font, size: ctx.size }),
            new TextRun({ text: "_".repeat(60), font, size: ctx.size }),
          ],
        })]
      }
      return [new Paragraph({
        alignment: align,
        spacing: {
          before: el.spaceBefore !== undefined ? pxToTw(el.spaceBefore) : (inCell ? 0 : 40),
          after:  el.spaceAfter  !== undefined ? pxToTw(el.spaceAfter)  : (inCell ? 0 : 60),
          ...(el.lineSpacing && el.lineSpacing !== 1 && { line: Math.round(240 * el.lineSpacing), lineRule: "auto" as const }),
        },
        children: [new TextRun({
          text: el.text,
          bold: el.bold ?? false,
          italics: el.italic,
          underline: el.underline ? {} : undefined,
          subScript: el.subscript,
          superScript: el.superscript,
          highlight: el.highlight,
          color: el.color?.replace("#", ""),
          size: el.fontSize ? el.fontSize * 2 : ctx.size,
          font,
          characterSpacing: el.characterSpacing,
        })],
      })]
    }

    case "table": {
      const styleMap: Record<string, (typeof BorderStyle)[keyof typeof BorderStyle]> = {
        solid: BorderStyle.SINGLE, double: BorderStyle.DOUBLE,
        dashed: BorderStyle.DASHED, dotted: BorderStyle.DOTTED,
      }
      const bStyle = styleMap[el.borderStyle ?? "solid"] ?? BorderStyle.SINGLE
      const bSize = el.borderWidth ? Math.max(1, Math.round(el.borderWidth / 96 * 72 * 8)) : 4
      const bColor = el.borderColor ? el.borderColor.replace("#", "") : "000000"
      const border = el.borders ? { style: bStyle, size: bSize, color: bColor } : NO_BORDER

      // Tabela flutuante: largura em DXA e posicionamento flutuante
      const tableWidth = el.tblW
        ? { size: Math.round(el.tblW * 1440 / 96), type: WidthType.DXA }
        : { size: 100, type: WidthType.PERCENTAGE }

      const float = (el.tblpCenter || el.floatY !== undefined)
        ? {
            horizontalAnchor: TableAnchorType.MARGIN,
            relativeHorizontalPosition: el.tblpCenter ? RelativeHorizontalPosition.CENTER : undefined,
            verticalAnchor: TableAnchorType.TEXT,
            absoluteVerticalPosition: el.floatY !== undefined ? Math.round(el.floatY * 1440 / 96) : undefined,
            leftFromText:  el.floatLeftFromText  ?? 0,
            rightFromText: el.floatRightFromText ?? 0,
          }
        : undefined

      const pxToDxa = (px: number) => Math.round(px * 15)
      const cellMargins = el.cellPad ? {
        marginUnitType: WidthType.DXA,
        top:    pxToDxa(el.cellPad.top),
        bottom: pxToDxa(el.cellPad.bottom),
        left:   pxToDxa(el.cellPad.left),
        right:  pxToDxa(el.cellPad.right),
      } : undefined

      // Layout fixo + grade de colunas (equivale ao tableLayout:"fixed" do a4-sheet)
      const firstRow = el.rows[0]
      const allHaveWidth = firstRow?.cells.every(c => c.width !== undefined)
      const columnWidths = allHaveWidth && firstRow
        ? firstRow.cells.flatMap(c => Array.from({ length: c.colspan ?? 1 }, () => pxToDxa(c.width ?? 0)))
        : undefined

      return [new Table({
        width: tableWidth,
        layout: "fixed" as const,
        ...(columnWidths && { columnWidths }),
        ...(float && { float }),
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
        rows: el.rows.map(row => new TableRow({
          // Só aplica altura fixa quando o MODELO pediu explicitamente (heightRule vindo do
          // parser)  sem isso a linha some do <w:trHeight> e o Word ajusta ao conteúdo,
          // igual ao comportamento "auto" original (ver comentário em parseTableXml).
          ...(row.height !== undefined && row.heightRule
            ? { height: { value: Math.round(row.height * 1440 / 96), rule: row.heightRule === "exact" ? HeightRule.EXACT : HeightRule.ATLEAST } }
            : {}),
          children: row.cells.map(cell => new TableCell({
            columnSpan: cell.colspan,
            borders: el.borders ? { top: border, bottom: border, left: border, right: border } : noBorders(),
            width: cell.width ? { size: Math.round(cell.width * 1440 / 96), type: WidthType.DXA } : undefined,
            margins: cellMargins,
            verticalAlign: cell.vAlign as "top" | "center" | "bottom" | undefined,
            // Paragraph E Table  uma célula pode conter uma tabela aninhada (ex.: grid de
            // VALOR/NOTA dentro da célula de cabeçalho); filtrar só Paragraph descartava
            // silenciosamente qualquer tabela aninhada ao exportar.
            children: cell.elements.flatMap(e => elementToDocxChildren(e, true, ctx)).filter((c): c is Paragraph | Table => c instanceof Paragraph || c instanceof Table),
          })),
        })),
      })]
    }

    case "bordered-section": {
      const inner = el.elements.flatMap(e => elementToDocxChildren(e, true, ctx)).filter((c): c is Paragraph | Table => c instanceof Paragraph || c instanceof Table)
      if (inner.length === 0) return []
      const border = { style: BorderStyle.SINGLE, size: 4, color: "000000" }
      return [new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows: [new TableRow({ children: [new TableCell({ borders: noBorders(), children: inner })] })],
      })]
    }

    case "bullet-list":
      return el.items.map(item => new Paragraph({
        alignment: forceAlign,
        bullet: { level: el.indent ?? 0 },
        spacing: spacer(20, 40),
        children: [new TextRun({ text: item, font: ctx.font, size: ctx.size })],
      }))

    case "numbered-list":
      return el.items.map((item, i) => new Paragraph({
        indent: { left: 360 },
        spacing: spacer(20, 40),
        children: [new TextRun({ text: `${(el.startAt ?? 1) + i}. ${item}`, font: ctx.font, size: ctx.size })],
      }))

    case "horizontal-rule": {
      const color = el.color?.replace("#", "") ?? "888888"
      const size = Math.max(6, Math.round((el.thickness ?? 1) * 8))
      return [new Paragraph({
        spacing: spacer(80, 80),
        border: { bottom: { style: BorderStyle.SINGLE, size, color, space: 1 } },
        children: [new TextRun({ text: " ", font: ctx.font, size: ctx.size })],
      })]
    }

    case "form-field": {
      const label = el.label ? el.label + ": " : ""
      const line = "_".repeat(el.lineLength ?? 60)
      // Sem spacing  igual ao original no DOCX (parágrafos sem <w:pPr>)
      return [new Paragraph({
        children: [
          ...(label ? [new TextRun({ text: label, font: ctx.font, size: ctx.size })] : []),
          new TextRun({ text: line, font: ctx.font, size: ctx.size }),
        ],
      })]
    }

    case "checkbox":
      return [new Paragraph({
        spacing: spacer(40, 40),
        children: [
          new TextRun({ text: el.checked ? "☑  " : "☐  ", font: ctx.font, size: ctx.size }),
          ...(el.label ? [new TextRun({ text: el.label, font: ctx.font, size: ctx.size })] : []),
        ],
      })]

    case "text-box": {
      // Text-box posicionado: exporta como forma flutuante wps:wsp, preservando a estrutura original do MODELO
      if (el.x !== undefined && el.y !== undefined) {
        const runs = buildDocxAnchorRun(el)
        return [new Paragraph({ spacing: { before: 0, after: 0 }, children: runs })]
      }

      // Text-box inline (sem posicionamento) → parágrafo com borda
      const bColorStr = el.borderColor ? el.borderColor.replace("#", "") : "000000"
      const bSize = el.borderWidth ? Math.max(1, Math.round(el.borderWidth / 96 * 72 * 8)) : 4
      const bStyleVal = el.borderStyle === "dashed" ? BorderStyle.DASHED : el.borderStyle === "dotted" ? BorderStyle.DOTTED : el.borderStyle === "double" ? BorderStyle.DOUBLE : BorderStyle.SINGLE
      const border = { style: bStyleVal, size: bSize, color: bColorStr }
      return [new Paragraph({
        spacing: spacer(60, 60),
        border: { top: border, bottom: border, left: border, right: border },
        children: [new TextRun({
          text: el.text || " ",
          font: el.fontFamily ?? ctx.font,
          size: el.fontSize ? el.fontSize * 2 : ctx.size,
          bold: el.bold,
          italics: el.italic,
          color: el.color ? el.color.replace("#", "") : undefined,
        })],
      })]
    }

    case "page-break":
      return [new Paragraph({ children: [new PageBreak()] })]

    case "column-break":
      return [new Paragraph({ spacing: spacer(0, 80), children: [] })]

    case "math":
      return [new Paragraph({
        spacing: spacer(40, 60),
        children: [new TextRun({ text: el.formula, italics: true, font: "Cambria Math", size: ctx.size })],
      })]

    case "table-of-contents":
      return [new Paragraph({
        spacing: spacer(40, 60),
        children: [new TextRun({ text: "[Sumário]", italics: true, color: "AAAAAA", font: ctx.font, size: ctx.size })],
      })]

    case "qr-code":
      return [new Paragraph({
        spacing: spacer(40, 60),
        children: [new TextRun({ text: `[QR: ${el.value}]`, color: "AAAAAA", font: ctx.font, size: ctx.size })],
      })]

    case "section":
      return el.elements.flatMap(e => elementToDocxChildren(e, inCell, ctx))

    // header e footer são tratados no nível do documento
    case "header":
    case "footer":
    case "paragraph-boundary":
      return []

    case "shape": {
      const shapeLabel = el.shapeType === "circle" ? "●" : el.shapeType === "triangle" ? "▲" : "■"
      const shapeColor = el.fill ? el.fill.replace("#", "") : (el.borderColor ? el.borderColor.replace("#", "") : "AAAAAA")
      return [new Paragraph({
        spacing: spacer(40, 40),
        children: [new TextRun({ text: shapeLabel, color: shapeColor, font: ctx.font, size: el.height ? Math.round(el.height * 1.5) : 44 })],
      })]
    }

    default:
      return []
  }
}

/* ─── Tabela de dados do aluno (fallback, sem template) ──────── */

/** Monta a tabela padrão com os campos do aluno (Nome, Data, Turma etc.) quando não há modelo. */
function makeInfoTable(ctx: DocxFormatCtx) {
  const FIELDS: [string, string][] = [
    ["Nome:", ""], ["Data:", "short"],
    ["Turma:", ""], ["Nº:", "short"],
    ["Professor(a):", ""], ["Nota:", "short"],
  ]
  const pairs: [string, string, string, string][] = [
    [FIELDS[0][0], FIELDS[0][1], FIELDS[1][0], FIELDS[1][1]],
    [FIELDS[2][0], FIELDS[2][1], FIELDS[3][0], FIELDS[3][1]],
    [FIELDS[4][0], FIELDS[4][1], FIELDS[5][0], FIELDS[5][1]],
  ]

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
      insideHorizontal: NO_BORDER, insideVertical: NO_BORDER,
    },
    rows: pairs.map(([label1, w1, label2, w2]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE }, borders: noBorders(),
            children: [new Paragraph({ spacing: spacer(0, 160), children: [new TextRun({ text: label1, bold: true, font: ctx.font, size: ctx.size })] })],
          }),
          new TableCell({
            width: { size: w1 === "short" ? 18 : 36, type: WidthType.PERCENTAGE }, borders: bottomLine(),
            children: [new Paragraph({ spacing: spacer(0, 160), children: [] })],
          }),
          new TableCell({
            width: { size: 4, type: WidthType.PERCENTAGE }, borders: noBorders(),
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE }, borders: noBorders(),
            children: [new Paragraph({ spacing: spacer(0, 160), children: [new TextRun({ text: label2, bold: true, font: ctx.font, size: ctx.size })] })],
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE }, borders: bottomLine(),
            children: [new Paragraph({ spacing: spacer(0, 160), children: [] })],
          }),
        ],
      })
    ),
  })
}

/* ─── Imagem da questão (QuestaoImagem) ──────────────────────────── */

/** Carrega as dimensões naturais (px) de uma imagem  necessário pra replicar object-fit no .docx. */
function loadImageNaturalSize(src: string): Promise<{ w: number; h: number } | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

/** Recorta (via Canvas) o centro da imagem na proporção da caixa  equivalente ao object-fit: cover. */
function coverCropDataUrl(dataUrl: string, naturalW: number, naturalH: number, boxW: number, boxH: number): Promise<string> {
  if (typeof window === "undefined") return Promise.resolve(dataUrl)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const targetAspect = boxW / boxH
      const srcAspect = naturalW / naturalH
      let srcW = naturalW, srcH = naturalH, srcX = 0, srcY = 0
      if (srcAspect > targetAspect) {
        srcW = Math.round(naturalH * targetAspect)
        srcX = Math.round((naturalW - srcW) / 2)
      } else {
        srcH = Math.round(naturalW / targetAspect)
        srcY = Math.round((naturalH - srcH) / 2)
      }
      const canvas = document.createElement("canvas")
      canvas.width = boxW
      canvas.height = boxH
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, boxW, boxH)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

interface QuestaoImagemResolvida {
  dataUrl: string
  type: "png" | "jpg" | "gif"
  width: number
  height: number
}

/**
 * Resolve a imagem de uma questão para bytes + dimensões finais prontas pro ImageRun, replicando
 * o "ajuste" (object-fit) do editor: fill estica pra caixa, cover recorta o centro (via Canvas),
 * contain/scale-down mantêm a proporção natural encaixando na caixa  igual ao A4Sheet/sidebar.
 */
async function resolveQuestaoImagem(imagem: QuestaoImagem): Promise<QuestaoImagemResolvida | null> {
  const larguraPx = imagem.larguraPx ?? IMAGEM_LARGURA_PADRAO
  const alturaPx = imagem.alturaPx ?? IMAGEM_ALTURA_PADRAO
  const ajuste = imagem.ajuste ?? "contain"

  const dataUrl = imagem.src

  const mimeType = dataUrl.split(";")[0].split("/")[1] ?? "png"
  const type = (mimeType === "jpeg" ? "jpg" : mimeType) as "png" | "jpg" | "gif"

  const natural = await loadImageNaturalSize(dataUrl)
  if (!natural || ajuste === "fill") {
    return { dataUrl, type, width: larguraPx, height: alturaPx }
  }

  if (ajuste === "cover") {
    const cropped = await coverCropDataUrl(dataUrl, natural.w, natural.h, larguraPx, alturaPx)
    return { dataUrl: cropped, type: "png", width: larguraPx, height: alturaPx }
  }

  if (ajuste === "scale-down" && natural.w <= larguraPx && natural.h <= alturaPx) {
    return { dataUrl, type, width: natural.w, height: natural.h }
  }

  // contain (e scale-down quando a imagem é maior que a caixa): encaixa preservando a proporção natural
  const boxAspect = larguraPx / alturaPx
  const naturalAspect = natural.w / natural.h
  const width = naturalAspect > boxAspect ? larguraPx : Math.round(alturaPx * naturalAspect)
  const height = naturalAspect > boxAspect ? Math.round(larguraPx / naturalAspect) : alturaPx
  return { dataUrl, type, width, height }
}

function imagemParagraph(resolved: QuestaoImagemResolvida, alinhamento: QuestaoImagemAlinhamento | undefined, spacing: { before: number; after: number }): Paragraph {
  return new Paragraph({
    alignment: alinhamento === "direita" ? AlignmentType.RIGHT : AlignmentType.LEFT,
    spacing,
    children: [new ImageRun({
      data: Buffer.from(resolved.dataUrl.split(",")[1] ?? "", "base64"),
      transformation: { width: resolved.width, height: resolved.height },
      type: resolved.type,
    })],
  })
}

/* ─── Construção das questões ─────────────────────────────────── */

// Numeral romano de cada afirmativa de "assercoes-multiplas" (mesmo padrão de lookup simples do
// A4Sheet  ver ROMANOS em a4-sheet.tsx)  cobre o teto de 5 afirmativas pedido no prompt da IA.
const ROMANOS = ["I", "II", "III", "IV", "V", "VI"]

/** Monta os parágrafos/tabela de uma questão (enunciado + alternativas/linhas de resposta + imagem opcional, conforme o tipo e a posição da imagem).
 *  `isLast`: suprime o parágrafo vazio de separação que normalmente fecha a questão (respiro antes
 *  da próxima)  sem isso, a última questão do documento deixava uma linha em branco solta no fim
 *  do corpo, sem nenhuma questão depois pra justificar o espaço. */
async function questionChildren(q: QuestaoItem, ctx: DocxFormatCtx, isLast = false): Promise<(Paragraph | Table)[]> {
  const lineSpacing = ctx.lineRule !== 240 ? { line: ctx.lineRule, lineRule: "auto" as const } : {}

  const enunciado = new Paragraph({
    alignment: ctx.align,
    spacing: { before: 160, after: 100, ...lineSpacing },
    children: [
      new TextRun({ text: `${q.numero}. `, bold: true, font: ctx.font, size: ctx.size }),
      new TextRun({ text: q.enunciado, font: ctx.font, size: ctx.size }),
    ],
  })

  const respostas: Paragraph[] = []

  if (q.tipo === "assercoes-multiplas" && q.afirmativas) {
    q.afirmativas.forEach((afirmativa, i) => {
      respostas.push(
        new Paragraph({
          indent: { left: 480 },
          spacing: { before: 40, after: 40, ...lineSpacing },
          children: [
            new TextRun({ text: `${ROMANOS[i] ?? i + 1} -  `, bold: true, font: ctx.font, size: ctx.size }),
            new TextRun({ text: afirmativa, font: ctx.font, size: ctx.size }),
          ],
        })
      )
    })
    // Só é a separação final da questão quando não há bloco de opções depois  nesse caso,
    // suprimir por causa de isLast é seguro; senão ela separa afirmativas de opções e tem que ficar.
    if (!(isLast && !q.opcoes)) respostas.push(new Paragraph({ spacing: spacer(0, 60), children: [] }))
  }

  if ((q.tipo === "multipla-escolha" || q.tipo === "assercoes-multiplas") && q.opcoes) {
    q.opcoes.forEach((opcao, i) => {
      respostas.push(
        new Paragraph({
          indent: { left: 480 },
          spacing: { before: 40, after: 40, ...lineSpacing },
          children: [
            new TextRun({ text: `${String.fromCharCode(65 + i)})  `, bold: true, font: ctx.font, size: ctx.size }),
            new TextRun({ text: opcao, font: ctx.font, size: ctx.size }),
          ],
        })
      )
    })
    if (!isLast) respostas.push(new Paragraph({ spacing: spacer(0, 60), children: [] }))
  }

  if (q.tipo === "dissertativo" || q.tipo === "matematica") {
    for (let i = 0; i < (q.numeroLinhas ?? 6); i++) {
      respostas.push(new Paragraph({
        spacing: { before: 0, after: 300 },
        border: { between: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
        children: [],
      }))
    }
  }

  if (q.tipo === "completar-lacunas") {
    if (!isLast) respostas.push(new Paragraph({ spacing: spacer(0, 60), children: [] }))
  }

  if (q.tipo === "verdade-falso") {
    for (const opcao of ["Verdadeiro", "Falso"]) {
      respostas.push(
        new Paragraph({
          indent: { left: 480 },
          spacing: spacer(40, 40),
          children: [
            new TextRun({ text: `( )  ${opcao}`, font: ctx.font, size: ctx.size }),
          ],
        })
      )
    }
  }

  const resolved = q.imagem ? await resolveQuestaoImagem(q.imagem) : null
  if (!resolved || !q.imagem) {
    return [enunciado, ...respostas]
  }

  const posicao = q.imagem.posicao ?? "acima-respostas"
  const alinhamento = q.imagem.alinhamento ?? "esquerda"

  // "Do lado da questão": réplica da lado-questao flex do editor  tabela sem bordas de 2 colunas,
  // com a imagem numa célula de largura fixa e o enunciado+respostas na célula restante.
  if (posicao === "lado-questao") {
    const imgCell = new TableCell({
      width: { size: Math.round(resolved.width * 15), type: WidthType.DXA },
      borders: noBorders(),
      margins: { right: 200 },
      verticalAlign: "top",
      children: [imagemParagraph(resolved, undefined, { before: 0, after: 0 })],
    })
    const textCell = new TableCell({
      borders: noBorders(),
      verticalAlign: "top",
      children: [enunciado, ...respostas],
    })
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { ...noBorders(), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
      rows: [new TableRow({ children: alinhamento === "direita" ? [textCell, imgCell] : [imgCell, textCell] })],
    })
    return [table]
  }

  const imagemPar = imagemParagraph(resolved, alinhamento, spacer(0, 120))
  return [enunciado, imagemPar, ...respostas] // "acima-respostas" (única posição empilhada)
}

/** Monta o(s) parágrafo(s) do gabarito de uma questão  número + resposta (letra da alternativa
 *  na múltipla escolha). Dissertativo/matemática repetem o enunciado antes da resposta: sem ele,
 *  a resposta sozinha fica sem contexto. */
function gabaritoChildren(q: QuestaoItem, ctx: DocxFormatCtx): Paragraph[] {
  const lineSpacing = ctx.lineRule !== 240 ? { line: ctx.lineRule, lineRule: "auto" as const } : {}
  const resposta = formatarRespostaGabarito(q)
  const comEnunciado = gabaritoPrecisaDeEnunciado(q.tipo)

  const paragrafos = [
    new Paragraph({
      alignment: ctx.align,
      spacing: { before: 120, after: comEnunciado ? 20 : 60, ...lineSpacing },
      children: [
        new TextRun({ text: `${q.numero}. `, bold: true, font: ctx.font, size: ctx.size }),
        new TextRun({ text: comEnunciado ? q.enunciado : resposta, font: ctx.font, size: ctx.size }),
      ],
    }),
  ]

  if (comEnunciado) {
    paragrafos.push(new Paragraph({
      alignment: ctx.align,
      indent: { left: 240 },
      spacing: { before: 0, after: 60, ...lineSpacing },
      children: [
        new TextRun({ text: "Resposta: ", bold: true, font: ctx.font, size: ctx.size }),
        new TextRun({ text: resposta, font: ctx.font, size: ctx.size }),
      ],
    }))
  }

  return paragrafos
}

/** Parágrafo do rodapé com os códigos da BNCC identificados (ver lib/bncc/detectar-habilidades.ts)
 *   só os códigos, sem descrição (ex.: "BNCC: EF01LP10, EF01LP05"). `[]` quando não há nenhum.
 *  A lista vem sempre de `habilidadesBNCC` (cada código já resolvido/validado contra a base
 *  oficial), nunca escrita aqui  só os códigos são exibidos, não o texto da habilidade. */
function habilidadesBNCCFooterParagraphs(habilidadesBNCC: HabilidadeBNCC[], ctx: DocxFormatCtx): Paragraph[] {
  if (!habilidadesBNCC.length) return []
  const tamanho = 14 // 7pt  rodapé é auxiliar, não deve competir com o conteúdo da página
  return [
    new Paragraph({
      spacing: { before: 120, after: 20 },
      children: [
        new TextRun({ text: "BNCC: ", bold: true, font: ctx.font, size: tamanho }),
        new TextRun({ text: habilidadesBNCC.map((h) => h.codigo).join(", "), font: ctx.font, size: tamanho }),
      ],
    }),
  ]
}

/* ─── Exportação principal ───────────────────────────────────── */

/* ─── Auxiliares de corte de imagem (executados no browser, via Canvas) ─── */

function cropImageDataUrl(
  dataUrl: string,
  crop: { l: number; r: number; t: number; b: number },
  dstW: number,
  dstH: number,
): Promise<string> {
  // Canvas não existe fora do browser; fallback para a imagem original sem crop.
  if (typeof window === "undefined") return Promise.resolve(dataUrl)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const srcX = Math.round(crop.l * img.naturalWidth)
      const srcY = Math.round(crop.t * img.naturalHeight)
      const srcW = Math.round((1 - crop.l - crop.r) * img.naturalWidth)
      const srcH = Math.round((1 - crop.t - crop.b) * img.naturalHeight)
      const canvas = document.createElement("canvas")
      canvas.width = dstW
      canvas.height = dstH
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, dstW, dstH)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/** Recorta (via Canvas) as imagens com crop definido, gerando novas imagens já cortadas  recursivo para tabelas, seções, cabeçalho e rodapé. */
export async function preprocessElements(elements: DocxElement[]): Promise<DocxElement[]> {
  return Promise.all(elements.map(async (el): Promise<DocxElement> => {
    if (el.type === "image" && el.crop) {
      const { l, r, t, b } = el.crop
      if (l > 0 || r > 0 || t > 0 || b > 0) {
        try {
          const croppedUrl = await cropImageDataUrl(el.dataUrl, el.crop, el.widthPx ?? 300, el.heightPx ?? 100)
          return { ...el, dataUrl: croppedUrl, crop: undefined }
        } catch { /* usa a imagem original em caso de falha */ }
      }
    }
    if (el.type === "table") {
      return {
        ...el,
        rows: await Promise.all(el.rows.map(async (row) => ({
          ...row,
          cells: await Promise.all(row.cells.map(async (cell) => ({
            ...cell,
            elements: await preprocessElements(cell.elements),
          }))),
        }))),
      } as typeof el
    }
    if (el.type === "section" || el.type === "bordered-section" || el.type === "header" || el.type === "footer") {
      return { ...el, elements: await preprocessElements(el.elements) } as typeof el
    }
    return el
  }))
}

export interface BuildDocxBlobParams {
  modeloTemplate: ModeloTemplate | null
  ctx: DocxFormatCtx
  /** Contexto de formatação do cabeçalho do modelo  cai pra `ctx` quando o modelo não define
   *  um estilo de cabeçalho próprio (ver `headerStyle` em `ModeloTemplate`). */
  headerCtx?: DocxFormatCtx
  presetMargins: { top: number; bottom: number; left: number; right: number }
  /** Conteúdo específico do documento (questões da atividade, seções do plano de aula etc.) 
   *  já convertido em Paragraph/Table, entra logo depois do corpo do modelo (quando houver),
   *  igual ao ActivityEditor (modelo como base, conteúdo gerado inserido em seguida). */
  contentChildren: (Paragraph | Table)[]
  /** Parágrafos extras no rodapé, depois do número de página (ex.: códigos BNCC da atividade)  nenhum por padrão. */
  extraFooterParagraphs?: Paragraph[]
  /** "Alto contraste" (acessibilidade da atividade)  fundo escuro + texto branco; ausente por padrão. */
  altoContraste?: boolean
}

/**
 * Monta o `.docx` final: aplica o modelo de estilo (corpo, cabeçalho, rodapé, margens, borda,
 * cor de página  quando houver) e insere `contentChildren` logo depois do corpo do modelo.
 * Extraída de `generateWordBlob` pra ser compartilhada com o Plano de Aula (ver
 * `components/plano-de-aula/editor/generate-plano-word.ts`), que antes baixava um .docx
 * estático sem nenhuma formatação/modelo aplicado  com isso os dois passam pela mesma lógica.
 */
export async function buildDocxBlob({
  modeloTemplate,
  ctx,
  headerCtx = ctx,
  presetMargins,
  contentChildren,
  extraFooterParagraphs = [],
  altoContraste = false,
}: BuildDocxBlobParams): Promise<Blob> {
  const children: (Paragraph | Table)[] = []

  // Pré-processa imagens com crop → nova imagem já cortada via Canvas
  const resolvedElements = modeloTemplate ? await preprocessElements(modeloTemplate.elements) : null
  const resolvedHeader   = modeloTemplate?.header ? await preprocessElements(modeloTemplate.header) : null
  const resolvedFooter   = modeloTemplate?.footer
    ? { elements: await preprocessElements(modeloTemplate.footer.elements), pageNumber: modeloTemplate.footer.pageNumber }
    : null

  if (resolvedElements) {
    // ── Modo template: renderiza o cabeçalho do MODELO.docx ──────────
    // Agrupa os elementos pelo parágrafo de origem (separados por marcadores paragraph-boundary)
    // para que vários anchors do mesmo parágrafo do MODELO sejam colocados em UM único <w:p>,
    // preservando a estrutura original e evitando linhas em branco extras.
    const pendingAnchors: (ImageRun | WpsShapeRun)[] = []
    // Elementos originais (não convertidos) por trás de `pendingAnchors`  precisamos deles
    // pra calcular a altura reservada do grupo (`anchorBottomPx`), já que ImageRun/WpsShapeRun
    // não carregam mais x/y/height depois de convertidos.
    const pendingAnchorEls: DocxElement[] = []
    // Borda inferior (px, relativa ao topo do corpo) até onde já reservamos espaço  cada novo
    // grupo de anchors soma só o incremento necessário além do que o grupo anterior já cobriu.
    // Sem essa reserva, parágrafos "só de anchors" (sem texto) ficam com altura ~0 no Word (os
    // desenhos são flutuantes e não contam pra altura do parágrafo), então o fluxo normal
    // (próximas linhas de campos, depois a questão 1) começa colado no topo do corpo em vez de
    // abaixo da área visual das âncoras  causando a sobreposição vista no .docx exportado.
    let anchorBaselinePx = 0

    const flushAnchorGroup = (textEl?: Extract<DocxElement, { type: "paragraph" }>) => {
      if (pendingAnchors.length === 0) {
        if (textEl) children.push(...elementToDocxChildren(textEl))
        return
      }
      const groupBottomPx = pendingAnchorEls.reduce((max, el) => Math.max(max, anchorBottomPx(el)), 0)
      const reservePx = Math.max(0, groupBottomPx - anchorBaselinePx)
      anchorBaselinePx = Math.max(anchorBaselinePx, groupBottomPx)
      if (textEl?.text) {
        const align = textEl.align === "center" ? AlignmentType.CENTER : textEl.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT
        const pxToTw = (px: number) => Math.round(px * 1440 / 96)
        children.push(new Paragraph({
          alignment: align,
          spacing: {
            before: textEl.spaceBefore ? pxToTw(textEl.spaceBefore) : 0,
            after: textEl.spaceAfter ? pxToTw(textEl.spaceAfter) : 0,
            ...(textEl.lineSpacing && textEl.lineSpacing !== 1 && { line: Math.round(240 * textEl.lineSpacing), lineRule: "auto" as const }),
          },
          children: [
            ...pendingAnchors,
            new TextRun({
              text: textEl.text,
              bold: textEl.bold ?? false,
              italics: textEl.italic,
              underline: textEl.underline ? {} : undefined,
              subScript: textEl.subscript,
              superScript: textEl.superscript,
              highlight: textEl.highlight,
              color: textEl.color?.replace("#", ""),
              size: textEl.fontSize ? textEl.fontSize * 2 : ctx.size,
              font: textEl.fontFamily ?? ctx.font,
              characterSpacing: textEl.characterSpacing,
            }),
          ],
        }))
      } else {
        // Somente anchors (sem texto inline) → parágrafo hospedeiro com a altura do grupo
        // reservada via spacing.after (os desenhos flutuantes em si não ocupam espaço no Word)
        children.push(new Paragraph({
          spacing: { before: 0, after: Math.round(reservePx * 1440 / 96) },
          children: [...pendingAnchors],
        }))
      }
      pendingAnchors.length = 0
      pendingAnchorEls.length = 0
    }

    for (const el of resolvedElements) {
      if (el.type === "paragraph-boundary") {
        // Marcador sem texto em seguida → despeja os anchors pendentes como parágrafo só de anchors
        flushAnchorGroup()
        continue
      }
      const anchorRuns = buildDocxAnchorRun(el)
      if (anchorRuns.length > 0) {
        pendingAnchors.push(...anchorRuns)
        pendingAnchorEls.push(el)
        continue
      }
      if (el.type === "paragraph") {
        // Parágrafo de texto encerra o grupo de anchors atual
        flushAnchorGroup(el)
        continue
      }
      // Elemento que não é anchor nem parágrafo (tabela, heading etc.)  despeja antes
      flushAnchorGroup()
      children.push(...elementToDocxChildren(el, false, ctx))
    }
    flushAnchorGroup()

  }

  // Conteúdo do documento  adicionado após o corpo do modelo (template ou padrão)
  children.push(...contentChildren)

  const pb = modeloTemplate?.pageBorder
  const pbOffsetFrom = (modeloTemplate as { pageBorderOffsetFrom?: string } | null)?.pageBorderOffsetFrom
  const borderDef = modeloTemplate?.hasBorder
    ? {
        pageBorders: {
          offsetFrom: pbOffsetFrom === "text" ? PageBorderOffsetFrom.TEXT : PageBorderOffsetFrom.PAGE,
        },
        pageBorderTop:    sideToDocxBorder(pb?.top),
        pageBorderLeft:   sideToDocxBorder(pb?.left    ?? pb?.top),
        pageBorderBottom: sideToDocxBorder(pb?.bottom  ?? pb?.top),
        pageBorderRight:  sideToDocxBorder(pb?.right   ?? pb?.top),
      }
    : undefined

  const doc = new Document({
    // "Alto contraste" (acessibilidade) tem prioridade sobre a cor de página do MODELO,
    // mesma regra do a4-sheet (ver `paperBg`/`backgroundColor` em A4Sheet/PageShell).
    background: altoContraste
      ? { color: "111111" }
      : modeloTemplate?.pageBackground
        ? { color: modeloTemplate.pageBackground.replace("#", "") }
        : undefined,
    // Cor padrão de texto (docDefaults)  runs sem `color` explícito herdam daqui, os que
    // já têm cor própria (ex.: elemento do MODELO) continuam intactos, igual à cascata CSS
    // do a4-sheet (texto branco só onde nenhuma cor explícita foi definida).
    styles: altoContraste
      ? { default: { document: { run: { color: "FFFFFF" } } } }
      : undefined,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: (() => {
              const pxToTw = (px: number) => Math.round(px * 1440 / 96)
              // Mesma prioridade do a4-sheet: template > preset
              const m = modeloTemplate?.margins
              return {
                top:    pxToTw(m?.top    ?? presetMargins.top),
                bottom: pxToTw(m?.bottom ?? presetMargins.bottom),
                left:   pxToTw(m?.left   ?? presetMargins.left),
                right:  pxToTw(m?.right  ?? presetMargins.right),
                // Distâncias do cabeçalho/rodapé à borda da página  preserva o posicionamento original do MODELO
                ...(m?.header !== undefined && { header: pxToTw(m.header) }),
                ...(m?.footer !== undefined && { footer: pxToTw(m.footer) }),
              }
            })(),
            borders: borderDef,
          },
        },
        headers: resolvedHeader ? {
          default: new Header({
            children: [
              ...resolvedHeader
                .map((e: DocxElement): DocxElement => {
                  if (e.type !== "table") return e
                  // No header, a tabela deve ser não-flutuante para ancorar corretamente
                  // no topo. Remove todas as propriedades de float; a largura (tblW) é
                  // mantida para preservar o tamanho original do MODELO.
                  const { floatY: _fy, floatLeftFromText: _fl, floatRightFromText: _fr, tblpCenter: _tc, ...rest } = e
                  return rest as DocxElement
                })
                .filter((e: DocxElement) => !(e.type === "paragraph" && !e.text))
                .flatMap((e: DocxElement) => elementToDocxChildren(e, false, headerCtx))
                .filter((c): c is Paragraph | Table => c instanceof Paragraph || c instanceof Table),
            ],
          }),
        } : undefined,
        footers: {
          default: resolvedFooter ? new Footer({
            children: [
              ...resolvedFooter.elements.flatMap((e: DocxElement) => elementToDocxChildren(e, false, ctx)).filter((c): c is Paragraph | Table => c instanceof Paragraph || c instanceof Table),
              ...(resolvedFooter.pageNumber ? [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: ctx.font, size: 16, color: "888888" }),
                  new TextRun({ text: " / ", font: ctx.font, size: 16, color: "888888" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: ctx.font, size: 16, color: "888888" }),
                ],
              })] : []),
              ...extraFooterParagraphs,
            ],
          }) : new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ children: [PageNumber.CURRENT], font: ctx.font, size: 16, color: "BBBBBB" }),
                  new TextRun({ text: " / ", font: ctx.font, size: 16, color: "BBBBBB" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: ctx.font, size: 16, color: "BBBBBB" }),
                ],
              }),
              ...extraFooterParagraphs,
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toBlob(doc)
}

/** Gera o arquivo .docx da atividade (modelo do docx ou cabeçalho padrão + questões) e retorna como Blob.
 *  Com `modo: "gabarito"`, o corpo traz só o número e a resposta correta de cada questão (mesmo cabeçalho/rodapé do modelo). */
export async function generateWordBlob(config: AtividadeConfig, modo: "questoes" | "gabarito" = "questoes"): Promise<Blob> {
  const { codigosBNCC, mostrarBNCC, quantidadeQuestoes, acessibilidade, modeloTemplate } = config

  // Resolve os códigos BNCC (preenchidos pela IA e/ou editados manualmente pelo professor  ver
  // editor-sidebar.tsx) contra a base oficial na hora de exportar: a descrição exibida no rodapé
  // é sempre a oficial, nunca inventada, e um código adicionado à mão também passa pela mesma
  // verificação. Código que não existe na base é simplesmente omitido do rodapé. Pulado por
  // completo (nem a busca acontece) quando o professor desligou "Mostrar no rodapé".
  const habilidadesBNCC = mostrarBNCC ? await resolverCodigosBNCC(codigosBNCC) : []

  // ── Formatação: espelha a lógica do a4-sheet ──────────────────────────────
  const preset        = getPreset(config.formatacao)
  const presetMargins = getPresetMargins(preset)
  const fontSizePx    = parseFloat(getPresetFontSize(preset, config.fonteEscolhida))
  // fonteGrande acrescenta 2px, igual ao a4-sheet
  const effectivePx   = acessibilidade.fonteGrande ? fontSizePx + 2 : fontSizePx
  // px → half-points: 1px@96dpi = 0.75pt; half-pt = pt×2
  const fontSizeHalfPt = Math.round(effectivePx * 0.75 * 2)

  // Espaçamento de linha: mesma prioridade do a4-sheet
  const lineMultiplier = acessibilidade.espacamento    ? 2
    : preset.espacamento >= 2   ? 2
    : preset.espacamento >= 1.5 ? 1.5
    : 1.25
  const lineRule = Math.round(240 * lineMultiplier) // 240 = simples no docx

  const ctx: DocxFormatCtx = {
    font:    config.fonteEscolhida,
    size:    fontSizeHalfPt,
    lineRule,
    align:   preset.textJustify ? AlignmentType.BOTH : AlignmentType.LEFT,
  }

  const headerStyle = modeloTemplate?.headerStyle
  const headerCtx: DocxFormatCtx = {
    font:     headerStyle?.fontFamily ?? ctx.font,
    size:     headerStyle?.fontSize   ?? ctx.size,
    lineRule: headerStyle?.lineRule   ?? ctx.lineRule,
    align:    ctx.align,
  }

  const allQuestoes = config.questoes ?? []
  // "Reduzir questões" (TEA/autismo) não reduz a quantidade de questões  só o número de
  // alternativas de múltipla escolha/asserções múltiplas (mesmo corte do A4Sheet, ver
  // questaoComAlternativasReduzidas)  o .docx exportado precisa bater com o que o professor viu na tela.
  const questoesVisiveis = allQuestoes.slice(0, quantidadeQuestoes)
  const questoes = acessibilidade.reduzirQuestoes
    ? questoesVisiveis.map(questaoComAlternativasReduzidas)
    : questoesVisiveis

  const contentChildren: (Paragraph | Table)[] = [new Paragraph({ spacing: spacer(120, 0), children: [] })]
  for (let i = 0; i < questoes.length; i++) {
    const q = questoes[i]
    const isLast = i === questoes.length - 1
    contentChildren.push(...(modo === "gabarito" ? gabaritoChildren(q, ctx) : await questionChildren(q, ctx, isLast)))
  }

  return buildDocxBlob({
    modeloTemplate,
    ctx,
    headerCtx,
    presetMargins,
    contentChildren,
    extraFooterParagraphs: habilidadesBNCCFooterParagraphs(habilidadesBNCC, ctx),
    altoContraste: acessibilidade.altoContraste,
  })
}
