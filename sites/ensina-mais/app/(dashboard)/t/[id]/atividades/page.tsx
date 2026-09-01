import type { Metadata } from "next"
import ContentPage from "@/components/content-page"

export const metadata: Metadata = {
  title: "Atividades",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaAtividadesPage({ params }: Props) {
  const { id } = await params
  return <ContentPage title="Atividade" turmaId={id} />
}
