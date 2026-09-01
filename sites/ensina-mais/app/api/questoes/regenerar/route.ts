import { createServerSupabaseClient } from "@/lib/supabase-server"
import { obterConfigIA } from "@/lib/ai/model-por-plano"
import { ehErroDeSobrecarga, gerarQuestoes, TIPOS_QUESTAO_VALIDOS, DIFICULDADES_VALIDAS } from "@/lib/ai/gerar-questoes"
import { obterCacheExistente } from "@/lib/ai/gemini-document-cache"
import {
  reservarBuscaVestibular,
  reservarRegeneracaoQuestao,
  obterLimiteRegeneracaoQuestaoDiario,
  obterLimiteRegeneracaoQuestaoMensal,
} from "@/lib/atividades/limites"
import { obterAssinaturaEfetiva } from "@/lib/atividades/assinatura"
import { verificarDonoDaAtividade } from "@/lib/atividades/dono"

/** Regenera uma única questão avulsa no editor (botão "Regerar" do painel de questão)  não
 *  persiste nada no banco, só devolve a questão nova pro cliente trocar no estado local. */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const turmaId = body?.turmaId
  const atividadeId = body?.atividadeId
  const titulo = body?.titulo
  const tipo = body?.tipo
  const dificuldade = body?.dificuldade
  const usarBaseVestibular = body?.usarBaseVestibular === true
  const evitarTemas = Array.isArray(body?.evitarTemas)
    ? body.evitarTemas.filter((e: unknown): e is string => typeof e === "string")
    : undefined

  if (
    typeof turmaId !== "string" || !turmaId ||
    typeof titulo !== "string" || !titulo.trim() ||
    !TIPOS_QUESTAO_VALIDOS.includes(tipo) ||
    typeof dificuldade !== "string" || !DIFICULDADES_VALIDAS.includes(dificuldade as (typeof DIFICULDADES_VALIDAS)[number])
  ) {
    return Response.json({ error: "Dados incompletos para regenerar a questão" }, { status: 400 })
  }

  // `turmaId` e `atividadeId` vêm do cliente  sem checar dono, um usuário poderia ler dados
  // (nível/série da turma) ou o cache Gemini associado à atividade de OUTRO professor (IDOR).
  const { data: turma } = await supabase
    .from("turmas")
    .select("nome, nivel, serie, periodo, usuario_id")
    .eq("id", turmaId)
    .maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }
  const serieOuPeriodo = turma.serie ?? turma.periodo ?? undefined

  if (typeof atividadeId === "string" && atividadeId && !(await verificarDonoDaAtividade(supabase, atividadeId, user.id))) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { plano } = await obterAssinaturaEfetiva(supabase, user.id)

  // Ao contrário de /api/atividades/gerar, esta rota regenera UMA questão avulsa e não gasta
  // cota de "atividades novas"  mas sem NENHUM teto, um script autenticado poderia chamá-la em
  // loop e gerar custo real de IA sem limite algum. Cota própria e independente, maior que a de
  // atividades novas (cada chamada é bem mais barata  1 questão em vez de uma atividade inteira).
  // O RPC checa diário E mensal na mesma transação (ver lib/atividades/limites.ts).
  const regeneracao = await reservarRegeneracaoQuestao(supabase, user.id)
  if (!regeneracao.permitido) {
    const limiteMensal = obterLimiteRegeneracaoQuestaoMensal(plano)
    const atingiuMensal = limiteMensal !== undefined && regeneracao.usadasMensal >= limiteMensal
    const mensagem = atingiuMensal
      ? `Limite mensal de regeneração de questões atingido (${regeneracao.usadasMensal}/${limiteMensal}). Faça upgrade para gerar mais.`
      : `Limite diário de regeneração de questões atingido (${regeneracao.usadas}/${obterLimiteRegeneracaoQuestaoDiario(plano)}). Tente novamente amanhã.`
    return Response.json({ error: mensagem, limiteAtingido: true }, { status: 403 })
  }

  const { provider, modelo, maxOutputTokens, apiKey } = obterConfigIA(plano)

  // Reaproveita o cache de contexto do Gemini do material usado na geração original da atividade
  // (se houver e ainda estiver dentro do TTL)  sem ele, o arquivo original não está mais
  // disponível aqui pra dar contexto à regeneração desta questão avulsa.
  let cachedContentName: string | undefined
  let tipoConteudo: "atividade" | "prova" = "atividade"
  if (typeof atividadeId === "string" && atividadeId) {
    const { data: atividade } = await supabase
      .from("atividades")
      .select("gemini_arquivo_hash, tipo")
      .eq("id", atividadeId)
      .maybeSingle()
    if (atividade?.tipo === "prova") tipoConteudo = "prova"
    if (atividade?.gemini_arquivo_hash) {
      cachedContentName = (await obterCacheExistente(supabase, user.id, atividade.gemini_arquivo_hash, modelo)) ?? undefined
    }
  }

  // Mesma regra da rota de criação: busca ENEM/vestibular só pra prova, com cota mensal própria
  // (ver lib/atividades/limites.ts)  se estourou, regenera a questão sem busca real em vez de bloquear.
  let usarBaseVestibularEfetivo = usarBaseVestibular && tipoConteudo === "prova"
  if (usarBaseVestibularEfetivo) {
    const { permitido } = await reservarBuscaVestibular(supabase, user.id)
    usarBaseVestibularEfetivo = permitido
  }

  try {
    const resultado = await gerarQuestoes({
      provider,
      modelo,
      apiKey,
      maxOutputTokens,
      tipoConteudo,
      usarBaseVestibular: usarBaseVestibularEfetivo,
      tema: titulo,
      quantidade: 1,
      tipos: [tipo],
      dificuldade,
      nivelEnsino: turma?.nivel,
      serieOuPeriodo,
      disciplina: turma?.nome,
      evitarTemas,
      cachedContentName,
      cache: { supabase, usuarioId: user.id },
    })

    const questao = resultado.questoes[0]
    if (!questao) throw new Error("A IA não retornou nenhuma questão")

    return Response.json({ questao })
  } catch (err) {
    console.error("[/api/questoes/regenerar] falha ao regenerar questão com a IA:", err)
    const mensagem = ehErroDeSobrecarga(err)
      ? "O serviço de IA está sobrecarregado no momento. Tente novamente em alguns instantes."
      : "Não foi possível regenerar a questão com a IA."
    return Response.json({ error: mensagem }, { status: 502 })
  }
}
