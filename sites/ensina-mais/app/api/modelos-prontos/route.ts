import { createServerSupabaseClient } from "@/lib/supabase-server"

/** Retorna os "modelos prontos" de sistema (`modelos_template.usuario_id is null`)  disponíveis
 *  pra qualquer usuário autenticado escolher no step-style, sem precisar enviar um .docx próprio.
 *  Endpoint separado de `/api/modelos-template` (que só lista os modelos do próprio usuário) porque
 *  aquele é usado também pra pré-selecionar automaticamente o "último modelo enviado"  misturar os
 *  dois faria um modelo de sistema ser tratado como se fosse o último upload do usuário. */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const { data, error } = await supabase
    .from("modelos_template")
    .select("id, nome, created_at")
    .is("usuario_id", null)
    .order("created_at", { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}
