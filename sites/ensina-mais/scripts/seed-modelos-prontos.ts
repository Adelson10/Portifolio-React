import fs from "node:fs"
import path from "node:path"
import {
  Document,
  Header,
  HeightRule,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  BorderStyle,
  WidthType,
} from "docx"
import { createClient } from "@supabase/supabase-js"

/** Cria (ou atualiza) os "modelos prontos" de sistema  modelos_template com usuario_id null,
 *  selecionáveis por qualquer usuário em "Usar um modelo pronto" no step-style. Idempotente:
 *  identifica cada modelo pelo par (usuario_id is null, nome), então rodar de novo só atualiza o
 *  .docx e a linha existentes em vez de duplicar.
 *
 *  Uso: npm run seed-modelos-prontos
 */

// `.replace(/\r$/, "")`  .env.local aqui tem quebras de linha CRLF; sem isso o `\r` sobrando
// no fim de cada linha impede `(.*)$` de casar (exceto na última linha, sem `\r` final).
for (const linha of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const match = linha.replace(/\r$/, "").match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] ??= match[2].trim()
}

const FONT = "Calibri"
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const noBorders = () => ({ top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER })
const bottomLine = (color = "AAAAAA") => ({
  top: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
  bottom: { style: BorderStyle.SINGLE, size: 4, color },
})

/** Área reservada (sem borda visível) com o texto "LOGO" centralizado  indica onde a instituição
 *  deve colocar o próprio logo (substituído de verdade na geração, ver lib/atividades/
 *  aplicar-logo-modelo.ts; sem logo enviado, o professor troca depois editando o cabeçalho). Sem
 *  borda porque, uma vez substituído pela imagem de verdade, uma caixa ao redor do logo real fica
 *  com aparência de moldura indesejada no .docx gerado. */
function logoBox(color: string, align: (typeof AlignmentType)[keyof typeof AlignmentType]) {
  return new Table({
    alignment: align,
    width: { size: 1300, type: WidthType.DXA }, // ~87px  caixa quadrada pequena
    borders: { ...noBorders(), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        height: { value: 1300, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            borders: noBorders(),
            verticalAlign: "center",
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "LOGO", color, size: 16, font: FONT })],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

/** Linha "Nome / Turma / Data" com campos em branco (borda só embaixo)  mesmo recurso visual já
 *  usado no fallback sem modelo (ver makeInfoTable em components/atividades/editor/generate-word.ts). */
function camposRow() {
  const label = (text: string, sizePct: number, alignRight = false) =>
    new TableCell({
      width: { size: sizePct, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      children: [new Paragraph({
        alignment: alignRight ? AlignmentType.RIGHT : undefined,
        children: [new TextRun({ text, bold: true, size: 16, font: FONT })],
      })],
    })
  const blank = (sizePct: number) =>
    new TableCell({
      width: { size: sizePct, type: WidthType.PERCENTAGE },
      borders: bottomLine(),
      children: [new Paragraph({ children: [] })],
    })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [
      new TableRow({
        children: [
          label("Nome:", 10), blank(28),
          new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [] })] }),
          label("Turma:", 9, true), blank(15),
          new TableCell({ width: { size: 3, type: WidthType.PERCENTAGE }, borders: noBorders(), children: [new Paragraph({ children: [] })] }),
          label("Data:", 8, true), blank(24),
        ],
      }),
    ],
  })
}

function buildDocx(headerChildren: (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 em twips
            margin: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
          },
        },
        headers: { default: new Header({ children: headerChildren }) },
        // Corpo vazio  convenção do produto: o modelo só define o cabeçalho (ver aviso no step-style).
        children: [new Paragraph({ children: [] })],
      },
    ],
  })
  return Packer.toBuffer(doc)
}

const MODELOS: { nome: string; slug: string; header: (Paragraph | Table)[] }[] = [
  {
    nome: "Clássico",
    slug: "classico",
    header: [
      logoBox("999999", AlignmentType.LEFT),
      new Paragraph({
        spacing: { before: 120, after: 0 },
        children: [new TextRun({ text: "Nome da Instituição", bold: true, size: 26, font: FONT })],
      }),
      new Paragraph({
        spacing: { before: 0, after: 160 },
        children: [new TextRun({ text: "Escola • Colégio • Curso", color: "888888", italics: true, size: 18, font: FONT })],
      }),
      camposRow(),
    ],
  },
  {
    nome: "Moderno",
    slug: "moderno",
    header: [
      logoBox("2F6FED", AlignmentType.CENTER),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 0 },
        children: [new TextRun({ text: "Nome da Instituição", bold: true, size: 28, color: "2F6FED", font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 160 },
        children: [new TextRun({ text: "Educação de qualidade", color: "888888", size: 18, font: FONT })],
      }),
      camposRow(),
    ],
  },
]

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const modelo of MODELOS) {
    const buffer = await buildDocx(modelo.header)
    const storagePath = `sistema/${modelo.slug}.docx`

    const { error: uploadError } = await admin.storage.from("modelos").upload(storagePath, buffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    })
    if (uploadError) {
      console.error(`Falha ao subir "${modelo.nome}":`, uploadError.message)
      process.exit(1)
    }

    const { data: existente, error: buscaError } = await admin
      .from("modelos_template")
      .select("id")
      .is("usuario_id", null)
      .eq("nome", modelo.nome)
      .maybeSingle()
    if (buscaError) {
      console.error(`Falha ao checar "${modelo.nome}" em modelos_template:`, buscaError.message)
      process.exit(1)
    }

    if (existente) {
      const { error } = await admin.from("modelos_template").update({ arquivo_docx_path: storagePath }).eq("id", existente.id)
      if (error) { console.error(`Falha ao atualizar "${modelo.nome}":`, error.message); process.exit(1) }
      console.log(`OK  "${modelo.nome}" atualizado (${existente.id}).`)
    } else {
      const { data, error } = await admin
        .from("modelos_template")
        .insert({ usuario_id: null, nome: modelo.nome, arquivo_docx_path: storagePath })
        .select("id")
        .single()
      if (error) { console.error(`Falha ao criar "${modelo.nome}":`, error.message); process.exit(1) }
      console.log(`OK  "${modelo.nome}" criado (${data.id}).`)
    }
  }
}

main()
