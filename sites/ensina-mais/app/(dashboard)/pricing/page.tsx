"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import PricingPlans from "@/components/pricing-plans"

export default function PricingPage() {
  const router = useRouter()
  const [planoAtual, setPlanoAtual] = useState<"gratis" | "basico" | "premium">("gratis")

  useEffect(() => {
    fetch("/api/atividades/limite")
      .then((res) => res.json())
      .then((data) => { if (data.plano) setPlanoAtual(data.plano) })
      .catch(() => {})
  }, [])

  return <PricingPlans planoAtual={planoAtual} onClose={() => router.back()} />
}
