/** Subdomínio do produto  a landing institucional (ensinaplus.com) linka pra cá em vez
 *  de rotas relativas, já que o login/app deve sempre abrir em chat.ensinaplus.com. */
export const APP_URL = "https://chat.ensinaplus.com"

export const APP_LOGIN_URL = `${APP_URL}/login`
export const APP_PRICING_URL = `${APP_URL}/pricing`

/** Manda direto pro checkout do plano escolhido em vez do /pricing genérico  se não tiver
 *  sessão, o middleware já redireciona pra /login?next=/checkout?preco=... e volta pra cá
 *  sozinho depois (ver proxy.ts e o fluxo de `next` em lib/auth.ts). `precoId` bate com as
 *  chaves de PRECO_INFO em app/checkout/page.tsx (ex: "basico_mensal", "premium_mensal"). */
export function appCheckoutUrl(precoId: string): string {
  return `${APP_URL}/checkout?preco=${precoId}`
}

const ROOT_DOMAIN = "ensinaplus.com"

/** Domínio pro Set-Cookie da sessão do Supabase. Sem isso, o cookie de auth fica
 *  preso ao host que fez login (chat.ensinaplus.com) e a landing institucional
 *  (ensinaplus.com) nunca enxerga o usuário como logado. Em dev/preview (host fora
 *  de ensinaplus.com) retorna undefined pra manter o comportamento padrão (host-only). */
export function getCookieDomain(host: string | null | undefined): string | undefined {
  const hostname = host?.split(":")[0]
  return hostname && (hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`))
    ? `.${ROOT_DOMAIN}`
    : undefined
}

/** Valida o ?next= usado pra voltar o usuário pra onde ele tentou ir antes do login (ex:
 *  /pricing). Só aceita caminho relativo interno  nunca um domínio externo  pra não abrir
 *  brecha de open redirect via query string forjada. */
export function sanitizeNextPath(next: string | null | undefined): string | undefined {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return undefined
  return next
}
