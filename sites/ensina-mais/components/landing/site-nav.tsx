"use client"

import { useState } from "react"
import Link from "next/link"
import { ListIcon, SignInIcon, XIcon } from "@phosphor-icons/react"
import LogoIcon from "@/assents/logo"
import { APP_LOGIN_URL } from "@/lib/site"

const NAV_LINKS = [
  { href: "#recursos", label: "Recursos" },
  { href: "#comofunciona", label: "Como Funciona" },
  { href: "#seguranca", label: "Segurança" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
]

const LEGAL_LINKS = [
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/cookies", label: "Cookies" },
  { href: "/politica-ia", label: "IA" },
  { href: "/politica-conta", label: "Conta" },
]

interface SiteNavProps {
  /** Nas páginas de termos/privacidade não existem seções pra ancorar, então o nav
   *  troca os links de #seção pelos links entre as duas páginas legais, e a logo
   *  volta pra raiz em vez de rolar até #intro. */
  legal?: boolean
}

/** Nav da landing  no mobile os links viram uma gaveta lateral (ver .translate-x
 *  abaixo) acionada pelo botão de menu, já que não cabem na barra igual no desktop. */
export default function SiteNav({ legal = false }: SiteNavProps) {
  const [open, setOpen] = useState(false)
  const links = legal ? LEGAL_LINKS : NAV_LINKS

  return (
    <>
      <nav className="fixed top-0 left-0 right-2 z-2 h-16 flex items-center justify-between lg:justify-around gap-6 px-6 bg-(--background)/80 backdrop-blur-sm border-b border-(--secundary)">
        <Link href={legal ? "/" : "#intro"} className="flex items-center gap-2">
          <LogoIcon h={28} w={28} />
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-(--foreground)/70">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-(--foreground) transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

                  <a href={APP_LOGIN_URL} className="hidden sm:flex gap-1 justify-center items-center text-sm font-semibold text-white bg-(--brand) hover:bg-(--brand-secundary) transition-colors rounded-lg px-4 py-2">
            <SignInIcon size={18} /> Login
          </a>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="sm:hidden p-1.5 rounded-lg hover:bg-(--secundary) text-(--foreground)/70 transition-colors cursor-pointer"
        >
          <ListIcon size={24} />
        </button>
      </nav>

      <div className={`fixed inset-0 z-2 sm:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`fixed top-0 right-0 h-full w-64 max-w-[80vw] bg-(--background) border-l border-(--secundary) flex flex-col gap-1 p-6 shadow-xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Menu</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="p-1.5 rounded-lg hover:bg-(--secundary) transition-colors cursor-pointer"
            >
              <XIcon size={20} />
            </button>
          </div>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-(--foreground)/70 hover:text-(--foreground) transition-colors py-2"
            >
              {link.label}
            </Link>
          ))}

          <a
            href={APP_LOGIN_URL}
            onClick={() => setOpen(false)}
            className="mt-2 text-center text-sm font-semibold text-white bg-(--brand) hover:bg-(--brand-secundary) transition-colors rounded-lg px-4 py-2.5"
          >
            Começar grátis
          </a>
        </div>
      </div>
    </>
  )
}
