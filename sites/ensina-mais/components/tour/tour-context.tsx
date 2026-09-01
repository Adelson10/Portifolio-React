"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { TOUR_STEPS } from "./steps"

const STORAGE_KEY = "ensinaplus-onboarding-visto"

interface TourContextValue {
  /** Tour em andamento (overlay visível). */
  active: boolean
  stepIndex: number
  step: (typeof TOUR_STEPS)[number]
  isFirstStep: boolean
  isLastStep: boolean
  /** Avança pro próximo passo, ou encerra se já estiver no último. */
  next: () => void
  back: () => void
  /** Encerra o tour e marca como visto (o botão de ajuda passa a valer pra rever). */
  skip: () => void
  /** Reabre do zero, mesmo já tendo sido visto antes (usado pelo botão de ajuda). */
  restart: () => void
}

const TourContext = createContext<TourContextValue | null>(null)

/** Dono do estado do tutorial interativo (passo atual + "já visto" em localStorage) - ver
 *  `components/tour/tour-overlay.tsx` (o que de fato desenha o spotlight/tooltip) e
 *  `components/tour/help-button.tsx` (reabre depois de encerrado). Só ativa a partir do `md:`
 *  breakpoint: a UI do tutorial (e do próprio app, nesse fluxo) não tem versão mobile. */
export function TourProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    let visto = null
    try {
      visto = localStorage.getItem(STORAGE_KEY)
    } catch {
      /* localStorage indisponível (ex.: modo privado) - trata como não visto */
    }
    if (visto === "1") return
    if (!window.matchMedia("(min-width: 768px)").matches) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- só sabemos se já foi visto (localStorage) e se é desktop (matchMedia) depois do mount
    setActive(true)
  }, [])

  function marcarVisto() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* sem persistência disponível - o tour só não abrirá sozinho na próxima visita à sessão atual */
    }
  }

  function next() {
    setStepIndex((i) => {
      const proximo = i + 1
      if (proximo >= TOUR_STEPS.length) {
        setActive(false)
        marcarVisto()
        return i
      }
      return proximo
    })
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function skip() {
    setActive(false)
    marcarVisto()
  }

  function restart() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* segue mesmo sem conseguir limpar - restart ainda funciona pra sessão atual */
    }
    setStepIndex(0)
    setActive(true)
  }

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0]

  return (
    <TourContext.Provider
      value={{
        active,
        stepIndex,
        step,
        isFirstStep: stepIndex === 0,
        isLastStep: stepIndex === TOUR_STEPS.length - 1,
        next,
        back,
        skip,
        restart,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error("useTour precisa ser usado dentro de um TourProvider")
  return ctx
}
