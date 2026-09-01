export type Dificuldade = "facil" | "medio" | "dificil" | "extremo" | "superior" | "pos"

export type QuestaoImagemPosicao = "acima-respostas" | "lado-questao"
export type QuestaoImagemAlinhamento = "esquerda" | "direita"

// Equivalente ao CSS object-fit  controla como a imagem preenche a caixa largura×altura
// quando essa caixa não tem a mesma proporção da imagem original (ex.: após redimensionar só um eixo).
export type QuestaoImagemAjuste = "fill" | "contain" | "cover" | "scale-down"

// Largura/altura da imagem em px  ajustáveis tanto pelas alças de redimensionamento no A4Sheet
// (cada eixo independente, como num editor de canvas) quanto pelo stepper no painel lateral.
export const IMAGEM_LARGURA_MIN = 60
export const IMAGEM_LARGURA_MAX = 700
export const IMAGEM_LARGURA_PADRAO = 280
export const IMAGEM_LARGURA_STEP = 20
export const IMAGEM_ALTURA_MIN = 40
export const IMAGEM_ALTURA_MAX = 700
export const IMAGEM_ALTURA_PADRAO = 160

export interface QuestaoImagem {
  tipo: "upload"
  src: string // dataURL (upload) ou URL http(s) (web)
  posicao?: QuestaoImagemPosicao // default "acima-respostas"
  alinhamento?: QuestaoImagemAlinhamento // default "esquerda"  lado da imagem em "lado-questao" e alinhamento em "acima-respostas"
  larguraPx?: number // default IMAGEM_LARGURA_PADRAO
  alturaPx?: number // default IMAGEM_ALTURA_PADRAO (calculado a partir da proporção natural ao adicionar a imagem)
  ajuste?: QuestaoImagemAjuste // default "contain"
  // Deslocamento visual acumulado ao redimensionar pela alça oeste  mantém a borda direita fixa
  // no lugar, como um editor de canvas, em vez de a imagem só crescer para a direita.
  offsetXPx?: number
  offsetYPx?: number // não é mais alterado pelo redimensionamento (sem alça norte); mantido para compatibilidade
}

export interface QuestaoItem {
  id: string // chave estável para dnd-kit e React  não muda com a reordenação
  numero: number // posição visual (1-based), recalculada a cada reorder via renumberQuestoes
  tipo: "multipla-escolha" | "dissertativo" | "verdade-falso" | "completar-lacunas" | "matematica" | "assercoes-multiplas"
  enunciado: string
  opcoes?: string[] // multipla-escolha e assercoes-multiplas (nesta, o texto de cada combinação  ex.: "As afirmativas I e III estão corretas")
  afirmativas?: string[] // só assercoes-multiplas: os itens numerados em romano (I, II, III...) que as opcoes avaliam
  gabarito: string
  layout?: "horizontal" | "vertical" // default vertical
  imagem?: QuestaoImagem
  dificuldade?: Dificuldade // undefined = herda a dificuldade global da atividade
  numeroLinhas?: number // dissertativo/matematica; undefined = usa o default (4/5 conforme espaçamento)
}

/** Retorna uma cópia da lista com `numero` recalculado (1-based) a partir da ordem atual. */
export function renumberQuestoes(questoes: QuestaoItem[]): QuestaoItem[] {
  return questoes.map((q, i) => ({ ...q, numero: i + 1 }))
}

/** Resposta do gabarito pronta para exibição  múltipla escolha ganha a letra da alternativa
 *  (ex.: "B) 550 veículos") pra não depender do texto cru bater exatamente com a opção certa. */
export function formatarRespostaGabarito(questao: Pick<QuestaoItem, "tipo" | "opcoes" | "gabarito">): string {
  if ((questao.tipo === "multipla-escolha" || questao.tipo === "assercoes-multiplas") && questao.opcoes) {
    const indice = questao.opcoes.indexOf(questao.gabarito)
    if (indice !== -1) return `${String.fromCharCode(65 + indice)}) ${questao.gabarito}`
  }
  return questao.gabarito
}

/** Tipos cuja resposta "seca" (só o gabarito) fica sem contexto  o gabarito também mostra o enunciado. */
export function gabaritoPrecisaDeEnunciado(tipo: QuestaoItem["tipo"]): boolean {
  return tipo === "dissertativo" || tipo === "matematica"
}

/** Reduz `opcoes` pela metade (mesmo corte da acessibilidade "Reduzir questões"  TEA/autismo 
 *  aplicado à quantidade de questões, ver A4Sheet), sempre preservando a alternativa correta.
 *  Só afeta multipla-escolha e assercoes-multiplas  os únicos tipos com `opcoes` lettradas; os
 *  demais voltam sem alteração (mesma referência). Não muta `questao`  usado só na hora de
 *  exibir/exportar, nunca persistido, pra o toggle continuar reversível. */
export function questaoComAlternativasReduzidas(questao: QuestaoItem): QuestaoItem {
  if ((questao.tipo !== "multipla-escolha" && questao.tipo !== "assercoes-multiplas") || !questao.opcoes) return questao
  const quantidade = Math.max(2, Math.ceil(questao.opcoes.length / 2))
  if (questao.opcoes.length <= quantidade) return questao
  const indiceCorreta = questao.opcoes.indexOf(questao.gabarito)
  const indices = new Set<number>()
  if (indiceCorreta !== -1) indices.add(indiceCorreta)
  for (let i = 0; indices.size < quantidade && i < questao.opcoes.length; i++) indices.add(i)
  return { ...questao, opcoes: questao.opcoes.filter((_, i) => indices.has(i)) }
}

