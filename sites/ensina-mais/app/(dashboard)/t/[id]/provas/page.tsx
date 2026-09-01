import type { Metadata } from "next"
import ContentPage from "@/components/content-page"

export const metadata: Metadata = {
  title: "Provas",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function TurmaProvasPage({ params }: Props) {
  const { id } = await params
  return <ContentPage title="Prova" turmaId={id} />
}
