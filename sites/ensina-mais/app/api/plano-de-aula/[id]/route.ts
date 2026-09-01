import { createServerSupabaseClient } from "@/lib/supabase-server"

const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function GET(_request: Request, ctx: RouteContext<"/api/plano-de-aula/[id]">) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Checagem explícita de dono (defesa em profundidade além da RLS)  `atividades` não tem
  // usuario_id direto, o dono é quem é dono da turma (mesmo padrão de /api/atividades/[id]).
  const { data: atividade, error: atividadeError } = await supabase
    .from("atividades")
    .select("id, titulo, turma_id")
    .eq("id", id)
    .single()
  if (atividadeError) return Response.json({ error: "Plano de aula não encontrado" }, { status: 404 })

  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", atividade.turma_id).maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: planoAula, error: planoError } = await supabase
    .from("planos_aula")
    .select(
      "disciplina, data_aula, duracao_minutos, formato_aula, objetivo_geral, objetivos, habilidades_bncc, competencias, conteudo, metodologia, recursos, atividades_propostas, avaliacao, adaptacoes, tarefa_casa, referencias"
    )
    .eq("atividade_id", id)
    .maybeSingle()
  if (planoError) {
    console.error("[GET /api/plano-de-aula/[id]] falha ao buscar plano de aula:", planoError)
    return Response.json({ error: "Não foi possível carregar o plano de aula." }, { status: 500 })
  }

  const docxUrl =
    (await supabase.storage.from("atividades").createSignedUrl(`${user.id}/${id}.docx`, SIGNED_URL_TTL_SECONDS)).data
      ?.signedUrl ?? null

  return Response.json({
    id: atividade.id,
    titulo: atividade.titulo,
    disciplina: planoAula?.disciplina ?? undefined,
    dataAula: planoAula?.data_aula ?? undefined,
    duracaoMinutos: planoAula?.duracao_minutos ?? undefined,
    formatoAula: planoAula?.formato_aula ?? undefined,
    objetivoGeral: planoAula?.objetivo_geral ?? undefined,
    objetivos: planoAula?.objetivos ?? [],
    habilidadesBNCC: planoAula?.habilidades_bncc ?? [],
    competencias: planoAula?.competencias ?? [],
    conteudo: planoAula?.conteudo ?? undefined,
    metodologia: planoAula?.metodologia ?? undefined,
    recursos: planoAula?.recursos ?? [],
    atividadesPropostas: planoAula?.atividades_propostas ?? [],
    avaliacao: planoAula?.avaliacao ?? undefined,
    adaptacoes: planoAula?.adaptacoes ?? undefined,
    tarefaCasa: planoAula?.tarefa_casa ?? undefined,
    referencias: planoAula?.referencias ?? [],
    docxUrl,
  })
}
