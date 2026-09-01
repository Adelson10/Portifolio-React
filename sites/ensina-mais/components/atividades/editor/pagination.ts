import type { DocxElement } from "./activity-editor"
import type { QuestaoItem } from "./mock-questoes"

/** Unidade atômica de paginação  nunca é dividida no meio: ou cabe inteira numa
 *  página, ou passa inteira para a próxima. */
export type FlowBlock =
  | { kind: "docx"; key: string; element: DocxElement }
  | { kind: "questao"; key: string; questao: QuestaoItem }

/**
 * Empacota blocos em páginas por acumulação gulosa de altura: soma a altura dos blocos
 * (mais o espaçamento entre eles) até estourar a altura de conteúdo disponível da página
 * atual, então fecha a página e começa outra. Garante pelo menos 1 bloco por página  um
 * bloco maior que a própria página fica sozinho, sem ser dividido.
 *
 * `firstPageReservedPx` desconta espaço extra só da primeira página  usado pela
 * `AnchorLayer` (logo/caixas de texto flutuantes do modelo docx), que só aparece na
 * página 1 e não faz parte dos `blocks`/`heights` medidos normalmente.
 */
export function paginateBlocks(
  blocks: FlowBlock[],
  heights: number[],
  pageContentHeightPx: number,
  gapPx: number,
  firstPageReservedPx = 0
): FlowBlock[][] {
  if (blocks.length === 0) return [[]]

  const pages: FlowBlock[][] = [[]]
  let used = 0

  for (let i = 0; i < blocks.length; i++) {
    const altura = heights[i] ?? 0
    const limiteAtual = pages.length === 1 ? pageContentHeightPx - firstPageReservedPx : pageContentHeightPx
    const projetado = used === 0 ? altura : used + gapPx + altura
    if (used > 0 && projetado > limiteAtual) {
      pages.push([blocks[i]])
      used = altura
    } else {
      pages[pages.length - 1].push(blocks[i])
      used = projetado
    }
  }

  return pages
}
