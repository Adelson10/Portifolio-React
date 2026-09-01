"use client"

import { getCookieDomain } from "@/lib/site"

/** Tema de aparência do app  persiste em cookie (não localStorage) e aplica via classe
 *  `.light`/`.dark` em <html> (ver app/globals.css, regras `:root.light`/`:root.dark`).
 *  "Sistema" é a ausência de classe: as variáveis de cor seguem só a media query
 *  `prefers-color-scheme`. Precisa ser cookie com `domain=.ensinaplus.com` (mesmo esquema do
 *  cookie de sessão em lib/site.ts) pra a preferência escolhida em um subdomínio (ex:
 *  chat.ensinaplus.com) valer também na landing (ensinaplus.com) e vice-versa  localStorage é
 *  isolado por origem e não cobre isso. O script inline em app/layout.tsx lê o mesmo cookie
 *  antes da hidratação pra evitar flash da cor errada. */
export type Tema = "sistema" | "claro" | "escuro"

const CHAVE_TEMA = "tema"
const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365

function lerCookie(nome: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

export function obterTemaSalvo(): Tema {
  if (typeof window === "undefined") return "sistema"
  const valor = lerCookie(CHAVE_TEMA)
  return valor === "claro" || valor === "escuro" ? valor : "sistema"
}

export function aplicarTema(tema: Tema) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  if (tema === "claro") root.classList.add("light")
  if (tema === "escuro") root.classList.add("dark")

  const domain = getCookieDomain(window.location.hostname)
  const domainAttr = domain ? `; domain=${domain}` : ""
  document.cookie = `${CHAVE_TEMA}=${tema}; path=/; max-age=${UM_ANO_EM_SEGUNDOS}${domainAttr}`
}
