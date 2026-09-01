"use client"

import { useState } from "react"
import { CaretDownIcon } from "@phosphor-icons/react"

const PERGUNTAS = [
  {
    pergunta: "Isso substitui o professor?",
    resposta: "Não. O Ensina Plus gera o material de apoio (questões, provas, planos de aula), mas o julgamento pedagógico e a condução da aula continuam sendo do professor.",
  },
  {
    pergunta: "Funciona com meu material?",
    resposta: "Sim, você pode colar o conteúdo ou enviar o material que já usa e a IA gera questões, provas ou o plano de aula em cima dele.",
  },
  {
    pergunta: "Como funciona a busca de questões do ENEM/vestibular?",
    resposta: "Nas Provas, é possível ativar a busca de questões reais do ENEM e vestibulares, com fonte citada, funcionalidade disponível nos planos Básico e Premium.",
  },
  {
    pergunta: "Tem limite de uso no plano grátis?",
    resposta: "Sim, o plano grátis permite 2 gerações por dia, sem acesso à busca de questões do ENEM/vestibular.",
  },
  {
    pergunta: "Preciso colocar cartão de crédito pra usar o plano grátis?",
    resposta: "Não. O plano grátis não pede cartão e não expira  você só tem um limite de 2 gerações por dia.",
  },
  {
    pergunta: "Posso cancelar minha assinatura quando quiser?",
    resposta: "Sim, sem multa e sem burocracia. Você cancela direto no seu painel, quando quiser.",
  },
]

/** Perguntas frequentes  cada item abre/fecha independente, sem exigir JS de terceiros. */
export default function FaqAccordion() {
  const [aberta, setAberta] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {PERGUNTAS.map((item, i) => {
        const isOpen = aberta === i
        return (
          <div
            className={`bg-(--background) rounded-xl p-4 flex gap-4 flex-col border ${
              isOpen ? "border-(--brand)" : "border-transparent"
            }`}
            key={item.pergunta}
          >
            <button
              type="button"
              onClick={() => setAberta(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-sm font-medium">{item.pergunta}</span>
              <CaretDownIcon
                size={14}
                className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-(--brand)" : "text-(--foreground)/40"}`}
              />
            </button>
            {isOpen && (
              <p className="text-sm text-(--foreground)/80 max-w-[65ch] text-balance">{item.resposta}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
