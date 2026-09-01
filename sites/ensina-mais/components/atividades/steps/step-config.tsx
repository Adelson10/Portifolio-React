"use client"

import { useEffect } from "react"
import { CheckFatIcon, GlobeIcon } from "@phosphor-icons/react"
import type { Plano } from "@/lib/ai/model-por-plano"
import { obterLimiteQuestoesPorGeracao } from "@/lib/atividades/limites"

const QUANTIDADE_MAXIMA_PADRAO = 25

const TIPOS = [
  { id: "multipla-escolha", label: "Múltipla escolha" },
  { id: "verdade-falso", label: "Verdadeiro ou falso" },
  { id: "dissertativo", label: "Dissertativo" },
  { id: "completar-lacunas", label: "Completar lacunas" },
  { id: "matematica", label: "Matemática (fórmulas e cálculo)" },
  { id: "assercoes-multiplas", label: "Asserções múltiplas" },
]

interface StepConfigProps {
  quantidade: number
  onQuantidadeChange: (n: number) => void
  tipos: string[]
  onTiposChange: (tipos: string[]) => void
  dificuldade: string
  onDificuldadeChange: (dificuldade: string) => void
  usarBaseVestibular: boolean
  onUsarBaseVestibularChange: (usar: boolean) => void
  /** "atividade" (padrão) ou "prova"  a busca ENEM/vestibular só aparece pra prova: usa
   *  grounding do Google, cobrado à parte e ~37x mais caro que uma geração normal (ver
   *  lib/atividades/limites.ts), então não faz sentido oferecer pra atividade de sala comum. */
  tipoConteudo?: "atividade" | "prova"
  /** Plano de assinatura do usuário  a busca ENEM/vestibular só existe pra "basico" e "premium"
   *  (grátis tem cota 0, ver LIMITE_VESTIBULAR_MENSAL_POR_PLANO em lib/atividades/limites.ts). */
  plano: Plano
  /** Uso da cota mensal de buscas ENEM/vestibular do usuário (null enquanto ainda não carregou 
   *  ver GET /api/atividades/limite). Usado só pra exibir quanto resta; quem bloqueia de verdade
   *  é `reservarBuscaVestibular` no backend. */
  usoVestibular: { usadas: number; limite: number } | null
}

export default function StepConfig({
  quantidade,
  onQuantidadeChange,
  tipos,
  onTiposChange,
  dificuldade,
  onDificuldadeChange,
  usarBaseVestibular,
  onUsarBaseVestibularChange,
  tipoConteudo = "atividade",
  plano,
  usoVestibular,
}: StepConfigProps) {
  const allSelected = tipos.length === TIPOS.length
  const restamVestibular = usoVestibular ? Math.max(0, usoVestibular.limite - usoVestibular.usadas) : null
  const limiteVestibularAtingido = restamVestibular === 0
  const limiteQuestoes = obterLimiteQuestoesPorGeracao(plano) ?? QUANTIDADE_MAXIMA_PADRAO

  // Se o usuário trocou de plano (ou o valor padrão do modal excede o teto do gratis), ajusta a
  // quantidade selecionada pro máximo permitido em vez de deixar o <select> com um valor sem
  // <option> correspondente.
  useEffect(() => {
    if (quantidade > limiteQuestoes) onQuantidadeChange(limiteQuestoes)
  }, [quantidade, limiteQuestoes, onQuantidadeChange])

  function toggleTipo(id: string) {
    onTiposChange(tipos.includes(id) ? tipos.filter((t) => t !== id) : [...tipos, id])
  }

  function toggleTodos() {
    onTiposChange(allSelected ? [] : TIPOS.map((t) => t.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Quantidade de Questões</p>
          <select
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            name="quantidade"
            id="quantidade"
            value={quantidade}
            onChange={(e) => onQuantidadeChange(Number(e.target.value))}
          >
            {Array.from({ length: limiteQuestoes }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Questão" : "Questões"}
              </option>
            ))}
          </select>
          {plano === "gratis" && (
            <p className="text-xs text-(--foreground)/50">
              Plano gratuito permite até {limiteQuestoes} questões por vez. Faça upgrade para gerar mais.
            </p>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Nível de Dificuldade</p>
          <select
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            name="dificuldade"
            id="dificuldade"
            value={dificuldade}
            onChange={(e) => onDificuldadeChange(e.target.value)}
          >
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
            <option value="extremo">Extremo</option>
            <option value="superior">Nível Superior</option>
            <option value="pos">Pós-graduação</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <p className="text-sm font-semibold">
          Tipos de Questões <span className="text-(--foreground)/40 font-normal">(selecione ao menos um)</span>
        </p>
        <div className="flex flex-col gap-2">
          {TIPOS.map(({ id, label }) => {
            const checked = tipos.includes(id)
            return (
              <div
                key={id}
                onClick={() => toggleTipo(id)}
                className="flex items-center gap-3 cursor-pointer"
              >
                <span
                  className={`w-5 h-5 p-0.5 rounded flex items-center justify-center shrink-0 border-1 transition-colors ${
                    checked ? "bg-(--foreground) border-(--foreground)" : "border-(--secundary)"
                  }`}
                >
                  {checked && <CheckFatIcon size={12} weight="fill" className="text-(--background)" />}
                </span>
                <span className="text-sm">{label}</span>
              </div>
            )
          })}
          <div
            onClick={toggleTodos}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span
              className={`w-5 h-5 p-0.5 rounded flex items-center justify-center shrink-0 border-1 transition-colors ${
                allSelected ? "bg-(--foreground) border-(--foreground)" : "border-(--secundary)"
              }`}
            >
              {allSelected && <CheckFatIcon size={12} weight="fill" className="text-(--background)" />}
            </span>
            <span className="text-sm font-semibold">Marcar todos</span>
          </div>
        </div>
      </div>

      {tipoConteudo === "prova" && (plano === "basico" || plano === "premium") && (
        <div
          onClick={() => {
            if (limiteVestibularAtingido && !usarBaseVestibular) return
            onUsarBaseVestibularChange(!usarBaseVestibular)
          }}
          className={`flex items-start gap-3 p-3 rounded-xl border-1 transition-colors ${
            limiteVestibularAtingido && !usarBaseVestibular ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          } ${
            usarBaseVestibular ? "border-(--brand) bg-(--brand)/5" : "border-(--secundary) hover:bg-(--secundary)"
          }`}
        >
          <span
            className={`w-5 h-5 p-0.5 mt-0.5 rounded flex items-center justify-center shrink-0 border-1 transition-colors ${
              usarBaseVestibular ? "bg-(--foreground) border-(--foreground)" : "border-(--secundary)"
            }`}
          >
            {usarBaseVestibular && <CheckFatIcon size={12} weight="fill" className="text-(--background)" />}
          </span>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <GlobeIcon size={14} />
              Usar questões reais do ENEM e vestibulares
            </p>
            <p className="text-xs text-(--foreground)/50">
              Busca na internet questões já aplicadas (ENEM, Fuvest, Unicamp, UFRGS, UERJ, ITA, IME e outras) sobre o tema, citando a fonte. Quando não encontrar material real suficiente, completa com questões originais no mesmo padrão.
            </p>
            {restamVestibular !== null && usoVestibular && (
              <p className={`text-xs font-medium ${limiteVestibularAtingido ? "text-red-500" : "text-(--brand)"}`}>
                {limiteVestibularAtingido
                  ? `Limite mensal atingido (${usoVestibular.usadas}/${usoVestibular.limite} buscas)`
                  : `Restam ${restamVestibular} de ${usoVestibular.limite} buscas este mês`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
