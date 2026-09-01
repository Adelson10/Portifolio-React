import { NextRequest, NextResponse } from "next/server"
import zlib from "zlib"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { TAMANHO_MAXIMO_ARQUIVO_BYTES, TAMANHO_MAXIMO_ARQUIVO_MB } from "@/lib/ai/limites-arquivo"
import { verificarDonoDaAtividade } from "@/lib/atividades/dono"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HighlightColor =
  | "black" | "blue" | "cyan" | "darkBlue" | "darkCyan" | "darkGray" | "darkGreen" | "darkMagenta"
  | "darkRed" | "darkYellow" | "green" | "lightGray" | "magenta" | "red" | "white" | "yellow"

export type DocxElement =
  | { type: "image"; dataUrl: string; align?: "left" | "center" | "right"; widthPx?: number; heightPx?: number; x?: number; y?: number; behindDoc?: boolean; relativeHeight?: number; wrapType?: "none" | "square" | "tight" | "topAndBottom"; crop?: { l: number; r: number; t: number; b: number } }
  | { type: "paragraph-boundary" }
  | { type: "paragraph"; text: string; align?: "left" | "center" | "right"; bold?: boolean; italic?: boolean; underline?: boolean; subscript?: boolean; superscript?: boolean; highlight?: HighlightColor; fontSize?: number; color?: string; isFormField?: boolean; lineSpacing?: number; fontFamily?: string; height?: number; spaceBefore?: number; spaceAfter?: number; characterSpacing?: number }
  | { type: "heading"; text: string; level: 1 | 2 | 3 | 4 | 5 | 6; align?: "left" | "center" | "right" }
  | { type: "run"; runs: { text: string; bold?: boolean; italic?: boolean; underline?: boolean; subscript?: boolean; superscript?: boolean; highlight?: HighlightColor; color?: string; fontSize?: number; fontFamily?: string; characterSpacing?: number }[]; spaceBefore?: number; spaceAfter?: number; lineSpacing?: number }
  | { type: "table"; rows: { height?: number; heightRule?: "atLeast" | "exact"; cells: { elements: DocxElement[]; colspan?: number; rowspan?: number; width?: number; vAlign?: "top" | "center" | "bottom" }[] }[]; borders?: boolean; borderColor?: string; borderWidth?: number; borderStyle?: string; floatY?: number; tblW?: number; tblpCenter?: boolean; floatLeftFromText?: number; floatRightFromText?: number; cellPad?: { top: number; right: number; bottom: number; left: number } }
  | { type: "bordered-section"; elements: DocxElement[] }
  | { type: "page-break" }
  | { type: "column-break" }
  | { type: "section"; columns: number; elements: DocxElement[] }
  | { type: "horizontal-rule"; thickness?: number; color?: string }
  | { type: "text-box"; text: string; x: number; y: number; width: number; height: number; background?: string; fontFamily?: string; fontSize?: number; bold?: boolean; italic?: boolean; color?: string; align?: "left" | "center" | "right"; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; relativeHeight?: number; paddingH?: number; paddingV?: number }
  | { type: "shape"; shapeType: "rectangle" | "circle" | "triangle"; fill?: string; border?: string; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; width?: number; height?: number; x?: number; y?: number; relativeHeight?: number }
  | { type: "bullet-list"; items: string[]; indent?: number }
  | { type: "numbered-list"; items: string[]; startAt?: number }
  | { type: "form-field"; label?: string; lines?: number; lineLength?: number }
  | { type: "checkbox"; label?: string; checked?: boolean }
  | { type: "header"; elements: DocxElement[] }
  | { type: "footer"; elements: DocxElement[]; pageNumber?: boolean }
  | { type: "table-of-contents" }
  | { type: "math"; formula: string }
  | { type: "qr-code"; value: string; size?: number }

export interface BorderSide {
  color?: string   // "#RRGGBB"
  width?: number   // px
  space?: number   // px from page edge
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
  fontSize?: number   // half-points (mesma unidade do docx)
  lineRule?: number   // 240 = simples, 360 = 1.5x, 480 = duplo
}

export interface ParsedModelo {
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

// ─── ZIP parser ───────────────────────────────────────────────────────────────

function readUint16LE(buf: Buffer, offset: number) {
  return buf[offset] | (buf[offset + 1] << 8)
}
function readUint32LE(buf: Buffer, offset: number) {
  return (buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0
}

interface ZipEntry { name: string; data: Buffer }

// Teto de bytes DESCOMPRIMIDOS  o tamanho comprimido já é limitado antes de chegar aqui
// (TAMANHO_MAXIMO_ARQUIVO_BYTES, ver chamadores), mas DEFLATE permite razões de expansão de até
// ~1000:1, então um .docx pequeno e malicioso ainda podia inflar pra vários GB em memória ("zip
// bomb") sem este teto. `maxOutputLength` é reforçado pelo próprio zlib durante a descompressão
// (não espera terminar pra checar), e o acumulador `totalDescomprimido` cobre o caso de muitas
// entradas pequenas somando um total grande.
const MAX_DESCOMPRIMIDO_POR_ENTRADA_BYTES = 50 * 1024 * 1024
const MAX_DESCOMPRIMIDO_TOTAL_BYTES = 150 * 1024 * 1024

async function parseZip(buf: Buffer): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = []
  let totalDescomprimido = 0
  let i = 0
  while (i + 4 <= buf.length) {
    if (readUint32LE(buf, i) !== 0x04034b50) break
    const compression = readUint16LE(buf, i + 8)
    const compressedSize = readUint32LE(buf, i + 18)
    const nameLen = readUint16LE(buf, i + 26)
    const extraLen = readUint16LE(buf, i + 28)
    const nameStart = i + 30
    const name = buf.slice(nameStart, nameStart + nameLen).toString("utf-8")
    const dataStart = nameStart + nameLen + extraLen
    const compressedData = buf.slice(dataStart, dataStart + compressedSize)
    let data: Buffer
    if (compression === 0) {
      data = compressedData
    } else if (compression === 8) {
      data = await new Promise<Buffer>((resolve, reject) => {
        zlib.inflateRaw(compressedData, { maxOutputLength: MAX_DESCOMPRIMIDO_POR_ENTRADA_BYTES }, (err, result) =>
          err ? reject(new Error("Arquivo .docx inválido ou grande demais para processar.")) : resolve(result)
        )
      })
    } else {
      data = compressedData
    }
    totalDescomprimido += data.length
    if (totalDescomprimido > MAX_DESCOMPRIMIDO_TOTAL_BYTES) {
      throw new Error("Arquivo .docx inválido ou grande demais para processar.")
    }
    entries.push({ name, data })
    i = dataStart + compressedSize
  }
  return entries
}

// ─── Relationship map ─────────────────────────────────────────────────────────

function parseRels(xml: string): Map<string, string> {
  const map = new Map<string, string>()
  const re = /<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) map.set(m[1], m[2])
  return map
}

// ─── Numbering (listas) ───────────────────────────────────────────────────────

function parseNumbering(xml: string): Map<string, "bullet" | "decimal"> {
  const abstractTypes = new Map<string, "bullet" | "decimal">()
  const abstractRe = /<w:abstractNum\s+w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g
  let m: RegExpExecArray | null
  while ((m = abstractRe.exec(xml)) !== null) {
    const fmtMatch = m[2].match(/<w:numFmt\s+w:val="([^"]+)"/)
    abstractTypes.set(m[1], fmtMatch?.[1] === "bullet" ? "bullet" : "decimal")
  }
  const result = new Map<string, "bullet" | "decimal">()
  const numRe = /<w:num\s+w:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g
  while ((m = numRe.exec(xml)) !== null) {
    const absRef = m[2].match(/<w:abstractNumId\s+w:val="(\d+)"/)
    if (absRef) result.set(m[1], abstractTypes.get(absRef[1]) ?? "decimal")
  }
  return result
}

// ─── Helpers de texto ─────────────────────────────────────────────────────────

/** Remove o texto em cache de campos dinâmicos do Word (PAGE, NUMPAGES, DATE, AUTHOR etc.).
 *  Entre `<w:fldChar w:fldCharType="separate"/>` e o `.../"end"/>` correspondente fica o
 *  ÚLTIMO VALOR CALCULADO pelo Word (ex.: "1"), não texto literal digitado pelo usuário  sem
 *  remover isso, um rodapé "PAGE / NUMPAGES" virava o texto fixo "1 / 1" extraído junto com a
 *  detecção separada de `pageNumber` (ver `parseHeaderFooterFile`), e o app acabava desenhando
 *  o número duas vezes: uma vez como texto congelado, outra como campo de página de verdade. */
function stripFieldResultRuns(xml: string): string {
  return xml.replace(
    /<w:fldChar\s+w:fldCharType="separate"\s*\/>[\s\S]*?<w:fldChar\s+w:fldCharType="end"\s*\/>/g,
    (segment) => segment.replace(/<w:t(?:\s[^>]*)?>[^<]*<\/w:t>/g, "<w:t></w:t>")
  )
}

function extractPlainText(xml: string): string {
  let text = ""
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) text += m[1]
  return text
}

// ─── Helpers de parágrafo ─────────────────────────────────────────────────────

function paragraphAlign(pPr: string): "left" | "center" | "right" {
  const m = pPr.match(/<w:jc\s+w:val="([^"]+)"/)
  if (!m) return "left"
  return m[1] === "center" ? "center" : m[1] === "right" ? "right" : "left"
}

// Alguns modelos posicionam uma imagem (ex.: brasão/logo dentro de uma célula de tabela) sem
// <w:jc>, usando em vez disso <w:tab/> até um tab stop "center"/"right" definido em <w:tabs> 
// truque comum do Word para centralizar algo sem mexer no alinhamento do parágrafo inteiro. Se
// não há <w:jc> e o parágrafo é só tabs + a imagem (sem texto real antes dela), usa o tipo do
// último tab stop alcançado como alinhamento efetivo da imagem.
function resolveImageAlign(pXml: string, pPr: string): "left" | "center" | "right" {
  const jc = paragraphAlign(pPr)
  if (jc !== "left") return jc
  const drawingIdx = pXml.indexOf("<w:drawing")
  if (drawingIdx === -1) return jc
  const before = pXml.slice(0, drawingIdx)
  const hasRealText = [...before.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].some(m => m[1].trim().length > 0)
  if (hasRealText) return jc
  const tabCount = (before.match(/<w:tab\/>/g) ?? []).length
  if (tabCount === 0) return jc
  const tabStops = [...pPr.matchAll(/<w:tab\s+w:val="(center|right|left)"/g)].map(m => m[1])
  const lastStop = tabStops[Math.min(tabCount, tabStops.length) - 1]
  return lastStop === "center" ? "center" : lastStop === "right" ? "right" : jc
}

function getHeadingLevel(pPr: string): 1 | 2 | 3 | 4 | 5 | 6 | null {
  let m = pPr.match(/<w:pStyle\s+w:val="[Hh]eading\s*(\d)"/)
  if (!m) m = pPr.match(/<w:pStyle\s+w:val="T[ií]tulo\s*(\d)"/)
  if (!m) return null
  const level = parseInt(m[1])
  return level >= 1 && level <= 6 ? (level as 1 | 2 | 3 | 4 | 5 | 6) : null
}

function getListInfo(pPr: string): { numId: string; level: number } | null {
  const numPrMatch = pPr.match(/<w:numPr>([\s\S]*?)<\/w:numPr>/)
  if (!numPrMatch) return null
  const numIdMatch = numPrMatch[1].match(/<w:numId\s+w:val="(\d+)"/)
  if (!numIdMatch || numIdMatch[1] === "0") return null
  const ilvlMatch = numPrMatch[1].match(/<w:ilvl\s+w:val="(\d+)"/)
  return { numId: numIdMatch[1], level: ilvlMatch ? parseInt(ilvlMatch[1]) : 0 }
}

// ─── Runs com formatação ──────────────────────────────────────────────────────

interface RunInfo {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  subscript?: boolean
  superscript?: boolean
  highlight?: HighlightColor
  color?: string
  fontSize?: number
  fontFamily?: string
  characterSpacing?: number
}

// Valores válidos de w:highlight  usados para validar o que vem do XML antes do cast para HighlightColor
const HIGHLIGHT_COLORS = new Set<string>([
  "black", "blue", "cyan", "darkBlue", "darkCyan", "darkGray", "darkGreen", "darkMagenta",
  "darkRed", "darkYellow", "green", "lightGray", "magenta", "red", "white", "yellow",
])

