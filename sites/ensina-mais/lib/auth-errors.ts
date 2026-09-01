// Mensagens de erro do Supabase Auth vêm em inglês  traduzidas aqui pra exibir na UI.
// Match exato primeiro; mensagens com valores dinâmicos (ex.: contagem de segundos) usam regex.
// Módulo compartilhado (sem 'use server') porque é usado tanto em server actions (lib/auth.ts)
// quanto em chamadas client-side ao Supabase (components/auth-form.tsx: reset de senha, OTP).
const ERROS_AUTH_TRADUZIDOS: Record<string, string> = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'A user with this email address has already been registered': 'Este e-mail já está cadastrado.',
  'User not found': 'Usuário não encontrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Password should be at least 6 characters.': 'A senha deve ter pelo menos 6 caracteres.',
  'signup requires a valid password': 'Informe uma senha válida.',
  'Unable to validate email address: invalid format': 'E-mail inválido.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'Email link is invalid or has expired': 'O link expirou ou já foi utilizado.',
  'Token has expired or is invalid': 'O código ou link expirou ou é inválido.',
  'Invalid token': 'O código ou link é inválido.',
  'New password should be different from the old password': 'A nova senha deve ser diferente da senha atual.',
  'Same password': 'A nova senha deve ser diferente da senha atual.',
}

const ERROS_AUTH_REGEX: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^For security purposes, you can only request this after (\d+) seconds?\.?$/i, (m) => `Por segurança, aguarde ${m[1]} segundos antes de tentar novamente.`],
]

export function traduzirErroAuth(mensagem: string): string {
  if (ERROS_AUTH_TRADUZIDOS[mensagem]) return ERROS_AUTH_TRADUZIDOS[mensagem]
  for (const [regex, traduzir] of ERROS_AUTH_REGEX) {
    const match = mensagem.match(regex)
    if (match) return traduzir(match)
  }
  return mensagem
}
