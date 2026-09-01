import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const turmaId = new URL(request.url).searchParams.get("turmaId")
  if (!turmaId) return Response.json({ error: "turmaId é obrigatório" }, { status: 400 })

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Checagem explícita de dono da turma (defesa em profundidade além da RLS) antes de listar
  // as atividades dela.
  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", turmaId).maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: atividades, error } = await supabase
    .from("atividades")
    .select("id, tipo, titulo, status, created_at")
    .eq("turma_id", turmaId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[GET /api/atividades] falha ao listar atividades:", error)
    return Response.json({ error: "Não foi possível carregar as atividades." }, { status: 500 })
  }
  return Response.json(atividades)
}

interface CreateAtividadeBody {
  turmaId: string
  titulo: string
  quantidadeQuestoes?: number
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const body: CreateAtividadeBody = await request.json()
  if (!body.turmaId || !body.titulo?.trim()) {
    return Response.json({ error: "turmaId e titulo são obrigatórios" }, { status: 400 })
  }

  // Checagem explícita de dono da turma (defesa em profundidade além da RLS `atividades_insert_own`).
  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", body.turmaId).maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: atividade, error } = await supabase
    .from("atividades")
    .insert({
      turma_id: body.turmaId,
      tipo: "atividade",
      titulo: body.titulo.trim(),
      formatacao: "abnt",
      fonte_escolhida: "Arial",
      quantidade_questoes: body.quantidadeQuestoes ?? null,
    })
    .select("id, tipo, titulo, status, created_at")
    .single()

  if (error) {
    console.error("[POST /api/atividades] falha ao criar atividade:", error)
    return Response.json({ error: "Não foi possível criar a atividade." }, { status: 500 })
  }
  return Response.json(atividade, { status: 201 })
}
