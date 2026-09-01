// O @supabase/auth-js captura o erro real do fetch (que carrega a causa verdadeira em `.cause`
// - DNS, TLS, conexão recusada etc.) mas descarta essa causa e só repassa `error.message =
// "fetch failed"` pra cima (ver node_modules/@supabase/auth-js/.../lib/fetch.js, _handleRequest).
// Sem interceptar aqui, um "fetch failed" é impossível de diagnosticar a partir do erro que
// quem chamou (ex: app/auth/callback/route.ts, proxy.ts) recebe de volta.
export function createLoggingFetch(label: string) {
  return async function loggingFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url
    const start = Date.now()
    try {
      return await fetch(input, init)
    } catch (err) {
      const cause = err instanceof Error ? (err.cause as { code?: string; errno?: string | number } | undefined) : undefined
      console.error(`[${label}] fetch para o Supabase falhou:`, {
        url,
        elapsedMs: Date.now() - start,
        errorName: err instanceof Error ? err.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        causeCode: cause?.code,
        causeErrno: cause?.errno,
        cause,
      })
      throw err
    }
  }
}
