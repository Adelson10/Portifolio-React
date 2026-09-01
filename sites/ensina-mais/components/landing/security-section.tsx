"use client"

import {
  RobotIcon,
  LockKeyIcon,
  ScalesIcon,
  type Icon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import type { StaticImageData } from "next/image"
import SemTreinarIa from "../../assents/security/Sem treinamento de IA.webp"
import Criptografia from "../../assents/security/criptografia.webp"
import LGDP from "../../assents/security/Adequação à LGPD.webp"

const INTERVALO_MS = 8000

interface ItemSeguranca {
  icon: Icon
  image: StaticImageData
  titulo: string
  resumo: string
  texto: string
}

// Só confiança/proteção de dados aqui  "Provas adaptadas" e "Alinhado à BNCC" são
// conformidade pedagógica, não segurança, e ficam na seção Ferramentas (ver app/inicio/page.tsx).
const ITENS: ItemSeguranca[] = [
  { icon: RobotIcon, image: SemTreinarIa, titulo: "Sem treinamento de IA", resumo: "Seus dados, só seus", texto: "Os dados que você envia não são usados pra treinar ou aprimorar nenhum modelo. Suas provas, planos de aula e materiais permanecem exclusivamente seus, nunca compartilhados com terceiros ou reaproveitados para melhorar sistemas de IA de qualquer empresa." },
  { icon: LockKeyIcon, image: Criptografia, titulo: "Criptografia de Dados", resumo: "Sempre protegidos", texto: "Toda comunicação com a plataforma é protegida por criptografia em trânsito (HTTPS/TLS), e os dados armazenados são protegidos por criptografia em repouso. O acesso ao seu conteúdo é restrito à sua conta, com controles de autorização em cada camada do sistema." },
  { icon: ScalesIcon, image: LGDP, titulo: "Adequação à LGPD", resumo: "Conformidade garantida", texto: "Tratamento de dados de alunos e professores dentro das exigências da lei. Seguimos rigorosamente a Lei Geral de Proteção de Dados, garantindo transparência sobre como as informações são coletadas, armazenadas e utilizadas, além do direito de solicitar a exclusão a qualquer momento." },
]

export default function SecuritySection() {
  const [index, setIndex] = useState(0)
  const selected = ITENS[index]

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ITENS.length)
    }, INTERVALO_MS)
    return () => clearInterval(timer)
  }, [index])

  return (
    <section id="seguranca" className="flex flex-col gap-12 scroll-mt-5 py-18">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-lg font-serif text-(--brand)">Segurança</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-balance">Feito pra passar na auditoria da sua escola</h2>
        <p className="text-base font-serif text-(--foreground)/60 max-w-xl">Conformidade com a LGPD, criptografia em trânsito e em repouso, e controle total sobre os dados dos seus alunos.</p>
      </div>
      <div className="flex gap-4 flex-1 w-full mx-auto rounded-xl p-2 bg-(--background) sm:w-full sm:mx-0 sm:rounded-none sm:p-0 sm:bg-transparent">
        {ITENS.map((item, i) => {
          const isSelected = i === index
          return (
            <button
              key={item.titulo}
              type="button"
              onClick={() => setIndex(i)}
              className={`text-left flex-1 rounded-xl sm:p-4 flex justify-center sm:justify-start gap-4 transition-colors cursor-pointer ${
                isSelected ? "bg-(--brand)" : "sm:bg-(--background) sm:hover:bg-(--secundary)"
              }`}
            >
              <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${isSelected ? "sm:bg-(--background)" : "sm:bg-(--brand)/10"}`}>
                <item.icon size={26} className={isSelected ? "text-(--foreground)" : "text-(--brand)"} />
              </div>
              <div className="hidden sm:flex flex-col justify-between">
                <span className="text-base font-bold">{item.titulo}</span>
                <span className="text-sm text-(--foreground)/60">{item.resumo}</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 flex-2">
        <img src={selected.image.src} alt="" className="rounded-3xl w-full max-w-[440px] h-[300px] sm:h-[420px] lg:h-[525px] object-cover"/>
        <div className="lg:flex-1 flex flex-col gap-4">
          <div>
            <span className="text-lg text-(--brand) font-serif">{selected.resumo}</span>
            <h3 className="text-2xl sm:text-5xl font-bold font-serif text-balance leading-tight sm:leading-16">{selected.titulo}</h3>
          </div>
          <p className="text-sm text-(--foreground)/60 text-left">{selected.texto}</p>
        </div>
      </div>
    </section>
  )
}
