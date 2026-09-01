import type { SupabaseClient } from "@supabase/supabase-js"
import { Document, Header, Packer, Paragraph, type Table } from "docx"
import { parseDocxBuffer } from "@/app/api/parse-modelo/route"
import { elementToDocxChildren } from "@/components/atividades/editor/generate-word"
import type { DocxElement, PageMargins } from "@/components/atividades/editor/activity-editor"

/** Lê largura/altura de um PNG (chunk IHDR) ou JPEG (marcador SOF0/SOF2) direto dos bytes  sem
 *  isso, o logo enviado sairia esticado/distorcido dentro da caixa do modelo pronto. */
function sniffImageDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) { offset++; continue }
      const marker = buf[offset + 1]
      if (marker === 0xc0 || marker === 0xc2) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) }
      }
      offset += 2 + buf.readUInt16BE(offset + 2)
    }
  }
  return null
}

/** Percorre o cabeçalho (recursivo em células de tabela, já que a caixa "LOGO" dos modelos prontos
 *  é uma tabela 1x1  ver scripts/seed-modelos-prontos.ts) procurando o parágrafo placeholder
 *  "LOGO" e substitui pelo elemento de imagem. Não altera nada se não encontrar (ex.: aplicado a um
 *  modelo que não é um dos prontos)  quem chamar cai pro comportamento sem logo nesse caso. */
function substituirLogoNoHeader(elements: DocxElement[], imagemEl: DocxElement): { elements: DocxElement[]; substituido: boolean } {
  let substituido = false
  const novos = elements.map((el): DocxElement => {
    if (substituido) return el
    if (el.type === "paragraph" && el.text.trim().toUpperCase() === "LOGO") {
      substituido = true
      return imagemEl
    }
    if (el.type === "table") {
      const rows = el.rows.map((row) => ({
        ...row,
        cells: row.cells.map((cell) => {
          const r = substituirLogoNoHeader(cell.elements, imagemEl)
          if (r.substituido) substituido = true
          return { ...cell, elements: r.elements }
        }),
      }))
      return { ...el, rows }
    }
    return el
  })
  return { elements: novos, substituido }
}

const A4_TWIPS = { width: 11906, height: 16838 }

function pxToTwip(px: number) {
  return Math.round((px * 1440) / 96)
}

interface AplicarLogoParams {
  supabase: SupabaseClient
  usuarioId: string
  modeloTemplateId: string
  logoFile: File
}

/** Gera uma cópia personalizada de um modelo pronto com o logo enviado no lugar do placeholder
 *  "LOGO", salva como um `modelos_template` normal do usuário (mesmo mecanismo de
 *  "modelo novo enviado"  ver resolver-modelo-template.ts) e retorna o id dela. Nunca lança: erros
 *  viram `{ error }` e quem chamar decide (o logo é um extra, não deve travar a geração). */
export async function aplicarLogoAoModelo({
  supabase,
  usuarioId,
  modeloTemplateId,
  logoFile,
}: AplicarLogoParams): Promise<{ modeloTemplateId?: string; error?: string }> {
  const { data: modelo } = await supabase
    .from("modelos_template")
    .select("nome, arquivo_docx_path")
    .eq("id", modeloTemplateId)
    .or(`usuario_id.eq.${usuarioId},usuario_id.is.null`)
    .maybeSingle()
  if (!modelo?.arquivo_docx_path) return {}

  const { data: arquivoOriginal, error: downloadError } = await supabase.storage.from("modelos").download(modelo.arquivo_docx_path)
  if (downloadError || !arquivoOriginal) return { error: "Falha ao baixar o modelo original." }

  const parsed = await parseDocxBuffer(Buffer.from(await arquivoOriginal.arrayBuffer()))
  if (!parsed.header?.length) return {}

  const logoBuf = Buffer.from(await logoFile.arrayBuffer())
  const dims = sniffImageDimensions(logoBuf) ?? { width: 1, height: 1 }
  // Cabe dentro de ~80x80px (tamanho da caixa "LOGO" nos modelos prontos), preservando proporção.
  const maxBox = 80
  const scale = Math.min(maxBox / dims.width, maxBox / dims.height, 1)
  const imagemEl: DocxElement = {
    type: "image",
    dataUrl: `data:${logoFile.type || "image/png"};base64,${logoBuf.toString("base64")}`,
    align: "center",
    widthPx: Math.max(1, Math.round(dims.width * scale)),
    heightPx: Math.max(1, Math.round(dims.height * scale)),
  }

  const { elements: headerComLogo, substituido } = substituirLogoNoHeader(parsed.header as unknown as DocxElement[], imagemEl)
  if (!substituido) return {}

  const margins: PageMargins = (parsed.margins as unknown as PageMargins) ?? { top: 96, right: 96, bottom: 96, left: 96 }
  const headerChildren = headerComLogo.flatMap((el) => elementToDocxChildren(el, false)) as (Paragraph | Table)[]

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: A4_TWIPS,
            margin: {
              top: pxToTwip(margins.top),
              bottom: pxToTwip(margins.bottom),
              left: pxToTwip(margins.left),
              right: pxToTwip(margins.right),
            },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        children: [new Paragraph({ children: [] })],
      },
    ],
  })
  const buffer = await Packer.toBuffer(doc)

  const storagePath = `${usuarioId}/${crypto.randomUUID()}-logo.docx`
  const { error: uploadError } = await supabase.storage.from("modelos").upload(storagePath, buffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
  if (uploadError) return { error: uploadError.message }

  const { data: novoModelo, error: insertError } = await supabase
    .from("modelos_template")
    .insert({ usuario_id: usuarioId, nome: `${modelo.nome} (com logo)`, arquivo_docx_path: storagePath })
    .select("id")
    .single()
  if (insertError) return { error: insertError.message }

  return { modeloTemplateId: novoModelo.id }
}