function parseRuns(pXml: string): RunInfo[] {
  const runs: RunInfo[] = []
  const runRe = /<w:r[ >][\s\S]*?<\/w:r>/g
  let m: RegExpExecArray | null
  while ((m = runRe.exec(pXml)) !== null) {
    const rXml = m[0]
    const tMatch = rXml.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/)
    if (!tMatch) continue
    const rPr = (rXml.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) ?? [])[1] ?? ""
    const colorMatch = rPr.match(/<w:color\s+w:val="([0-9A-Fa-f]{6})"/)
    const szMatch = rPr.match(/<w:sz\s+w:val="(\d+)"/)
    const fontMatch = rPr.match(/<w:rFonts[^>]+w:ascii="([^"]+)"/)
    // <w:spacing w:val="NNN"> inside <w:rPr> = character spacing in twentieths of a point
    const charSpacingMatch = rPr.match(/<w:spacing\s+w:val="(-?\d+)"/)
    const vertAlignMatch = rPr.match(/<w:vertAlign\s+w:val="(subscript|superscript)"/)
    const highlightMatch = rPr.match(/<w:highlight\s+w:val="([a-zA-Z]+)"/)
    const highlightVal = highlightMatch?.[1]
    runs.push({
      text: tMatch[1],
      bold: /<w:b(?:\s|\/|>)/.test(rPr) || undefined,
      italic: /<w:i(?:\s|\/|>)/.test(rPr) || undefined,
      underline: /<w:u\s/.test(rPr) || undefined,
      subscript: vertAlignMatch?.[1] === "subscript" || undefined,
      superscript: vertAlignMatch?.[1] === "superscript" || undefined,
      highlight: (highlightVal && highlightVal !== "none" && HIGHLIGHT_COLORS.has(highlightVal)) ? highlightVal as HighlightColor : undefined,
      color: colorMatch ? `#${colorMatch[1]}` : undefined,
      fontSize: szMatch ? parseInt(szMatch[1]) / 2 : undefined,
      fontFamily: fontMatch ? fontMatch[1] : undefined,
      characterSpacing: charSpacingMatch ? parseInt(charSpacingMatch[1]) : undefined,
    })
  }
  return runs
}

// Coleta todos os nomes de fonte únicos do XML do documento (document.xml + styles.xml)
function extractDocumentFonts(docXml: string, stylesXml: string): string[] {
  const seen = new Set<string>()
  const re = /w:(?:ascii|hAnsi)="([^"+][^"]*)"/g
  let m: RegExpExecArray | null
  for (const xml of [docXml, stylesXml]) {
    while ((m = re.exec(xml)) !== null) {
      // Ignora nomes de tema como "+mj-lt", "+mn-lt"
      if (!m[1].startsWith("+")) seen.add(m[1])
    }
  }
  return [...seen]
}

// ─── Detectores de elementos especiais ───────────────────────────────────────

function detectPageBreak(pXml: string, pPr: string): boolean {
  return /<w:br\s+w:type="page"/.test(pXml) ||
    /<w:pageBreakBefore\s*\/>/.test(pPr) ||
    /<w:pageBreakBefore\s+w:val="1"/.test(pPr)
}

function detectColumnBreak(pXml: string): boolean {
  return /<w:br\s+w:type="column"/.test(pXml)
}

function detectTOC(pXml: string): boolean {
  return /<w:instrText[^>]*>\s*TOC\s/.test(pXml)
}

function detectMath(pXml: string): string | null {
  if (!/<m:oMath/.test(pXml)) return null
  return extractPlainText(pXml).trim() || "∫"
}

// Mapa mínimo de scheme colors do Office para hex CSS
const SCHEME_COLORS: Record<string, string> = {
  tx1: "#000000", dk1: "#000000", lt1: "#FFFFFF",
  tx2: "#1F3864", dk2: "#1F3864", lt2: "#E7E6E6",
  accent1: "#4472C4", accent2: "#ED7D31", accent3: "#A9D18E",
  accent4: "#FFC000", accent5: "#5A96C8", accent6: "#70AD47",
}

function extractLineStyle(lnXml: string): { borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted" } {
  const srgbM = lnXml.match(/<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/)
  const schemeM = lnXml.match(/<a:schemeClr\s+val="([^"]+)"/)
  const sysM = lnXml.match(/<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"/)
  const wMatch = lnXml.match(/<a:ln\s[^>]*w="(\d+)"/)
  const dashMatch = lnXml.match(/<a:prstDash\s+val="([^"]+)"/)
  const d = dashMatch?.[1] ?? ""
  const color = srgbM ? `#${srgbM[1]}` : schemeM ? (SCHEME_COLORS[schemeM[1]] ?? "#000000") : sysM ? `#${sysM[1]}` : undefined
  return {
    borderColor: color,
    borderWidth: wMatch ? Math.max(1, Math.round(parseInt(wMatch[1]) / 9525)) : undefined,
    borderStyle: d.includes("dot") ? "dotted" : d.includes("dash") ? "dashed" : "solid",
  }
}

function detectTextBox(pXml: string, headerOffset?: HeaderPageOffset): { text: string; x: number; y: number; width: number; height: number; background?: string; fontFamily?: string; fontSize?: number; bold?: boolean; italic?: boolean; color?: string; align?: "left" | "center" | "right"; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; paddingH?: number; paddingV?: number } | null {
  if (!/<w:txbxContent/.test(pXml)) return null

  // Position and size from wp:anchor  extract H and V content first to avoid cross-element regex bleeding
  const posHContent = pXml.match(/<wp:positionH[^>]*>([\s\S]*?)<\/wp:positionH>/)?.[1] ?? ""
  const posVContent = pXml.match(/<wp:positionV[^>]*>([\s\S]*?)<\/wp:positionV>/)?.[1] ?? ""
  const posHMatch = posHContent.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)
  const posVMatch = posVContent.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)
  const extentMatch = pXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)

  // Shape properties  <wps:spPr> can have attributes (e.g. bwMode="auto")
  const spPr = pXml.match(/<wps:spPr[^>]*>([\s\S]*?)<\/wps:spPr>/)?.[1] ?? ""
  const spPrNoLn = spPr.replace(/<a:ln[\s\S]*?<\/a:ln>/g, "")
  const hasNoFill = /<a:noFill[\s/>]/.test(spPrNoLn)
  const srgbFillM = spPrNoLn.match(/<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/)
  const sysFillM  = spPrNoLn.match(/<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"/)
  const schemeFillM = spPrNoLn.match(/<a:schemeClr\s+val="([^"]+)"/)
  const fillHex = srgbFillM?.[1] ?? sysFillM?.[1] ?? (schemeFillM ? (SCHEME_COLORS[schemeFillM[1]] ?? "#FFFFFF").slice(1) : null)
  const background = !hasNoFill && fillHex ? `#${fillHex}` : undefined

  const lnXml = spPr.match(/<a:ln(?:\s[^>]*)?>[\s\S]*?<\/a:ln>/)?.[0] ?? ""
  const hasNoBorder = !lnXml || /<a:noFill[\s/>]/.test(lnXml)
  const { borderColor, borderWidth, borderStyle } = hasNoBorder ? {} : extractLineStyle(lnXml)

  const prstMatch = spPr.match(/<a:prstGeom\s+prst="([^"]+)"/)
  const adjMatch = spPr.match(/<a:gd\s+name="adj"\s+fmla="val\s+(\d+)"/)
  // roundRect radius: adj/100000 * min(width, height) per OOXML spec
  const borderRadius = prstMatch?.[1] === "roundRect"
    ? Math.round((adjMatch ? parseInt(adjMatch[1]) / 100000 : 0.16667) * Math.min(
        extentMatch ? Math.round(parseInt(extentMatch[1]) / 9525) : 100,
        extentMatch ? Math.round(parseInt(extentMatch[2]) / 9525) : 50,
      ))
    : undefined

  // Text from txbxContent  handles both full match and truncated (anchor paragraph) cases
  const txbxFullMatch = pXml.match(/<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/)
  const txbxIdx = pXml.indexOf("<w:txbxContent>")
  const txbxContent = txbxFullMatch
    ? txbxFullMatch[1]
    : txbxIdx !== -1 ? pXml.slice(txbxIdx + 15) : ""

  const runs = parseRuns(txbxContent)
  // Junta os RUNS de cada PARÁGRAFO separadamente (correto: runs de um mesmo parágrafo são texto
  // contínuo) e só então junta os parágrafos entre si com espaço  sem isso, um text box com
  // várias linhas (ex.: "Universidade... – UPF" / "Instituto..." / "Prova...") virava um único
  // texto colado ("...UPFInstituto...", ver relato de bug no cabeçalho da UPF).
  const paragraphsXml = txbxContent.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [txbxContent]
  const rawText = paragraphsXml
    .map((pXml) => parseRuns(pXml).map((r) => r.text).join(""))
    .filter((linha) => linha.trim().length > 0)
    .join(" ")
    .trim()
  // Strip trailing underscores used as visual fill blanks (e.g., "NOTA_____" → "NOTA")
  // Only strip when there's no colon  colons indicate labeled form fields handled elsewhere
  const text = rawText.includes(":") ? rawText : rawText.replace(/\s*_{5,}\s*$/, "").trim() || rawText
  const firstRun = runs[0]

  // Font family from first run rPr
  const rPrSection = txbxContent.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ""
  const rFontsMatch = rPrSection.match(/<w:rFonts[^>]*w:ascii="([^"]+)"/)

  // Alignment from first paragraph pPr
  const pPrSection = txbxContent.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? ""
  const align = paragraphAlign(pPrSection)

  // Internal body padding from <wps:bodyPr lIns="..." tIns="...">
  const bodyPrM = pXml.match(/<wps:bodyPr[^>]*>/)
  const lInsM = bodyPrM?.[0].match(/\blIns="(\d+)"/)
  const tInsM = bodyPrM?.[0].match(/\btIns="(\d+)"/)
  const paddingH = lInsM ? Math.round(parseInt(lInsM[1]) / 9525) : undefined
  const paddingV = tInsM ? Math.round(parseInt(tInsM[1]) / 9525) : undefined

  // <wp:positionH> pode usar <wp:align> (esquerda/centro/direita) em vez de <wp:posOffset>  mesmo
  // fallback aplicado a imagens flutuantes (ver parseAnchorXml), senão a caixa virava x=0 fixo
  // mesmo quando o Word a alinhou ao centro/direita, deslocando-a da posição real do documento.
  const hAlignMatch = posHContent.match(/<wp:align>([^<]+)<\/wp:align>/)?.[1]
  const boxWidthPx = extentMatch ? Math.round(parseInt(extentMatch[1]) / 9525) : undefined
  const rawX = posHMatch
    ? Math.round(parseInt(posHMatch[1]) / 9525)
    : hAlignMatch === "right" && boxWidthPx  ? Math.max(0, 700 - boxWidthPx)
    : hAlignMatch === "center" && boxWidthPx ? Math.max(0, (700 - boxWidthPx) / 2)
    : 0 // "left", sem align, ou center/right sem largura conhecida  aproxima como esquerda
  const rawY = posVMatch ? Math.round(parseInt(posVMatch[1]) / 9525) : 0
  return {
    text,
    x: Math.max(0, adjustPageRelative(rawX, getHRelativeFrom(pXml), headerOffset?.leftPx)),
    y: Math.max(0, adjustPageRelative(rawY, getVRelativeFrom(pXml), headerOffset?.topPx)),
    width: extentMatch ? Math.round(parseInt(extentMatch[1]) / 9525) : 200,
    height: extentMatch ? Math.round(parseInt(extentMatch[2]) / 9525) : 50,
    background,
    fontFamily: rFontsMatch?.[1],
    fontSize: firstRun?.fontSize,
    bold: firstRun?.bold || undefined,
    italic: firstRun?.italic || undefined,
    color: firstRun?.color,
    align: align !== "left" ? align : undefined,
    borderColor,
    borderWidth,
    borderStyle,
    borderRadius,
    paddingH,
    paddingV,
  }
}

function detectShape(pXml: string): { shapeType: "rectangle" | "circle" | "triangle"; fill?: string; borderColor?: string; borderWidth?: number; borderStyle?: "solid" | "double" | "dashed" | "dotted"; borderRadius?: number; width?: number; height?: number } | null {
  const prstMatch = pXml.match(/<a:prstGeom\s+prst="([^"]+)"/)
  if (!prstMatch) return null
  const prst = prstMatch[1]
  let shapeType: "rectangle" | "circle" | "triangle" | null = null
  if (prst === "rect" || prst === "roundRect") shapeType = "rectangle"
  else if (prst === "ellipse") shapeType = "circle"
  else if (prst === "triangle" || prst === "rtTriangle") shapeType = "triangle"
  if (!shapeType) return null

  // <wps:spPr> can have attributes (e.g. bwMode="auto")  use [^>]* to match
  const spPr = pXml.match(/<wps:spPr[^>]*>([\s\S]*?)<\/wps:spPr>/)?.[1] ?? pXml
  const spPrNoLn = spPr.replace(/<a:ln[\s\S]*?<\/a:ln>/g, "")
  const hasNoFill = /<a:noFill[\s/>]/.test(spPrNoLn)
  const srgbFillM = spPrNoLn.match(/<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/)
  const sysFillM = spPrNoLn.match(/<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"/)
  const schemeFillM = spPrNoLn.match(/<a:schemeClr\s+val="([^"]+)"/)
  const fillHex = srgbFillM?.[1] ?? sysFillM?.[1] ?? (schemeFillM ? (SCHEME_COLORS[schemeFillM[1]] ?? "#FFFFFF").slice(1) : null)

  const lnXml = spPr.match(/<a:ln(?:\s[^>]*)?>[\s\S]*?<\/a:ln>/)?.[0] ?? ""
  const hasNoBorder = !lnXml || /<a:noFill[\s/>]/.test(lnXml)
  const { borderColor, borderWidth, borderStyle } = hasNoBorder ? {} : extractLineStyle(lnXml)

  // Size from wp:extent
  const extentMatch = pXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)
  const width = extentMatch ? Math.round(parseInt(extentMatch[1]) / 9525) : undefined
  const height = extentMatch ? Math.round(parseInt(extentMatch[2]) / 9525) : undefined

  // RoundRect radius from adj value per OOXML spec: adj/100000 * min(w, h)
  const adjMatch = spPr.match(/<a:gd\s+name="adj"\s+fmla="val\s+(\d+)"/)
  const borderRadius = prst === "roundRect"
    ? Math.round((adjMatch ? parseInt(adjMatch[1]) / 100000 : 0.16667) * Math.min(width ?? 100, height ?? 50))
    : undefined

  return {
    shapeType,
    fill: !hasNoFill && fillHex ? `#${fillHex}` : undefined,
    borderColor,
    borderWidth,
    borderStyle,
    borderRadius,
    width,
    height,
  }
}

