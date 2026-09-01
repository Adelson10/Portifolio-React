import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import type { PlanoAulaGerado } from "./gerar-plano-aula"
import { parseNegrito, stripNegrito } from "./parse-negrito"

const SECAO_TITULO: Record<string, string> = {
  objetivoGeral: "Objetivo Geral",
  objetivos: "Objetivos Específicos",
  habilidadesBNCC: "Habilidades (BNCC)",
  competencias: "Competências",
  conteudo: "Conteúdo",
  metodologia: "Metodologia",
  recursos: "Recursos Didáticos",
  atividadesPropostas: "Atividades Propostas",
  avaliacao: "Avaliação",
  adaptacoes: "Adaptações para Necessidades Específicas",
  tarefaCasa: "Tarefa de Casa",
  referencias: "Referências Bibliográficas e Materiais de Apoio",
}

/** Parágrafo com trechos em negrito (**texto**) convertidos em runs de verdade  a IA às vezes
 *  usa markdown mesmo sendo instruída a não usar (ver `SYSTEM_INSTRUCTION_PLANO_AULA`). */
function paragrafoComNegrito(texto: string, spacingAfter: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: spacingAfter },
    children: parseNegrito(texto).map((seg) => new TextRun({ text: seg.text, bold: seg.bold })),
  })
}

function paragrafosLista(itens: string[]): Paragraph[] {
  return itens.map((item) => new Paragraph({
    bullet: { level: 0 },
    text: stripNegrito(item),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 60 },
  }))
}

/** Texto longo pode vir com mais de um parágrafo (separados por linha em branco)  cada um
 *  vira um `Paragraph` próprio, senão o Word ignora as quebras de linha dentro de um só. */
function paragrafosTexto(texto: string): Paragraph[] {
  const partes = texto.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return partes.map((parte, i) => paragrafoComNegrito(parte, i === partes.length - 1 ? 100 : 60))
}

function paragrafosSecao(titulo: string, conteudo: string[] | string): Paragraph[] {
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_2, text: titulo, spacing: { before: 300, after: 120 } }),
    ...(Array.isArray(conteudo) ? paragrafosLista(conteudo) : paragrafosTexto(conteudo)),
  ]
}

export async function gerarPlanoAulaDocx(
  titulo: string,
  plano: PlanoAulaGerado,
  disciplina?: string,
  dataAula?: string
): Promise<Buffer> {
  const secoes: Paragraph[] = []

  if (plano.objetivoGeral) secoes.push(...paragrafosSecao(SECAO_TITULO.objetivoGeral, plano.objetivoGeral))
  if (plano.objetivosEspecificos?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.objetivos, plano.objetivosEspecificos))
  if (plano.habilidadesBNCC?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.habilidadesBNCC, plano.habilidadesBNCC))
  if (plano.competencias?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.competencias, plano.competencias))
  if (plano.conteudo) secoes.push(...paragrafosSecao(SECAO_TITULO.conteudo, plano.conteudo))
  if (plano.metodologia) secoes.push(...paragrafosSecao(SECAO_TITULO.metodologia, plano.metodologia))
  if (plano.recursos?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.recursos, plano.recursos))
  if (plano.atividadesPropostas?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.atividadesPropostas, plano.atividadesPropostas))
  if (plano.avaliacao) secoes.push(...paragrafosSecao(SECAO_TITULO.avaliacao, plano.avaliacao))
  if (plano.adaptacoes) secoes.push(...paragrafosSecao(SECAO_TITULO.adaptacoes, plano.adaptacoes))
  if (plano.tarefaCasa) secoes.push(...paragrafosSecao(SECAO_TITULO.tarefaCasa, plano.tarefaCasa))
  if (plano.referencias?.length) secoes.push(...paragrafosSecao(SECAO_TITULO.referencias, plano.referencias))

  const subtitulo = [
    disciplina,
    `Duração: ${plano.duracaoMinutos} minutos`,
    dataAula ? `Data: ${new Date(`${dataAula}T00:00:00`).toLocaleDateString("pt-BR")}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, text: stripNegrito(titulo) }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: subtitulo, italics: true })],
          }),
          ...secoes,
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
