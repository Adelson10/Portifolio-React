import type { SupabaseClient } from "@supabase/supabase-js"
import type { Plano } from "@/lib/ai/model-por-plano"

// Únicos status do Stripe em que o usuário ainda tem direito ao plano pago  qualquer outro
// (past_due, unpaid, incomplete, incomplete_expired, canceled) derruba pro limite "gratis" na
// hora, sem esperar a Stripe cancelar a assinatura de fato (ver customer.subscription.deleted em
// app/api/webhooks/stripe/route.ts, que só acontece bem depois de um pagamento começar a falhar).
const STATUS_COM_PLANO_PAGO = new Set(["active", "trialing"])

export interface AssinaturaEfetiva {
  plano: Plano
  /** Data real de início da assinatura paga (Stripe subscription.start_date)  âncora do reset
   *  de cota a cada 30 dias (ver inicioJanelaCota em lib/atividades/limites.ts). NULL quando o
   *  usuário está no plano "gratis" (sem assinatura, ou assinatura sem status pago). */
  assinaturaIniciadaEm: string | null
}

/**
 * Busca `assinaturas` do usuário e resolve o plano/âncora que REALMENTE vale pra checagem de
 * cota e escolha de modelo de IA  ao contrário de ler só a coluna `plano`, também considera o
 * `status` (Stripe): pagamento atrasado ou assinatura incompleta não dá mais o plano pago, mesmo
 * que a coluna `plano` ainda esteja marcada como "basico"/"premium" (só o webhook do Stripe some
 * com essa marcação quando a assinatura é cancelada de fato).
 */
export async function obterAssinaturaEfetiva(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<AssinaturaEfetiva> {
  const { data } = await supabase
    .from("assinaturas")
    .select("plano, status, assinatura_iniciada_em")
    .eq("usuario_id", usuarioId)
    .maybeSingle()

  if (!data || !STATUS_COM_PLANO_PAGO.has(data.status)) {
    return { plano: "gratis", assinaturaIniciadaEm: null }
  }

  return { plano: data.plano as Plano, assinaturaIniciadaEm: data.assinatura_iniciada_em }
}
