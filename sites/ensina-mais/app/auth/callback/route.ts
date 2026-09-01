import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeNextPath } from '@/lib/site'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requestedNext = sanitizeNextPath(searchParams.get('next'))

  if (code) {
    // Log em string única (não objeto/array aninhado) pra não depender de expandir nada no
    // viewer de logs da Vercel  entra tudo numa linha só, sempre visível. Mostra os nomes dos
    // cookies recebidos (nunca os valores) e, especificamente, se algum bate com o padrão
    // "*-code-verifier" (nome usado pelo @supabase/ssr pro cookie do PKCE) e o tamanho do valor
    // dele, pra distinguir "cookie nunca chegou" de "cookie chegou vazio/truncado".
    const cookieNames = request.cookies.getAll().map((c) => c.name)
    const verifierCookie = request.cookies.getAll().find((c) => c.name.includes('code-verifier'))
    console.warn(
      `[auth/callback] recebido code=sim; cookies=[${cookieNames.join(', ')}]; ` +
        `verifierCookie=${verifierCookie ? `${verifierCookie.name} (len=${verifierCookie.value.length})` : 'AUSENTE'}`
    )

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${requestedNext ?? '/'}`)
    }
    // console.warn (não .error): na maioria das vezes é o navegador do usuário não mandando de
    // volta o cookie do code_verifier (aba/dispositivo diferente, proteção anti-tracking do
    // Safari/Brave/Edge que limpa cookies setados logo antes de um redirect cross-site, clique
    // duplo no botão do Google), não uma falha do servidor.
    console.warn(
      `[auth/callback] exchangeCodeForSession falhou (fluxo Google): message="${error.message}" ` +
        `name=${error.name} status=${error.status} code=${error.code}`
    )
    return NextResponse.redirect(`${origin}/login?error=auth_callback&reason=${encodeURIComponent(error.message)}`)
  }

  console.error('[auth/callback] sem "code" na URL:', request.url)
  return NextResponse.redirect(`${origin}/login?error=auth_callback&reason=missing_code`)
}
