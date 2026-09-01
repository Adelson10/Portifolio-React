"use client"

import { Suspense, useEffect, useState, type ComponentType } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { XIcon, NotebookIcon, LightningIcon, MagnifyingGlassIcon, SparkleIcon, CheckCircleIcon, type Icon } from "@phosphor-icons/react"
import LogoIcon from "@/assents/logo"
import { StripeElementsProvider, PaymentFields, ConfirmarAssinaturaButton } from "@/components/checkout-form"
import { obterLimiteMensal, obterLimiteVestibularMensal } from "@/lib/atividades/limites"

interface Beneficio {
  icon: ComponentType<React.ComponentProps<Icon>>
  texto: string
}

/** Espelha as chaves de `PRECOS` em lib/stripe.ts  não importamos aquele módulo aqui pelo
 *  mesmo motivo documentado em components/pricing-plans.tsx (instancia o Stripe server-side
 *  com a secret key no escopo do módulo). Só o necessário pro resumo do pedido nesta tela.
 *  Os números de limite, porém, vêm de lib/atividades/limites.ts  mesma fonte usada pelo
 *  backend pra checar e bloquear  pra não divergir do que é realmente aplicado. */
const PRECO_INFO: Record<string, { plano: string; preco: string; unidade: string; beneficios: Beneficio[] }> = {
  basico_mensal: {
    plano: "Básico",
    preco: "39,90",
    unidade: "BRL/mês",
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("basico")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("basico")} buscas de questões reais do ENEM e vestibulares por mês` },
    ],
  },
  premium_mensal: {
    plano: "Premium",
    preco: "89,90",
    unidade: "BRL/mês",
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("premium")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("premium")} buscas de questões reais do ENEM e vestibulares por mês` },
      { icon: SparkleIcon, texto: "Textos mais completos e elaborados" },
    ],
  },
  premium_anual: {
    plano: "Premium anual",
    preco: "899,90",
    unidade: "BRL/ano",
    beneficios: [
      { icon: NotebookIcon, texto: "Atividades, provas e planos de aula" },
      { icon: LightningIcon, texto: `${obterLimiteMensal("premium")} gerações por mês` },
      { icon: MagnifyingGlassIcon, texto: `${obterLimiteVestibularMensal("premium")} buscas de questões reais do ENEM e vestibulares por mês` },
      { icon: SparkleIcon, texto: "Textos mais completos e elaborados" },
    ],
  },
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const precoId = searchParams.get("preco")
  const infoPlano = precoId ? PRECO_INFO[precoId] : undefined
  const ciclo = infoPlano?.unidade === "BRL/ano" ? "anual" : "mensal"

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [compraConfirmada, setCompraConfirmada] = useState(false)

  useEffect(() => {
    if (!precoId || !infoPlano) return

    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preco: precoId }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Não foi possível iniciar o pagamento.")
        setClientSecret(data.clientSecret)
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Não foi possível iniciar o pagamento."))
    // precoId sozinho já determina infoPlano  não precisa re-rodar se a referência do objeto mudar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precoId])

  return (
    <div className="h-full w-full overflow-y-auto bg-(--background)">
      <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
        <Link href="/pricing" replace><LogoIcon w={36} h={36} /></Link>
        <button
          onClick={() => router.replace("/pricing")}
          aria-label="Fechar"
          className="p-2.5 rounded-full text-(--foreground)/60 hover:text-(--foreground) hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          <XIcon size={24} />
        </button>
      </div>

      <div className="mx-auto max-w-[1060px] w-full px-4 pb-16">
        {compraConfirmada && infoPlano ? (
          <div className="flex flex-col items-center gap-6 text-center pt-16 max-w-md mx-auto">
            <span className="flex items-center justify-center w-16 h-16 rounded-full bg-(--brand)/10">
              <CheckCircleIcon size={40} weight="fill" className="text-(--brand)" />
            </span>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold">Assinatura confirmada!</h1>
              <p className="text-sm text-(--foreground)/60">
                Seu pagamento foi aprovado  em instantes seu plano é atualizado automaticamente.
              </p>
            </div>

            <div className="w-full rounded-2xl border border-(--secundary) p-6 flex flex-col gap-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--foreground)/50">Plano</span>
                <span className="text-sm font-semibold">{infoPlano.plano}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--foreground)/50">Valor cobrado</span>
                <span className="text-sm font-semibold">R$ {infoPlano.preco} {infoPlano.unidade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--foreground)/50">Data</span>
                <span className="text-sm font-semibold">{new Date().toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--foreground)/50">Renovação</span>
                <span className="text-sm font-semibold">{ciclo === "anual" ? "Anual" : "Mensal"}, até cancelar</span>
              </div>
              <hr className="border-t border-(--secundary)" />
              <ul className="flex flex-col gap-2.5">
                {infoPlano.beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <b.icon size={18} className="shrink-0 text-(--brand)" />
                    <span>{b.texto}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex-1 py-3 bg-(--brand) hover:opacity-90 text-white font-medium rounded-full transition-opacity cursor-pointer"
              >
                Ir para o Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.replace("/pricing")}
                className="flex-1 py-3 border border-(--secundary) hover:bg-(--secundary) font-medium rounded-full transition-colors cursor-pointer"
              >
                Ver meus planos
              </button>
            </div>
          </div>
        ) : !infoPlano ? (
          <div className="flex flex-col items-center gap-3 text-center pt-16">
            <p className="text-sm text-(--foreground)/70">Plano inválido ou não encontrado.</p>
            <Link href="/pricing" replace className="text-sm font-medium text-(--brand) hover:underline">
              Voltar para os planos
            </Link>
          </div>
        ) : erro ? (
          <div className="flex flex-col items-center gap-3 text-center pt-16">
            <p className="text-sm text-red-500">{erro}</p>
            <Link href="/pricing" replace className="text-sm font-medium text-(--brand) hover:underline">
              Voltar para os planos
            </Link>
          </div>
        ) : !clientSecret ? (
          <p className="text-sm text-(--foreground)/50 text-center pt-16">Preparando pagamento...</p>
        ) : (
          <StripeElementsProvider clientSecret={clientSecret}>
            <div className="flex flex-col md:flex-row gap-10 md:gap-14 pt-4 md:pt-10">
              <div className="flex-1 flex flex-col gap-4">
                <PaymentFields />
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <p className="text-3xl font-bold">{infoPlano.plano}</p>
                <p className="text-xs text-(--foreground)/50">Recursos:</p>
                <ul className="flex flex-col gap-3.5">
                  {infoPlano.beneficios.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <b.icon size={20} className="shrink-0" />
                      <span>{b.texto}</span>
                    </li>
                  ))}
                </ul>
                <hr className="border-t border-(--secundary)" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">A pagar hoje</span>
                  <span className="text-sm font-semibold">R$ {infoPlano.preco} {infoPlano.unidade}</span>
                </div>

                <ConfirmarAssinaturaButton onSucesso={() => setCompraConfirmada(true)} />

                <p className="text-xs text-(--foreground)/60 leading-relaxed">
                  Renovação {ciclo} até cancelar. Cobraremos R$ {infoPlano.preco} {infoPlano.unidade === "BRL/ano" ? "por ano" : "por mês"}.
                  Cancele quando quiser em <Link href="/pricing" replace className="underline hover:text-(--foreground)">Configurações</Link>.
                  Ao assinar, você concorda com os Termos de uso e os Termos de crédito do serviço, reconhece que leu
                  nossa Política de privacidade e autoriza a Ensina Plus a armazenar e cobrar de sua forma de pagamento.
                </p>
              </div>
            </div>
          </StripeElementsProvider>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
