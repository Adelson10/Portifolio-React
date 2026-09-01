"use client"

import { useEffect, useRef, useState } from "react"
import { useTour } from "./tour-context"
import { TOUR_STEPS, type TourLado } from "./steps"
import ModelExamplePreview from "./model-example-preview"

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6
const MARGEM = 18
const BORDA = 16
const TOOLTIP_LARGURA = 308
// Estimativa pra escolher o lado antes do tooltip renderizar (a altura real, sempre um pouco
// menor que isso na prática, é medida via ref logo depois - ver `tooltipRef`/`tooltipAltura`).
const TOOLTIP_ALTURA_ESTIMADA = 210

/** Mede a posição de um alvo do tour (`data-tour="..."`) dentro do `MockApp` (components/tour/
 *  mock-app.tsx), reagindo a resize/mudanças de layout - sem MutationObserver global (caro e
 *  desnecessário aqui): um polling leve por intervalo já cobre transições de cena e a animação
 *  fictícia de "gerando", do mesmo jeito que o `medir()` do mockup original. Retorna `null`
 *  enquanto o alvo não existe no DOM (cena ainda não trocou) - é esse `null` que faz o overlay
 *  inteiro sumir sem travar a interação. */
function useAlvoRect(target: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reseta ao trocar de alvo antes do primeiro `medir()` do novo alvo
    setRect(null)
    if (!target) return

    let ativo = true
    function medir() {
      if (!ativo) return
      const el = document.querySelector(`[data-tour="${target}"]`)
      if (!el) {
        setRect((r) => (r === null ? r : null))
        return
      }
      const r = el.getBoundingClientRect()
      const novo: Rect = { top: r.top, left: r.left, width: r.width, height: r.height }
      setRect((atual) => {
        if (atual && atual.top === novo.top && atual.left === novo.left && atual.width === novo.width && atual.height === novo.height) {
          return atual
        }
        return novo
      })
    }

    medir()
    const intervalo = setInterval(medir, 150)
    window.addEventListener("resize", medir)
    window.addEventListener("scroll", medir, true)
    return () => {
      ativo = false
      clearInterval(intervalo)
      window.removeEventListener("resize", medir)
      window.removeEventListener("scroll", medir, true)
    }
  }, [target])

  return rect
}

function escolherPosicaoTooltip(alvo: Rect, lado: TourLado | undefined, tooltipAltura: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampY = (y: number) => Math.min(Math.max(BORDA, y), Math.max(BORDA, vh - tooltipAltura - BORDA))
  const clampX = (x: number) => Math.min(Math.max(BORDA, x), Math.max(BORDA, vw - TOOLTIP_LARGURA - BORDA))

  const candidatos: { left: number; top: number; cabe: boolean }[] = []
  const preferido = lado ?? "direita"
  const ordem: TourLado[] = [preferido, ...(["direita", "esquerda", "baixo", "cima"] as TourLado[]).filter((l) => l !== preferido)]

  for (const l of ordem) {
    if (l === "direita") {
      candidatos.push({ left: alvo.left + alvo.width + MARGEM, top: clampY(alvo.top - 20), cabe: alvo.left + alvo.width + MARGEM + TOOLTIP_LARGURA <= vw - BORDA })
    }
    if (l === "esquerda") {
      candidatos.push({ left: alvo.left - TOOLTIP_LARGURA - MARGEM, top: clampY(alvo.top - 20), cabe: alvo.left - TOOLTIP_LARGURA - MARGEM >= BORDA })
    }
    if (l === "baixo") {
      candidatos.push({ left: clampX(alvo.left), top: alvo.top + alvo.height + MARGEM, cabe: alvo.top + alvo.height + MARGEM + tooltipAltura <= vh - BORDA })
    }
    if (l === "cima") {
      candidatos.push({ left: clampX(alvo.left), top: alvo.top - tooltipAltura - MARGEM, cabe: alvo.top - tooltipAltura - MARGEM >= BORDA })
    }
  }

  const sobrepoe = (c: { left: number; top: number }) =>
    !(c.left + TOOLTIP_LARGURA < alvo.left - 4 || c.left > alvo.left + alvo.width + 4 || c.top + tooltipAltura < alvo.top - 4 || c.top > alvo.top + alvo.height + 4)

  const escolhido = candidatos.find((c) => c.cabe && !sobrepoe(c)) ?? candidatos.find((c) => c.cabe) ?? candidatos[0]
  return { left: clampX(escolhido.left), top: clampY(escolhido.top) }
}

