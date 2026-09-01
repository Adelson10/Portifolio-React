import { AlignmentType, type Paragraph, type Table } from "docx"
import { buildDocxBlob, elementToDocxChildren, type DocxFormatCtx } from "../../atividades/editor/generate-word"
import type { ModeloTemplate } from "../../atividades/editor/activity-editor"
import { montarElementosPlano, type PlanoAulaData } from "@/lib/ai/plano-aula-elements"

// Margens ABNT (3cm topo/esquerda, 2cm baixo/direita)  os mesmos valores usados como padrão na
// prévia em tela quando não há modelo de estilo (ver `MARGENS_PADRAO` em plano-aula-editor.tsx).
const PRESET_MARGINS_ABNT = { top: 113, bottom: 76, left: 113, right: 76 }

/**
 * Gera o .docx do plano de aula aplicando o modelo de estilo (corpo/cabeçalho/rodapé/margens/
 * borda  quando houver) via `buildDocxBlob`, a mesma função usada por Atividade/Prova  em vez
 * do arquivo estático gerado uma única vez no servidor logo após a criação (ver
 * `lib/ai/gerar-plano-aula-docx.ts`), que nunca recebeu o modelo nem margens/fonte/espaçamento
 * ABNT nenhum (sem cabeçalho, fonte padrão da lib, espaçamento simples). Chamada sob demanda
 * pelo botão "Baixar Word" (ver `plano-aula-editor.tsx`), igual ao `generateWordBlob` do
 * ActivityEditor  sempre gera a partir do que está na tela, nunca de um arquivo antigo.
 */
export async function generatePlanoAulaWordBlob(plano: PlanoAulaData, modeloTemplate: ModeloTemplate | null): Promise<Blob> {
  // ABNT: Arial 12pt, espaçamento 1,5  plano de aula não tem seletor de formatação/fonte como
  // Atividade/Prova (o step de configuração não inclui esse campo), então usa sempre esses
  // valores fixos, os mesmos da prévia em tela (FONT_FAMILY/FONT_SIZE/LINE_HEIGHT).
  const ctx: DocxFormatCtx = {
    font: "Arial",
    size: 24, // 12pt em half-points (half-pt = pt × 2)
    lineRule: 360, // 1,5× (240 = simples no docx)
    align: AlignmentType.BOTH,
  }
  const headerStyle = modeloTemplate?.headerStyle
  const headerCtx: DocxFormatCtx = {
    font: headerStyle?.fontFamily ?? ctx.font,
    size: headerStyle?.fontSize ?? ctx.size,
    lineRule: headerStyle?.lineRule ?? ctx.lineRule,
    align: ctx.align,
  }

  // `forceAlign: ctx.align` justifica o texto corrido (parágrafo/run/lista)  mesmo critério do
  // `justificarSeTextoCorrido` na prévia em tela; headings continuam sempre à esquerda (o próprio
  // `elementToDocxChildren` ignora `forceAlign` pra heading).
  const contentChildren: (Paragraph | Table)[] = montarElementosPlano(plano).flatMap((el) => elementToDocxChildren(el, false, ctx, ctx.align))

  return buildDocxBlob({
    modeloTemplate,
    ctx,
    headerCtx,
    presetMargins: PRESET_MARGINS_ABNT,
    contentChildren,
  })
}
