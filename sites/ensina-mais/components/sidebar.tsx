"use client"

import { useState, useEffect, useRef } from "react"
import {
  SidebarSimpleIcon,
  UsersIcon,
  SparkleIcon,
  SignOutIcon,
  GearIcon,
  UserIcon,
  UserCircleIcon,
  CaretUpIcon,
  CaretDownIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react"
import LogoIcon from "@/assents/logo"
import ProfileModal from "@/components/profile-modal"
import SettingsModal from "@/components/settings-modal"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { useTurmas, turmaLabelCurta } from "@/components/turmas-context"

interface SidebarProps {
  defaultCollapsed?: boolean
  userName?: string
  userEmail?: string
  avatarUrl?: string | null
}

export default function Sidebar({ defaultCollapsed = false, userName = "Usuário", userEmail = "", avatarUrl = null }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [contentVisible, setContentVisible] = useState(!defaultCollapsed)
  const [mounted, setMounted] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [displayName, setDisplayName] = useState(userName)
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState(avatarUrl)
  const { turmas, openNovaTurma, sidebarMobileOpen, closeSidebarMobile, uso } = useTurmas()
  const showLabels = contentVisible || sidebarMobileOpen
  // Ao contrário de `showLabels` (atrasado de propósito 200ms em relação à largura, pra dar
  // tempo do texto sumir/aparecer suavemente), esse aqui segue a largura real da sidebar 
  // usado só onde a troca é de layout inteiro (completo ↔ compacto), não só texto, então precisa
  // estar em sincronia com a largura pra não trocar "antes da hora".
  const isWide = !collapsed || sidebarMobileOpen
  const pathname = usePathname()
  const router = useRouter()
  const selectedTurma = (() => {
    const match = pathname.match(/^\/t\/([^/]+)/)
    return match ? match[1] : null
  })()
  const profileRef = useRef<HTMLDivElement>(null)
  const transitionDuration = 200

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [profileOpen])

  const handleCollapse = () => {
    setContentVisible(false)
    setTimeout(() => {
      setCollapsed(true)
      document.cookie = "sidebar-collapsed=true; path=/; max-age=31536000"
    }, transitionDuration)
  }

  const handleExpand = () => {
    setCollapsed(false)
    document.cookie = "sidebar-collapsed=false; path=/; max-age=31536000"
    setTimeout(() => setContentVisible(true), transitionDuration)
  }

  return (
    <>
    {/* Backdrop da gaveta mobile  some acima de md: (sidebar nunca é off-canvas no desktop) */}
    {sidebarMobileOpen && (
      <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeSidebarMobile} />
    )}

    <aside
      className={`flex flex-col h-dvh md:h-screen border-r border-(--secundary) bg-(--background) p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] gap-[8px] fixed inset-y-0 left-0 z-50 w-72 md:static md:z-auto ${
        mounted ? "transition-all duration-200" : "transition-none"
      } ${sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 ${collapsed ? "md:w-20" : "md:w-64"}`}
    >
      {/* Logo / fechar  cabeçalho mobile (fixo, sempre com botão de fechar) */}
      <div className="flex md:hidden items-center justify-between min-h-[56px]">
        <Link className="pl-3" href={'/'} onClick={closeSidebarMobile}><LogoIcon h={28} w={28} /></Link>
        <button
          onClick={closeSidebarMobile}
          aria-label="Fechar menu"
          className="p-1.5 items-center justify-center text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
        >
          <XIcon size={20} />
        </button>
      </div>

      {/* Logo / colapsar  cabeçalho desktop (colapsa em vez de fechar) */}
      <div className="hidden md:flex items-center justify-between min-h-[56px]">
        {contentVisible ? (
          <>
            <Link className="pl-3 " href={'/'}><LogoIcon h={28} w={28} /></Link>
            <button
              onClick={handleCollapse}
              aria-label="Recolher"
              className="items-center justify-center text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
            >
              <SidebarSimpleIcon size={20} />
            </button>
          </>
        ) : (
          <button
            onClick={handleExpand}
            onMouseEnter={() => setIsFocused(true)}
            onMouseLeave={() => setIsFocused(false)}
            aria-label="Expandir"
            className="pl-3 items-center justify-center text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
          >
            {isFocused ? <SidebarSimpleIcon size={20} /> : <LogoIcon h={28} w={28} />}
          </button>
        )}
      </div>

      <hr className="border-t border-(--secundary)" />

      {/* Lista de turmas */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-2">
        {showLabels && <b className="text-(--brand)">Minhas Turmas</b>}

        {turmas.map((turma) => (
          <div key={turma.id} className="relative">
            {selectedTurma === turma.id && (
              <div className="absolute left-0 inset-y-1 w-[6px] rounded-r-full bg-(--brand) z-10 pointer-events-none" />
            )}
            <Link
              href={`/t/${turma.id}`}
              onClick={closeSidebarMobile}
              className="flex items-center w-full text-sm rounded-lg overflow-hidden hover:bg-(--secundary) hover:text-(--foreground) transition-colors px-3 py-2 gap-3"
            >
              <UsersIcon
                size={20}
                weight={selectedTurma === turma.id ? "fill" : "regular"}
                className={selectedTurma === turma.id ? "text-(--brand)" : ""}
              />
              {showLabels && (
                <span
                  className={`truncate text-left ${
                    selectedTurma === turma.id ? "font-bold text-(--foreground)" : ""
                  }`}
                >
                  {turmaLabelCurta(turma)}
                </span>
              )}
            </Link>
          </div>
        ))}

        <button
          onClick={() => openNovaTurma()}
          className="flex items-center w-full rounded-lg py-2 px-3 gap-3 text-sm font-medium text-(--brand) hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          <PlusIcon size={18} className="shrink-0" />
          {showLabels && <span>Nova Turma</span>}
        </button>
      </nav>
      {/* Encurtada (modo ícone): a barra em si some, mas o número (ex.: 12/400) continua
            visível, só que compacto e centralizado embaixo do avatar. */}
        {uso && (isWide ? (
          <div className="px-4 py-1.5 space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-[11px] text-(--foreground)/50 mb-1.5">
                <span>Atividades este mês</span>
                <span className="font-medium tabular-nums">{uso.usadas}/{uso.limite}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-(--secundary) overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    uso.usadas >= uso.limite ? "bg-(--color-danger)" : "bg-(--brand)"
                  }`}
                  style={{ width: `${Math.min(100, (uso.usadas / uso.limite) * 100)}%` }}
                />
              </div>
            </div>

            {typeof uso.limiteDiario === "number" && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-(--foreground)/50 mb-1.5">
                  <span>Atividades hoje</span>
                  <span className="font-medium tabular-nums">{uso.usadasDiario}/{uso.limiteDiario}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-(--secundary) overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (uso.usadasDiario ?? 0) >= uso.limiteDiario ? "bg-(--color-danger)" : "bg-(--brand)"
                    }`}
                    style={{ width: `${Math.min(100, ((uso.usadasDiario ?? 0) / uso.limiteDiario) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 py-1">
            <div className="flex flex-col items-center gap-0.5 w-full">
              <span
                className={`text-[11px] font-medium tabular-nums ${
                  uso.usadas >= uso.limite ? "text-(--color-danger)" : "text-(--foreground)/50"
                }`}
              >
                {uso.usadas}/{uso.limite}
              </span>
              <div className="h-1 w-full rounded-full bg-(--secundary) overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    uso.usadas >= uso.limite ? "bg-(--color-danger)" : "bg-(--brand)"
                  }`}
                  style={{ width: `${Math.min(100, (uso.usadas / uso.limite) * 100)}%` }}
                />
              </div>
            </div>

            {typeof uso.limiteDiario === "number" && (
              <div className="flex flex-col items-center gap-0.5 w-full">
                <span
                  className={`text-[10px] font-medium tabular-nums ${
                    (uso.usadasDiario ?? 0) >= uso.limiteDiario ? "text-(--color-danger)" : "text-(--foreground)/50"
                  }`}
                >
                  {uso.usadasDiario}/{uso.limiteDiario}
                </span>
                <div className="h-1 w-full rounded-full bg-(--secundary) overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (uso.usadasDiario ?? 0) >= uso.limiteDiario ? "bg-(--color-danger)" : "bg-(--brand)"
                    }`}
                    style={{ width: `${Math.min(100, ((uso.usadasDiario ?? 0) / uso.limiteDiario) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      {/* Perfil */}
      <div ref={profileRef} className="relative">
        {profileOpen && (
          <div className="absolute flex flex-col bottom-full left-0 w-56 max-w-[calc(100vw-2rem)] mb-2 rounded-xl border border-(--secundary) bg-(--background) shadow-lg text-sm overflow-hidden z-50 p-2 gap-2">
            <button
              onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-(--secundary) transition-colors rounded-xl cursor-pointer"
            >
              <UserIcon size={20} />
              Perfil
            </button>
            <button
              onClick={() => { setProfileOpen(false); setSettingsModalOpen(true) }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-(--secundary) transition-colors rounded-xl cursor-pointer"
            >
              <GearIcon size={20} />
              Configurações
            </button>
            <button
              onClick={() => { setProfileOpen(false); router.push("/pricing") }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-(--secundary) transition-colors rounded-xl cursor-pointer"
            >
              <SparkleIcon size={20} />
              Subir de Plano
            </button>
            <hr className="border-t border-(--secundary)" />

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-(--color-danger) hover:bg-(--secundary) transition-colors rounded-xl cursor-pointer"
            >
              <SignOutIcon size={20} />
              Sair da Conta
            </button>
          </div>
        )}
        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm hover:bg-(--secundary) transition-colors cursor-pointer"
        >
          {displayAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayAvatarUrl} alt="" className="shrink-0 w-[22px] h-[22px] rounded-full object-cover" />
          ) : (
            <UserCircleIcon size={22} className="shrink-0 text-(--brand)" />
          )}
          {showLabels && (
            <>
              <span className="flex-1 text-left truncate font-medium">{displayName}</span>
              {profileOpen ? <CaretUpIcon size={14} /> : <CaretDownIcon size={14} />}
            </>
          )}
        </button>
      </div>
    </aside>

    <ProfileModal
      isOpen={profileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      userName={displayName}
      userEmail={userEmail}
      avatarUrl={displayAvatarUrl}
      onNameUpdated={(name) => setDisplayName(name)}
      onAvatarUpdated={(url) => setDisplayAvatarUrl(url)}
    />

    <SettingsModal
      isOpen={settingsModalOpen}
      onClose={() => setSettingsModalOpen(false)}
      userName={displayName}
      userEmail={userEmail}
      onNameUpdated={(name) => setDisplayName(name)}
    />
    </>
  )
}
