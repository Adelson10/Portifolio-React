import type { Metadata } from "next"
import ActivityEditor from "@/components/atividades/editor/activity-editor"

export const metadata: Metadata = {
  title: "Nova Atividade",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarAtividadePage({ params }: Props) {
  const { id } = await params
  return <ActivityEditor turmaId={id} />
}