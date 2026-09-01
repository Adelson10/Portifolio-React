import { loadStripe } from "@stripe/stripe-js"

// `loadStripe` já memoiza a Promise internamente  chamar isto várias vezes não recarrega o
// script da Stripe. Vive num módulo próprio (em vez de dentro de checkout-form.tsx) porque é
// puramente client-side: importar `lib/stripe.ts` aqui instanciaria o SDK server-side com a
// secret key no bundle do navegador.
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
