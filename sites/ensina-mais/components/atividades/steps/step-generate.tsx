"use client"

import { SpinnerGapIcon, WarningCircleIcon, CheckFatIcon } from "@phosphor-icons/react"
import Link from "next/link"
import type { QuestaoGerada } from "@/lib/ai/gerar-questoes"

export type GenerationStatus = "idle" | "loading" | "done" | "error"

const TIPO_LABEL: Record<string, string> = {
  "multipla-escolha": "Múltipla escolha",
  "dissertativo": "Dissertativo",
  "verdade-falso": "Verdadeiro ou falso",
  "completar-lacunas": "Completar lacunas",
  "matematica": "Matemática",
  "assercoes-multiplas": "Asserções múltiplas",
}

const ROMANOS = ["I", "II", "III", "IV", "V", "VI"]

interface StepGenerateProps {
  status: GenerationStatus
  questoes: QuestaoGerada[]
  error?: string | null
  /** Erro por cota do plano (403 do backend)  mostra CTA de upgrade em vez de só o texto do erro. */
  errorIsLimite?: boolean
  /** "atividade" (padrão) ou "prova"  só ajusta o texto exibido em cada estado. */
  tipoLabel?: "atividade" | "prova"
}

export default function StepGenerate({ status, questoes, error, errorIsLimite, tipoLabel = "atividade" }: StepGenerateProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">

      {/* idle */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-(--foreground)/60">
            Geração ainda não disponível para este tipo de documento.
          </p>
        </div>
      )}

      {/* loading */}
      {status === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <SpinnerGapIcon size={32} className="animate-spin text-(--brand)" />
          <p className="text-sm font-medium">Gerando {tipoLabel}...</p>
          <p className="text-xs text-(--foreground)/50">Isso pode levar alguns segundos.</p>
        </div>
      )}

      {/* error */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <WarningCircleIcon size={32} className="text-red-400" />
          <p className="text-sm font-medium">Não foi possível gerar {tipoLabel === "prova" ? "a prova" : "a atividade"}.</p>
          {error && <p className="text-xs text-(--foreground)/50">{error}</p>}
          {errorIsLimite && (
            <Link href="/pricing" className="text-xs font-medium text-(--brand) hover:underline">
              Fazer upgrade de plano
            </Link>
          )}
        </div>
      )}

      {/* done */}
      {status === "done" && (
        <div className="flex flex-col gap-8">
          {questoes.map((q, i) => (
            <div key={i}>
              {/* Questão */}
              <span className="text-sm font-semibold text-justify">
                <span className="font-semibold">{i + 1}. </span>
                <span className="text-(--foreground) font-bold">
                  ({TIPO_LABEL[q.tipo] ?? q.tipo})
                </span>
                <span className="font-normal"> {q.enunciado}</span>
              </span>

              {q.tipo === "assercoes-multiplas" && q.afirmativas && (
                <ul className="flex flex-col gap-1 mt-1">
                  {q.afirmativas.map((afirmativa, j) => (
                    <li key={j} className="text-xs text-(--foreground)/70">
                      <span className="font-medium">{ROMANOS[j] ?? j + 1} -</span> {afirmativa}
                    </li>
                  ))}
                </ul>
              )}

              {(q.tipo === "multipla-escolha" || q.tipo === "assercoes-multiplas") && q.opcoes && (
                <ul className="flex flex-col gap-1 mt-1">
                  {q.opcoes.map((opcao, j) => {
                    const isCorrect = q.gabarito === opcao
                    return (
                      <li key={j} className="text-xs text-(--foreground)/70 flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                            isCorrect ? "bg-green-500" : "border border-(--secundary)"
                          }`}
                        >
                          {isCorrect && <CheckFatIcon size={9} weight="fill" className="text-white" />}
                        </div>
                        <span className="font-medium">{String.fromCharCode(65 + j)})</span>
                        {opcao}
                      </li>
                    )
                  })}
                </ul>
              )}

              {(q.tipo === "dissertativo" || q.tipo === "matematica") && (
                <div className="flex flex-col gap-4 mt-3">
                  {Array.from({ length: q.numeroLinhas ?? 4 }).map((_, j) => (
                    <div key={j} className="border-b border-(--secundary)/40 w-full" />
                  ))}
                </div>
              )}

              {q.tipo === "verdade-falso" && (
                <div className="flex gap-5 mt-2">
                  {(["Verdadeiro", "Falso"] as const).map((opcao) => {
                    const isCorrect = q.gabarito === opcao
                    return (
                      <div key={opcao} className="flex items-center gap-1.5">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            isCorrect ? "bg-green-500" : "border border-(--secundary)"
                          }`}
                        >
                          {isCorrect && <CheckFatIcon size={9} weight="fill" className="text-white" />}
                        </div>
                        <span className="text-xs text-(--foreground)/70">{opcao}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center rounded-sm gap-1.5 mt-4 p-1 bg-(--secundary)">
                <span className="text-[12px] text-(--foreground)">Gabarito: {q.gabarito}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
