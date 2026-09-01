"use client"

import { useEffect, useState } from "react"
import { XIcon } from "@phosphor-icons/react"
import { useTurmas, NIVEL_LABELS, usaPeriodo, opcoesSerieOuPeriodo, serieOuPeriodo as getSerieOuPeriodo, type TurmaNivel } from "@/components/turmas-context"
import { disciplinasFixasPorNivel } from "@/lib/turmas/disciplinas"

const NIVEL_INICIAL: TurmaNivel = "fundamental_1"

/** Nome inicial do campo "Nome da Disciplina" pra um nível: a primeira opção da grade fixa
 *  quando o nível tem uma (Fundamental I/II, Médio  ver `disciplinasFixasPorNivel`), ou vazio
 *  quando o campo é texto livre (Infantil/Técnico/EJA/Superior/Pós). */
function nomeInicialPara(nivel: TurmaNivel): string {
  return disciplinasFixasPorNivel(nivel)?.[0] ?? ""
}

export default function NovaTurmaModal() {
  const { novaTurmaOpen, closeNovaTurma, addTurma, updateTurma, turmaEditando } = useTurmas()
  const [nome, setNome] = useState("")
  const [nivel, setNivel] = useState<TurmaNivel>(NIVEL_INICIAL)
  const [serieOuPeriodo, setSerieOuPeriodo] = useState(opcoesSerieOuPeriodo(NIVEL_INICIAL)[0])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const disciplinasFixas = disciplinasFixasPorNivel(nivel)

  useEffect(() => {
    if (!novaTurmaOpen) return
    setErro(null)
    if (turmaEditando) {
      setNome(turmaEditando.nome)
      setNivel(turmaEditando.nivel)
      setSerieOuPeriodo(getSerieOuPeriodo(turmaEditando) || opcoesSerieOuPeriodo(turmaEditando.nivel)[0])
    } else {
      setNome(nomeInicialPara(NIVEL_INICIAL))
      setNivel(NIVEL_INICIAL)
      setSerieOuPeriodo(opcoesSerieOuPeriodo(NIVEL_INICIAL)[0])
    }
  }, [novaTurmaOpen, turmaEditando])

  function fechar() {
    closeNovaTurma()
  }

  function trocarNivel(novoNivel: TurmaNivel) {
    setNivel(novoNivel)
    setSerieOuPeriodo(opcoesSerieOuPeriodo(novoNivel)[0])
    setNome(nomeInicialPara(novoNivel))
  }

  // Antes disso o modal fechava assim que o clique acontecia, sem esperar a resposta da API 
  // se o servidor recusasse a criação (ex.: erro 500), o usuário via o modal fechar como se
  // tivesse dado certo, mas nenhuma turma existia de verdade. Agora só fecha em caso de sucesso;
  // em caso de erro, mostra a mensagem e deixa o formulário aberto pra tentar de novo.
  async function salvarTurma() {
    const nomeTrimmed = nome.trim()
    if (!nomeTrimmed || salvando) return
    const data = usaPeriodo(nivel)
      ? { nome: nomeTrimmed, nivel, periodo: serieOuPeriodo }
      : { nome: nomeTrimmed, nivel, serie: serieOuPeriodo }
    setSalvando(true)
    setErro(null)
    try {
      if (turmaEditando) {
        await updateTurma(turmaEditando.id, data)
      } else {
        await addTurma(data)
      }
      fechar()
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar a turma.")
    } finally {
      setSalvando(false)
    }
  }

  if (!novaTurmaOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 dark:bg-black/60 md:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && fechar()}
    >
      <div className="bg-(--background) rounded-t-2xl md:rounded-2xl shadow-xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full md:max-w-sm flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{turmaEditando ? "Editar turma" : "Nova turma"}</h3>
          <button
            type="button"
            onClick={fechar}
            className="p-1.5 rounded-lg hover:bg-(--secundary) text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
          >
            <XIcon size={16} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            salvarTurma()
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="nova-turma-nome" className="text-xs font-medium text-(--foreground)/70">
              Nome da Disciplina
            </label>
            {disciplinasFixas ? (
              <select
                id="nova-turma-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
              >
                {disciplinasFixas.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input
                id="nova-turma-nome"
                type="text"
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Robótica"
                className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) placeholder:text-gray-400 focus:outline-none focus:border-(--brand) transition-colors"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nova-turma-nivel" className="text-xs font-medium text-(--foreground)/70">
              Nível
            </label>
            <select
              id="nova-turma-nivel"
              value={nivel}
              onChange={(e) => trocarNivel(e.target.value as TurmaNivel)}
              className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            >
              {(Object.entries(NIVEL_LABELS) as [TurmaNivel, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nova-turma-serie-periodo" className="text-xs font-medium text-(--foreground)/70">
              {usaPeriodo(nivel) ? "Período" : "Série/Ano"}
            </label>
            <select
              id="nova-turma-serie-periodo"
              value={serieOuPeriodo}
              onChange={(e) => setSerieOuPeriodo(e.target.value)}
              className="w-full text-sm rounded-lg border border-(--secundary) px-3 py-2 bg-(--background) focus:outline-none focus:border-(--brand) transition-colors cursor-pointer"
            >
              {opcoesSerieOuPeriodo(nivel).map((opcao) => (
                <option key={opcao} value={opcao}>{opcao}</option>
              ))}
            </select>
          </div>

          {erro && <p className="text-xs text-red-500">{erro}</p>}

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={fechar}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim() || salvando}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "var(--brand)" }}
            >
              {salvando ? "Salvando..." : turmaEditando ? "Salvar alterações" : "Criar turma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
