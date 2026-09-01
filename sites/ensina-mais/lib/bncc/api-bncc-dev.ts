/**
 * Cliente pra api.bncc.dev  API pública, gratuita e sem key, com as habilidades da BNCC
 * extraídas e verificadas contra o documento homologado do MEC (dados-*, CC-BY 4.0,
 * https://github.com/bncc-dev/bncc-dados). Fonte única de código+descrição de habilidade
 * usada por `lib/ai/selecionar-habilidades-bncc.ts`  a IA nunca inventa um código nem o texto
 * de uma habilidade, só escolhe entre os itens que essa API devolveu (ver aquele módulo).
 *
 * Tudo aqui é "melhor esforço": qualquer falha (rede, API fora do ar, resposta inesperada)
 * devolve `null` em vez de lançar  sugerir habilidades BNCC é um bônus da geração, não algo
 * que deva travar a atividade se a API estiver indisponível.
 */

const BASE_URL = "https://api.bncc.dev/v1"
// Respostas da api.bncc.dev são imutáveis por versão de dados (ver header
// `cache-control: public, max-age=86400, immutable` nas respostas reais)  24h de cache no
// fetch do Next.js evita bater na API a cada geração sem risco de servir dado desatualizado.
const REVALIDATE_SECONDS = 60 * 60 * 24

export interface HabilidadeBNCC {
  codigo: string
  texto: string
}

async function buscarJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

interface RespostaListagem {
  total: number
  itens: { codigo: string; texto: string }[]
}

function paraHabilidades(resposta: RespostaListagem | null): HabilidadeBNCC[] | null {
  if (!resposta) return null
  return resposta.itens.map((i) => ({ codigo: i.codigo, texto: i.texto }))
}

/** Habilidades do Ensino Fundamental de um componente curricular (sigla, ex.: "MA", "LP") e ano
 *  (1 a 9)  o par componente+ano de uma turma real cai numa faixa de ~20 a 40 itens. */
export async function buscarHabilidadesEF(componenteSigla: string, ano: number): Promise<HabilidadeBNCC[] | null> {
  const params = new URLSearchParams({ etapa: "EF", componente: componenteSigla, ano: String(ano), limite: "200" })
  return paraHabilidades(await buscarJSON<RespostaListagem>(`/habilidades?${params}`))
}

/** Habilidades do Ensino Médio de uma área do conhecimento (id, ex.: "em-area-mat")  o Novo
 *  Ensino Médio organiza a BNCC por área, não por componente/ano (~40 a 50 itens por área). */
export async function buscarHabilidadesEM(areaId: string): Promise<HabilidadeBNCC[] | null> {
  const params = new URLSearchParams({ etapa: "EM", area: areaId, limite: "200" })
  return paraHabilidades(await buscarJSON<RespostaListagem>(`/habilidades?${params}`))
}

/** Resolve um único código (ex.: "EF67LP08") contra a base oficial  usado pra buscar a
 *  descrição real de qualquer código em `codigosBNCC`, tanto os que a IA preencheu quanto os que
 *  o professor adicionou manualmente (ver `resolverCodigosBNCC` abaixo). A API devolve 400 pra
 *  código com gramática inválida ou que simplesmente não existe na BNCC  `buscarJSON` já trata
 *  isso como `null` (mesmo caminho de "não encontrado" de qualquer outra falha). Roda tanto no
 *  servidor quanto no navegador (a api.bncc.dev libera CORS pra qualquer origem). */
export async function buscarAprendizagem(codigo: string): Promise<HabilidadeBNCC | null> {
  const resposta = await buscarJSON<{ codigo: string; texto: string }>(`/aprendizagens/${encodeURIComponent(codigo)}`)
  return resposta ? { codigo: resposta.codigo, texto: resposta.texto } : null
}

/** Resolve uma lista de códigos (ex.: `config.codigosBNCC`, editável pelo professor) contra a
 *  base oficial em paralelo, devolvendo só os que existem de verdade  na ordem original, sem os
 *  que não foram encontrados (código digitado errado, ainda incompleto etc.). Usada na hora de
 *  montar o rodapé do Word (ver `generate-word.ts`), pra que uma edição manual do professor
 *  também mostre sempre a descrição oficial, nunca um texto inventado. */
export async function resolverCodigosBNCC(codigos: string[]): Promise<HabilidadeBNCC[]> {
  if (codigos.length === 0) return []
  const resolvidos = await Promise.all(codigos.map((c) => buscarAprendizagem(c)))
  return resolvidos.filter((h): h is HabilidadeBNCC => h !== null)
}
