"use client"

import { useEffect, useState, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import {
  XIcon,
  NotebookIcon,
  LightningIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  SparkleIcon,
  CrownIcon,
  ScissorsIcon,
  type Icon,
} from "@phosphor-icons/react"
import { obterLimiteDiario, obterLimiteMensal, obterLimiteVestibularMensal } from "@/lib/atividades/limites"

interface PricingPlansProps {
  onClose: () => void
  planoAtual?: "gratis" | "basico" | "premium"
}

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
  /** Espelha as chaves de `PRECOS` em lib/stripe.ts  não importamos aquele módulo aqui porque
   *  ele instancia o client Stripe com a secret key no escopo do módulo, e este componente roda
   *  no navegador (importar o valor injetaria a secret key no bundle do cliente). */
  precoIdMensal?: string
  precoIdAnual?: string
  destaque?: boolean
  beneficios: Beneficio[]
}

// Números de limite vêm de lib/atividades/limites.ts (mesma fonte usada pelo backend pra checar
// e bloquear)  evita que a UI fique com números divergentes do que é realmente aplicado.
const PLANOS: PlanoInfo[] = [
  {
    id: "gratis",
    nome: "Grátis",
    precoMensal: "0",
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: ClockIcon, texto: `${obterLimiteDiario("gratis")} gerações por dia` },
      { icon: SparkleIcon, texto: "Ideal para conhecer a plataforma" },
    ],
  },
  {
    id: "basico",
    nome: "Básico",
    precoMensal: "39,90",
    precoIdMensal: "basico_mensal",
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("basico")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("basico")} buscas de questões reais do ENEM e vestibulares por mês` },
    ],
  },
  {
    id: "premium",
    nome: "Premium",
    precoMensal: "89,90",
    precoAnual: "899,90",
    precoIdMensal: "premium_mensal",
    precoIdAnual: "premium_anual",
    destaque: true,
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("premium")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("premium")} buscas de questões reais do ENEM e vestibulares por mês` },
      { icon: SparkleIcon, texto: "Textos mais completos e elaborados" },
      { icon: ScissorsIcon, texto: "Recorte páginas de PDF direto na plataforma" },
    ],
  },
]

const PLANO_GRADIENTE: React.CSSProperties = {
  borderColor: "var(--brand)",
  background: "linear-gradient(30deg, transparent 0%, var(--brand) 150%)",
}

/** Tela de seleção/upgrade de plano  vive em app/(dashboard)/pricing/page.tsx (rota "/pricing",
 *  acessível direto e compartilhável). `onClose` decide pra onde volta o botão de fechar (a
 *  página usa `router.back()`). Assinar leva pra rota dedicada /checkout (tela cheia, própria,
 *  com o formulário de pagamento  ver app/checkout/page.tsx) em vez de abrir um modal aqui. */
