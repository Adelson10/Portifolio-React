import type { Metadata } from "next"
import PlanoAulaEditor from "@/components/plano-de-aula/editor/plano-aula-editor"

export const metadata: Metadata = {
  title: "Editar Plano de Aula",
}

interface Props {
  params: Promise<{ id: string; atividadeId: string }>
}

export default async function EditarPlanoAulaPage({ params }: Props) {
  const { id, atividadeId } = await params
  return <PlanoAulaEditor turmaId={id} atividadeId={atividadeId} />
}
