import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TPage({ params }: Props) {
  const { id } = await params
  redirect(`/t/${id}/atividades`)
}
