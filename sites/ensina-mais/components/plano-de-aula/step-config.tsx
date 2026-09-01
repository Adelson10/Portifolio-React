"use client"

import { CheckFatIcon } from "@phosphor-icons/react"

const DURACOES = [30, 45, 50, 60, 90, 120]

const FORMATOS = [
  { id: "expositiva", label: "Aula expositiva" },
  { id: "pratica", label: "Aula prática/laboratório" },
  { id: "grupo", label: "Aula em grupo" },
  { id: "tecnologia", label: "Uso de tecnologia" },
  { id: "invertida", label: "Sala de aula invertida" },
  { id: "revisao", label: "Aula de revisão" },
]

const SECOES = [
  { id: "objetivos", label: "Objetivos de aprendizagem (geral e específicos)" },
  { id: "habilidadesBNCC", label: "Habilidades (BNCC)" },
  { id: "competencias", label: "Competências" },
  { id: "conteudo", label: "Conteúdo/tema abordado" },
  { id: "metodologia", label: "Metodologia (desenvolvimento da aula)" },
  { id: "recursos", label: "Recursos didáticos" },
  { id: "atividadesPropostas", label: "Atividades propostas" },
  { id: "avaliacao", label: "Avaliação" },
  { id: "adaptacoes", label: "Adaptações para necessidades específicas" },
  { id: "tarefaCasa", label: "Tarefa de casa" },
  { id: "referencias", label: "Referências bibliográficas e materiais de apoio" },
]

interface StepConfigPlanoProps {
  disciplina: string
  onDisciplinaChange: (disciplina: string) => void
  dataAula: string
  onDataAulaChange: (data: string) => void
  duracaoMinutos: number
  onDuracaoMinutosChange: (n: number) => void
  formatoAula: string
  onFormatoAulaChange: (formato: string) => void
  secoes: string[]
  onSecoesChange: (secoes: string[]) => void
}

export default function StepConfigPlano({
  disciplina,
  onDisciplinaChange,
  dataAula,
  onDataAulaChange,
  duracaoMinutos,
  onDuracaoMinutosChange,
  formatoAula,
  onFormatoAulaChange,
  secoes,
  onSecoesChange,
}: StepConfigPlanoProps) {
  const allSelected = secoes.length === SECOES.length

  function toggleSecao(id: string) {
    onSecoesChange(secoes.includes(id) ? secoes.filter((s) => s !== id) : [...secoes, id])
  }

  function toggleTodas() {
    onSecoesChange(allSelected ? [] : SECOES.map((s) => s.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Componente Curricular</p>
          <input
            type="text"
            name="disciplina"
            id="disciplina"
            value={disciplina}
            onChange={(e) => onDisciplinaChange(e.target.value)}
            placeholder="Ex.: Matemática, Português..."
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors placeholder:text-gray-400"
          />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Data da Aula</p>
          <input
            type="date"
            name="dataAula"
            id="dataAula"
            value={dataAula}
            onChange={(e) => onDataAulaChange(e.target.value)}
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Duração da Aula</p>
          <select
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            name="duracaoMinutos"
            id="duracaoMinutos"
            value={duracaoMinutos}
            onChange={(e) => onDuracaoMinutosChange(Number(e.target.value))}
          >
            {DURACOES.map((min) => (
              <option key={min} value={min}>
                {min} minutos
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold">Formato da Aula</p>
          <select
            className="p-2.5 text-sm rounded-xl border-1 border-(--secundary) w-full bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            name="formatoAula"
            id="formatoAula"
            value={formatoAula}
            onChange={(e) => onFormatoAulaChange(e.target.value)}
          >
            {FORMATOS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <p className="text-sm font-semibold">
          Seções do Plano <span className="text-(--foreground)/40 font-normal">(selecione ao menos uma)</span>
        </p>
        <div className="flex flex-col gap-2">
          {SECOES.map(({ id, label }) => {
            const checked = secoes.includes(id)
            return (
              <div
                key={id}
                onClick={() => toggleSecao(id)}
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
            onClick={toggleTodas}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span
              className={`w-5 h-5 p-0.5 rounded flex items-center justify-center shrink-0 border-1 transition-colors ${
                allSelected ? "bg-(--foreground) border-(--foreground)" : "border-(--secundary)"
              }`}
            >
              {allSelected && <CheckFatIcon size={12} weight="fill" className="text-(--background)" />}
            </span>
            <span className="text-sm font-semibold">Marcar todas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
