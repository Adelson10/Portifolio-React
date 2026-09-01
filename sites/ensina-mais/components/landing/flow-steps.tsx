"use client"

import type { StaticImageData } from "next/image"
import { useState } from "react"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import mobile1 from "@/assents/tutors/mobile-1.webp"
import mobile2 from "@/assents/tutors/mobile-2.webp"
import mobile3 from "@/assents/tutors/mobile-3.webp"
import desktop1 from "@/assents/tutors/desktop-1.webp"
import desktop2 from "@/assents/tutors/desktop-2.webp"
import desktop3 from "@/assents/tutors/desktop-3.webp"
import mbpHardware from "@/assents/tutors/performance_mbp_hw__dsz2n8vqr16q_large_2x.png"
import mbpMask from "@/assents/tutors/performance_mbp_mask__fgahzoduo5u2_large_2x.png"
import phoneHardware from "@/assents/tutors/hw__cf6xzzs5yb0i_large.png"

interface Passo {
  titulo: string
  texto: string
  imagemDesktop: StaticImageData
  imagemMobile: StaticImageData
}

const PASSOS: Passo[] = [
  { titulo: "Escolha a ferramenta", texto: `Atividade, prova ou plano de aula.`, imagemDesktop: desktop1, imagemMobile: mobile1 },
  { titulo: "Informe o conteúdo", texto: "Tema, texto colado ou upload do material.", imagemDesktop: desktop2, imagemMobile: mobile2 },
  { titulo: "Gere e adapte", texto: "Resultado pronto em segundos  refine ou exporte em Word.", imagemDesktop: desktop3, imagemMobile: mobile3 },
]

export default function FlowSteps() {
  const [index, setIndex] = useState(0)

  function go(dir: -1 | 1) {
    setIndex((i) => (i + dir + PASSOS.length) % PASSOS.length)
  }

  const passo = PASSOS[index]

  return (
    <section id="comofunciona" className="flex flex-col gap-6 scroll-mt-15 py-18">
      <div className="flex flex-col items-center text-center gap-3 mb-8">
        <span className="text-lg font-serif text-(--brand)">Como funciona</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-balance">Três passos. Zero dificuldade.</h2>
        <p className="text-base font-serif text-(--foreground)/60 max-w-xl">Do zero ao material pronto em menos de 3 minutos.</p>
      </div>

      {/* mockup notebook: desktop */}
      <div
        className="hidden sm:block relative isolate w-full sm:max-w-3xl mx-auto"
        style={{ aspectRatio: `${mbpHardware.width} / ${mbpHardware.height}` }}
      >
        {/* conteúdo do passo, recortado no formato exato da tela do notebook (via mask) */}
        <div
          className="absolute inset-0 bg-(--secundary)"
          style={{
            backgroundImage: `url(${passo.imagemDesktop.src})`,
            backgroundSize: "cover",
            backgroundPosition: "left",
            backgroundRepeat: "no-repeat",
            maskImage: `url(${mbpMask.src})`,
            WebkitMaskImage: `url(${mbpMask.src})`,
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />

        {/* casco do notebook por cima: onde a foto é preta (a tela), o blend "screen"
            deixa o conteúdo mascarado abaixo aparecer sem alteração; no resto (moldura),
            a própria foto do notebook domina e cobre as bordas do conteúdo. */}
        <img
          src={mbpHardware.src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{ mixBlendMode: "screen" }}
        />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Passo anterior"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-1 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo passo"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-1 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer"
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>

      {/* mockup celular: mobile */}
      <div
        className="sm:hidden relative isolate w-full max-w-full mx-auto"
        style={{ aspectRatio: `${phoneHardware.width} / ${phoneHardware.height}` }}
      >
        {/* conteúdo do passo: a própria foto do celular já tem a área da tela
            transparente, então basta posicionar a imagem por baixo dela, sem máscara */}
        <div
          className="absolute overflow-hidden bg-(--secundary) rounded-4xl"
          style={{ top: "2.1%", bottom: "2.1%", left: "4.7%", right: "4.7%" }}
        >
          <img
            src={passo.imagemMobile.src}
            alt=""
            aria-hidden
            draggable={false}
            className="w-full h-full object-contain object-top pointer-events-none select-none"
          />
        </div>

        <img
          src={phoneHardware.src}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
        />

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Passo anterior"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-1 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Próximo passo"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-1 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors cursor-pointer"
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>

      <div className="flex flex-col items-center text-center gap-1">
        <span className="text-lg font-bold text-(--brand)">{passo.titulo}</span>
        <span className="text-sm text-(--foreground)/60">{passo.texto}</span>
      </div>

      <div className="flex justify-center gap-1.5">
        {PASSOS.map((p, i) => (
          <button
            key={p.titulo}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir para o passo ${i + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? "w-6 bg-(--brand)" : "w-1.5 bg-(--secundary)"}`}
          />
        ))}
      </div>
    </section>
  )
}
