export interface SegmentoTexto {
  text: string
  bold: boolean
}

/** Quebra um texto com marcação markdown de negrito (`**texto**`) em segmentos simples com a
 *  flag `bold`  a IA às vezes usa markdown mesmo sendo instruída a escrever texto puro (ver
 *  `SYSTEM_INSTRUCTION_PLANO_AULA`); interpretamos a marcação em vez de simplesmente descartar
 *  os asteriscos, pra não perder a ênfase que o modelo quis dar. */
export function parseNegrito(texto: string): SegmentoTexto[] {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter((parte) => parte.length > 0)
  if (partes.length === 0) return [{ text: texto, bold: false }]

  return partes.map((parte) => {
    const isBold = parte.startsWith("**") && parte.endsWith("**")
    return { text: isBold ? parte.slice(2, -2) : parte, bold: isBold }
  })
}

/** Remove a marcação de negrito sem preservar a ênfase  usado nos poucos lugares (título,
 *  itens de lista) onde não há como aplicar negrito de verdade por trecho. */
export function stripNegrito(texto: string): string {
  return texto.replace(/\*\*([^*]+)\*\*/g, "$1")
}
