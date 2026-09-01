import type { SupabaseClient } from "@supabase/supabase-js"
import { TAMANHO_MAXIMO_MODELO_DOCX_BYTES, TAMANHO_MAXIMO_MODELO_DOCX_MB } from "@/lib/ai/limites-arquivo"
import { aplicarLogoAoModelo } from "@/lib/atividades/aplicar-logo-modelo"

/** Remove acentos e qualquer caractere fora de [a-zA-Z0-9._-] do nome do arquivo  o Supabase
 *  Storage rejeita chaves com acentuação (ex.: "cabeçalho.docx") com "Invalid key". O nome
 *  original (não sanitizado) continua sendo salvo em `modelos_template.nome` pra exibição. */
function sanitizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
}

interface ResolverModeloTemplateParams {
  supabase: SupabaseClient
  usuarioId: string
  /** .docx novo enviado no step-style  só sobe pro Storage se `modeloTemplateIdExistente` não vier. */
  modeloDocx?: File
  /** Referência de um modelo já enviado antes (reaproveitado  sem reupload). Tem prioridade sobre `modeloDocx`. */
  modeloTemplateIdExistente?: string
  /** Logo da instituição enviado no step-style (ModelSelector)  só tem efeito junto de um modelo
   *  pronto de sistema (que tem a caixa "LOGO" no cabeçalho, ver aplicar-logo-modelo.ts). */
  logoInstituicao?: File
}

/** Resolve o modelo de estilo indicado no step-style (upload novo ou reaproveitado)  usado por
 *  `/api/atividades/gerar` e `/api/plano-de-aula/gerar`, que compartilham o mesmo mecanismo de
 *  seleção de estilo (ver `components/atividades/steps/step-style.tsx`). Só deve ser chamado
 *  depois que a IA gerar o conteúdo com sucesso  se a geração falhar, nada é persistido/reenviado. */
export async function resolverModeloTemplate({
  supabase,
  usuarioId,
  modeloDocx,
  modeloTemplateIdExistente,
  logoInstituicao,
}: ResolverModeloTemplateParams): Promise<{ modeloTemplateId?: string; error?: string }> {
  if (modeloTemplateIdExistente) {
    // Logo enviado junto de um modelo existente: tenta gerar uma cópia personalizada com o logo no
    // lugar do placeholder "LOGO" (só funciona pra modelo pronto  modelo comum não tem o
    // placeholder, aplicarLogoAoModelo devolve {} nesse caso). Nunca falha a geração por causa
    // disso  sem sucesso, cai pro modelo original sem logo.
    if (logoInstituicao) {
      const { modeloTemplateId: modeloComLogo } = await aplicarLogoAoModelo({
        supabase,
        usuarioId,
        modeloTemplateId: modeloTemplateIdExistente,
        logoFile: logoInstituicao,
      })
      if (modeloComLogo) return { modeloTemplateId: modeloComLogo }
    }

    // Reaproveita um modelo já enviado antes (do próprio usuário) ou um modelo pronto de sistema
    // (usuario_id null, ver "Modelos prontos" no step-style)  sem upload, só confirma a posse.
    const { data: modeloExistente } = await supabase
      .from("modelos_template")
      .select("id")
      .eq("id", modeloTemplateIdExistente)
      .or(`usuario_id.eq.${usuarioId},usuario_id.is.null`)
      .maybeSingle()
    return { modeloTemplateId: modeloExistente?.id }
  }

  if (modeloDocx && modeloDocx.name.toLowerCase().endsWith(".docx")) {
    // Redundante com a checagem do step-style.tsx (defesa em profundidade, mesmo padrão das
    // checagens de dono acima)  um cliente que burle a validação do form não devia conseguir
    // subir pro Storage um arquivo fora do teto pensado pro payload de `/api/atividades/gerar`.
    if (modeloDocx.size > TAMANHO_MAXIMO_MODELO_DOCX_BYTES) {
      return { error: `O modelo de estilo enviado tem mais de ${TAMANHO_MAXIMO_MODELO_DOCX_MB} MB.` }
    }
    const modeloPath = `${usuarioId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(modeloDocx.name)}`
    const { error: modeloUploadError } = await supabase.storage.from("modelos").upload(modeloPath, modeloDocx, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
    if (modeloUploadError) return { error: modeloUploadError.message }

    const { data: modeloTemplate, error: modeloError } = await supabase
      .from("modelos_template")
      .insert({ usuario_id: usuarioId, nome: modeloDocx.name, arquivo_docx_path: modeloPath })
      .select("id")
      .single()
    if (modeloError) return { error: modeloError.message }
    return { modeloTemplateId: modeloTemplate.id }
  }

  return {}
}