function detectHorizontalRule(pPr: string): { thickness?: number; color?: string } | null {
  const bdrMatch = pPr.match(/<w:pBdr>([\s\S]*?)<\/w:pBdr>/)
  if (!bdrMatch) return null
  const bdrXml = bdrMatch[1]
  if (!/<w:bottom\s/.test(bdrXml) || /<w:top\s/.test(bdrXml)) return null
  const szMatch = bdrXml.match(/<w:bottom[^>]+w:sz="(\d+)"/)
  const colorMatch = bdrXml.match(/<w:bottom[^>]+w:color="([0-9A-Fa-f]{6})"/)
  return {
    thickness: szMatch ? parseInt(szMatch[1]) / 8 : 1,
    color: colorMatch ? `#${colorMatch[1]}` : undefined,
  }
}

function detectCheckbox(pXml: string, runs: RunInfo[]): { checked: boolean; label: string } | null {
  if (/<w14:checkbox/.test(pXml)) {
    const checkedMatch = pXml.match(/<w14:checked\s+w14:val="([^"]+)"/)
    const label = runs.map(r => r.text).join("").replace(/[☐☑✓✗]/g, "").trim()
    return { checked: checkedMatch?.[1] === "1", label }
  }
  if (/<w:instrText[^>]*>\s*FORMCHECKBOX/.test(pXml)) return { checked: false, label: "" }
  const fullText = runs.map(r => r.text).join("")
  if (/[☐☑✓]/.test(fullText)) {
    return { checked: /[☑✓]/.test(fullText), label: fullText.replace(/[☐☑✓✗]\s*/, "").trim() }
  }
  return null
}

// ─── Detectores de borda ──────────────────────────────────────────────────────

type TableStyleDef = { color?: string; width?: number; style?: string }

// Lê word/styles.xml e extrai bordas definidas por estilos de tabela (ex: TableGrid)
function parseTableStyles(stylesXml: string): Map<string, TableStyleDef> {
  const result = new Map<string, TableStyleDef>()
  const styleRe = /<w:style\s[^>]*w:type="table"[^>]*>([\s\S]*?)<\/w:style>/g
  let m: RegExpExecArray | null
  while ((m = styleRe.exec(stylesXml)) !== null) {
    const sXml = m[0]
    const idMatch = sXml.match(/w:styleId="([^"]+)"/)
    if (!idMatch) continue
    const bMatch = sXml.match(/<w:tblBorders>([\s\S]*?)<\/w:tblBorders>/)
    if (!bMatch) continue
    const sideMatch = bMatch[1].match(/<w:(?:top|left|bottom|right)\s([^/]+)/)
    if (!sideMatch) continue
    const val = sideMatch[1].match(/w:val="([^"]+)"/)?.[1]
    if (!val || val === "none" || val === "nil") continue
    const side = parseBorderSide(sideMatch[1])
    result.set(idMatch[1], { color: side.color, width: side.width, style: side.style })
  }
  return result
}

function parseTableBorders(
  tblXml: string,
  tableStyles: Map<string, TableStyleDef> = new Map(),
): { hasBorder: boolean; borderColor?: string; borderWidth?: number; borderStyle?: string } {
  // 1) Verifica bordas explícitas no próprio XML da tabela
  const m = tblXml.match(/<w:tblBorders>([\s\S]*?)<\/w:tblBorders>/)
  if (m) {
    const sideMatch = m[1].match(/<w:(?:top|left|bottom|right)\s([^/]+)/)
    if (sideMatch) {
      const val = sideMatch[1].match(/w:val="([^"]+)"/)?.[1]
      if (val && val !== "none" && val !== "nil") {
        const side = parseBorderSide(sideMatch[1])
        return { hasBorder: true, borderColor: side.color, borderWidth: side.width, borderStyle: side.style }
      }
    }
  }
  // 2) Fallback: resolve pelo estilo de tabela em styles.xml
  const styleId = tblXml.match(/<w:tblStyle\s+w:val="([^"]+)"/)?.[1]
  if (styleId) {
    const def = tableStyles.get(styleId)
    if (def) return { hasBorder: true, borderColor: def.color, borderWidth: def.width, borderStyle: def.style }
  }
  return { hasBorder: false }
}

// Depth-counting close-tag finder  handles nested tables/SDTs correctly
function findCloseTag(body: string, openPos: number, openTag1: string, openTag2: string, closeTag: string): number {
  let depth = 1
  let pos = openPos + openTag1.length
  while (pos < body.length && depth > 0) {
    const o1 = body.indexOf(openTag1, pos)
    const o2 = openTag2 ? body.indexOf(openTag2, pos) : -1
    const nextOpen = o1 === -1 ? o2 : o2 === -1 ? o1 : Math.min(o1, o2)
    const nextClose = body.indexOf(closeTag, pos)
    if (nextClose === -1) return -1
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Tags auto-fechadas (ex: <w:p .../>, parágrafo vazio) não têm closeTag próprio 
      // contá-las como abertura quebraria o depth-count para sempre. Pula sem incrementar.
      const tagEnd = body.indexOf(">", nextOpen)
      if (tagEnd !== -1 && body[tagEnd - 1] === "/") {
        pos = tagEnd + 1
        continue
      }
      depth++
      pos = nextOpen + openTag1.length
    } else {
      depth--
      if (depth === 0) return nextClose
      pos = nextClose + closeTag.length
    }
  }
  return -1
}

function parseBorderSide(attrStr: string): BorderSide {
  const valMatch = attrStr.match(/w:val="([^"]+)"/)
  const colorMatch = attrStr.match(/w:color="([0-9A-Fa-f]{6})"/)
  const szMatch = attrStr.match(/w:sz="(\d+)"/)
  const spaceMatch = attrStr.match(/w:space="(\d+)"/)
  const docxVal = valMatch?.[1] ?? "single"
  let style: BorderSide["style"] = "solid"
  if (docxVal === "double" || docxVal === "triple" || docxVal === "thinThickMediumGap" || docxVal === "thickThinMediumGap") style = "double"
  else if (docxVal.includes("dot")) style = "dotted"
  else if (docxVal.includes("dash")) style = "dashed"
  return {
    style,
    color: colorMatch ? `#${colorMatch[1]}` : undefined,
    // w:sz is in 1/8pt; convert to px at 96dpi
    width: szMatch ? Math.max(1, Math.round(parseInt(szMatch[1]) / 8 * 96 / 72)) : undefined,
    // w:space is in pt; convert to px
    space: spaceMatch ? Math.round(parseInt(spaceMatch[1]) * 96 / 72) : undefined,
  }
}

function parsePageBorder(xml: string): { hasBorder: boolean; pageBorder?: PageBorderProps; pageBorderOffsetFrom?: "page" | "text" } {
  const pgMatch = xml.match(/<w:pgBorders([^>]*)>([\s\S]*?)<\/w:pgBorders>/)
  if (!pgMatch) return { hasBorder: false }
  const attrs = pgMatch[1]
  const inner = pgMatch[2]
  const offsetFrom = /w:offsetFrom="text"/.test(attrs) ? "text" : "page"
  const pageBorder: PageBorderProps = {}
  let hasBorder = false
  for (const side of ["top", "bottom", "left", "right"] as const) {
    const sideRe = new RegExp(`<w:${side}\\s([^/]+)`)
    const sideMatch = inner.match(sideRe)
    if (!sideMatch) continue
    const val = sideMatch[1].match(/w:val="([^"]+)"/)?.[1]
    if (!val || val === "none" || val === "nil") continue
    pageBorder[side] = parseBorderSide(sideMatch[1])
    hasBorder = true
  }
  return { hasBorder, pageBorder: hasBorder ? pageBorder : undefined, pageBorderOffsetFrom: hasBorder ? offsetFrom : undefined }
}

// Cor de fundo da página, definida via "Design > Cor da Página" no Word (<w:background w:color="RRGGBB"/>,
// filho de <w:document>, fora do <w:body>).
function parsePageBackground(xml: string): string | undefined {
  const m = xml.match(/<w:background\s+[^>]*w:color="([0-9A-Fa-f]{6})"/)
  return m ? `#${m[1]}` : undefined
}

function parsePageMargins(xml: string): PageMargins | undefined {
  const m = xml.match(/<w:pgMar\s([^/]+)/)
  if (!m) return undefined
  const attr = m[1]
  const twipsToPx = (t: number) => Math.round(t * 96 / 1440)
  const get = (name: string): number | undefined => {
    const match = attr.match(new RegExp('w:' + name + '="(\\d+)"'))
    return match ? parseInt(match[1]) : undefined
  }
  const top = get("top"), right = get("right"), bottom = get("bottom"), left = get("left")
  if (!top && !right && !bottom && !left) return undefined
  const header = get("header")
  const footer = get("footer")
  return {
    top:    twipsToPx(top    ?? 1440),
    right:  twipsToPx(right  ?? 1800),
    bottom: twipsToPx(bottom ?? 1440),
    left:   twipsToPx(left   ?? 1800),
    ...(header !== undefined && { header: twipsToPx(header) }),
    ...(footer !== undefined && { footer: twipsToPx(footer) }),
  }
}

// ─── Agrupamento de listas ────────────────────────────────────────────────────

function groupListItems(elements: DocxElement[]): DocxElement[] {
  const result: DocxElement[] = []
  let i = 0
  while (i < elements.length) {
    const el = elements[i]
    if (el.type === "bullet-list" || el.type === "numbered-list") {
      const listType = el.type
      const items: string[] = [...el.items]
      while (i + 1 < elements.length && elements[i + 1].type === listType) {
        const next = elements[++i] as { items: string[] }
        items.push(...next.items)
      }
      result.push({ type: listType, items } as DocxElement)
    } else {
      result.push(el)
    }
    i++
  }
  return result
}

// ─── Line-spacing helper ──────────────────────────────────────────────────────

/** Extrai w:line / 240 de um fragmento de XML que pode conter <w:spacing>.
 *  Funciona independente da ordem dos atributos e só retorna valor para lineRule="auto". */
function extractLineSpacing(xml: string): number | undefined {
  const spacingTag = xml.match(/<w:spacing([^/]*)/)
  if (!spacingTag) return undefined
  const attrs = spacingTag[1]
  if (!/w:lineRule="auto"/.test(attrs)) return undefined
  const lineM = attrs.match(/\bw:line="(\d+)"/)
  if (!lineM) return undefined
  return Math.round((parseInt(lineM[1]) / 240) * 100) / 100
}

// ─── Crop helper ─────────────────────────────────────────────────────────────

function parseSrcRect(xml: string): { l: number; r: number; t: number; b: number } | undefined {
  const m = xml.match(/<a:srcRect([^/]*)/)
  if (!m) return undefined
  const attrs = m[1]
  const lv = (attrs.match(/\bl="(\d+)"/) ?? [])[1]
  const rv = (attrs.match(/\br="(\d+)"/) ?? [])[1]
  const tv = (attrs.match(/\bt="(\d+)"/) ?? [])[1]
  const bv = (attrs.match(/\bb="(\d+)"/) ?? [])[1]
  const l = lv ? parseInt(lv) / 100000 : 0
  const r = rv ? parseInt(rv) / 100000 : 0
  const t = tv ? parseInt(tv) / 100000 : 0
  const b = bv ? parseInt(bv) / 100000 : 0
  return (l || r || t || b) ? { l, r, t, b } : undefined
}

// ─── Parser de parágrafo ──────────────────────────────────────────────────────

