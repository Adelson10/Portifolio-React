import { createHash } from "node:crypto"
import type { GoogleGenAI } from "@google/genai"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ArquivoReferencia } from "./extrair-conteudo-arquivo"
import { montarConteudoReferencia, obterSystemInstruction, type TipoConteudo } from "./gemini-prompt"
import { logUsoTokens } from "./log-uso-tokens"

// TTL do cache no Gemini  janela em que "Regerar" reaproveita o material já enviado
// sem custo de reprocessar o documento inteiro de novo. Espelhado em `gemini_cache_documentos.expira_em`.
const CACHE_TTL_SECONDS = 3600

/** Hash estável do conteúdo do arquivo  chave de busca do cache em `gemini_cache_documentos`
 *  (persistido em `atividades.gemini_arquivo_hash` pra sobreviver além da chamada de geração
 *  original e permitir reaproveitar o cache ao regenerar uma questão avulsa depois). Inclui
 *  `tipoConteudo` na chave: atividade e prova usam personas (system instructions) diferentes,
 *  então precisam de caches separados mesmo para o mesmo arquivo. */
export function hashArquivo(arquivo: ArquivoReferencia, tipoConteudo: TipoConteudo = "atividade"): string {
  const conteudo = arquivo.tipo === "pdf" ? arquivo.base64 : arquivo.texto
  return createHash("sha256").update(`${tipoConteudo}:${arquivo.tipo}:${conteudo}`).digest("hex")
}

/** Busca (sem criar) um cache ainda válido pra esse hash+modelo  usado quando não se tem mais
 *  o arquivo original em mãos (ex.: regenerar uma questão avulsa bem depois da geração), só o
 *  hash gravado na atividade. Retorna `null` se não houver cache ou se já tiver expirado. */
export async function obterCacheExistente(
  supabase: SupabaseClient,
  usuarioId: string,
  hash: string,
  modelo: string,
): Promise<string | null> {
  const { data: existente } = await supabase
    .from("gemini_cache_documentos")
    .select("cache_name, expira_em")
    .eq("usuario_id", usuarioId)
    .eq("hash", hash)
    .eq("modelo", modelo)
    .maybeSingle()

  return existente && new Date(existente.expira_em) > new Date() ? existente.cache_name : null
}

/**
 * Reaproveita (ou cria) um cache de contexto do Gemini para o material de referência anexado 
 * evita reenviar o PDF/texto inteiro a cada "Regerar", já que só o prompt variável (tema,
 * quantidade, tipos etc.) muda entre chamadas. Retorna `null` quando o cache não é viável
 * (documento pequeno demais para o mínimo exigido pela API, cota excedida, modelo sem suporte
 * etc.)  nesse caso o chamador deve enviar o material inline, como antes.
 */
export async function obterCacheDeReferencia(
  ai: GoogleGenAI,
  arquivo: ArquivoReferencia,
  modelo: string,
  supabase: SupabaseClient,
  usuarioId: string,
  tipoConteudo: TipoConteudo = "atividade",
): Promise<string | null> {
  const hash = hashArquivo(arquivo, tipoConteudo)

  const existente = await obterCacheExistente(supabase, usuarioId, hash, modelo)
  if (existente) return existente

  try {
    const cache = await ai.caches.create({
      model: modelo,
      config: {
        contents: [montarConteudoReferencia(arquivo)],
        systemInstruction: obterSystemInstruction(tipoConteudo),
        ttl: `${CACHE_TTL_SECONDS}s`,
      },
    })
    if (!cache.name) return null

    // A criação do cache é cobrada como tokens de entrada normais (preço "entrada", não
    // "entradaCache")  a tarifa de cache só se aplica quando esse cache é *reaproveitado*
    // numa chamada de geração posterior. `CachedContentUsageMetadata` só expõe `totalTokenCount`.
    logUsoTokens(
      "obterCacheDeReferencia (criação)",
      modelo,
      cache.usageMetadata ? { promptTokenCount: cache.usageMetadata.totalTokenCount } : undefined
    )

    const expiraEm = new Date(Date.now() + CACHE_TTL_SECONDS * 1000).toISOString()
    await supabase
      .from("gemini_cache_documentos")
      .upsert(
        { usuario_id: usuarioId, hash, modelo, cache_name: cache.name, expira_em: expiraEm },
        { onConflict: "usuario_id,hash,modelo" }
      )

    return cache.name
  } catch {
    // Não é crítico  o chamador cai de volta para enviar o material inline nesta chamada.
    return null
  }
}

/** Remove do registro um cache que o Gemini rejeitou em tempo de geração (expirou antes do
 *  previsto, foi apagado etc.)  a próxima chamada cria um novo em vez de reusar o inválido. */
export async function invalidarCache(supabase: SupabaseClient, usuarioId: string, cacheName: string): Promise<void> {
  await supabase
    .from("gemini_cache_documentos")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("cache_name", cacheName)
}
