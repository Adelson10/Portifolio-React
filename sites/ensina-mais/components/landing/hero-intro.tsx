"use client"

import LogoFull from "@/assents/logo-full"
import { PaperPlaneRightIcon } from "@phosphor-icons/react";

export default function HeroIntro() {
  return (
    <div className="flex flex-col items-center lg:flex-1 gap-6">
      <LogoFull className="w-full sm:w-85 lg:w-110 h-auto" />
      <h1 className="text-3xl sm:text-4xl font-light max-w-2xl text-balance">
        Planeje menos. <strong className="text-(--brand) font-medium">Ensine mais.</strong>
      </h1>
      <p className="text-base text-(--foreground)/60 max-w-xl text-balance">
        Gere atividades, provas com questões reais do ENEM/vestibular e planos de aula
        completos  com IA, em poucos minutos.
      </p>
      <span className="inline-flex items-center gap-1.5 text-lg text-(--foreground) max-w-xl text-balance font-serif">
        <PaperPlaneRightIcon size={18} weight="fill" className="text-(--brand)" /> Sem gastar seu fim de semana. Sem complicação.
      </span>
    </div>
  )
}