function parseParagraphXml(
  pXml: string,
  relsMap: Map<string, string>,
  images: Map<string, string>,
  numberingMap: Map<string, "bullet" | "decimal">,
  defaultLineSpacing?: number,
  stylesXml = "",
  theme: { major?: string; minor?: string } = {},
): DocxElement | null {
  const pPr = (pXml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/) ?? [])[1] ?? ""

  // Espaçamento antes/depois do parágrafo (twips → px)
  const spacingAttrs = (pPr.match(/<w:spacing([^/]*)/) ?? [])[1] ?? ""
  const beforeM = spacingAttrs.match(/\bw:before="(\d+)"/)
  const afterM  = spacingAttrs.match(/\bw:after="(\d+)"/)
  const spaceBefore = beforeM ? Math.round(parseInt(beforeM[1]) * 96 / 1440) : undefined
  const spaceAfter  = afterM  ? Math.round(parseInt(afterM[1])  * 96 / 1440) : undefined

  if (detectPageBreak(pXml, pPr)) return { type: "page-break" }
  if (detectColumnBreak(pXml)) return { type: "column-break" }
  if (detectTOC(pXml)) return { type: "table-of-contents" }

  const mathText = detectMath(pXml)
  if (mathText !== null) return { type: "math", formula: mathText }

  // Text box (antes de imagem, pois wsp pode ter os dois)
  const textBox = detectTextBox(pXml)
  if (textBox) return { type: "text-box", ...textBox }

  // Shape (sem blip = sem imagem)
  if (!/<a:blip/.test(pXml)) {
    const shape = detectShape(pXml)
    if (shape) return { type: "shape", ...shape }
  }

  // Imagem
  const rIdMatch = pXml.match(/<a:blip[^>]+r:embed="([^"]+)"/)
  if (rIdMatch) {
    const target = relsMap.get(rIdMatch[1])
    if (target) {
      const key = target.replace(/^\.\.\//, "word/").replace(/^media\//, "word/media/")
      const dataUrl = images.get(key) ?? images.get(`word/media/${target.split("/").pop()}`)
      if (dataUrl) {
        const extentMatch = pXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)
        const crop = parseSrcRect(pXml)
        return {
          type: "image",
          dataUrl,
          align: resolveImageAlign(pXml, pPr),
          widthPx: extentMatch ? Math.round(parseInt(extentMatch[1]) / 9525) : undefined,
          heightPx: extentMatch ? Math.round(parseInt(extentMatch[2]) / 9525) : undefined,
          ...(crop && { crop }),
        }
      }
    }
    return null
  }

  // Linha horizontal
  const hrInfo = detectHorizontalRule(pPr)
  if (hrInfo) return { type: "horizontal-rule", ...hrInfo }

  // Runs
  const runs = parseRuns(pXml)

  // Fonte/tamanho do documento original: runs sem w:rFonts/w:sz inline herdam do estilo
  // do parágrafo (w:pStyle → w:basedOn → Normal → docDefaults), nunca da formatação do editor.
  const fallbackFont = stylesXml ? resolveParagraphFont(pPr, stylesXml, theme) : undefined
  const fallbackFontSize = stylesXml ? resolveParagraphFontSize(pPr, stylesXml) : undefined

  // Checkbox
  const checkboxInfo = detectCheckbox(pXml, runs)
  if (checkboxInfo) return { type: "checkbox", checked: checkboxInfo.checked, label: checkboxInfo.label || undefined }

  let text = runs.map(r => r.text).join("").trim()
  // Parágrafo feito só de campos dinâmicos (ex.: "PAGE / NUMPAGES")  depois de
  // stripFieldResultRuns() sobra só a pontuação/separador literal entre os campos (ex.: "/").
  // Tratar como vazio evita um traço solto no rodapé além da numeração real já reconstruída
  // via a flag `pageNumber` (ver parseHeaderFooterFile).
  if (text && /<w:fldChar/.test(pXml) && !/[\p{L}\p{N}]/u.test(text)) text = ""

  // Parágrafo que só existe pra carregar <w:sectPr> (fim de seção  margens/borda de página,
  // já extraídas à parte por parsePageMargins/parsePageBorder) não é conteúdo do autor: todo
  // documento/seção termina obrigatoriamente com um parágrafo assim, mesmo vazio. Tratá-lo como
  // "parágrafo vazio" comum criava uma linha em branco fantasma logo após a tabela do cabeçalho,
  // sem nenhuma relação com o que o professor realmente digitou no MODELO.
  if (!text && /<w:sectPr[\s>]/.test(pPr)) return null

  if (!text) {
    // Empty paragraph  emit a spacer whose height matches Word's line height
    const lineRatio = extractLineSpacing(pPr) ?? defaultLineSpacing ?? 1.15
    // Font size from paragraph mark rPr (<w:sz> inside <w:pPr><w:rPr>)
    const szM = pPr.match(/<w:sz\s+w:val="(\d+)"/)
    const fontSizePx = szM ? Math.round(parseInt(szM[1]) / 2 * 96 / 72) : 16
    return { type: "paragraph", text: "", height: Math.round(lineRatio * fontSizePx) }
  }

  const align = paragraphAlign(pPr)

  // Título (heading)
  const level = getHeadingLevel(pPr)
  if (level) return { type: "heading", text, level, align }

  // Item de lista
  const listInfo = getListInfo(pPr)
  if (listInfo) {
    const listType = numberingMap.get(listInfo.numId) ?? "decimal"
    return {
      type: listType === "bullet" ? "bullet-list" : "numbered-list",
      items: [text],
      indent: listInfo.level || undefined,
    } as DocxElement
  }

  // Campo de formulário
  const isFormText = /<w:instrText[^>]*>\s*FORMTEXT/.test(pXml)
  const isFormPattern = /^[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ\s]{2,25}:\s*_{3,}/.test(text)
  if (isFormText || isFormPattern) {
    const labelMatch = text.match(/^([^:]+):/)
    const underscoreMatch = text.match(/_{3,}/)
    return {
      type: "form-field",
      label: labelMatch?.[1].trim(),
      lineLength: underscoreMatch ? underscoreMatch[0].length : undefined,
    }
  }

  // Line spacing: pPr do parágrafo → estilo (pStyle/Normal) → default do documento → single (1),
  // que é o comportamento real do Word quando nada é definido. Nunca deixa undefined aqui, senão
  // o CSS herdaria o espaçamento do preset de formatação do editor em vez do original do docx.
  const lineSpacing = extractLineSpacing(pPr)
    ?? (stylesXml ? resolveParagraphLineSpacing(pPr, stylesXml) : undefined)
    ?? defaultLineSpacing
    ?? 1

  // Runs com formatação mista → tipo "run"
  const hasFormatDiff = runs.length > 1 && runs.some(r =>
    r.bold !== runs[0].bold ||
    r.italic !== runs[0].italic ||
    r.underline !== runs[0].underline ||
    r.subscript !== runs[0].subscript ||
    r.superscript !== runs[0].superscript ||
    r.highlight !== runs[0].highlight ||
    r.color !== runs[0].color ||
    r.fontSize !== runs[0].fontSize ||
    r.fontFamily !== runs[0].fontFamily ||
    r.characterSpacing !== runs[0].characterSpacing
  )
  if (hasFormatDiff) {
    const runsWithFont = (fallbackFont || fallbackFontSize)
      ? runs.map(r => ({ ...r, fontFamily: r.fontFamily ?? fallbackFont, fontSize: r.fontSize ?? fallbackFontSize }))
      : runs
    return { type: "run", runs: runsWithFont, ...(spaceBefore !== undefined && { spaceBefore }), ...(spaceAfter !== undefined && { spaceAfter }), lineSpacing }
  }

  // Parágrafo simples
  const r = runs[0]
  return {
    type: "paragraph",
    text,
    align,
    bold: r?.bold || undefined,
    italic: r?.italic || undefined,
    underline: r?.underline || undefined,
    subscript: r?.subscript || undefined,
    superscript: r?.superscript || undefined,
    highlight: r?.highlight,
    fontSize: r?.fontSize ?? fallbackFontSize,
    color: r?.color,
    fontFamily: r?.fontFamily ?? fallbackFont,
    lineSpacing,
    ...(r?.characterSpacing !== undefined && { characterSpacing: r.characterSpacing }),
    ...(spaceBefore !== undefined && { spaceBefore }),
    ...(spaceAfter  !== undefined && { spaceAfter }),
  }
}

// ─── Parser de tabela ─────────────────────────────────────────────────────────

function parseTableXml(
  tblXml: string,
  relsMap: Map<string, string>,
  images: Map<string, string>,
  numberingMap: Map<string, "bullet" | "decimal">,
  tableStyles: Map<string, TableStyleDef> = new Map(),
  stylesXml = "",
  theme: { major?: string; minor?: string } = {},
): DocxElement {
  const rows: { cells: { elements: DocxElement[]; colspan?: number; rowspan?: number; width?: number }[] }[] = []

  // Depth-aware row scan  a <w:tc> can itself contain a nested <w:tbl>, whose own
  // <w:tr> tags would terminate a naive lazy regex early. findCloseTag correctly
  // skips past any such nested rows to find the TRUE closing tag of the outer row.
  let trPos = 0
  while (trPos < tblXml.length) {
    const trA = tblXml.indexOf("<w:tr>", trPos)
    const trB = tblXml.indexOf("<w:tr ", trPos)
    const trStart = trA === -1 ? trB : trB === -1 ? trA : Math.min(trA, trB)
    if (trStart === -1) break
    const trEnd = findCloseTag(tblXml, trStart, "<w:tr>", "<w:tr ", "</w:tr>")
    if (trEnd === -1) break
    const trXml = tblXml.slice(trStart, trEnd + "</w:tr>".length)
    trPos = trEnd + "</w:tr>".length

    const cells: { elements: DocxElement[]; colspan?: number; rowspan?: number; width?: number }[] = []

    // Same reasoning as above, one level down: a nested table's own <w:tc> tags
    // must not be mistaken for a sibling cell of the outer row.
    let tcPos = 0
    while (tcPos < trXml.length) {
      const tcA = trXml.indexOf("<w:tc>", tcPos)
      const tcB = trXml.indexOf("<w:tc ", tcPos)
      const tcStart = tcA === -1 ? tcB : tcB === -1 ? tcA : Math.min(tcA, tcB)
      if (tcStart === -1) break
      const tcEnd = findCloseTag(trXml, tcStart, "<w:tc>", "<w:tc ", "</w:tc>")
      if (tcEnd === -1) break
      const tcXml = trXml.slice(tcStart, tcEnd + "</w:tc>".length)
      tcPos = tcEnd + "</w:tc>".length

      // Pula células de continuação de rowspan
      if (/<w:vMerge(?:\s*\/>|[^>]*(?!restart)[^>]*\/>)/.test(tcXml) && !/<w:vMerge\s[^>]*restart/.test(tcXml)) continue

      const gridSpanMatch = tcXml.match(/<w:gridSpan\s+w:val="(\d+)"/)
      const colspan = gridSpanMatch ? parseInt(gridSpanMatch[1]) : undefined

      const tcWMatch = tcXml.match(/<w:tcW\s+w:w="(\d+)"\s+w:type="dxa"/)
      const cellWidth = tcWMatch ? Math.round(parseInt(tcWMatch[1]) * 96 / 1440) : undefined

      const vAlignVal = tcXml.match(/<w:vAlign\s+w:val="([^"]+)"/)?.[1]
      const vAlign: "top" | "center" | "bottom" | undefined =
        vAlignVal === "center" ? "center" : vAlignVal === "bottom" ? "bottom" : vAlignVal === "top" ? "top" : undefined

      // Walk the cell's own content in document order, splitting top-level
      // paragraphs from a top-level nested <w:tbl> (e.g. a "VALOR/NOTA" grid
      // inside a header-table cell) so the nested table survives as its own
      // "table" element instead of having its paragraphs flattened into the
      // outer cell's paragraph list.
      const cellElements: DocxElement[] = []
      let cPos = 0
      while (cPos < tcXml.length) {
        const pA = tcXml.indexOf("<w:p>", cPos)
        const pB = tcXml.indexOf("<w:p ", cPos)
        const pStart = pA === -1 ? pB : pB === -1 ? pA : Math.min(pA, pB)

        const nestedTblA = tcXml.indexOf("<w:tbl>", cPos)
        const nestedTblB = tcXml.indexOf("<w:tbl ", cPos)
        const nestedTblStart = nestedTblA === -1 ? nestedTblB : nestedTblB === -1 ? nestedTblA : Math.min(nestedTblA, nestedTblB)

        const firstPos = Math.min(pStart === -1 ? Infinity : pStart, nestedTblStart === -1 ? Infinity : nestedTblStart)
        if (!isFinite(firstPos)) break

        if (firstPos === nestedTblStart) {
          const nestedEnd = findCloseTag(tcXml, nestedTblStart, "<w:tbl>", "<w:tbl ", "</w:tbl>")
          if (nestedEnd === -1) break
          const nestedXml = tcXml.slice(nestedTblStart, nestedEnd + "</w:tbl>".length)
          cellElements.push(parseTableXml(nestedXml, relsMap, images, numberingMap, tableStyles, stylesXml, theme))
          cPos = nestedEnd + "</w:tbl>".length
        } else {
          const tagEnd = tcXml.indexOf(">", pStart)
          if (tagEnd !== -1 && tcXml[tagEnd - 1] === "/") {
            // Parágrafo vazio auto-fechado (<w:p .../>)
            cPos = tagEnd + 1
            continue
          }
          const pEnd = findCloseTag(tcXml, pStart, "<w:p>", "<w:p ", "</w:p>")
          if (pEnd === -1) break
          const pXml = tcXml.slice(pStart, pEnd + "</w:p>".length)
          const el = parseParagraphXml(pXml, relsMap, images, numberingMap, undefined, stylesXml, theme)
          if (el) cellElements.push(el)
          cPos = pEnd + "</w:p>".length
        }
      }

      cells.push({ elements: groupListItems(cellElements), ...(colspan && colspan > 1 ? { colspan } : {}), ...(cellWidth ? { width: cellWidth } : {}), ...(vAlign ? { vAlign } : {}) })
    }

    // <w:trHeight> sem w:hRule (o padrão da spec é "auto" quando omitido) é só uma dica legada 
    // o Word ignora w:val no layout real e a linha cresce conforme o conteúdo. Só herdamos uma
    // altura fixa quando o autor pediu explicitamente "atLeast"/"exact"; do contrário deixamos
    // height indefinido pra a linha se ajustar ao conteúdo (preview e exportação), evitando linhas
    // infladas por um w:val obsoleto (ex.: sobra de quando uma imagem maior ocupava a célula).
    const trHeightM = trXml.match(/<w:trHeight\s([^>]*)\/?>/)
    let rowHeight: number | undefined
    let heightRule: "atLeast" | "exact" | undefined
    if (trHeightM) {
      const valM = trHeightM[1].match(/w:val="(\d+)"/)
      const ruleM = trHeightM[1].match(/w:hRule="(atLeast|exact)"/)
      if (valM && ruleM) {
        rowHeight = Math.round(parseInt(valM[1]) * 96 / 1440)
        heightRule = ruleM[1] as "atLeast" | "exact"
      }
    }
    if (cells.length > 0) rows.push({ ...(rowHeight !== undefined ? { height: rowHeight, heightRule } : {}), cells })
  }

  const { hasBorder, borderColor, borderWidth, borderStyle } = parseTableBorders(tblXml, tableStyles)

  // Cell margins: <w:tblCellMar> in <w:tblPr>, fallback to Word default (0/108/0/108 dxa)
  const cellMarXml = tblXml.match(/<w:tblCellMar>([\s\S]*?)<\/w:tblCellMar>/)?.[1] ?? ""
  function dxaToPx(xml: string, side: string): number {
    const m = xml.match(new RegExp(`<w:${side}\\s[^/]*w:w="(\\d+)"[^/]*w:type="dxa"`))
    return m ? Math.round(parseInt(m[1]) * 96 / 1440) : side === "left" || side === "right" ? 7 : 0
  }
  const cellPad = {
    top: dxaToPx(cellMarXml, "top"),
    right: dxaToPx(cellMarXml, "right"),
    bottom: dxaToPx(cellMarXml, "bottom"),
    left: dxaToPx(cellMarXml, "left"),
  }

  // Table width: <w:tblW w:w="..." w:type="dxa|pct|auto">
  const tblWM = tblXml.match(/<w:tblW\s[^/]*\/?/)
  let tblW: number | undefined
  if (tblWM) {
    const wVal = tblWM[0].match(/w:w="(\d+)"/)
    const wType = tblWM[0].match(/w:type="([^"]+)"/)
    if (wVal && wType?.[1] === "dxa") tblW = Math.round(parseInt(wVal[1]) * 96 / 1440)
    // pct fica indefinido aqui (não há uma base fixa confiável pra converter) → cai no fallback abaixo
  }
  // type="auto" (ou tblW ausente) não é uma largura confiável pra layout real  igual ao w:val de
  // <w:trHeight> sem hRule, é só um resquício legado. A largura de fato vem de <w:tblGrid> (soma das
  // colunas), que é o que <w:tblLayout w:type="fixed"/> realmente usa pra desenhar a tabela. Sem esse
  // fallback, tabelas "auto" (comum em subtabelas dentro de célula) esticavam pra 100% do contêiner.
  if (tblW === undefined) {
    const gridM = tblXml.match(/<w:tblGrid>([\s\S]*?)<\/w:tblGrid>/)
    if (gridM) {
      const colWidths = [...gridM[1].matchAll(/<w:gridCol\s+w:w="(\d+)"/g)].map(m => parseInt(m[1]))
      if (colWidths.length > 0) tblW = Math.round(colWidths.reduce((a, b) => a + b, 0) * 96 / 1440)
    }
  }

  // Floating table position: <w:tblpPr ...>
  let floatY: number | undefined
  let tblpCenter: boolean | undefined
  let floatLeftFromText: number | undefined
  let floatRightFromText: number | undefined
  const tblpPrM = tblXml.match(/<w:tblpPr[^/]*\/?/)
  if (tblpPrM) {
    const p = tblpPrM[0]
    const tblpYM = p.match(/w:tblpY="(-?\d+)"/)
    if (tblpYM) floatY = Math.round(parseInt(tblpYM[1]) * 96 / 1440)
    if (/w:tblpXSpec="center"/.test(p)) tblpCenter = true
    const lfM = p.match(/w:leftFromText="(\d+)"/)
    const rfM = p.match(/w:rightFromText="(\d+)"/)
    if (lfM) floatLeftFromText = parseInt(lfM[1])
    if (rfM) floatRightFromText = parseInt(rfM[1])
  }

  return {
    type: "table",
    rows,
    borders: hasBorder,
    ...(borderColor && { borderColor }),
    ...(borderWidth && { borderWidth }),
    ...(borderStyle && { borderStyle }),
    ...(floatY !== undefined && { floatY }),
    ...(tblW !== undefined && { tblW }),
    ...(tblpCenter && { tblpCenter }),
    ...(floatLeftFromText !== undefined && { floatLeftFromText }),
    ...(floatRightFromText !== undefined && { floatRightFromText }),
    cellPad,
  }
}

