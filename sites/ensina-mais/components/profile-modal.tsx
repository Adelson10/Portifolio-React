"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { XIcon, CameraIcon } from "@phosphor-icons/react"
import Cropper, { type Area } from "react-easy-crop"
import { updateProfile } from "@/lib/auth"
import { getCroppedImageBlob } from "@/lib/crop-image"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userEmail: string
  avatarUrl?: string | null
  onNameUpdated?: (name: string) => void
  onAvatarUpdated?: (url: string) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export default function ProfileModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  avatarUrl,
  onNameUpdated,
  onAvatarUpdated,
}: ProfileModalProps) {
  const [name, setName] = useState(userName)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCropSrc(URL.createObjectURL(file))
  }

  function handleCancelCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function handleConfirmCrop() {
    if (!cropSrc || !croppedAreaPixels) return

    setError(null)
    setAvatarUploading(true)

    getCroppedImageBlob(cropSrc, croppedAreaPixels)
      .then((blob) => {
        const formData = new FormData()
        formData.append("file", blob, "avatar.jpg")
        return fetch("/api/usuarios/avatar", { method: "POST", body: formData }).then((res) => res.json())
      })
      .then((result) => {
        if (result.error) {
          setError(result.error)
        } else {
          onAvatarUpdated?.(result.avatar_url)
          URL.revokeObjectURL(cropSrc)
          setCropSrc(null)
        }
      })
      .catch(() => setError("Não foi possível enviar a foto."))
      .finally(() => setAvatarUploading(false))
  }

  useEffect(() => {
    if (isOpen) {
      setName(userName)
      setError(null)
      setSuccess(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, userName])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name.trim()) {
      setError("O nome não pode ficar em branco.")
      return
    }
    startTransition(async () => {
      const result = await updateProfile(name.trim())
      if (result?.error) {
        setError(result.error)
      } else {
        onNameUpdated?.(name.trim())
        onClose()
      }
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full md:max-w-md bg-(--secundary) rounded-t-2xl md:rounded-2xl shadow-md p-8 pb-[calc(2rem+env(safe-area-inset-bottom))] space-y-6">
        {/* Fechar */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-(--foreground)/40 hover:text-(--foreground) transition-colors cursor-pointer"
        >
          <XIcon size={20} />
        </button>

        {cropSrc ? (
          <div className="space-y-5">
            <h2 className="text-center font-semibold text-base">Ajustar foto</h2>

            <div className="relative w-full h-64 rounded-xl overflow-hidden bg-black/80">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-(--brand)"
              aria-label="Zoom"
            />

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={avatarUploading}
                className="flex-1 border border-(--secundary) rounded-lg py-2.5 text-sm font-medium hover:bg-(--secundary) transition-colors cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={avatarUploading || !croppedAreaPixels}
                className="flex-1 bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {avatarUploading ? "Enviando..." : "Usar foto"}
              </button>
            </div>
          </div>
        ) : (
        <>
        {/* Avatar + info */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white select-none overflow-hidden"
              style={{ background: "var(--brand)" }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(userName) || <CameraIcon size={32} />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Trocar foto de perfil"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center bg-(--secundary) border border-(--secundary) text-(--foreground)/70 hover:text-(--brand) transition-colors cursor-pointer disabled:opacity-50"
            >
              <CameraIcon size={14} />
            </button>
          </div>
          <div className="text-center">
            <p className="font-semibold text-base">{userName}</p>
            <p className="text-sm text-(--foreground)/50">{userEmail}</p>
          </div>
        </div>

        <hr className="border-t border-(--secundary)" />

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="block text-[12px] text-(--foreground) dark:text-gray-300 font-bold">
              Nome completo
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full border border-gray-300 bg-(--secundary) rounded-lg px-3 py-2.5 text-sm text-(--foreground) placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--brand) focus:border-transparent"
            />
          </div>

          {/* E-mail (somente leitura) */}
          <div className="space-y-1.5">
            <label className="block text-[12px] text-(--foreground) dark:text-gray-300 font-bold">
              E-mail
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-(--foreground) cursor-not-allowed"
              style={{ background: "var(--secundary)" }}
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          {success && <p className="text-xs text-green-600 text-center">{success}</p>}

          {/* Ações */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-(--secundary) rounded-lg py-2.5 text-sm font-medium hover:bg-(--secundary) transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  )
}
