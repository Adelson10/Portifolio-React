import { ApiError } from "@google/genai"

const RETRY_STATUS_CODES = new Set([503, 429])
const RETRY_DELAYS_MS = [1500, 4000, 9000]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Repete a chamada em picos de indisponibilidade/rate-limit do Gemini (503/429)  erros
 *  transitórios e comuns em modelos com muita demanda, que costumam se resolver em segundos. */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await fn()
    } catch (err) {
      const podeTentarNovamente = err instanceof ApiError && RETRY_STATUS_CODES.has(err.status)
      if (!podeTentarNovamente || tentativa >= RETRY_DELAYS_MS.length) throw err
      await sleep(RETRY_DELAYS_MS[tentativa])
    }
  }
}

/** Erro de indisponibilidade/rate-limit do Gemini que persistiu mesmo após os retries do `withRetry`. */
export function ehErroDeSobrecarga(err: unknown): boolean {
  return err instanceof ApiError && RETRY_STATUS_CODES.has(err.status)
}
