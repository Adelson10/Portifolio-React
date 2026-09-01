import { createServerSupabaseClient } from "@/lib/supabase-server"

/** Retorna todos os modelos .docx que o usuário já enviou (mais recentes primeiro), pra permitir
 *  reusá-los em novas atividades sem reenviar o mesmo arquivo  economiza upload e espaço no
 *  Storage. O primeiro item da lista é o mais recente (ver step-style: reaproveitado por padrão). */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const { data, error } = await supabase
    .from("modelos_template")
    .select("id, nome, created_at")
    .eq("usuario_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
