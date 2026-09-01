"use client"

import { ListIcon } from "@phosphor-icons/react"
import Link from "next/link"
import LogoIcon from "@/assents/logo"
import { useTurmas } from "@/components/turmas-context"

/** Barra fina só-mobile (abaixo de md:) com o botão que abre a gaveta da sidebar  a sidebar
 *  em si fica off-canvas nesse breakpoint (ver components/sidebar.tsx), então precisa de um
 *  gatilho sempre visível fora dela, dentro da coluna de conteúdo. */
export default function MobileTopbar() {
  const { openSidebarMobile } = useTurmas()

  return (
    <div className="flex md:hidden items-center gap-3 px-3 py-2.5 border-b border-(--secundary) shrink-0">
      <button
        type="button"
        onClick={openSidebarMobile}
        aria-label="Abrir menu"
        className="p-1.5 rounded-lg hover:bg-(--secundary) text-(--foreground)/70 transition-colors cursor-pointer"
      >
        <ListIcon size={22} />
      </button>
      <Link href="/" className="flex items-center">
        <LogoIcon h={22} w={22} />
      </Link>
    </div>
  )
}
