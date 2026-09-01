import type { Metadata } from "next"
import ContentPage from "@/components/content-page"

export const metadata: Metadata = {
  title: "Planos de Aula",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaPlanoDeAulaPage({ params }: Props) {
  const { id } = await params
  return <ContentPage title="Plano de Aula" turmaId={id} />
}
