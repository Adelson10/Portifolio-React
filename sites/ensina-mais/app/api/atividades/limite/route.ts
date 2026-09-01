import { createServerSupabaseClient } from "@/lib/supabase-server"
import { obterLimiteDiario, verificarLimiteDiario, verificarLimiteMensal, verificarLimiteVestibular } from "@/lib/atividades/limites"
import { obterAssinaturaEfetiva } from "@/lib/atividades/assinatura"

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const { plano, assinaturaIniciadaEm } = await obterAssinaturaEfetiva(supabase, user.id)

  const { usadas, limite } = await verificarLimiteMensal(supabase, user.id, plano, assinaturaIniciadaEm)

  // Só o plano "gratis" tem teto diário  os demais mostram só a cota mensal.
  const diario = obterLimiteDiario(plano)
    ? await verificarLimiteDiario(supabase, user.id, plano)
    : null

  // Cota própria de buscas ENEM/vestibular (grounding)  só existe pra "basico"/"premium" (ver
  // LIMITE_VESTIBULAR_MENSAL_POR_PLANO em lib/atividades/limites.ts); "gratis" sempre vem 0/0.
  const vestibular = await verificarLimiteVestibular(supabase, user.id, plano, assinaturaIniciadaEm)

  return Response.json({
    plano,
    usadas,
    limite,
    ...(diario ? { usadasDiario: diario.usadas, limiteDiario: diario.limite } : {}),
    usadasVestibular: vestibular.usadas,
    limiteVestibular: vestibular.limite,
  })
}
