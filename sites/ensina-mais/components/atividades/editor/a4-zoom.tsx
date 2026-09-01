"use client"

import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

// Mantém em sincronia com PAGE_WIDTH_PX de a4-sheet.tsx (mesma folha A4 a 96dpi)  não é
// importado de lá pra não criar uma dependência circular entre os dois arquivos.
const PAGE_WIDTH_PX = 794

/**
 * Encolhe a(s) folha(s) A4 (794px de largura) pra caber na largura disponível do container
 * pai via `transform: scale()`, com scroll/pinch ainda disponível pra ver de perto  sem isso,
 * a folha força scroll horizontal constante em qualquer tela menor que 794px (todo celular).
 *
 * Mede via `ResizeObserver` (não um breakpoint fixo) pra se ajustar a qualquer largura de
 * container, inclusive quando ele já é mais largo que 794px (desktop)  nesse caso o fator
 * fica em 1 e não tem efeito nenhum, preservando o comportamento atual.
 */
export default function A4Zoom({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [naturalHeight, setNaturalHeight] = useState(0)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    function recalcular() {
      const largura = container!.clientWidth
      setScale(largura > 0 ? Math.min(1, largura / PAGE_WIDTH_PX) : 1)
      setNaturalHeight(content!.scrollHeight)
    }

    recalcular()
    const observer = new ResizeObserver(recalcular)
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full">
      <div className="mx-auto" style={{ width: PAGE_WIDTH_PX * scale, height: naturalHeight * scale || undefined }}>
        <div ref={contentRef} style={{ width: PAGE_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
