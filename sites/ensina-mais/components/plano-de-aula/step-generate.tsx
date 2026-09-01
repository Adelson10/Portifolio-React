"use client"

import { SpinnerGapIcon, WarningCircleIcon } from "@phosphor-icons/react"
import Link from "next/link"
import type { PlanoAulaGerado } from "@/lib/ai/gerar-plano-aula"
import { stripNegrito } from "@/lib/ai/parse-negrito"

export type GenerationStatus = "idle" | "loading" | "done" | "error"

const SECAO_TITULO: Record<string, string> = {
  objetivoGeral: "Objetivo Geral",
  objetivos: "Objetivos Específicos",
  habilidadesBNCC: "Habilidades (BNCC)",
  competencias: "Competências",
  conteudo: "Conteúdo",
  metodologia: "Metodologia",
  recursos: "Recursos Didáticos",
  atividadesPropostas: "Atividades Propostas",
  avaliacao: "Avaliação",
  adaptacoes: "Adaptações para Necessidades Específicas",
  tarefaCasa: "Tarefa de Casa",
  referencias: "Referências Bibliográficas",
}

interface StepGeneratePlanoProps {
  status: GenerationStatus
  plano: PlanoAulaGerado | null
  error?: string | null
  /** Erro por cota do plano (403 do backend)  mostra CTA de upgrade em vez de só o texto do erro. */
  errorIsLimite?: boolean
}

export default function StepGeneratePlano({ status, plano, error, errorIsLimite }: StepGeneratePlanoProps) {
  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">

      {/* idle */}
      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-(--foreground)/60">
            Preencha a configuração e clique em avançar para gerar o plano de aula.
          </p>
        </div>
      )}

      {/* loading */}
      {status === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <SpinnerGapIcon size={32} className="animate-spin text-(--brand)" />
          <p className="text-sm font-medium">Gerando plano de aula...</p>
          <p className="text-xs text-(--foreground)/50">Isso pode levar alguns segundos.</p>
        </div>
      )}

      {/* error */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <WarningCircleIcon size={32} className="text-red-400" />
          <p className="text-sm font-medium">Não foi possível gerar o plano de aula.</p>
          {error && <p className="text-xs text-(--foreground)/50">{error}</p>}
          {errorIsLimite && (
            <Link href="/pricing" className="text-xs font-medium text-(--brand) hover:underline">
              Fazer upgrade de plano
            </Link>
          )}
        </div>
      )}

      {/* done */}
      {status === "done" && plano && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center rounded-sm gap-1.5 p-1 bg-(--secundary) w-fit">
            <span className="text-[12px] text-(--foreground)">Duração: {plano.duracaoMinutos} minutos</span>
          </div>

          {plano.objetivoGeral ? (
            <div>
              <span className="text-sm font-semibold">{SECAO_TITULO.objetivoGeral}</span>
              <p className="text-xs text-(--foreground)/70 mt-1">{stripNegrito(plano.objetivoGeral)}</p>
            </div>
          ) : null}

          {plano.objetivosEspecificos?.length ? (
            <div>
              <span className="text-sm font-semibold">{SECAO_TITULO.objetivos}</span>
              <ul className="flex flex-col gap-1 mt-1 list-disc pl-4">
                {plano.objetivosEspecificos.map((objetivo, i) => (
                  <li key={i} className="text-xs text-(--foreground)/70">{stripNegrito(objetivo)}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {(["habilidadesBNCC", "competencias"] as const).map((campo) =>
            plano[campo]?.length ? (
              <div key={campo}>
                <span className="text-sm font-semibold">{SECAO_TITULO[campo]}</span>
                <ul className="flex flex-col gap-1 mt-1 list-disc pl-4">
                  {plano[campo]!.map((item, i) => (
                    <li key={i} className="text-xs text-(--foreground)/70">{stripNegrito(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}

          {(["conteudo", "metodologia"] as const).map((campo) =>
            plano[campo] ? (
              <div key={campo}>
                <span className="text-sm font-semibold">{SECAO_TITULO[campo]}</span>
                <p className="text-xs text-(--foreground)/70 mt-1">{stripNegrito(plano[campo]!)}</p>
              </div>
            ) : null
          )}

          {(["recursos", "atividadesPropostas"] as const).map((campo) =>
            plano[campo]?.length ? (
              <div key={campo}>
                <span className="text-sm font-semibold">{SECAO_TITULO[campo]}</span>
                <ul className="flex flex-col gap-1 mt-1 list-disc pl-4">
                  {plano[campo]!.map((item, i) => (
                    <li key={i} className="text-xs text-(--foreground)/70">{stripNegrito(item)}</li>
                  ))}
                </ul>
              </div>
            ) : null
          )}

          {(["avaliacao", "adaptacoes", "tarefaCasa"] as const).map((campo) =>
            plano[campo] ? (
              <div key={campo}>
                <span className="text-sm font-semibold">{SECAO_TITULO[campo]}</span>
                <p className="text-xs text-(--foreground)/70 mt-1">{stripNegrito(plano[campo]!)}</p>
              </div>
            ) : null
          )}

          {plano.referencias?.length ? (
            <div>
              <span className="text-sm font-semibold">{SECAO_TITULO.referencias}</span>
              <ul className="flex flex-col gap-1 mt-1 list-disc pl-4">
                {plano.referencias.map((referencia, i) => (
                  <li key={i} className="text-xs text-(--foreground)/70">{stripNegrito(referencia)}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

    </div>
  )
}
