import type { DocxElement } from "@/components/atividades/editor/activity-editor"
import { parseNegrito, stripNegrito } from "./parse-negrito"

export const FORMATO_AULA_LABEL: Record<string, string> = {
  expositiva: "Aula expositiva",
  pratica: "Aula prática/laboratório",
  grupo: "Aula em grupo",
  tecnologia: "Uso de tecnologia",
  invertida: "Sala de aula invertida",
  revisao: "Aula de revisão",
}

export const SECAO_TITULO: Record<string, string> = {
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

export interface PlanoAulaData {
  id: string
  titulo: string
  disciplina?: string
  dataAula?: string
  duracaoMinutos?: number
  formatoAula?: string
  objetivoGeral?: string
  objetivos: string[]
  habilidadesBNCC: string[]
  competencias: string[]
  conteudo?: string
  metodologia?: string
  recursos: string[]
  atividadesPropostas: string[]
  avaliacao?: string
  adaptacoes?: string
  tarefaCasa?: string
  referencias: string[]
  docxUrl: string | null
}

/** Quebra um texto (possivelmente com vários parágrafos separados por linha em branco) em um
 *  `DocxElement` "run" por parágrafo  cada um vira um bloco de paginação independente, em vez
 *  de um bloco único gigante, igual a como um docx real trata cada parágrafo como unidade
 *  separada. Usa "run" (não "paragraph") pra poder aplicar negrito por trecho: a IA às vezes
 *  usa markdown (**negrito**) mesmo sendo instruída a não usar  ver `parseNegrito`. */
function textoParaParagrafos(texto: string): DocxElement[] {
  return texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text): DocxElement => ({ type: "run", runs: parseNegrito(text), spaceAfter: 12 }))
}

/**
 * Monta o plano de aula como uma sequência de `DocxElement` (heading/paragraph/run/bullet-list)
 *  o mesmo tipo usado pra renderizar o modelo docx de atividades/provas  pra reaproveitar
 * `DocxElementRenderer` (prévia em tela) e `elementToDocxChildren` (exportação .docx) sem
 * reimplementar a montagem do conteúdo em dois lugares diferentes.
 */
export function montarElementosPlano(plano: PlanoAulaData): DocxElement[] {
  const els: DocxElement[] = [{ type: "heading", level: 1, text: stripNegrito(plano.titulo) }]

  const subtitulo = [
    plano.disciplina,
    plano.duracaoMinutos ? `${plano.duracaoMinutos} minutos` : null,
    plano.formatoAula ? FORMATO_AULA_LABEL[plano.formatoAula] ?? plano.formatoAula : null,
    plano.dataAula ? new Date(`${plano.dataAula}T00:00:00`).toLocaleDateString("pt-BR") : null,
  ]
    .filter(Boolean)
    .join(" · ")
  if (subtitulo) els.push({ type: "paragraph", text: subtitulo })

  if (plano.objetivoGeral) {
    els.push({ type: "heading", level: 2, text: SECAO_TITULO.objetivoGeral })
    els.push(...textoParaParagrafos(plano.objetivoGeral))
  }

  if (plano.objetivos.length > 0) {
    els.push({ type: "heading", level: 2, text: SECAO_TITULO.objetivos })
    els.push({ type: "bullet-list", items: plano.objetivos.map(stripNegrito) })
  }

  for (const campo of ["habilidadesBNCC", "competencias"] as const) {
    if (plano[campo].length === 0) continue
    els.push({ type: "heading", level: 2, text: SECAO_TITULO[campo] })
    els.push({ type: "bullet-list", items: plano[campo].map(stripNegrito) })
  }

  for (const campo of ["conteudo", "metodologia"] as const) {
    const texto = plano[campo]
    if (!texto) continue
    els.push({ type: "heading", level: 2, text: SECAO_TITULO[campo] })
    els.push(...textoParaParagrafos(texto))
  }

  for (const campo of ["recursos", "atividadesPropostas"] as const) {
    if (plano[campo].length === 0) continue
    els.push({ type: "heading", level: 2, text: SECAO_TITULO[campo] })
    els.push({ type: "bullet-list", items: plano[campo].map(stripNegrito) })
  }

  for (const campo of ["avaliacao", "adaptacoes", "tarefaCasa"] as const) {
    const texto = plano[campo]
    if (!texto) continue
    els.push({ type: "heading", level: 2, text: SECAO_TITULO[campo] })
    els.push(...textoParaParagrafos(texto))
  }

  if (plano.referencias.length > 0) {
    els.push({ type: "heading", level: 2, text: SECAO_TITULO.referencias })
    els.push({ type: "bullet-list", items: plano.referencias.map(stripNegrito) })
  }

  return els
}