// ─── Extração de anchors flutuantes (<wp:anchor>) ────────────────────────────

/** Lê o relativeFrom de <wp:positionV>  "paragraph" faz o Y ser relativo ao parágrafo que
 *  contém o anchor (precisa acumular a altura dos parágrafos anteriores pra virar posição
 *  absoluta na página); "margin"/"page"/outros já vêm como offset absoluto pronto, sem somar
 *  nada. Sem checar isso, todo anchor era tratado como se fosse sempre "paragraph". */
function getVRelativeFrom(anchorXml: string): string {
  const m = anchorXml.match(/<wp:positionV\s+relativeFrom="([^"]+)"/)
  return m?.[1] ?? "paragraph"
}

/** Mesma ideia de `getVRelativeFrom`, pro eixo horizontal (`<wp:positionH relativeFrom=...>`). */
function getHRelativeFrom(anchorXml: string): string {
  const m = anchorXml.match(/<wp:positionH\s+relativeFrom="([^"]+)"/)
  return m?.[1] ?? "column"
}

/** Offset (em px) do container onde o cabeçalho é desenhado até a borda física da página  usado
 *  só pra anchors de CABEÇALHO com `relativeFrom="page"` (ver `adjustPageRelative`). Sem isso, um
 *  logo com `positionH/V relativeFrom="page"` (comum em papéis timbrados  a posição é combinada
 *  a partir da borda da página, não da margem) ficava deslocado pela margem inteira além do
 *  esperado: nosso container do cabeçalho já começa na margem (`RepeatingHeader` tem
 *  `paddingLeft: effectiveMargins.left`), então somar a posição-desde-a-página por cima empurrava
 *  tudo margem+posição pra direita/baixo em vez de só posição (ver relato de bug no cabeçalho da
 *  UPF: moldura+logo apareciam bem mais à direita/abaixo do que no Word). */
interface HeaderPageOffset {
  leftPx: number
  topPx: number
}

/** Ajusta um valor de posição (px) extraído de `<wp:posOffset>`  quando `relativeFrom` é
 *  "page" e temos o offset do container até a borda da página, subtrai esse offset (a posição já
 *  "inclui" a margem, que nosso container já aplica sozinho via padding). Nos demais casos
 *  (`relativeFrom` "margin"/"column"/"paragraph", ou sem `offset` disponível  ex.: anchors do
 *  corpo do documento, não tocadas por este fix) devolve o valor como veio, comportamento
 *  inalterado. */
function adjustPageRelative(px: number, relativeFrom: string, offsetPx: number | undefined): number {
  if (relativeFrom !== "page" || offsetPx === undefined) return px
  return px - offsetPx
}

/** Quando a imagem está dentro de um grupo (`<wpg:wgp>`, ex.: logo + moldura decorativa
 *  agrupados no cabeçalho), o `<wp:extent>`/`<wp:positionH/V>` do `<wp:anchor>` descrevem o
 *  GRUPO inteiro, não a imagem sozinha  que costuma ser bem menor e deslocada dentro dele. Sem
 *  isso, a imagem era desenhada do tamanho do grupo todo (ex.: quase a largura inteira do
 *  cabeçalho), estourando por cima do texto ao lado (ver relato de bug com cabeçalho da UPF).
 *  Resolve o `<a:xfrm>` próprio da imagem (dentro de `<pic:spPr>`, não o `<wps:spPr>` de
 *  shapes/text box) para coordenadas relativas ao `<wp:anchor>`, aplicando a escala do grupo
 *  (`chOff`/`chExt` → `off`/`ext`, ver OOXML §20.4.2.7)  `null` quando não há grupo (imagem
 *  "solta" direto no anchor), caso em que `<wp:extent>` já é a imagem, sem transformação. */
function groupChildImageTransform(anchorXml: string): { xEmu: number; yEmu: number; cxEmu: number; cyEmu: number } | null {
  if (!/<wpg:wgp>/.test(anchorXml)) return null

  const grpXfrmXml = anchorXml.match(/<wpg:grpSpPr>[\s\S]*?<a:xfrm>([\s\S]*?)<\/a:xfrm>/)?.[1]
  const grpOff   = grpXfrmXml?.match(/<a:off x="(-?\d+)" y="(-?\d+)"/)
  const grpExt   = grpXfrmXml?.match(/<a:ext cx="(\d+)" cy="(\d+)"/)
  const grpChOff = grpXfrmXml?.match(/<a:chOff x="(-?\d+)" y="(-?\d+)"/)
  const grpChExt = grpXfrmXml?.match(/<a:chExt cx="(\d+)" cy="(\d+)"/)
  if (!grpOff || !grpExt || !grpChOff || !grpChExt) return null

  // <pic:spPr>, especificamente  <wps:spPr> (shape/text box) também tem <a:xfrm> e casaria com
  // a regex genérica se não distinguirmos o namespace do elemento pai.
  const picXfrmXml = anchorXml.match(/<pic:spPr[^>]*>[\s\S]*?<a:xfrm>([\s\S]*?)<\/a:xfrm>/)?.[1]
  const picOff = picXfrmXml?.match(/<a:off x="(-?\d+)" y="(-?\d+)"/)
  const picExt = picXfrmXml?.match(/<a:ext cx="(\d+)" cy="(\d+)"/)
  if (!picOff || !picExt) return null

  const chExtCx = parseInt(grpChExt[1]), chExtCy = parseInt(grpChExt[2])
  const scaleX = chExtCx !== 0 ? parseInt(grpExt[1]) / chExtCx : 1
  const scaleY = chExtCy !== 0 ? parseInt(grpExt[2]) / chExtCy : 1

  return {
    xEmu: parseInt(grpOff[1]) + (parseInt(picOff[1]) - parseInt(grpChOff[1])) * scaleX,
    yEmu: parseInt(grpOff[2]) + (parseInt(picOff[2]) - parseInt(grpChOff[2])) * scaleY,
    cxEmu: parseInt(picExt[1]) * scaleX,
    cyEmu: parseInt(picExt[2]) * scaleY,
  }
}

/** Forma decorativa (moldura/borda) desenhada como geometria customizada (`<a:custGeom>`) e
 *  agrupada junto com uma imagem (ex.: logo com moldura no cabeçalho, ver relato de bug) 
 *  `detectShape` não reconhece geometria customizada (só `prstGeom`: rect/ellipse/triângulo), só
 *  a imagem do grupo era extraída e a moldura ficava de fora. Aproxima como um retângulo SEM
 *  preenchimento e com borda fina na cor do preenchimento original: o path desse tipo de forma
 *  costuma desenhar tiras finas formando um contorno (às vezes com um "vão" recortado onde a
 *  imagem entra), não uma área sólida  preencher o retângulo inteiro ficaria bem mais errado
 *  (um bloco colorido cobrindo o cabeçalho) do que aproximar como contorno.
 *  `null` quando não há grupo, ou o grupo não tem uma forma assim (a maioria não tem). */
