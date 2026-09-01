'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from './supabase-server'
import { createSupabaseAdminClient } from './supabase-admin'
import { traduzirErroAuth } from './auth-errors'
import { sanitizeNextPath } from './site'

export async function signIn(email: string, password: string, next?: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: traduzirErroAuth(error.message) }
  redirect(sanitizeNextPath(next) ?? '/')
}

export async function signUp(nome: string, email: string, password: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: nome } },
  })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: 'Verifique seu e-mail para confirmar o cadastro.' }
}

/**
 * Checa se um e-mail já tem conta  chamado ANTES do login existir (enquanto a pessoa digita
 * no cadastro, ver components/auth-form.tsx), então não dá pra usar o client de sessão normal
 * (que agiria como `anon`). Usa a service role porque `email_ja_cadastrado` foi revogada de
 * `anon`/`authenticated` no banco (ver migration de segurança)  sem isso, qualquer visitante
 * conseguiria chamar a função direto pela API REST do Supabase (só com a anon key, pública por
 * design) pra enumerar e-mails cadastrados, sem nenhum limite de taxa.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('email_ja_cadastrado', { email_input: email })
  if (error) return false
  return Boolean(data)
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updatePassword(password: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: true }
}

/** Troca de senha a partir das Configurações (usuário já logado)  exige a senha atual, diferente
 *  de `updatePassword` (usado só no fluxo "esqueci minha senha", onde não há senha atual pra
 *  conferir). Reautentica com `signInWithPassword` antes de trocar, pra confirmar que quem está
 *  com a sessão aberta realmente sabe a senha atual. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Não foi possível verificar sua conta.' }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'Senha atual incorreta.' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: true }
}

/** Troca de e-mail  o Supabase envia um link de confirmação pro endereço novo (e, dependendo da
 *  config do projeto, também um aviso pro antigo); o e-mail só muda de fato depois que o link é
 *  confirmado, então a resposta aqui é sempre "confira sua caixa de entrada", não a troca em si. */
export async function updateEmail(email: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: true }
}

export async function confirmPasswordReset(tokenHash: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: true }
}

export async function updateProfile(fullName: string) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })
  if (error) return { error: traduzirErroAuth(error.message) }
  return { success: true }
}
