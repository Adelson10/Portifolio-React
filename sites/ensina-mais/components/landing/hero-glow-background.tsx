"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"

// Precisa bater com --triangle-base em .triangle-grid (globals.css).
const TRIANGLE_BASE = 18
const TRIANGLE_BASE_HEIGHT = 1.733 * TRIANGLE_BASE

// Intensidade do degradê de fundo  ajuste aqui (0 a 1, sem precisar mexer no CSS).
const GLOW_OPACITY = 0.12

/** Fundo decorativo do hero: um campo de gradiente cobrindo toda a área, com deriva
 *  lenta (CSS puro, ver .hero-glow-field em globals.css), coberto por uma grade de
 *  triângulos preenchidos com a cor de fundo da seção  é pelas frestas finas entre eles
 *  que o gradiente vaza, criando o efeito "cristal" em toda a extensão do hero. A
 *  deriva do campo desliga quando o usuário prefere menos movimento. */
export default function HeroGlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ columns: 0, rows: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setGrid({
        columns: Math.ceil(width / (TRIANGLE_BASE * 2)) + 2,
        rows: Math.ceil(height / TRIANGLE_BASE_HEIGHT) + 2,
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="hero-glow-field absolute inset-0" style={{ opacity: GLOW_OPACITY }} />

      <div
        className="triangle-grid absolute inset-0"
        style={{ "--columns": grid.columns } as CSSProperties}
      >
        {Array.from({ length: grid.columns * grid.rows }).map((_, i) => {
          const row = Math.floor(i / grid.columns)
          return (
            <div
              key={i}
              className={`triangle-set${row % 2 === 0 ? " triangle-set--offset" : ""}`}
            />
          )
        })}
      </div>
    </div>
  )
}
