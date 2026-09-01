import type { Metadata } from "next"
import ActivityEditor from "@/components/atividades/editor/activity-editor"

export const metadata: Metadata = {
  title: "Editar Prova",
}

interface Props {
  params: Promise<{ id: string; atividadeId: string }>
}

export default async function EditarProvaPage({ params }: Props) {
  const { id, atividadeId } = await params
  return <ActivityEditor turmaId={id} atividadeId={atividadeId} tipo="prova" />
}
