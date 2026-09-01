import { cookies } from "next/headers"
import Sidebar from "@/components/sidebar"
import MobileTopbar from "@/components/mobile-topbar"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getUserSeguro } from "@/lib/auth-seguro"
import { TurmasProvider } from "@/components/turmas-context"
import NovaTurmaModal from "@/components/nova-turma-modal"
import { TourProvider } from "@/components/tour/tour-context"
import TourOverlay from "@/components/tour/tour-overlay"
import HelpButton from "@/components/tour/help-button"
import MockApp from "@/components/tour/mock-app"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  const supabase = await createServerSupabaseClient()
  const user = await getUserSeguro(supabase)
  const userName = user?.user_metadata?.full_name ?? user?.email ?? "Usuário"
  const userEmail = user?.email ?? ""

  const { data: usuario } = user
    ? await supabase.from("usuarios").select("avatar_url").eq("id", user.id).single()
    : { data: null }
  const avatarUrl = usuario?.avatar_url ?? null

  return (
    <TurmasProvider>
      <TourProvider>
        <div className="h-full flex w-full">
          <Sidebar defaultCollapsed={defaultCollapsed} userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <MobileTopbar />
            {children}
          </div>
        </div>
        <NovaTurmaModal />
        <MockApp />
        <TourOverlay />
        <HelpButton />
      </TourProvider>
    </TurmasProvider>
  )
}
