"use client"

import { QuestionIcon } from "@phosphor-icons/react"
import { useTour } from "./tour-context"

/** Botão flutuante que reabre o tutorial (ver `restart` em tour-context.tsx) - só aparece depois
 *  que o tour já foi encerrado (visto ou pulado) e só a partir do `md:`, já que o tutorial em si
 *  não tem versão mobile. */
export default function HelpButton() {
  const { active, restart } = useTour()
  if (active) return null

  return (
    <button
      type="button"
      onClick={restart}
      title="Rever o tutorial"
      className="hidden md:flex fixed right-5 bottom-5 z-40 w-11 h-11 items-center justify-center rounded-full border border-(--secundary) bg-(--background) text-(--brand) shadow-lg hover:bg-(--secundary) transition-colors cursor-pointer"
    >
      <QuestionIcon size={22} />
    </button>
  )
}