/** Spotlight + tooltip do tutorial interativo, ancorados em elementos do `MockApp` (a réplica
 *  falsa do app, ver mock-app.tsx) marcados com `data-tour="..."`. Avança quando o usuário clica
 *  no elemento falso destacado (listener de clique abaixo) ou no botão "Avançar" do próprio
 *  tooltip - nenhum dos dois caminhos toca em API real, é tudo dentro da encenação. Passos sem
 *  alvo (`tipo: "centro"`) aparecem como um cartão central, tipo modal. */
export default function TourOverlay() {
  const { active, step, stepIndex, isFirstStep, next, back, skip } = useTour()
  const alvo = useAlvoRect(step.target)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipAltura, setTooltipAltura] = useState(TOOLTIP_ALTURA_ESTIMADA)

  useEffect(() => {
    if (tooltipRef.current) setTooltipAltura(tooltipRef.current.offsetHeight)
  }, [step, alvo])

  // Clicar no elemento falso destacado também avança o tour (além do botão "Avançar" do
  // tooltip) - dá a sensação de estar realmente interagindo, mesmo sendo só encenação.
  useEffect(() => {
    if (!active || !step.target) return
    function handleClick(e: MouseEvent) {
      const alvoEl = (e.target as HTMLElement)?.closest?.(`[data-tour="${step.target}"]`)
      if (alvoEl) next()
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step.target])

  if (!active) return null

  if (step.tipo === "centro") {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
        <div className="w-full max-w-[420px] flex flex-col items-center gap-3.5 text-center rounded-2xl bg-(--background) shadow-2xl p-7">
          <span className="flex items-center justify-center w-13 h-13 rounded-full text-(--brand)" style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}>
            <SparkleIcon />
          </span>
          <span className="text-xl font-bold">{step.titulo}</span>
          <span className="text-sm leading-relaxed text-(--foreground)/70">{step.texto}</span>
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={skip}
              className="rounded-lg border border-(--secundary) px-4 py-2.5 text-sm font-medium hover:bg-(--secundary) transition-colors cursor-pointer"
            >
              {step.secundario ?? "Fechar"}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-(--brand) px-4.5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              {step.primario ?? "Continuar"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const posicao = alvo ? escolherPosicaoTooltip(alvo, step.lado, tooltipAltura) : null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {alvo && (
        <div
          className="absolute rounded-[10px] outline outline-2 outline-(--brand) outline-offset-2 transition-all duration-300"
          style={{
            top: alvo.top - PAD,
            left: alvo.left - PAD,
            width: alvo.width + PAD * 2,
            height: alvo.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      )}
      {alvo && posicao && (
        <div
          ref={tooltipRef}
          className="absolute w-[308px] flex flex-col gap-2.5 rounded-xl bg-(--background) shadow-2xl p-4 pointer-events-auto transition-all duration-300"
          style={{ top: posicao.top, left: posicao.left }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-(--brand)">
            Passo {stepIndex + 1} de {TOUR_STEPS.length}
          </span>
          <span className="text-[15px] font-semibold">{step.titulo}</span>
          <span className="text-[13px] leading-relaxed text-(--foreground)/70">{step.texto}</span>
          {step.target === "selecionar-proprio-modelo" && <ModelExamplePreview />}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" onClick={skip} className="text-xs font-medium text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer">
              Pular tutorial
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={back}
                disabled={isFirstStep}
                className="rounded-lg border border-(--secundary) px-3 py-2 text-[13px] font-medium hover:bg-(--secundary) transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-(--brand) px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Avançar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 256 256" fill="currentColor">
      <path d="M208,144a15.78,15.78,0,0,1-10.5,14.94l-40.63,14.79-14.79,40.63a15.85,15.85,0,0,1-29.86,0L97.44,173.69,56.81,158.9a15.85,15.85,0,0,1,0-29.86l40.63-14.79,14.79-40.63a15.85,15.85,0,0,1,29.86,0l14.79,40.63,40.63,14.79A15.78,15.78,0,0,1,208,144ZM160,40h16V56a8,8,0,0,0,16,0V40h16a8,8,0,0,0,0-16H192V8a8,8,0,0,0-16,0V24H160a8,8,0,0,0,0,16Zm88,32h-8V64a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V88h8a8,8,0,0,0,0-16Z" />
    </svg>
  )
}
