"use client"

import { useEffect, useState, useTransition, type FormEvent } from "react"
import Link from "next/link"
import {
  XIcon,
  GearIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  SignOutIcon,
  ReceiptIcon,
  ArrowSquareOutIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
} from "@phosphor-icons/react"
import { updateProfile, changePassword, updateEmail, signOut } from "@/lib/auth"
import { obterTemaSalvo, aplicarTema, type Tema } from "@/lib/theme"

type Tab = "geral" | "faturas" | "seguranca" | "conta"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userEmail: string
  onNameUpdated?: (name: string) => void
}

interface UsoMensal {
  plano: "gratis" | "basico" | "premium"
  usadas: number
  limite: number
  usadasDiario?: number
  limiteDiario?: number
}

const PLANO_NOMES: Record<string, string> = {
  gratis: "Grátis",
  basico: "Básico",
  premium: "Premium",
}

interface Fatura {
  id: string
  data: string
  valor: number
  moeda: string
  status: string
  url: string | null
}

const FATURA_STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: "Pago", className: "text-(--color-success) bg-(--color-success)/10" },
  open: { label: "Em aberto", className: "text-(--color-warning) bg-(--color-warning)/10" },
  uncollectible: { label: "Não cobrado", className: "text-(--color-danger) bg-(--color-danger)/10" },
  void: { label: "Cancelado", className: "text-(--foreground)/50 bg-(--foreground)/10" },
  draft: { label: "Rascunho", className: "text-(--foreground)/50 bg-(--foreground)/10" },
}

const NAV_ITEMS: { id: Tab; label: string; icon: typeof GearIcon }[] = [
  { id: "geral", label: "Geral", icon: GearIcon },
  { id: "faturas", label: "Faturas", icon: CreditCardIcon },
  { id: "seguranca", label: "Segurança", icon: ShieldCheckIcon },
  { id: "conta", label: "Conta", icon: UserCircleIcon },
]

/** Modal de configurações da conta, aberto a partir do botão "Configurações" no menu de perfil
 *  da sidebar (ver components/sidebar.tsx). Segue o mesmo padrão visual do ProfileModal (overlay
 *  + cartão bg-(--secundary) rounded-2xl), mas com navegação lateral entre seções. */
export default function SettingsModal({ isOpen, onClose, userName, userEmail, onNameUpdated }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>("geral")

  useEffect(() => {
    if (isOpen) setTab("geral")
  }, [isOpen])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-2xl h-[88dvh] md:h-[min(600px,88dvh)] bg-(--secundary) rounded-t-2xl md:rounded-2xl shadow-md flex flex-col md:flex-row overflow-hidden">
        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-(--foreground)/40 hover:text-(--foreground) transition-colors cursor-pointer z-10"
        >
          <XIcon size={20} />
        </button>

        {/* Navegação */}
        <nav className="w-full md:pt-6 md:w-44 shrink-0 border-b md:border-b-0 md:border-r border-(--secundary) p-3 pt-12 md:pt-3 justify-between flex flex-row md:flex-col md:justify-start gap-1">
          <h3 className="hidden md:block px-3 pt-0 pb-2 text-[14px] font-semibold text-(--foreground)">
            Configurações
          </h3>

          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-label={label}
              title={label}
              className={`flex items-center justify-center md:justify-start gap-2.5 md:w-full p-2.5 md:px-3 md:py-2 rounded-lg text-sm text-left whitespace-nowrap flex-1 md:flex-none transition-colors cursor-pointer ${
                tab === id
                  ? "bg-(--background) font-medium text-(--foreground)"
                  : "text-(--foreground)/60 hover:bg-(--background)/60"
              }`}
            >
              <Icon size={16} />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}

          <div className="hidden md:block flex-1" />
          <hr className="hidden md:block border-t border-(--secundary) my-2" />

          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Sair da Conta"
            title="Sair da Conta"
            className="flex items-center justify-center md:justify-start gap-2.5 md:w-full p-2.5 md:px-3 md:py-2 rounded-lg text-sm text-left whitespace-nowrap shrink-0 text-(--color-danger) hover:bg-(--background)/60 transition-colors cursor-pointer"
          >
            <SignOutIcon size={16} />
            <span className="hidden md:inline">Sair da Conta</span>
          </button>
        </nav>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 bg-(--background) overflow-y-auto p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {tab === "geral" && <GeralTab userName={userName} onNameUpdated={onNameUpdated} />}
          {tab === "faturas" && <FaturasTab />}
          {tab === "seguranca" && <SegurancaTab userEmail={userEmail} />}
          {tab === "conta" && <ContaTab userName={userName} userEmail={userEmail} />}
        </div>
      </div>
    </div>
  )
}

