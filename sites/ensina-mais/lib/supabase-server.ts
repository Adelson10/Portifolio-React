import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { getCookieDomain } from './site'
import { createLoggingFetch } from './supabase-fetch-logger'

const loggingFetch = createLoggingFetch('supabase-server')

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  const host = (await headers()).get('host')
  const domain = getCookieDomain(host)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: loggingFetch },
      cookieOptions: domain ? { domain } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (e) {
            // Esperado quando chamado de Server Components (cookies são read-only lá,
            // o middleware é quem refresca a sessão). Mas essa mesma função também é usada
            // em Route Handlers (ex: app/auth/callback/route.ts), onde set() deveria
            // funcionar  logamos aqui pra não mascarar uma falha real de gravação de
            // cookie de sessão ali, que faria o login parecer "não funcionar" sem erro nenhum.
            console.error('[supabase-server] setAll falhou:', e)
          }
        },
      },
    }
  )
}
