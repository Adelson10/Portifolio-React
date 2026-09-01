"use client"

import { UserCircleIcon } from "@phosphor-icons/react"
import { APP_URL } from "@/lib/site"

interface HeroAccessCardProps {
  userName?: string
  avatarUrl?: string | null
}

/** Substitui o HeroLoginCard quando o visitante já tem sessão ativa  não faz
 *  sentido pedir cadastro de novo, só encaminhar pro app. */
export default function HeroAccessCard({ userName, avatarUrl }: HeroAccessCardProps) {
  return (
    <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 flex flex-col gap-6 bg-(--background)">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="shrink-0 w-14 h-14 ring-4 ring-(--brand) rounded-full object-cover inset-shadow-sm" />
        ) : (
          <UserCircleIcon size={40} className="shrink-0 text-(--brand)" />
        )}
        <p className="text-xl font-bold truncate">{userName}</p>
      </div>

      <a
        href={APP_URL}
        className="w-full text-center py-2.5 rounded-lg bg-(--brand) text-white text-sm font-semibold hover:bg-(--brand-secundary) transition-colors"
      >
        Acessar
      </a>

      <p className="text-xs text-center text-(--foreground)/40">
        Sua conta já está pronta  é só continuar de onde parou.
      </p>
    </div>
  )
}
