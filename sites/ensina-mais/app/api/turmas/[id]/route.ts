import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NIVEL_LABELS, type TurmaNivel } from "@/lib/turmas/niveis"

const NIVEIS_VALIDOS = Object.keys(NIVEL_LABELS) as TurmaNivel[]

export async function PATCH(request: Request, ctx: RouteContext<"/api/turmas/[id]">) {
  const { id } = await ctx.params
  const body: { nome: string; nivel: TurmaNivel; serie?: string; periodo?: string } = await request.json()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })
  if (!body.nome?.trim() || !NIVEIS_VALIDOS.includes(body.nivel)) {
    return Response.json({ error: "nome e nivel são obrigatórios" }, { status: 400 })
  }

  // Filtro explícito por dono (defesa em profundidade além da RLS `turmas_update_own`)  sem
  // isso, `.eq("id", id)` sozinho deixaria qualquer usuário autenticado editar turma alheia se a
  // RLS estivesse mal configurada.
  const { data: turma, error } = await supabase
    .from("turmas")
    .update({
      nome: body.nome.trim(),
      nivel: body.nivel,
      serie: body.serie ?? null,
      periodo: body.periodo ?? null,
    })
    .eq("id", id)
    .eq("usuario_id", user.id)
    .select("id, nome, nivel, serie, periodo")
    .maybeSingle()

  if (error) {
    console.error("[PATCH /api/turmas/[id]] falha ao atualizar turma:", error)
    return Response.json({ error: "Não foi possível atualizar a turma." }, { status: 500 })
  }
  if (!turma) return Response.json({ error: "Turma não encontrada" }, { status: 404 })
  return Response.json(turma)
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/turmas/[id]">) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Apagar a turma cascateia a exclusão de todas as atividades/provas/planos de aula dela  sem
  // isso, o .docx de cada uma ficava órfão no Storage (mesmo path usado em /api/atividades/[id]).
  const { data: atividades } = await supabase.from("atividades").select("id").eq("turma_id", id)
  if (atividades?.length) {
    const paths = atividades.map((a) => `${user.id}/${a.id}.docx`)
    const { error: storageError } = await supabase.storage.from("atividades").remove(paths)
    if (storageError) console.error("[DELETE /api/turmas/[id]] falha ao remover .docx do Storage:", storageError)
  }

  // Filtro explícito por dono (defesa em profundidade além da RLS `turmas_delete_own`).
  const { error } = await supabase.from("turmas").delete().eq("id", id).eq("usuario_id", user.id)
  if (error) {
    console.error("[DELETE /api/turmas/[id]] falha ao apagar turma:", error)
    return Response.json({ error: "Não foi possível apagar a turma." }, { status: 500 })
  }
  return Response.json({ ok: true })
}
