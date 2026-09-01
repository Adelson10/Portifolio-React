import { APIError } from "openai"

const RETRY_STATUS_CODES = new Set([429, 500, 502, 503, 504])
const RETRY_DELAYS_MS = [1500, 4000, 9000]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Repete a chamada em picos de indisponibilidade/rate-limit da OpenAI  mesmo espírito de
 *  `gemini-retry.ts`, adaptado ao formato de erro do SDK da OpenAI (`APIError.status`). */
export async function withRetryOpenAI<T>(fn: () => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await fn()
    } catch (err) {
      const podeTentarNovamente = err instanceof APIError && RETRY_STATUS_CODES.has(err.status ?? 0)
      if (!podeTentarNovamente || tentativa >= RETRY_DELAYS_MS.length) throw err
      await sleep(RETRY_DELAYS_MS[tentativa])
    }
  }
}

/** Erro de indisponibilidade/rate-limit da OpenAI que persistiu mesmo após os retries. */
export function ehErroDeSobrecargaOpenAI(err: unknown): boolean {
  return err instanceof APIError && RETRY_STATUS_CODES.has(err.status ?? 0)
}
