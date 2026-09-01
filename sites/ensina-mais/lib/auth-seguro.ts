import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * `supabase.auth.getUser()` tenta refrescar o access token usando o refresh token do cookie. Se
 * esse refresh token já foi invalidado  rotacionado por outra requisição concorrente (corrida
 * clássica quando duas requisições chegam com o mesmo cookie antigo logo após o login), sessão
 * expirada há muito tempo, ou cookie de um ambiente/projeto Supabase antigo , a chamada REJEITA
 * com `AuthApiError: Invalid Refresh Token` em vez de devolver `{ user: null }` como as outras
 * falhas de autenticação. Sem tratar isso aqui, uma sessão inválida vira uma página/rota quebrada
 * (esta função roda no middleware e em toda página protegida) em vez de simplesmente tratar a
 * requisição como deslogada, que é o comportamento correto para um token expirado/inválido.
 *
 * Sem imports de `next/headers` de propósito  usada também em `proxy.ts` (middleware), que não
 * pode depender de APIs exclusivas de Server Component/Route Handler.
 */
export async function getUserSeguro(supabase: SupabaseClient) {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch (err) {
    console.error("[auth] getUser() falhou (refresh token inválido/expirado):", err)
    return null
  }
}
