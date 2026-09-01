import fs from "node:fs"
import path from "node:path"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

/** Backfill único: preenche `assinaturas.assinatura_iniciada_em` (âncora do reset de cota a
 *  cada 30 dias, ver lib/atividades/limites.ts) pros assinantes que já existiam ANTES da
 *  migration supabase/migrations/20260802000000_reset_cota_ciclo_pagamento.sql  sem isso, cada
 *  um só ganharia a âncora na próxima vez que cancelasse e assinasse de novo (o webhook só grava
 *  esse campo em checkout.session.completed, ver app/api/webhooks/stripe/route.ts).
 *
 *  Busca toda linha de `assinaturas` com `stripe_subscription_id` preenchido e
 *  `assinatura_iniciada_em` ainda nulo, consulta o `start_date` real da assinatura na API do
 *  Stripe (fonte da verdade) e grava. Roda uma vez, manualmente, depois de aplicar a migration.
 *
 *  Uso: npm run backfill-assinatura
 */

for (const linha of fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const match = linha.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] ??= match[2].trim()
}

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: linhas, error } = await admin
    .from("assinaturas")
    .select("usuario_id, stripe_subscription_id")
    .not("stripe_subscription_id", "is", null)
    .is("assinatura_iniciada_em", null)

  if (error) {
    console.error("Falha ao listar assinaturas pendentes de backfill:", error)
    process.exit(1)
  }

  if (!linhas || linhas.length === 0) {
    console.log("Nenhuma assinatura pendente de backfill  nada a fazer.")
    return
  }

  console.log(`${linhas.length} assinatura(s) sem \`assinatura_iniciada_em\`. Buscando no Stripe...`)

  let ok = 0
  let falhas = 0

  for (const linha of linhas) {
    try {
      const subscription = await stripe.subscriptions.retrieve(linha.stripe_subscription_id!)
      const assinaturaIniciadaEm = new Date(subscription.start_date * 1000).toISOString()

      const { error: updateError } = await admin
        .from("assinaturas")
        .update({ assinatura_iniciada_em: assinaturaIniciadaEm })
        .eq("usuario_id", linha.usuario_id)

      if (updateError) throw updateError

      console.log(`OK  usuario_id=${linha.usuario_id} subscription=${linha.stripe_subscription_id} inicio=${assinaturaIniciadaEm}`)
      ok++
    } catch (err) {
      console.error(`FALHA usuario_id=${linha.usuario_id} subscription=${linha.stripe_subscription_id}:`, err)
      falhas++
    }
  }

  console.log(`Concluído: ${ok} atualizada(s), ${falhas} falha(s).`)
  if (falhas > 0) process.exit(1)
}

main()
