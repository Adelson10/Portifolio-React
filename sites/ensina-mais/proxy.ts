import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getCookieDomain, sanitizeNextPath } from './lib/site'
import { getUserSeguro } from './lib/auth-seguro'
import { createLoggingFetch } from './lib/supabase-fetch-logger'

const loggingFetch = createLoggingFetch('proxy')

const protectedPrefixes = ['/atividades', '/provas', '/plano-de-aula', '/pricing', '/checkout']
const authRoutes = ['/login']

const SUPABASE_ORIGIN = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin

// Nonce por request em vez de hash fixo: o App Router injeta vários <script> inline com o
// payload do RSC (conteúdo muda a cada request), então um hash estático não cobre  só nonce
// ou 'unsafe-inline' cobrem. `strict-dynamic` deixa o bundle 'self' (já confiável via nonce)
// carregar o script do Stripe.js dinamicamente sem precisar abrir mão do allowlist por host,
// que fica como fallback pra navegadores sem suporte a strict-dynamic.
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV !== 'production'
  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': `'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com${isDev ? " 'unsafe-eval'" : ''}`,
    // 'unsafe-inline' aqui é pro atributo style="" usado no editor A4 (layout dinâmico, sem
    // como trocar por classes)  risco bem menor que 'unsafe-inline' em script-src.
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com data:",
    // data:/blob: pra imagens coladas/recortadas no editor A4; SUPABASE_ORIGIN pro avatar.
    'img-src': `'self' data: blob: ${SUPABASE_ORIGIN}`,
    // api.bncc.dev: resolve descrição oficial dos códigos BNCC no navegador  tanto na prévia A4
    // (RepeatingFooter, ver a4-sheet.tsx) quanto ao exportar o Word (generate-word.ts), ambos via
    // lib/bncc/api-bncc-dev.ts. Sem isso o fetch é bloqueado pela CSP (silenciosamente  sem esse
    // host aqui, o rodapé de BNCC nunca aparece nem dá erro visível).
    'connect-src': `'self' ${SUPABASE_ORIGIN} https://api.stripe.com https://api.bncc.dev`,
    // Payment Element da Stripe roda num iframe cross-origin (ver components/checkout-form.tsx).
    'frame-src': 'https://js.stripe.com https://hooks.stripe.com',
    'frame-ancestors': "'none'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
  }
  return Object.entries(directives)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ')
}

// Domínio institucional (ensinaplus.com) e o subdomínio do produto (chat.ensinaplus.com)
// compartilham este mesmo projeto na Vercel. Na raiz "/", o domínio institucional mostra só
// o placeholder de /inicio (sem exigir login)  o subdomínio chat.* não bate aqui e segue o
// fluxo normal abaixo (proteção de rota, callback de auth etc.).
const MARKETING_HOSTS = new Set(['ensinaplus.com', 'www.ensinaplus.com'])

export async function proxy(request: NextRequest) {
  const { pathname, searchParams, origin } = request.nextUrl
  const hostname = (request.headers.get('host') ?? '').split(':')[0]

  const code = searchParams.get('code')

  // Nonce gerado uma vez por request: vai tanto pro header de resposta CSP (script-src) quanto
  // pro header de request `x-nonce`, que o RootLayout lê via `headers()` pra assinar o único
  // <script> inline próprio do app (o resto dos inline scripts, injetados pelo Next pro payload
  // do RSC, recebem esse mesmo nonce automaticamente  ver next.config.ts/docs do App Router).
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  function withCsp(response: NextResponse): NextResponse {
    response.headers.set('Content-Security-Policy', csp)
    return response
  }

  // Precisa vir antes do rewrite de marketing abaixo: `new URL('/inicio', request.url)`
  // descarta a query string, então se um `?code=` da OAuth chegasse na raiz de um
  // MARKETING_HOST, o rewrite apagaria o code antes de virar sessão  login "falhando"
  // silenciosamente (sem erro, só voltando pra home deslogado).
  if (code && pathname !== '/auth/callback') {
    const url = new URL('/auth/callback', origin)
    url.searchParams.set('code', code)
    return withCsp(NextResponse.redirect(url))
  }

  if (MARKETING_HOSTS.has(hostname) && pathname === '/') {
    return withCsp(NextResponse.rewrite(new URL('/inicio', request.url)))
  }

  // A troca do code PKCE por sessão só pode acontecer uma vez. Se o middleware
  // instancia seu próprio client aqui e chama getUser()/getClaims() antes da rota
  // processar o code, uma sessão inválida residual no navegador pode disparar limpeza
  // de cookies do GoTrue e derrubar o code_verifier antes da troca acontecer  daí o
  // "PKCE code verifier not found in storage". A rota cuida da própria sessão sozinha.
  if (pathname === '/auth/callback') {
    return withCsp(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  const cookieDomain = getCookieDomain(hostname)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: loggingFetch },
      cookieOptions: cookieDomain ? { domain: cookieDomain } : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const user = await getUserSeguro(supabase)

  const isProtected =
    pathname === '/' || protectedPrefixes.some((r) => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r))

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return withCsp(NextResponse.redirect(loginUrl))
  }

  if (user && pathname !== '/redefinir-senha') {
    // Mesmo risco de refresh token inválido do getUser() acima (ver getUserSeguro)  uma falha
    // aqui não deve derrubar a navegação, só pula a checagem de sessão de recuperação de senha.
    try {
      const { data: claimsData } = await supabase.auth.getClaims()
      const isRecoverySession = claimsData?.claims.amr?.some(
        (m) => typeof m !== 'string' && m.method === 'recovery'
      )
      if (isRecoverySession) {
        return withCsp(NextResponse.redirect(new URL('/redefinir-senha', request.url)))
      }
    } catch (err) {
      console.error('[proxy] getClaims() falhou:', err)
    }
  }

  if (isAuthRoute && user && !searchParams.get('error')) {
    const dest = sanitizeNextPath(searchParams.get('next')) ?? '/'
    return withCsp(NextResponse.redirect(new URL(dest, request.url)))
  }

  return withCsp(supabaseResponse)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
