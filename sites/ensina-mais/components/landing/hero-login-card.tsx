"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { APP_LOGIN_URL } from "@/lib/site"

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" height="18" width="18" style={{ display: "block" }} aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

/** Formulário de acesso embutido no hero  sem esse passo extra, o visitante teria que
 *  clicar num botão só pra chegar numa segunda tela pra então ver as opções de login. */
export default function HeroLoginCard() {
  const [email, setEmail] = useState("")

  async function handleGoogleSignIn() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    // O cadastro por e-mail em si (senha, verificação) já existe em /login  aqui só
    // encaminha, sem duplicar aquele fluxo, já na aba de cadastro e com o e-mail
    // preenchido. Navegação de origem cruzada pro subdomínio do produto, então precisa
    // ser um redirect de verdade em vez de router.push.
    const url = new URL(APP_LOGIN_URL)
    url.searchParams.set("cadastro", "1")
    url.searchParams.set("email", email)
    window.location.href = url.toString()
  }

  return (
    <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 flex flex-col gap-6 bg-(--background)">
      <p className="text-3xl sm:text-3xl font-light text-balance">
        Comece de graça, <strong className="text-(--brand) font-medium">SEM CARTÃO</strong>
      </p>
      <p className="text-sm text-(--foreground)/60 -mt-2 text-balance">Grátis pra sempre  2 gerações por dia, sem prazo pra acabar.</p>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-(--secundary) text-sm font-semibold hover:bg-(--secundary) transition-colors cursor-pointer"
      >
        <GoogleIcon /> Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-(--foreground)/40">
        <hr className="flex-1 border-t border-(--secundary)" />
        ou
        <hr className="flex-1 border-t border-(--secundary)" />
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-6">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Digite seu e-mail…"
          className="w-full border border-(--secundary) rounded-lg px-3 py-2.5 text-sm bg-(--background) focus:outline-none focus:ring-2 focus:ring-(--brand) focus:border-transparent transition-shadow"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-(--brand) text-white text-sm font-semibold hover:bg-(--brand-secundary) transition-colors cursor-pointer"
        >
          Criar conta grátis
        </button>
      </form>

      <p className="text-[11px] text-center text-(--foreground)/40">
        Ao continuar, você concorda com os{" "}
        <a href="#" className="underline text-(--brand)/60 hover:text-(--brand)">Termos de Uso</a> e a{" "}
        <a href="#" className="underline text-(--brand)/60 hover:text-(--brand)">Política de Privacidade</a>
      </p>
    </div>
  )
}