export default function PricingPlans({ onClose, planoAtual = "gratis" }: PricingPlansProps) {
  const router = useRouter()
  const [ciclo, setCiclo] = useState<Ciclo>("mensal")
  const [error, setError] = useState<string | null>(null)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [canceladoAte, setCanceladoAte] = useState<string | null>(null)

  // No ciclo anual, só existe preço anual pro Premium hoje  planos sem opção anual (Básico)
  // somem da grade em vez de mostrar o preço mensal fora de contexto.
  const planosVisiveis = ciclo === "anual" ? PLANOS.filter((p) => p.id === "gratis" || p.precoAnual) : PLANOS

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  function assinar(precoId: string) {
    // replace (não push): /checkout faz parte do mesmo fluxo de assinatura que /pricing, não é
    // uma página nova pra empilhar no histórico  senão o X de /pricing (router.back()), depois
    // de ir e voltar do checkout, cai de novo no /checkout em vez de voltar pra tela de origem.
    router.replace(`/checkout?preco=${precoId}`)
  }

  async function cancelarAssinatura() {
    setError(null)
    setCancelando(true)
    try {
      const res = await fetch("/api/stripe/cancelar", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Não foi possível cancelar a assinatura.")
      setCancelConfirmOpen(false)
      setCanceladoAte(new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cancelar a assinatura.")
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--background) overflow-y-auto">
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="fixed top-5 right-5 md:top-8 md:right-8 z-20 shrink-0 p-2.5 rounded-full text-(--foreground)/60 hover:text-(--foreground) hover:bg-(--secundary) transition-colors cursor-pointer"
      >
        <XIcon size={28} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 md:gap-12 px-4 md:px-10 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-semibold text-center">Faça upgrade do seu plano</h2>

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

        <div className="flex flex-col md:flex-row justify-center items-stretch gap-6 md:gap-8 w-full max-w-6xl">
          {planosVisiveis.map((plano) => {
            const isAtual = planoAtual === plano.id
            const anualDisponivel = ciclo === "anual" && plano.precoAnual
            const precoExibido = anualDisponivel ? plano.precoAnual : plano.precoMensal
            const unidade = anualDisponivel ? "BRL/ano" : "BRL/mês"
            const precoIdParaAssinar = anualDisponivel ? plano.precoIdAnual : plano.precoIdMensal
            const pago = plano.id !== "gratis"

            return (
              <div
                key={plano.id}
                className={`relative w-full sm:w-sm flex flex-col gap-8 rounded-2xl p-6 sm:p-8 md:p-10 ${pago ? "border-1" : "border border-(--secundary)"}`}
                style={pago ? PLANO_GRADIENTE : undefined}
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-white px-3 py-1 rounded-full bg-(--brand) whitespace-nowrap">
                    <CrownIcon size={12} />
                    Mais popular
                  </span>
                )}

                <div className="space-y-6">
                  <p className="text-lg md:text-2xl font-bold">{plano.nome}</p>
                  <div className="flex flex-row gap-2">
                    <span className="text-base text-(--foreground)/50">R$</span>
                    <span className="text-5xl font-semibold">{precoExibido}</span>
                    <span className="text-xs text-(--foreground)/50 self-end">{unidade}</span>
                  </div>
                </div>

                {/* flex-1 absorve a diferença de altura entre planos com mais/menos benefícios,
                    pra manter os botões de todos os cards alinhados na mesma linha. */}
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

                {plano.id === "gratis" ? (
                  <button
                    type="button"
                    onClick={() => !isAtual && setCancelConfirmOpen(true)}
                    disabled={isAtual || cancelando}
                    className="w-full py-3 bg-transparent text-(--foreground) border-1 border-(--foreground) rounded-full text-sm font-semibold cursor-pointer transition-opacity hover:bg-(--foreground)/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    {isAtual ? "Plano atual" : cancelando ? "Cancelando..." : "Cancelar assinatura"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => precoIdParaAssinar && assinar(precoIdParaAssinar)}
                    disabled={isAtual}
                    className={`w-full py-3 ${isAtual ? 'bg-(--brand)' : 'bg-(--foreground)'} rounded-full text-sm font-semibold text-(--background) cursor-pointer disabled:cursor-not-allowed`}
                  >
                    {isAtual ? "Plano atual" : "Assinar"}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {error && !cancelConfirmOpen && <p className="text-xs text-red-500 text-center">{error}</p>}
        {canceladoAte && (
          <p className="text-xs text-(--brand) text-center">
            Cancelamento agendado  você continua com acesso ao plano atual até {canceladoAte}.
          </p>
        )}
      </div>

      {cancelConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 dark:bg-black/60 md:p-4">
          <div className="bg-(--background) rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full md:max-w-sm flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold">Cancelar assinatura</h3>
              <p className="text-sm text-(--foreground)">
                Você continua com acesso ao seu plano atual até o fim do período já pago  depois disso, sua conta passa para o gratuito automaticamente. Deseja continuar?
              </p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(false)}
                disabled={cancelando}
                className="px-4 py-2 rounded-lg text-sm font-medium text-(--foreground) transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={cancelarAssinatura}
                disabled={cancelando}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
