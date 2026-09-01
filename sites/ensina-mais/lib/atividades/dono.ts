import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * `atividades` não tem `usuario_id` direto  o dono é quem é dono da turma (`turma_id` ->
 * `turmas.usuario_id`). Usada como defesa em profundidade nas rotas que recebem um `atividadeId`
 * do cliente (regenerar atividade/prova/plano de aula, ler modelo de estilo) além da RLS
 * (`atividades_select_own` etc., ver supabase/migrations/20260713000000_seguranca_limites_e_rls.sql)
 *  mesmo padrão já usado em app/api/atividades/[id]/route.ts.
 */
export async function verificarDonoDaAtividade(
  supabase: SupabaseClient,
  atividadeId: string,
  usuarioId: string
): Promise<boolean> {
  const { data: atividade } = await supabase.from("atividades").select("turma_id").eq("id", atividadeId).maybeSingle()
  if (!atividade) return false

  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", atividade.turma_id).maybeSingle()
  return turma?.usuario_id === usuarioId
}
