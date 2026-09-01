import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NIVEL_LABELS, type TurmaNivel } from "@/lib/turmas/niveis"

const NIVEIS_VALIDOS = Object.keys(NIVEL_LABELS) as TurmaNivel[]

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Filtro explícito por dono (defesa em profundidade além da RLS `turmas_select_own`).
  const { data: turmas, error } = await supabase
    .from("turmas")
    .select("id, nome, nivel, serie, periodo")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[GET /api/turmas] falha ao listar turmas:", error)
    return Response.json({ error: "Não foi possível carregar as turmas." }, { status: 500 })
  }
  if (!turmas.length) return Response.json([])

  const { data: atividades } = await supabase
    .from("atividades")
    .select("turma_id, tipo")
    .in("turma_id", turmas.map((t) => t.id))

  const contagens = new Map<string, { atividades: number; provas: number }>()
  for (const a of atividades ?? []) {
    const c = contagens.get(a.turma_id) ?? { atividades: 0, provas: 0 }
    if (a.tipo === "atividade") c.atividades++
    if (a.tipo === "prova") c.provas++
    contagens.set(a.turma_id, c)
  }

  return Response.json(
    turmas.map((t) => ({ ...t, ...(contagens.get(t.id) ?? { atividades: 0, provas: 0 }) }))
  )
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const body: { nome: string; nivel: TurmaNivel; serie?: string; periodo?: string } = await request.json()
  if (!body.nome?.trim() || !NIVEIS_VALIDOS.includes(body.nivel)) {
    return Response.json({ error: "nome e nivel são obrigatórios" }, { status: 400 })
  }

  const { data: turma, error } = await supabase
    .from("turmas")
    .insert({
      usuario_id: user.id,
      nome: body.nome.trim(),
      nivel: body.nivel,
      serie: body.serie ?? null,
      periodo: body.periodo ?? null,
    })
    .select("id, nome, nivel, serie, periodo")
    .single()

  if (error) {
    console.error("[POST /api/turmas] falha ao criar turma:", error)
    return Response.json({ error: "Não foi possível criar a turma." }, { status: 500 })
  }
  return Response.json({ ...turma, atividades: 0, provas: 0 }, { status: 201 })
}