/* ─── Geral ───────────────────────────────────────────────────── */

function GeralTab({ userName, onNameUpdated }: { userName: string; onNameUpdated?: (name: string) => void }) {
  const [nome, setNome] = useState(userName)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setNome(userName), [userName])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!nome.trim()) {
      setError("O nome não pode ficar em branco.")
      return
    }
    startTransition(async () => {
      const result = await updateProfile(nome.trim())
      if (result?.error) {
        setError(result.error)
      } else {
        onNameUpdated?.(nome.trim())
        setSuccess(true)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold">Geral</h3>
        <p className="text-xs text-(--foreground)/50 mt-0.5">Preferências gerais da sua conta.</p>
      </div>

      <div className="flex flex-col gap-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-(--foreground)/70">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => { setNome(e.target.value); setSuccess(false) }}
              placeholder="Seu nome"
              className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
          {success && <p className="text-xs text-(--color-success)">Nome atualizado.</p>}

          <button
            type="submit"
            disabled={isPending || !nome.trim() || nome.trim() === userName.trim()}
            className="self-start px-4 py-2 rounded-lg text-sm font-medium text-white bg-(--brand) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </div>
      <TemaSelector />
    </div>
  )
}

const TEMA_OPCOES: { id: Tema; label: string; icon: typeof GearIcon }[] = [
  { id: "sistema", label: "Sistema", icon: MonitorIcon },
  { id: "claro", label: "Claro", icon: SunIcon },
  { id: "escuro", label: "Escuro", icon: MoonIcon },
]

/** Seletor de tema (ver lib/theme.ts)  aplica na hora via classe em <html>, sem precisar salvar
 *  nem recarregar a página. */
