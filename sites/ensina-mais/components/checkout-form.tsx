"use client"

import { useState } from "react"
import { CheckoutElementsProvider, PaymentElement, useCheckoutElements } from "@stripe/react-stripe-js/checkout"
import { stripePromise } from "@/lib/stripe-client"

interface StripeElementsProviderProps {
  clientSecret: string
  children: React.ReactNode
}

/** Provider compartilhado da Checkout Session  `PaymentFields` e `ConfirmarAssinaturaButton`
 *  (abaixo) usam `useCheckoutElements` e podem ficar em colunas visuais separadas na página
 *  (ver app/checkout/page.tsx), já que o contexto do provider não depende de posição no DOM,
 *  só de estarem dentro dele. */
export function StripeElementsProvider({ clientSecret, children }: StripeElementsProviderProps) {
  // O Payment Element roda num iframe cross-origin e não enxerga as CSS vars da página  não
  // tem como só apontar pra --brand/--background, precisa repetir os valores literais aqui.
  // Precisa checar a classe .dark/.light em <html> (tema escolhido manualmente, ver
  // lib/theme.ts) antes do matchMedia, porque ela tem precedência sobre a preferência do
  // sistema (ver :root.dark/:root.light em globals.css)  só cai no matchMedia quando o
  // tema é "Sistema" (nenhuma classe aplicada).
  const root = typeof window !== "undefined" ? document.documentElement : null
  const escuro = root?.classList.contains("dark")
    ? true
    : root?.classList.contains("light")
      ? false
      : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        elementsOptions: {
          appearance: {
            variables: escuro
              ? { colorPrimary: "#5BB8E8", colorBackground: "#0a0a0a", colorText: "#ededed", borderRadius: "12px" }
              : { colorPrimary: "#43A2D2", colorBackground: "#ffffff", colorText: "#323232", borderRadius: "12px" },
          },
        },
      }}
    >
      {children}
    </CheckoutElementsProvider>
  )
}

/** Campos de pagamento da Stripe (cartão etc.)  continuam renderizados pela Stripe dentro de
 *  iframes seguros, é assim que qualquer integração evita virar PCI-DSS nível SAQ-D. */
export function PaymentFields() {
  return <PaymentElement />
}

interface ConfirmarAssinaturaButtonProps {
  onSucesso: () => void
}

export function ConfirmarAssinaturaButton({ onSucesso }: ConfirmarAssinaturaButtonProps) {
  const checkoutState = useCheckoutElements()
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleConfirmar() {
    if (checkoutState.type !== "success") return

    setErro(null)
    setEnviando(true)

    // `returnUrl` não pode ser passado aqui  já foi definido na criação da Checkout Session
    // (`return_url` em app/api/stripe/checkout/route.ts); o SDK rejeita se vier duplicado.
    const resultado = await checkoutState.checkout.confirm({ redirect: "if_required" })

    if (resultado.type === "error") {
      setErro(resultado.error.message ?? "Não foi possível confirmar o pagamento.")
      setEnviando(false)
      return
    }

    onSucesso()
  }

  const podeConfirmar = checkoutState.type === "success" && checkoutState.checkout.canConfirm

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleConfirmar}
        disabled={!podeConfirmar || enviando}
        className="w-full bg-(--brand) hover:opacity-90 text-white font-medium py-3 rounded-full transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {enviando ? "Confirmando..." : "Assinar"}
      </button>
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  )
}
