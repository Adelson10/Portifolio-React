import { createClient } from "@supabase/supabase-js"

/** Client com a service-role key  ignora RLS. Só para uso em contextos sem sessão de usuário
 *  (ex.: webhook do Stripe, app/api/webhooks/stripe/route.ts), nunca em rotas que atendem
 *  requisições autenticadas do próprio usuário (essas usam `createServerSupabaseClient`). */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
