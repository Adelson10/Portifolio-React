import type { TurmaNivel } from "@/lib/turmas/niveis"
import { selecionarHabilidadesBNCC } from "@/lib/ai/selecionar-habilidades-bncc"
import { obterConfigIA } from "@/lib/ai/model-por-plano"
import { resolverEscopoBNCC } from "./mapear-turma"
import { buscarHabilidadesEF, buscarHabilidadesEM, type HabilidadeBNCC } from "./api-bncc-dev"

export type { HabilidadeBNCC }

interface DetectarHabilidadesBNCCParams {
  turma: { nivel: TurmaNivel; serie: string | null | undefined }
  /** `turmas.nome` (a disciplina)  usada pra resolver o componente/área BNCC da turma. */
  disciplina: string
  tema?: string
  questoes: { enunciado: string }[]
}

/**
 * Ponto de entrada único chamado por `/api/atividades/gerar` depois que as questões já foram
 * geradas com sucesso: resolve o escopo BNCC da turma (etapa/componente/ano ou área  ver
 * `resolverEscopoBNCC`), busca as habilidades candidatas na base oficial (`buscarHabilidadesEF`/
 * `buscarHabilidadesEM`) e pede pra IA escolher, entre elas, quais o conteúdo gerado realmente
 * trabalha (`selecionarHabilidadesBNCC`  restrito por `enum`, nunca inventa código).
 *
 * Cada etapa tem uma saída segura própria (`null`/lista vazia) quando não dá pra prosseguir 
 * turma fora do escopo da BNCC, disciplina não reconhecida, API fora do ar, IA não achou nada
 * compatível  e o resultado final nesses casos é sempre `[]`: a atividade já foi gerada com
 * sucesso antes desta função ser chamada, então nunca vale travar/falhar a geração por causa
 * disso, só deixar de mostrar habilidades no rodapé.
 */
export async function detectarHabilidadesBNCC(params: DetectarHabilidadesBNCCParams): Promise<HabilidadeBNCC[]> {
  const escopo = resolverEscopoBNCC(params.turma, params.disciplina)
  if (!escopo) return []

  const candidatas =
    escopo.etapa === "EF"
      ? await buscarHabilidadesEF(escopo.componenteSigla, escopo.ano)
      : await buscarHabilidadesEM(escopo.areaId)
  if (!candidatas?.length) return []

  // Sempre "gratis" (Gemini Flash-Lite), independente do plano de quem gerou a atividade  é uma
  // escolha entre um `enum` fechado de códigos já validados (não geração de texto livre), então o
  // modelo mais caro do premium (ver `model-por-plano.ts`) não melhora o resultado, só o custo.
  // Mesmo padrão de `filtrar-paginas-pdf.ts`, que força "gratis" pelo mesmo motivo.
  const { modelo, apiKey } = obterConfigIA("gratis")

  return selecionarHabilidadesBNCC({
    modelo,
    apiKey,
    tema: params.tema,
    questoes: params.questoes,
    candidatas,
  })
}