function TemaSelector() {
  const [tema, setTema] = useState<Tema>(() => obterTemaSalvo())

  function selecionar(t: Tema) {
    setTema(t)
    aplicarTema(t)
  }

  return (
    <div className="flex flex-row justify-between items-center">
      <p className="text-xs font-semibold text-(--foreground)/70">Tema</p>
      <div className="flex flex-row gap-2 bg-(--secundary)/50 rounded-full p-1">
        {TEMA_OPCOES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => selecionar(id)}
            aria-label={label}
            aria-pressed={tema === id}
            title={label}
            className={`p-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer border-transparent ${
              tema === id
                ? "border-(--brand) bg-(--brand)/10 text-(--brand)"
                : "hover:bg-(--secundary)"
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Faturas ─────────────────────────────────────────────────── */

function FaturasTab() {
  const [uso, setUso] = useState<UsoMensal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [canceladoAte, setCanceladoAte] = useState<string | null>(null)
  const [faturas, setFaturas] = useState<Fatura[] | null>(null)
  const [loadingFaturas, setLoadingFaturas] = useState(true)

  useEffect(() => {
    fetch("/api/atividades/limite")
      .then((res) => res.json())
      .then((data) => { if (typeof data.usadas === "number") setUso(data) })
      .catch(() => {})
      .finally(() => setLoading(false))

    fetch("/api/stripe/faturas")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data.faturas)) setFaturas(data.faturas) })
      .catch(() => setFaturas([]))
      .finally(() => setLoadingFaturas(false))
  }, [])

  async function cancelarAssinatura() {
    setError(null)
    setCancelando(true)
    try {
      const res = await fetch("/api/stripe/cancelar", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Não foi possível cancelar a assinatura.")
      setCancelConfirm(false)
      setCanceladoAte(new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cancelar a assinatura.")
    } finally {
      setCancelando(false)
    }
  }

  const plano = uso?.plano ?? "gratis"

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h3 className="text-sm font-semibold">Faturas</h3>
        <p className="text-xs text-(--foreground)/50 mt-0.5">Seu plano e uso da plataforma.</p>
      </div>

      {loading ? (
        <p className="text-xs text-(--foreground)/40">Carregando...</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-(--foreground)/50">Plano atual</p>
              <p className="text-sm font-semibold">{PLANO_NOMES[plano] ?? plano}</p>
            </div>
            <Link href="/pricing" className="text-xs font-medium text-(--brand) hover:underline rounded-lg border border-(--secundary) p-2">
              {plano === "gratis" ? "Fazer upgrade" : "Ver planos"}
            </Link>
          </div>

          {/* Histórico de faturas  data, valor e status de cada cobrança no Stripe */}
          <div className="flex flex-col gap-2 pt-2 border-t border-(--secundary)">
            <div className="flex items-center gap-1.5 text-xs font-medium text-(--foreground)/70">
              <ReceiptIcon size={14} />
              Histórico de compras
            </div>

            {loadingFaturas ? (
              <p className="text-xs text-(--foreground)/40">Carregando...</p>
            ) : !faturas || faturas.length === 0 ? (
              <p className="text-xs text-(--foreground)/40">Nenhuma fatura encontrada.</p>
            ) : (
              <div className="flex flex-col divide-y divide-(--secundary)">
                {faturas.map((fatura) => {
                  const statusInfo = FATURA_STATUS[fatura.status] ?? { label: fatura.status, className: "text-(--foreground)/50 bg-(--foreground)/10" }
                  return (
                    <div key={fatura.id} className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0 gap-1">
                        <span className="text-xs font-medium">
                          {new Date(fatura.data).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="text-[11px] text-(--foreground)/50 tabular-nums">
                          {fatura.valor.toLocaleString("pt-BR", { style: "currency", currency: fatura.moeda.toUpperCase() })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        {fatura.url && (
                          <a
                            href={fatura.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Ver fatura"
                            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-(--secundary) text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
                          >
                            <ArrowSquareOutIcon size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {uso && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-(--foreground)/50 mb-1.5">
                  <span>Atividades este mês</span>
                  <span className="font-medium tabular-nums">{uso.usadas}/{uso.limite}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-(--secundary) overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${uso.usadas >= uso.limite ? "bg-(--color-danger)" : "bg-(--brand)"}`}
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
                      className={`h-full rounded-full transition-all ${(uso.usadasDiario ?? 0) >= uso.limiteDiario ? "bg-(--color-danger)" : "bg-(--brand)"}`}
                      style={{ width: `${Math.min(100, ((uso.usadasDiario ?? 0) / uso.limiteDiario) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {plano !== "gratis" && (
            <div className="pt-2 border-t border-(--secundary)">
              {!cancelConfirm ? (
                <button
                  type="button"
                  onClick={() => setCancelConfirm(true)}
                  className="text-xs font-medium text-(--color-danger) hover:underline cursor-pointer"
                >
                  Cancelar assinatura
                </button>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-xs text-(--foreground)/70">
                    Você continua com acesso até o fim do período já pago. Deseja continuar?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelConfirm(false)}
                      disabled={cancelando}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-(--secundary) hover:bg-(--secundary) transition-colors cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={cancelarAssinatura}
                      disabled={cancelando}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-(--color-danger) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {cancelando ? "Cancelando..." : "Confirmar"}
                    </button>
                  </div>
                </div>
              )}
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              {canceladoAte && (
                <p className="text-xs text-(--brand) mt-2">
                  Cancelamento agendado  acesso ao plano atual até {canceladoAte}.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Segurança ───────────────────────────────────────────────── */

function SegurancaTab({ userEmail }: { userEmail: string }) {
  return (
    <div className="flex flex-col gap-8 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold">Segurança</h3>
        <p className="text-xs text-(--foreground)/50 mt-0.5">E-mail de acesso e senha da sua conta.</p>
      </div>
      <EmailForm userEmail={userEmail} />
      <PasswordForm />
    </div>
  )
}

/** Único lugar do app onde o e-mail aparece editável  nos outros (ProfileModal, ContaTab) ele é
 *  só exibido, sempre bloqueado pra evitar troca acidental fora daqui. */
function EmailForm({ userEmail }: { userEmail: string }) {
  const [email, setEmail] = useState(userEmail)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => setEmail(userEmail), [userEmail])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const trimmed = email.trim()
    if (!trimmed) {
      setError("O e-mail não pode ficar em branco.")
      return
    }
    startTransition(async () => {
      const result = await updateEmail(trimmed)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-(--foreground)/70">E-mail</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setSuccess(false) }}
          placeholder="seu@email.com"
          className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="text-xs text-(--color-success)">
          Enviamos um link de confirmação para o novo e-mail  a troca só é concluída depois que ele for confirmado.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !email.trim() || email.trim() === userEmail.trim()}
        className="self-start px-4 py-2 rounded-lg text-sm font-medium text-white bg-(--brand) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Salvando..." : "Salvar e-mail"}
      </button>
    </form>
  )
}

function PasswordForm() {
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [repetirSenha, setRepetirSenha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (novaSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (novaSenha !== repetirSenha) {
      setError("As senhas não coincidem.")
      return
    }
    startTransition(async () => {
      const result = await changePassword(senhaAtual, novaSenha)
      if (result?.error) {
        setError(result.error)
      } else {
        setSenhaAtual("")
        setNovaSenha("")
        setRepetirSenha("")
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-(--foreground)/70">Senha atual</label>
        <input
          type="password"
          autoComplete="current-password"
          value={senhaAtual}
          onChange={(e) => { setSenhaAtual(e.target.value); setSuccess(false) }}
          placeholder="••••••••"
          className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-(--foreground)/70">Nova senha</label>
        <input
          type="password"
          autoComplete="new-password"
          value={novaSenha}
          onChange={(e) => { setNovaSenha(e.target.value); setSuccess(false) }}
          placeholder="••••••••"
          className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-(--foreground)/70">Repetir senha</label>
        <input
          type="password"
          autoComplete="new-password"
          value={repetirSenha}
          onChange={(e) => { setRepetirSenha(e.target.value); setSuccess(false) }}
          placeholder="••••••••"
          className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-(--foreground)/30 focus:outline-none focus:border-(--brand) transition-colors"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-(--color-success)">Senha atualizada.</p>}

      <button
        type="submit"
        disabled={isPending || !senhaAtual || !novaSenha || !repetirSenha}
        className="self-start px-4 py-2 rounded-lg text-sm font-medium text-white bg-(--brand) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Salvando..." : "Atualizar senha"}
      </button>
    </form>
  )
}

/* ─── Conta ───────────────────────────────────────────────────── */

function ContaTab({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
    <div className="flex flex-col gap-6 max-w-sm">
      <div>
        <h3 className="text-sm font-semibold">Conta</h3>
        <p className="text-xs text-(--foreground)/50 mt-0.5">Informações da sua conta.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg border border-(--secundary) px-4 py-3">
          <span className="text-xs text-(--foreground)/50">Nome</span>
          <span className="text-sm font-medium truncate ml-4">{userName}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-(--secundary) px-4 py-3">
          <span className="text-xs text-(--foreground)/50">E-mail</span>
          <span className="text-sm font-medium truncate ml-4">{userEmail}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-(--secundary)">
        <p className="text-xs font-medium text-(--color-danger)">Excluir conta</p>
        <p className="text-xs text-(--foreground)/40 mt-1 leading-relaxed">
          Para excluir sua conta e todos os dados associados, entre em contato com o suporte. Processamos o
          pedido em até 15 dias úteis.
        </p>
      </div>
    </div>
  )
}
