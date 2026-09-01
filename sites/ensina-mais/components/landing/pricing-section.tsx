"use client"

import { useState, type ComponentType, type CSSProperties } from "react"
import {
  NotebookIcon,
  LightningIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
  CrownIcon,
  ScissorsIcon,
  type Icon,
} from "@phosphor-icons/react"
import { APP_LOGIN_URL, appCheckoutUrl } from "@/lib/site"
import { obterLimiteDiario, obterLimiteMensal, obterLimiteVestibularMensal } from "@/lib/atividades/limites"

type Ciclo = "mensal" | "anual"

interface Beneficio {
  icon: ComponentType<React.ComponentProps<Icon>>
  texto: string
}

interface PlanoInfo {
  id: "gratis" | "basico" | "premium"
  nome: string
  precoMensal: string
  precoAnual?: string
  hrefMensal: string
  hrefAnual?: string
  destaque?: boolean
  beneficios: Beneficio[]
}

// Mesma fonte de números usada pelo backend pra checar e bloquear (lib/atividades/limites.ts) 
// evita que a landing prometa um número diferente do que o produto realmente aplica.
const PLANOS: PlanoInfo[] = [
  {
    id: "gratis",
    nome: "Grátis",
    precoMensal: "0",
    hrefMensal: `${APP_LOGIN_URL}?cadastro=1`,
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: ClockIcon, texto: `${obterLimiteDiario("gratis")} gerações por dia` },
      { icon: SparkleIcon, texto: "Sem cartão de crédito" },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    precoMensal: "39,90",
    hrefMensal: appCheckoutUrl("basico_mensal"),
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("basico")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("basico")} buscas ENEM/vestibular por mês` },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    precoMensal: "89,90",
    precoAnual: "899,90",
    hrefMensal: appCheckoutUrl("premium_mensal"),
    hrefAnual: appCheckoutUrl("premium_anual"),
    destaque: true,
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("premium")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("premium")} buscas ENEM/vestibular por mês` },
      { icon: SparkleIcon, texto: "Textos mais completos e elaborados" },
      { icon: ScissorsIcon, texto: "Recorte páginas de PDF direto na plataforma" },
    ],
  },
]

// Mesmo visual do card de plano pago em components/pricing-plans.tsx.
const PLANO_GRADIENTE: CSSProperties = {
  borderColor: "var(--brand)",
  background: "linear-gradient(30deg, transparent 0%, var(--brand) 150%)",
}

/** Seção de preços da landing  estilização idêntica à tela real de planos
 *  (components/pricing-plans.tsx), mas sem os estados de sessão/Stripe: aqui é sempre
 *  visitante deslogado, então os CTAs só linkam pro login (grátis) ou direto pro checkout
 *  do subdomínio do produto (pagos), igual já era feito antes (ver lib/site.ts). */
export default function PricingSection() {
  const [ciclo, setCiclo] = useState<Ciclo>("mensal")

  // No ciclo anual, só o Premium tem preço anual hoje  Básico some da grade em vez de
  // mostrar o preço mensal fora de contexto (mesma regra de components/pricing-plans.tsx).
  const planosVisiveis = ciclo === "anual" ? PLANOS.filter((p) => p.id === "gratis" || p.precoAnual) : PLANOS

  return (
    <section id="planos" className="flex flex-col items-center gap-8 py-18 scroll-mt-15">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-lg font-serif text-(--brand)">Planos</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-balance">Comece grátis. Pague quando quiser.</h2>
        <p className="text-base font-serif text-(--foreground)/60 max-w-xl">Sem cartão de crédito pra testar. Cancele quando quiser, sem multa.</p>
      </div>

      <div className="inline-flex p-1 rounded-full bg-(--secundary) text-sm">
        <button
          type="button"
          onClick={() => setCiclo("mensal")}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${ciclo === "mensal" ? "bg-(--background) text-(--foreground)" : "text-(--foreground)/50"}`}
        >
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setCiclo("anual")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${ciclo === "anual" ? "bg-(--background) text-(--foreground)" : "text-(--foreground)/50"}`}
        >
          Anual
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-(--brand) text-white">-16%</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8 w-full">
        {planosVisiveis.map((plano) => {
          const anualDisponivel = ciclo === "anual" && plano.precoAnual
          const precoExibido = anualDisponivel ? plano.precoAnual : plano.precoMensal
          const unidade = anualDisponivel ? "BRL/ano" : "BRL/mês"
          const href = anualDisponivel ? plano.hrefAnual! : plano.hrefMensal
          const pago = plano.id !== "gratis"

          return (
            <div
              key={plano.id}
              className={`relative w-full sm:w-sm flex flex-col gap-8 rounded-2xl p-6 sm:p-8 md:p-10 ${pago ? "border-1" : "bg-(--background)"}`}
              style={pago ? PLANO_GRADIENTE : undefined}
            >
              {plano.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-white px-3 py-1 rounded-full bg-(--brand) whitespace-nowrap">
                  <CrownIcon size={12} />
                  Mais escolhido
                </span>
              )}

              <div className="space-y-6">
                <p className="text-lg md:text-2xl font-bold">{plano.nome}</p>
                <div className="flex flex-row gap-2">
                  <span className="text-base text-(--foreground)/50">R$</span>
                  <span className="text-5xl font-semibold">{precoExibido}</span>
                  {unidade && <span className="text-xs text-(--foreground)/50 self-end">{unidade}</span>}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <p className="text-xs text-(--foreground)/50">Confira o que a IA pode fazer:</p>
                <ul className="flex flex-col gap-3.5">
                  {plano.beneficios.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <b.icon size={20} className="shrink-0" />
                      <span>{b.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={href}
                  className={`w-full text-center py-3 rounded-full text-sm font-semibold cursor-pointer transition-opacity ${pago ? "bg-(--foreground) text-(--background) hover:opacity-90" : "bg-transparent text-(--foreground) border-1 border-(--foreground) hover:bg-(--foreground)/5"}`}
                >
                  {plano.id === "gratis" ? "Começar grátis" : `Assinar ${plano.nome}`}
                </a>
                {pago ? (
                  <p className="text-center text-[11px] text-(--foreground)/40">Cancele quando quiser, sem multa.</p>
                ) : <div className="h-4"/>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