function extractGroupBorderShape(anchorXml: string, headerOffset?: HeaderPageOffset): { element: DocxElement; vRelativeFrom: string } | null {
  if (!/<wpg:wgp>/.test(anchorXml)) return null

  const grpXfrmXml = anchorXml.match(/<wpg:grpSpPr>[\s\S]*?<a:xfrm>([\s\S]*?)<\/a:xfrm>/)?.[1]
  const grpOff   = grpXfrmXml?.match(/<a:off x="(-?\d+)" y="(-?\d+)"/)
  const grpExt   = grpXfrmXml?.match(/<a:ext cx="(\d+)" cy="(\d+)"/)
  const grpChOff = grpXfrmXml?.match(/<a:chOff x="(-?\d+)" y="(-?\d+)"/)
  const grpChExt = grpXfrmXml?.match(/<a:chExt cx="(\d+)" cy="(\d+)"/)
  if (!grpOff || !grpExt || !grpChOff || !grpChExt) return null

  // <wps:wsp> do grupo com geometria customizada e SEM txbxContent (senão é o balão de texto,
  // tratado por `detectTextBox`)  pega o primeiro que bater, é o caso comum de 1 moldura por grupo.
  const wspBlocks = anchorXml.match(/<wps:wsp>[\s\S]*?<\/wps:wsp>/g) ?? []
  const borderWsp = wspBlocks.find((w) => /<a:custGeom/.test(w) && !/<w:txbxContent/.test(w))
  if (!borderWsp) return null

  const xfrmXml = borderWsp.match(/<wps:spPr[^>]*>[\s\S]*?<a:xfrm>([\s\S]*?)<\/a:xfrm>/)?.[1]
  const off = xfrmXml?.match(/<a:off x="(-?\d+)" y="(-?\d+)"/)
  const ext = xfrmXml?.match(/<a:ext cx="(\d+)" cy="(\d+)"/)
  if (!off || !ext) return null

  const chExtCx = parseInt(grpChExt[1]), chExtCy = parseInt(grpChExt[2])
  const scaleX = chExtCx !== 0 ? parseInt(grpExt[1]) / chExtCx : 1
  const scaleY = chExtCy !== 0 ? parseInt(grpExt[2]) / chExtCy : 1
  const xEmuInGroup = parseInt(grpOff[1]) + (parseInt(off[1]) - parseInt(grpChOff[1])) * scaleX
  const yEmuInGroup = parseInt(grpOff[2]) + (parseInt(off[2]) - parseInt(grpChOff[2])) * scaleY
  const cxEmu = parseInt(ext[1]) * scaleX
  const cyEmu = parseInt(ext[2]) * scaleY

  const anchorHC = anchorXml.match(/<wp:positionH[^>]*>([\s\S]*?)<\/wp:positionH>/)?.[1] ?? ""
  const anchorVC = anchorXml.match(/<wp:positionV[^>]*>([\s\S]*?)<\/wp:positionV>/)?.[1] ?? ""
  const anchorXOff = parseInt(anchorHC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1] ?? "0")
  const anchorYOff = parseInt(anchorVC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1] ?? "0")

  const colorM = borderWsp.match(/<a:solidFill>\s*<a:srgbClr\s+val="([0-9A-Fa-f]{6})"/)
  const relHM = anchorXml.match(/\brelativeHeight="(\d+)"/)
  const rawX = Math.round((anchorXOff + xEmuInGroup) / 9525)
  const rawY = Math.round((anchorYOff + yEmuInGroup) / 9525)

  return {
    element: {
      type: "shape",
      shapeType: "rectangle",
      borderColor: colorM ? `#${colorM[1]}` : "#000000",
      borderWidth: 1,
      x: Math.max(0, adjustPageRelative(rawX, getHRelativeFrom(anchorXml), headerOffset?.leftPx)),
      y: Math.max(0, adjustPageRelative(rawY, getVRelativeFrom(anchorXml), headerOffset?.topPx)),
      width: Math.round(cxEmu / 9525),
      height: Math.round(cyEmu / 9525),
      relativeHeight: relHM ? parseInt(relHM[1]) : 0,
    },
    vRelativeFrom: getVRelativeFrom(anchorXml),
  }
}

function parseAnchorXml(
  anchorXml: string,
  relsMap: Map<string, string>,
  images: Map<string, string>,
  headerOffset?: HeaderPageOffset,
): { element: DocxElement; vRelativeFrom: string }[] {
  // relativeHeight drives z-order in Word (higher = on top)
  const relHM = anchorXml.match(/\brelativeHeight="(\d+)"/)
  const relativeHeight = relHM ? parseInt(relHM[1]) : 0
  const vRelativeFrom = getVRelativeFrom(anchorXml)

  // Imagem (tem blip, sem text box)
  const rIdMatch = anchorXml.match(/<a:blip[^>]+r:embed="([^"]+)"/)
  if (rIdMatch && !/<w:txbxContent/.test(anchorXml)) {
    const target = relsMap.get(rIdMatch[1])
    if (target) {
      const key = target.replace(/^\.\.\//, "word/").replace(/^media\//, "word/media/")
      const dataUrl = images.get(key) ?? images.get(`word/media/${target.split("/").pop()}`)
      if (dataUrl) {
        const extM = anchorXml.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)
        const imgHC = anchorXml.match(/<wp:positionH[^>]*>([\s\S]*?)<\/wp:positionH>/)?.[1] ?? ""
        const imgVC = anchorXml.match(/<wp:positionV[^>]*>([\s\S]*?)<\/wp:positionV>/)?.[1] ?? ""
        const imgX = imgHC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]
        const imgY = imgVC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]
        const behindDoc = /\bbehindDoc="1"/.test(anchorXml)
        const crop = parseSrcRect(anchorXml)
        // Extract text-wrap type from the anchor XML
        const wrapType: "none" | "square" | "tight" | "topAndBottom" =
          /<wp:wrapTight/.test(anchorXml) ? "tight" :
          /<wp:wrapSquare/.test(anchorXml) ? "square" :
          /<wp:wrapTopAndBottom/.test(anchorXml) ? "topAndBottom" :
          "none"
        // Imagem agrupada (ver groupChildImageTransform)  usa o tamanho/posição próprios da
        // imagem dentro do grupo em vez do <wp:extent>/<wp:positionH/V> do anchor, que descrevem
        // o grupo inteiro (moldura + imagem etc.), não só a imagem.
        const group = groupChildImageTransform(anchorXml)
        const widthCx  = group ? group.cxEmu : extM ? parseInt(extM[1]) : undefined
        const heightCy = group ? group.cyEmu : extM ? parseInt(extM[2]) : undefined
        const xEmu = group ? (imgX ? parseInt(imgX) : 0) + group.xEmu : imgX ? parseInt(imgX) : undefined
        const yEmu = group ? (imgY ? parseInt(imgY) : 0) + group.yEmu : imgY ? parseInt(imgY) : undefined
        const widthPx = widthCx !== undefined ? Math.round(widthCx / 9525) : undefined
        // <wp:positionH> pode usar <wp:align> (esquerda/centro/direita) em vez de <wp:posOffset> 
        // sem esse fallback a imagem ficava com x undefined, `isPositioned()` deixava de reconhecê-la
        // como anchor e ela caía pro fluxo normal, quebrando a ordem de leitura (o resto do
        // cabeçalho, todo em anchors, sempre é desenhado antes do fluxo  ver AnchorLayer/computeAnchorsAndFlow).
        const imgHAlign = imgHC.match(/<wp:align>([^<]+)<\/wp:align>/)?.[1]
        const rawX = xEmu !== undefined
          ? Math.round(xEmu / 9525)
          : imgHAlign === "right" && widthPx  ? Math.max(0, 700 - widthPx)
          : imgHAlign === "center" && widthPx ? Math.max(0, (700 - widthPx) / 2)
          : imgHAlign ? 0 // "left", ou center/right sem largura conhecida  aproxima como esquerda
          : undefined
        const rawY = yEmu !== undefined ? Math.round(yEmu / 9525) : undefined
        // Moldura/borda agrupada com a imagem (ver extractGroupBorderShape)  entra ANTES da
        // imagem no array pra ficar atrás dela na pilha visual quando o relativeHeight empata
        // (AnchorLayer ordena por relativeHeight, mas empates preservam a ordem de inserção).
        const borderShape = extractGroupBorderShape(anchorXml, headerOffset)
        return [
          ...(borderShape ? [borderShape] : []),
          {
            element: {
              type: "image",
              dataUrl,
              widthPx,
              heightPx: heightCy !== undefined ? Math.round(heightCy / 9525) : undefined,
              x: rawX !== undefined ? Math.max(0, adjustPageRelative(rawX, getHRelativeFrom(anchorXml), headerOffset?.leftPx)) : undefined,
              y: rawY !== undefined ? Math.max(0, adjustPageRelative(rawY, vRelativeFrom, headerOffset?.topPx)) : undefined,
              behindDoc,
              relativeHeight,
              wrapType,
              ...(crop && { crop }),
            },
            vRelativeFrom,
          },
        ]
      }
    }
    return []
  }

  // Text box
  if (/<w:txbxContent/.test(anchorXml)) {
    const textBox = detectTextBox(anchorXml, headerOffset)
    if (textBox) return [{ element: { type: "text-box", ...textBox, relativeHeight }, vRelativeFrom }]
  }

  // Shape puro (sem imagem, sem text box)
  const shape = detectShape(anchorXml)
  if (shape) {
    // Extract H/V content first to avoid cross-element regex bleeding
    const shpHC = anchorXml.match(/<wp:positionH[^>]*>([\s\S]*?)<\/wp:positionH>/)?.[1] ?? ""
    const shpVC = anchorXml.match(/<wp:positionV[^>]*>([\s\S]*?)<\/wp:positionV>/)?.[1] ?? ""
    const shpHOffset = shpHC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]
    const shpVOffset = shpVC.match(/<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]
    const shpHAlign = shpHC.match(/<wp:align>([^<]+)<\/wp:align>/)?.[1]
    let shapeX: number | undefined
    if (shpHOffset) shapeX = Math.max(0, adjustPageRelative(Math.round(parseInt(shpHOffset) / 9525), getHRelativeFrom(anchorXml), headerOffset?.leftPx))
    else if (shpHAlign === "right" && shape.width) shapeX = Math.max(0, 700 - shape.width)
    else if (shpHAlign === "center" && shape.width) shapeX = Math.max(0, (700 - shape.width) / 2)
    else if (shpHAlign === "left") shapeX = 0
    return [{
      element: {
        type: "shape",
        ...shape,
        x: shapeX,
        y: shpVOffset ? Math.max(0, adjustPageRelative(Math.round(parseInt(shpVOffset) / 9525), vRelativeFrom, headerOffset?.topPx)) : undefined,
        relativeHeight,
      },
      vRelativeFrom,
    }]
  }

  // Última tentativa: grupo com uma moldura de geometria customizada mas sem imagem nem texto
  // reconhecidos acima (ex.: só a moldura sozinha)  mesma extração usada junto da imagem.
  const soloBorderShape = extractGroupBorderShape(anchorXml, headerOffset)
  return soloBorderShape ? [soloBorderShape] : []
}

// Extrai todos os <wp:anchor> de um parágrafo e converte em DocxElements.
// <wp:anchor> não aninham, então indexOf simples é suficiente.
function extractAnchorElements(
  pXml: string,
  relsMap: Map<string, string>,
  images: Map<string, string>,
  headerOffset?: HeaderPageOffset,
): { element: DocxElement; vRelativeFrom: string }[] {
  if (!/<wp:anchor/.test(pXml)) return []
  const results: { element: DocxElement; vRelativeFrom: string }[] = []
  let pos = 0
  while (pos < pXml.length) {
    const aStart = pXml.indexOf("<wp:anchor", pos)
    if (aStart === -1) break
    const aEnd = pXml.indexOf("</wp:anchor>", aStart)
    if (aEnd === -1) break
    results.push(...parseAnchorXml(pXml.slice(aStart, aEnd + 12), relsMap, images, headerOffset))
    pos = aEnd + 12
  }
  return results
}

// ─── Parser do corpo do documento ────────────────────────────────────────────

