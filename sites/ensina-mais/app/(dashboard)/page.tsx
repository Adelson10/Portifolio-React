import type { Metadata } from "next"
import ContentPage from "@/components/content-page"

export const metadata: Metadata = {
  title: "Minhas Turmas",
}

export default function Home() {
  return <ContentPage showTurmas />
}
