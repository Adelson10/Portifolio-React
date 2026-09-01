import { createServerSupabaseClient } from "@/lib/supabase-server"

// Avatar é uma foto de perfil pequena  bem menor que o teto de 5MB usado pra anexos de
// atividade (lib/ai/limites-arquivo.ts), que são documentos de referência para a IA.
const TAMANHO_MAXIMO_AVATAR_BYTES = 2 * 1024 * 1024
const MIME_TIPOS_AVATAR_VALIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "file é obrigatório" }, { status: 400 })
    }
    if (!MIME_TIPOS_AVATAR_VALIDOS.includes(file.type)) {
      return Response.json({ error: "Formato de imagem não suportado (use JPEG, PNG, WEBP ou GIF)" }, { status: 400 })
    }
    if (file.size > TAMANHO_MAXIMO_AVATAR_BYTES) {
      return Response.json({ error: "Imagem muito grande (máximo 2MB)" }, { status: 400 })
    }

    const path = `${user.id}/avatar`

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadError) {
      console.error("[avatar upload] falha ao enviar para o storage:", uploadError)
      return Response.json({ error: "Não foi possível enviar a foto." }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path)
    const avatarUrl = `${publicUrl.publicUrl}?v=${Date.now()}`

    const { error } = await supabase.from("usuarios").update({ avatar_url: avatarUrl }).eq("id", user.id)
    if (error) {
      console.error("[avatar upload] falha ao atualizar usuarios:", error)
      return Response.json({ error: "Não foi possível salvar a foto de perfil." }, { status: 500 })
    }

    return Response.json({ avatar_url: avatarUrl })
  } catch (err) {
    console.error("[avatar upload] erro inesperado:", err)
    return Response.json({ error: "Erro inesperado ao enviar a foto." }, { status: 500 })
  }
}