function parseBodyXml(
  xml: string,
  relsMap: Map<string, string>,
  images: Map<string, string>,
  numberingMap: Map<string, "bullet" | "decimal">,
  tableStyles: Map<string, TableStyleDef> = new Map(),
  defaultLineSpacing?: number,
  addBoundaries = false,
  stylesXml = "",
  theme: { major?: string; minor?: string } = {},
  // Só usado ao parsear CABEÇALHO (ver chamada em parseDocxBuffer)  offset do container do
  // cabeçalho até a borda da página, pra corrigir anchors com relativeFrom="page" (ver
  // HeaderPageOffset/adjustPageRelative). `undefined` no corpo do documento e no rodapé
  // preserva o comportamento de sempre (sem esse ajuste).
  headerOffset?: HeaderPageOffset,
): DocxElement[] {
  const elements: DocxElement[] = []
  const bodyMatch = xml.match(/<w:body>([\s\S]*?)(?:<\/w:body>|$)/)
  const body = bodyMatch ? bodyMatch[1] : xml
  let pos = 0
  let anchorRowY = 0  // running cumulative y for anchor paragraphs (relativeFrom="paragraph" → absolute)

  while (pos < body.length) {
    const tblA = body.indexOf("<w:tbl>", pos)
    const tblB = body.indexOf("<w:tbl ", pos)
    const tblStart = tblA === -1 ? tblB : tblB === -1 ? tblA : Math.min(tblA, tblB)

    const pA = body.indexOf("<w:p>", pos)
    const pB = body.indexOf("<w:p ", pos)
    const pStart = pA === -1 ? pB : pB === -1 ? pA : Math.min(pA, pB)

    const sdtStart = body.indexOf("<w:sdt>", pos)

    if (tblStart === -1 && pStart === -1 && sdtStart === -1) break

    const firstPos = Math.min(
      tblStart !== -1 ? tblStart : Infinity,
      pStart !== -1 ? pStart : Infinity,
      sdtStart !== -1 ? sdtStart : Infinity,
    )

    if (firstPos === tblStart) {
      // Use depth-counting to handle nested tables correctly
      const endIdx = findCloseTag(body, tblStart, "<w:tbl>", "<w:tbl ", "</w:tbl>")
      if (endIdx === -1) break
      elements.push(parseTableXml(body.slice(tblStart, endIdx + 8), relsMap, images, numberingMap, tableStyles, stylesXml, theme))
      pos = endIdx + 8
    } else if (firstPos === sdtStart) {
      const endIdx = findCloseTag(body, sdtStart, "<w:sdt>", "", "</w:sdt>")
      if (endIdx === -1) break
      const sdtXml = body.slice(sdtStart, endIdx + 8)

      if (/<w14:checkbox/.test(sdtXml) || /<w:instrText[^>]*>\s*FORMCHECKBOX/.test(sdtXml)) {
        const checkedMatch = sdtXml.match(/<w14:checked\s+w14:val="([^"]+)"/)
        elements.push({
          type: "checkbox",
          checked: checkedMatch?.[1] === "1",
          label: extractPlainText(sdtXml).trim() || undefined,
        })
      } else {
        // Recursively parse the sdtContent as a mini-body (handles tables inside SDTs)
        const contentMatch = sdtXml.match(/<w:sdtContent>([\s\S]*?)<\/w:sdtContent>/)
        const innerXml = contentMatch ? contentMatch[1] : sdtXml
        const innerElements = parseBodyXml(innerXml, relsMap, images, numberingMap, tableStyles, defaultLineSpacing, false, stylesXml, theme)
        elements.push(...innerElements)
      }
      pos = endIdx + 8
    } else if ((() => { const t = body.indexOf(">", pStart); return t !== -1 && body[t - 1] === "/" })()) {
      // Parágrafo vazio auto-fechado (<w:p .../>)  sem conteúdo e sem tag de fechamento própria
      const tagEnd = body.indexOf(">", pStart)
      const lineRatio = defaultLineSpacing ?? 1.15
      elements.push({ type: "paragraph", text: "", height: Math.round(lineRatio * 16) })
      if (addBoundaries) elements.push({ type: "paragraph-boundary" })
      pos = tagEnd + 1
    } else {
      // Depth-count to find the TRUE outer </w:p>  avoids truncating inside txbxContent
      const endIdx = findCloseTag(body, pStart, "<w:p>", "<w:p ", "</w:p>")
      if (endIdx === -1) break
      const pXml = body.slice(pStart, endIdx + 6)

      // Floating anchors take priority: extract each <wp:anchor> independently so
      // each gets its own correct extent/position and shadow-text runs are ignored.
      const anchorPairs = extractAnchorElements(pXml, relsMap, images, headerOffset)
      if (anchorPairs.length > 0) {
        // Base row height from paragraph text (sz in <w:pPr><w:rPr>), matches Word's actual paragraph height
        const szM = pXml.match(/<w:pPr>[\s\S]*?<w:sz w:val="(\d+)"/)
        const szHalfPts = szM ? parseInt(szM[1]) : 24
        const textH = Math.round(szHalfPts / 2 * (96 / 72) * 1.125)
        // Row height rules (matching Word's paragraph layout for floating anchors):
        //   behindDoc images → excluded (they float behind text, don't push paragraph height)
        //   shapes → y + extent_h + border*2 (border adds outside the extent in Word)
        //   bordered text-boxes (input fields) → y + extent_h + body padding (tIns+bIns ≈ 10px)
        //   unbordered text-boxes (labels) → excluded; but track maxLabelY for correction below
        //   non-behindDoc images → y + height as usual
        let rowHeight = textH
        let maxLabelY = 0
        for (const { element: el } of anchorPairs) {
          if (el.type === "image" && (el as { behindDoc?: boolean }).behindDoc) continue
          const elY = (el as { y?: number }).y ?? 0
          if (el.type === "shape") {
            const shH = (el.height ?? 0) + ((el.borderWidth ?? 0) * 2)
            rowHeight = Math.max(rowHeight, elY + shH)
          } else if (el.type === "text-box" && (el.borderWidth ?? 0) > 0) {
            rowHeight = Math.max(rowHeight, elY + el.height + 10)
          } else if (el.type === "text-box") {
            maxLabelY = Math.max(maxLabelY, elY)
          } else if (el.type === "image") {
            rowHeight = Math.max(rowHeight, elY + (el.heightPx ?? 0))
          }
        }
        // When labels are positioned within the text height (maxLabelY < textH), Word's
        // internal font metrics produce ~6px more height than the simple calculation.
        if (maxLabelY > 0 && maxLabelY < textH) rowHeight = Math.max(rowHeight, textH + 6)
        // Shift each anchor's y by the running cumulative offset  mas só quando o anchor é
        // relativeFrom="paragraph" de fato. Quando é "margin"/"page", o posOffset já é absoluto
        // em relação à página e somar o acumulado duplicaria o deslocamento (ver getVRelativeFrom).
        const cumulativeY = anchorRowY
        const shifted = anchorPairs.map(({ element: el, vRelativeFrom }) => {
          const isParagraphRelative = vRelativeFrom === "paragraph"
          const offset = isParagraphRelative ? cumulativeY : 0
          if (el.type === "text-box") return { ...el, y: offset + Math.max(0, el.y) }
          if (el.type === "image" && el.y !== undefined) return { ...el, y: offset + el.y }
          if (el.type === "shape" && el.y !== undefined) return { ...el, y: offset + el.y }
          return el
        })
        anchorRowY += rowHeight
        elements.push(...shifted)
        // Also capture inline text runs that coexist with drawings in the same paragraph
        // (e.g., a heading alongside a floating logo image or text-box anchors).
        // Strip <w:drawing> and <mc:AlternateContent> so only pure text runs remain.
        const pXmlNoDrawings = pXml
          .replace(/<w:drawing[\s\S]*?<\/w:drawing>/g, "")
          .replace(/<mc:AlternateContent[\s\S]*?<\/mc:AlternateContent>/g, "")
        const inlineEl = parseParagraphXml(pXmlNoDrawings, relsMap, images, numberingMap, defaultLineSpacing, stylesXml, theme)
        // Only add if it has actual content  anchor-host paragraphs produce empty spacers that
        // should not appear as flow elements (the anchor itself is already in anchorEls).
        if (inlineEl && (inlineEl.type !== "paragraph" || inlineEl.text)) elements.push(inlineEl)
      } else {
        const el = parseParagraphXml(pXml, relsMap, images, numberingMap, defaultLineSpacing, stylesXml, theme)
        if (el) elements.push(el)
      }
      if (addBoundaries) elements.push({ type: "paragraph-boundary" })
      pos = endIdx + 6
    }
  }

  return groupListItems(elements)
}


// ─── Extração de estilo padrão do header ──────────────────────────────────────

// Lê word/theme/theme1.xml e devolve os nomes reais das fontes major/minor.
// Documentos modernos do Word usam w:asciiTheme="minorHAnsi" em vez de w:ascii="Calibri";
// sem resolver o tema, a fonte fica invisível para o extrator.
function parseThemeFonts(themeXml: string): { major?: string; minor?: string } {
  const majorM = themeXml.match(/<a:majorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/)
  const minorM = themeXml.match(/<a:minorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/)
  return { major: majorM?.[1], minor: minorM?.[1] }
}

// Extrai fonte explícita (w:ascii/w:hAnsi) ou resolve referência de tema.
function resolveFontFromXml(xml: string, theme: { major?: string; minor?: string }): string | undefined {
  const explicit = xml.match(/w:(?:ascii|hAnsi)="([^"+][^"]*)"/)
  if (explicit) return explicit[1]
  const themeRef = xml.match(/w:(?:ascii|hAnsi)Theme="([^"]+)"/)
  if (!themeRef) return undefined
  const ref = themeRef[1].toLowerCase()
  if (ref.includes("minor")) return theme.minor
  if (ref.includes("major")) return theme.major
  return undefined
}

// ─── Fonte original de parágrafos/tabelas do corpo do documento ──────────────
// Quando um run não define fonte inline (w:rFonts no próprio w:rPr), o Word resolve
// visualmente pela cadeia de estilos: w:pStyle do parágrafo → w:basedOn (recursivo) →
// estilo "Normal" → w:docDefaults. Sem isso, esses runs ficariam sem fontFamily e o
// preview usaria a fonte escolhida no editor em vez da fonte real do MODELO.docx.

function findStyleBlockById(stylesXml: string, styleId: string): string | undefined {
  const re = new RegExp(`<w:style\\s[^>]*w:styleId="${styleId}"[^>]*>([\\s\\S]*?)<\\/w:style>`)
  return stylesXml.match(re)?.[1]
}

function resolveStyleChainFont(
  styleId: string | undefined,
  stylesXml: string,
  theme: { major?: string; minor?: string },
  depth = 0,
): string | undefined {
  if (!styleId || depth > 8) return undefined
  const block = findStyleBlockById(stylesXml, styleId)
  if (!block) return undefined
  const rPr = block.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ""
  const font = resolveFontFromXml(rPr, theme)
  if (font) return font
  const basedOn = block.match(/<w:basedOn\s+w:val="([^"]+)"/)?.[1]
  return basedOn && basedOn !== styleId ? resolveStyleChainFont(basedOn, stylesXml, theme, depth + 1) : undefined
}

function resolveDocumentDefaultFont(stylesXml: string, theme: { major?: string; minor?: string }): string | undefined {
  const styleBlocks = stylesXml.match(/<w:style\s[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/g) ?? []
  for (const block of styleBlocks) {
    if (/<w:name\s+w:val="Normal"[^>]*>/i.test(block)) {
      const rPr = block.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ""
      const font = resolveFontFromXml(rPr, theme)
      if (font) return font
      break
    }
  }
  const defXml = stylesXml.match(/<w:docDefaults>([\s\S]*?)<\/w:docDefaults>/)?.[1] ?? ""
  return resolveFontFromXml(defXml, theme)
}

// Resolve a fonte "real" de um parágrafo do corpo do docx, seguindo a mesma cadeia
// de herança que o Word usa quando o run não define w:rFonts inline.
function resolveParagraphFont(pPr: string, stylesXml: string, theme: { major?: string; minor?: string }): string | undefined {
  const pStyleId = pPr.match(/<w:pStyle\s+w:val="([^"]+)"/)?.[1]
  return resolveStyleChainFont(pStyleId, stylesXml, theme) ?? resolveDocumentDefaultFont(stylesXml, theme)
}

// Mesma cadeia de herança (w:pStyle → w:basedOn → Normal → docDefaults), mas para o
// tamanho da fonte (w:sz, em meio-pontos → convertido para pontos).
function resolveStyleChainSize(styleId: string | undefined, stylesXml: string, depth = 0): number | undefined {
  if (!styleId || depth > 8) return undefined
  const block = findStyleBlockById(stylesXml, styleId)
  if (!block) return undefined
  const rPr = block.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ""
  const szM = rPr.match(/<w:sz\s+w:val="(\d+)"/)
  if (szM) return parseInt(szM[1]) / 2
  const basedOn = block.match(/<w:basedOn\s+w:val="([^"]+)"/)?.[1]
  return basedOn && basedOn !== styleId ? resolveStyleChainSize(basedOn, stylesXml, depth + 1) : undefined
}

function resolveDocumentDefaultSize(stylesXml: string): number | undefined {
  const styleBlocks = stylesXml.match(/<w:style\s[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/g) ?? []
  for (const block of styleBlocks) {
    if (/<w:name\s+w:val="Normal"[^>]*>/i.test(block)) {
      const rPr = block.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? ""
      const szM = rPr.match(/<w:sz\s+w:val="(\d+)"/)
      if (szM) return parseInt(szM[1]) / 2
      break
    }
  }
  const defXml = stylesXml.match(/<w:docDefaults>([\s\S]*?)<\/w:docDefaults>/)?.[1] ?? ""
  const szM = defXml.match(/<w:sz\s+w:val="(\d+)"/)
  return szM ? parseInt(szM[1]) / 2 : undefined
}

// Resolve o tamanho "real" de um parágrafo do corpo do docx, mesma cadeia usada para a fonte.
function resolveParagraphFontSize(pPr: string, stylesXml: string): number | undefined {
  const pStyleId = pPr.match(/<w:pStyle\s+w:val="([^"]+)"/)?.[1]
  return resolveStyleChainSize(pStyleId, stylesXml) ?? resolveDocumentDefaultSize(stylesXml)
}

// Mesma cadeia (w:pStyle → w:basedOn → Normal), mas para o espaçamento entre linhas
// (<w:spacing w:line="..." w:lineRule="auto"> dentro do w:pPr do estilo, não do w:rPr).
function resolveStyleChainLineSpacing(styleId: string | undefined, stylesXml: string, depth = 0): number | undefined {
  if (!styleId || depth > 8) return undefined
  const block = findStyleBlockById(stylesXml, styleId)
  if (!block) return undefined
  const pPrBlock = block.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? ""
  const spacing = extractLineSpacing(pPrBlock)
  if (spacing !== undefined) return spacing
  const basedOn = block.match(/<w:basedOn\s+w:val="([^"]+)"/)?.[1]
  return basedOn && basedOn !== styleId ? resolveStyleChainLineSpacing(basedOn, stylesXml, depth + 1) : undefined
}

// Resolve o espaçamento de linha "real" de um parágrafo, seguindo o pStyle e depois o
// próprio estilo "Normal" (o <w:pPrDefault> do documento já é tratado à parte, via defaultLineSpacing).
function resolveParagraphLineSpacing(pPr: string, stylesXml: string): number | undefined {
  const pStyleId = pPr.match(/<w:pStyle\s+w:val="([^"]+)"/)?.[1]
  const fromStyle = resolveStyleChainLineSpacing(pStyleId, stylesXml)
  if (fromStyle !== undefined) return fromStyle
  const styleBlocks = stylesXml.match(/<w:style\s[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/g) ?? []
  for (const block of styleBlocks) {
    if (/<w:name\s+w:val="Normal"[^>]*>/i.test(block)) {
      const pPrBlock = block.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? ""
      return extractLineSpacing(pPrBlock)
    }
  }
  return undefined
}

// Extrai tamanho (half-pts) e espaçamento de linha de um fragmento XML.
function extractSizeAndSpacing(xml: string): Pick<HeaderStyle, "fontSize" | "lineRule"> {
  const style: Pick<HeaderStyle, "fontSize" | "lineRule"> = {}
  const szM = xml.match(/<w:sz\s+w:val="(\d+)"/)
  if (szM) style.fontSize = parseInt(szM[1])
  const lineM  = xml.match(/\bw:line="(\d+)"/)
  const ruleM  = xml.match(/\bw:lineRule="auto"/)
  if (lineM && ruleM) style.lineRule = parseInt(lineM[1])
  return style
}

// Resolve o estilo padrão do cabeçalho com fallback em 4 níveis:
// 1. Inline nos runs/parágrafos do próprio XML do header
// 2. Estilo "Header/Cabeçalho" em styles.xml
// 3. Estilo "Normal" em styles.xml (base da herança da maioria dos estilos)
// 4. Defaults do documento (<w:docDefaults>) em styles.xml
function extractHeaderStyle(
  hdrXml: string,
  stylesXml: string,
  theme: { major?: string; minor?: string },
): HeaderStyle {
  // Nível 1: header inline
  const l1: HeaderStyle = {
    fontFamily: resolveFontFromXml(hdrXml, theme),
    ...extractSizeAndSpacing(hdrXml),
  }

  // Nível 2-3: estilos em styles.xml
  const styleBlocks = stylesXml.match(/<w:style\s[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/g) ?? []
  let l2: HeaderStyle = {}   // estilo header/cabeçalho
  let l3: HeaderStyle = {}   // estilo Normal (base da herança)
  for (const block of styleBlocks) {
    if (!l2.fontFamily && /<w:name\s+w:val="(?:header|Cabealho|Cabeçalho|Cabecalho|Header(?:\s*\d*)?)"[^>]*>/i.test(block)) {
      l2 = { fontFamily: resolveFontFromXml(block, theme), ...extractSizeAndSpacing(block) }
    }
    if (!l3.fontFamily && /<w:name\s+w:val="Normal"[^>]*>/i.test(block)) {
      l3 = { fontFamily: resolveFontFromXml(block, theme), ...extractSizeAndSpacing(block) }
    }
    if (l2.fontFamily && l3.fontFamily) break
  }

  // Nível 4: defaults do documento
  const defXml = stylesXml.match(/<w:docDefaults>([\s\S]*?)<\/w:docDefaults>/)?.[1] ?? ""
  const l4: HeaderStyle = { fontFamily: resolveFontFromXml(defXml, theme), ...extractSizeAndSpacing(defXml) }

  return {
    fontFamily: l1.fontFamily ?? l2.fontFamily ?? l3.fontFamily ?? l4.fontFamily,
    fontSize:   l1.fontSize   ?? l2.fontSize   ?? l3.fontSize   ?? l4.fontSize,
    lineRule:   l1.lineRule   ?? l2.lineRule   ?? l3.lineRule   ?? l4.lineRule,
  }
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export async function parseDocxBuffer(buf: Buffer): Promise<ParsedModelo> {
  const entries = await parseZip(buf)
  const get = (name: string) => entries.find(e => e.name === name)?.data

  const docXml = stripFieldResultRuns(get("word/document.xml")?.toString("utf-8") ?? "")
  const relsMap = parseRels(get("word/_rels/document.xml.rels")?.toString("utf-8") ?? "")
  const numberingMap = parseNumbering(get("word/numbering.xml")?.toString("utf-8") ?? "")
  const stylesXml = get("word/styles.xml")?.toString("utf-8") ?? ""
  const themeXml  = get("word/theme/theme1.xml")?.toString("utf-8") ?? ""
  const themeFonts = parseThemeFonts(themeXml)
  const tableStyles = parseTableStyles(stylesXml)
  // Parse document-default line spacing from <w:pPrDefault>
  const defPPr = (stylesXml.match(/<w:pPrDefault>([\s\S]*?)<\/w:pPrDefault>/) ?? [])[1] ?? ""
  const defaultLineSpacing = extractLineSpacing(defPPr)

  // Imagens
  const images = new Map<string, string>()
  for (const entry of entries) {
    if (/^word\/media\/.+\.(png|jpg|jpeg|gif|webp)$/i.test(entry.name)) {
      const ext = entry.name.split(".").pop()!.toLowerCase()
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`
      images.set(entry.name, `data:${mime};base64,${entry.data.toString("base64")}`)
    }
  }

  const elements = parseBodyXml(docXml, relsMap, images, numberingMap, tableStyles, defaultLineSpacing, true, stylesXml, themeFonts)
  const { hasBorder, pageBorder, pageBorderOffsetFrom } = parsePageBorder(docXml)
  const pageBackground = parsePageBackground(docXml)
  const margins = parsePageMargins(docXml)

  // Resolve o arquivo de cabeçalho/rodapé "default" via sectPr → relsMap
  const sectPrM = docXml.match(/<w:sectPr[^>]*>([\s\S]*?)<\/w:sectPr>/)
  const sectPr = sectPrM?.[1] ?? ""

  function resolveRefName(tag: "headerReference" | "footerReference"): string | undefined {
    // Scan all matching tags regardless of attribute order
    const tagRe = new RegExp(`<w:${tag}\\s[^/]*/>`, "g")
    let m: RegExpExecArray | null
    while ((m = tagRe.exec(sectPr)) !== null) {
      if (/w:type="default"/.test(m[0])) {
        const idM = m[0].match(/r:id="([^"]+)"/)
        if (idM) {
          const target = relsMap.get(idM[1])
          return target ? `word/${target}` : undefined
        }
      }
    }
    return undefined
  }

  // Elementos têm conteúdo real quando há texto, imagem ou tabela (parágrafos vazios não contam)
  function hasRealContent(els: DocxElement[]): boolean {
    return els.some(el => {
      if (el.type === "paragraph") return !!el.text
      if (el.type === "run") return el.runs.some(r => r.text)
      return el.type === "image" || el.type === "table"
    })
  }

  function parseHeaderFooterFile(name: string, headerOffset?: HeaderPageOffset): { elements: DocxElement[]; pageNumber: boolean } | null {
    const entry = entries.find(e => e.name === name)
    if (!entry) return null
    const fileName = name.split("/").pop()!
    const fileRels = parseRels(get(`word/_rels/${fileName}.rels`)?.toString("utf-8") ?? "")
    const xml = stripFieldResultRuns(entry.data.toString("utf-8"))
    const els = parseBodyXml(xml, fileRels, images, numberingMap, tableStyles, defaultLineSpacing, false, stylesXml, themeFonts, headerOffset)
    return { elements: els, pageNumber: /<w:instrText[^>]*>\s*PAGE/.test(xml) }
  }

  // Offset do container do cabeçalho até a borda da página (ver HeaderPageOffset)  só existe
  // quando o docx define margens explícitas; sem isso, anchors com relativeFrom="page" no
  // cabeçalho não são ajustadas (mesmo comportamento de antes deste fix).
  const headerPageOffset: HeaderPageOffset | undefined = margins
    ? { leftPx: margins.left, topPx: margins.header ?? margins.top }
    : undefined

  // Cabeçalho: tenta o "default" do sectPr primeiro; fallback = primeiro arquivo com conteúdo real
  let header: DocxElement[] | undefined
  let headerStyle: HeaderStyle | undefined
  const defaultHdrName = resolveRefName("headerReference")
  const hdrCandidates = [
    ...(defaultHdrName ? [defaultHdrName] : []),
    ...entries.filter(e => /^word\/header\d*\.xml$/.test(e.name)).map(e => e.name),
  ]
  for (const name of hdrCandidates) {
    const parsed = parseHeaderFooterFile(name, headerPageOffset)
    if (parsed && hasRealContent(parsed.elements)) {
      header = parsed.elements
      const hdrXml = entries.find(e => e.name === name)?.data.toString("utf-8") ?? ""
      const extracted = extractHeaderStyle(hdrXml, stylesXml, themeFonts)
      if (extracted.fontFamily || extracted.fontSize || extracted.lineRule) headerStyle = extracted
      break
    }
  }

  // Rodapé: tenta o "default" do sectPr primeiro; fallback = primeiro arquivo com conteúdo real
  let footer: { elements: DocxElement[]; pageNumber?: boolean } | undefined
  const defaultFtrName = resolveRefName("footerReference")
  const ftrCandidates = [
    ...(defaultFtrName ? [defaultFtrName] : []),
    ...entries.filter(e => /^word\/footer\d*\.xml$/.test(e.name)).map(e => e.name),
  ]
  for (const name of ftrCandidates) {
    const parsed = parseHeaderFooterFile(name)
    // Um rodapé só com campo de número de página (ex.: "PAGE / NUMPAGES") não sobra
    // nenhum texto "real" depois de stripFieldResultRuns()  `pageNumber` sozinho já
    // basta pra contar como conteúdo válido, senão o rodapé inteiro seria descartado.
    if (parsed && (parsed.pageNumber || hasRealContent(parsed.elements))) {
      footer = { elements: parsed.elements, pageNumber: parsed.pageNumber }
      break
    }
  }

  const fonts = extractDocumentFonts(docXml, stylesXml)

  return { elements, hasBorder, pageBorder, pageBorderOffsetFrom, pageBackground, margins, fonts, ...(header && { header }), ...(headerStyle && { headerStyle }), ...(footer && { footer }) }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const atividadeId = request.nextUrl.searchParams.get("atividadeId")
    const modeloTemplateId = request.nextUrl.searchParams.get("modeloTemplateId")

    // Sem essa checagem, qualquer usuário autenticado poderia ler o modelo de estilo (texto,
    // imagens, layout completo) de OUTRO professor só sabendo o UUID da atividade (IDOR)  a RLS
    // (`atividades_select_own`) também deveria bloquear, mas esta checagem garante um 403 claro.
    if (atividadeId && !(await verificarDonoDaAtividade(supabase, atividadeId, user.id))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    // Cada atividade pode ter seu próprio modelo de estilo (enviado no step-style e associado
    // via atividades.modelo_template_id)  cai pro modelo padrão do sistema (usuario_id is null)
    // quando a atividade não tem um customizado ou quando não há atividadeId (ex.: nova atividade).
    let arquivoPath: string | null = null
    if (atividadeId) {
      const { data: atividade } = await supabase
        .from("atividades")
        .select("modelos_template(arquivo_docx_path)")
        .eq("id", atividadeId)
        .single()
      // Sem tipos gerados do Supabase, o embed de FK 1-pra-1 pode vir como objeto ou array de 1  aceita os dois.
      const modeloRaw = atividade?.modelos_template as unknown
      const modelo = (Array.isArray(modeloRaw) ? modeloRaw[0] : modeloRaw) as { arquivo_docx_path: string | null } | undefined
      arquivoPath = modelo?.arquivo_docx_path ?? null
    }
    // Preview de um modelo específico (grid de "modelos prontos"/"meus modelos" no step-style) 
    // aceita tanto um modelo do próprio usuário quanto um modelo de sistema (usuario_id null).
    if (!arquivoPath && modeloTemplateId) {
      const { data } = await supabase
        .from("modelos_template")
        .select("arquivo_docx_path")
        .eq("id", modeloTemplateId)
        .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
        .maybeSingle()
      arquivoPath = data?.arquivo_docx_path ?? null
    }
    if (!arquivoPath && !modeloTemplateId) {
      // Pode haver mais de um modelo de sistema (ver "modelos prontos")  pega o mais antigo como
      // padrão genérico em vez de usar `.maybeSingle()`, que quebra com mais de uma linha.
      const { data } = await supabase
        .from("modelos_template")
        .select("arquivo_docx_path")
        .is("usuario_id", null)
        .order("created_at", { ascending: true })
        .limit(1)
      arquivoPath = data?.[0]?.arquivo_docx_path ?? null
    }
    if (!arquivoPath) return NextResponse.json({ error: "Nenhum modelo configurado" }, { status: 404 })

    const { data: file, error: downloadError } = await supabase.storage.from("modelos").download(arquivoPath)
    if (downloadError || !file) return NextResponse.json({ error: "Falha ao baixar modelo do storage" }, { status: 500 })

    const buf = Buffer.from(await file.arrayBuffer())
    return NextResponse.json(await parseDocxBuffer(buf))
  } catch (err) {
    return NextResponse.json({ error: "Falha ao ler modelo" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 })
    // Limite de tamanho ANTES de descompactar  o parser de ZIP abaixo é feito à mão (não usa
    // lib pronta) e infla tudo em memória, então um arquivo grande/malicioso sem esse teto vira
    // um vetor de exaustão de memória ("zip bomb").
    if (file.size > TAMANHO_MAXIMO_ARQUIVO_BYTES) {
      return NextResponse.json({ error: `Arquivo muito grande (máximo ${TAMANHO_MAXIMO_ARQUIVO_MB}MB)` }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    return NextResponse.json(await parseDocxBuffer(buf))
  } catch (err) {
    return NextResponse.json({ error: "Falha ao processar arquivo" }, { status: 500 })
  }
}
