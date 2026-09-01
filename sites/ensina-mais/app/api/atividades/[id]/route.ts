import { createServerSupabaseClient } from "@/lib/supabase-server"
import { TIPOS_QUESTAO_VALIDOS, DIFICULDADES_VALIDAS } from "@/lib/ai/gerar-questoes"
import { verificarDonoDaAtividade } from "@/lib/atividades/dono"

const LAYOUTS_VALIDOS = ["horizontal", "vertical"] as const
const IMAGEM_TIPOS_VALIDOS = ["upload"] as const
const IMAGEM_POSICOES_VALIDAS = ["acima-respostas", "lado-questao"] as const
const IMAGEM_ALINHAMENTOS_VALIDOS = ["esquerda", "direita"] as const
const IMAGEM_AJUSTES_VALIDOS = ["fill", "contain", "cover", "scale-down"] as const

export async function GET(_request: Request, ctx: RouteContext<"/api/atividades/[id]">) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // Mesma checagem explícita de dono do DELETE abaixo (defesa em profundidade além da RLS) 
  // `atividades` não tem usuario_id direto, o dono é quem é dono da turma.
  const { data: atividade, error: atividadeError } = await supabase
    .from("atividades")
    .select("id, titulo, quantidade_questoes, dificuldade, turma_id, formatacao, fonte_escolhida, acessibilidade, codigos_bncc, mostrar_bncc")
    .eq("id", id)
    .single()
  if (atividadeError) return Response.json({ error: "Atividade não encontrada" }, { status: 404 })

  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", atividade.turma_id).maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: questoes, error: questoesError } = await supabase
    .from("questoes")
    .select("id, numero, tipo, enunciado, opcoes, afirmativas, gabarito, layout, dificuldade, numero_linhas")
    .eq("atividade_id", id)
    .order("numero", { ascending: true })
  if (questoesError) {
    console.error("[GET /api/atividades/[id]] falha ao buscar questões:", questoesError)
    return Response.json({ error: "Não foi possível carregar a atividade." }, { status: 500 })
  }

  // Imagem de questão vive numa tabela própria (questao_imagens, 1 linha por questão que tem
  // imagem)  não é coluna de `questoes`. Busca tudo de uma vez e monta um mapa por questao_id
  // em vez de uma query por questão.
  const questaoIds = questoes.map((q) => q.id)
  const imagensPorQuestao = new Map<string, {
    tipo: string; src: string; posicao?: string; alinhamento?: string
    larguraPx?: number; alturaPx?: number; ajuste?: string
    offsetXPx?: number; offsetYPx?: number
  }>()
  if (questaoIds.length > 0) {
    const { data: imagens, error: imagensError } = await supabase
      .from("questao_imagens")
      .select("questao_id, tipo, src, posicao, alinhamento, largura_px, altura_px, ajuste, offset_x_px, offset_y_px")
      .in("questao_id", questaoIds)
    if (imagensError) {
      console.error("[GET /api/atividades/[id]] falha ao buscar imagens das questões:", imagensError)
      return Response.json({ error: "Não foi possível carregar a atividade." }, { status: 500 })
    }
    for (const img of imagens) {
      // `?? undefined`: colunas nullable do Postgres voltam como `null`; convertido aqui pra
      // `undefined` (o "não definido" que o resto do app usa) em vez de deixar `null` vazar pro
      // estado do cliente  que reenviaria esse `null` de volta num PUT futuro (ver
      // `questaoImagemValida`, que precisou aceitar `null` como rede de segurança pros dados que
      // já foram salvos assim antes desta normalização existir).
      imagensPorQuestao.set(img.questao_id, {
        tipo: img.tipo,
        src: img.src,
        posicao: img.posicao ?? undefined,
        alinhamento: img.alinhamento ?? undefined,
        larguraPx: img.largura_px ?? undefined,
        alturaPx: img.altura_px ?? undefined,
        ajuste: img.ajuste ?? undefined,
        offsetXPx: img.offset_x_px ?? undefined,
        offsetYPx: img.offset_y_px ?? undefined,
      })
    }
  }

  return Response.json({
    id: atividade.id,
    titulo: atividade.titulo,
    // Config escolhida no assistente de geração (step-config)  sem isso, o editor sempre
    // reabria com os valores padrão (3 questões/médio), mesmo quando outra coisa foi pedida.
    quantidadeQuestoes: atividade.quantidade_questoes ?? undefined,
    dificuldade: atividade.dificuldade ?? undefined,
    tiposQuestao: [...new Set(questoes.map((q) => q.tipo))],
    // Formatação/acessibilidade escolhidas no editor  sem isso, reabrir a atividade sempre
    // caía nos valores padrão (ABNT/Arial, sem BNCC, sem ajustes de acessibilidade).
    formatacao: atividade.formatacao ?? undefined,
    fonteEscolhida: atividade.fonte_escolhida ?? undefined,
    acessibilidade: atividade.acessibilidade ?? undefined,
    codigosBNCC: atividade.codigos_bncc ?? undefined,
    // Coluna nullable  `null` (nunca definido) equivale a "mostrar" (comportamento padrão).
    mostrarBNCC: atividade.mostrar_bncc ?? true,
    questoes: questoes.map((q) => ({
      id: q.id,
      numero: q.numero,
      tipo: q.tipo,
      enunciado: q.enunciado,
      opcoes: q.opcoes ?? undefined,
      afirmativas: q.afirmativas ?? undefined,
      gabarito: q.gabarito,
      layout: q.layout,
      dificuldade: q.dificuldade ?? undefined,
      numeroLinhas: q.numero_linhas ?? undefined,
      imagem: imagensPorQuestao.get(q.id) ?? undefined,
    })),
  })
}

interface QuestaoImagemInput {
  tipo: string
  src: string
  // `| null` porque isto pode vir de um GET anterior (colunas nullable do Postgres voltam como
  // `null`, não `undefined`)  ver comentário em `questaoImagemValida`.
  posicao?: string | null
  alinhamento?: string | null
  larguraPx?: number | null
  alturaPx?: number | null
  ajuste?: string | null
  offsetXPx?: number | null
  offsetYPx?: number | null
}

interface QuestaoInput {
  tipo: string
  enunciado: string
  opcoes?: string[]
  afirmativas?: string[]
  gabarito: string
  layout?: string
  dificuldade?: string
  numeroLinhas?: number
  imagem?: QuestaoImagemInput
}

function questaoImagemValida(imagem: QuestaoImagemInput | undefined): boolean {
  if (imagem === undefined) return true
  // `== null` (não `=== undefined`) porque colunas nullable do Postgres voltam como `null`, não
  // `undefined`  uma imagem salva sem alinhamento/ajuste customizado (ambos opcionais) chega do
  // GET com esses campos `null`; se o usuário editar essa questão de novo e o PUT seguinte
  // reenviar o mesmo objeto, `=== undefined` rejeitava um valor que a própria API tinha acabado
  // de devolver, derrubando o save inteiro com 400.
  return (
    typeof imagem.tipo === "string" &&
    IMAGEM_TIPOS_VALIDOS.includes(imagem.tipo as (typeof IMAGEM_TIPOS_VALIDOS)[number]) &&
    typeof imagem.src === "string" &&
    (imagem.posicao == null || IMAGEM_POSICOES_VALIDAS.includes(imagem.posicao as (typeof IMAGEM_POSICOES_VALIDAS)[number])) &&
    (imagem.alinhamento == null || IMAGEM_ALINHAMENTOS_VALIDOS.includes(imagem.alinhamento as (typeof IMAGEM_ALINHAMENTOS_VALIDOS)[number])) &&
    (imagem.ajuste == null || IMAGEM_AJUSTES_VALIDOS.includes(imagem.ajuste as (typeof IMAGEM_AJUSTES_VALIDOS)[number]))
  )
}

/** Salva o estado atual do editor: questões (texto, opções, layout, dificuldade por questão,
 *  imagem, ordem) e as preferências de formatação/acessibilidade/BNCC da atividade  chamado
 *  pelo autosave do editor a cada mudança. Substitui todas as questões da atividade de uma vez
 *  (apaga e reinsere, mesmo padrão de /api/atividades/gerar) em vez de tentar casar cada questão
 *  com sua linha original: o `id` do lado do cliente pode ter sido gerado localmente
 *  (crypto.randomUUID()) antes de existir uma linha real no banco, logo após uma geração nova,
 *  então não dá pra confiar nele para um update por id. */
export async function PUT(request: Request, ctx: RouteContext<"/api/atividades/[id]">) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  if (!(await verificarDonoDaAtividade(supabase, id, user.id))) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  let body: {
    questoes?: unknown
    formatacao?: unknown
    fonteEscolhida?: unknown
    acessibilidade?: unknown
    codigosBNCC?: unknown
    mostrarBNCC?: unknown
  }
  try {
    body = await request.json()
  } catch (err) {
    console.error("[PUT /api/atividades/[id]] JSON inválido:", err)
    return Response.json({ error: "JSON inválido" }, { status: 400 })
  }
  if (!Array.isArray(body.questoes)) {
    console.error("[PUT /api/atividades/[id]] campo 'questoes' não é array:", typeof body.questoes)
    return Response.json({ error: "Campo 'questoes' inválido" }, { status: 400 })
  }

  const questoes = body.questoes as QuestaoInput[]
  // Motivo específico de cada rejeição (em vez de só um booleano "todasValidas")  sem isso,
  // um 400 aqui não dava nenhuma pista de qual campo/questão causou a rejeição, dependendo de
  // adivinhação a cada vez que alguém reportasse o erro.
  const motivoInvalido = (q: QuestaoInput): string | null => {
    if (!q) return "questão nula/indefinida"
    if (typeof q.enunciado !== "string") return "enunciado não é string"
    if (typeof q.gabarito !== "string") return "gabarito não é string"
    if (!TIPOS_QUESTAO_VALIDOS.includes(q.tipo as (typeof TIPOS_QUESTAO_VALIDOS)[number])) return `tipo inválido: ${q.tipo}`
    if (q.layout != null && !LAYOUTS_VALIDOS.includes(q.layout as (typeof LAYOUTS_VALIDOS)[number])) return `layout inválido: ${q.layout}`
    if (q.dificuldade != null && !DIFICULDADES_VALIDAS.includes(q.dificuldade as (typeof DIFICULDADES_VALIDAS)[number])) return `dificuldade inválida: ${q.dificuldade}`
    if (!questaoImagemValida(q.imagem)) return `imagem inválida: ${JSON.stringify({ ...q.imagem, src: q.imagem?.src ? "(omitido)" : q.imagem?.src })}`
    return null
  }
  for (const q of questoes) {
    const motivo = motivoInvalido(q)
    if (motivo) {
      console.error("[PUT /api/atividades/[id]] questão rejeitada:", motivo)
      return Response.json({ error: "Questão inválida" }, { status: 400 })
    }
  }

  if (body.formatacao !== undefined && typeof body.formatacao !== "string") {
    console.error("[PUT /api/atividades/[id]] formatacao inválida:", body.formatacao)
    return Response.json({ error: "Configuração inválida" }, { status: 400 })
  }
  if (body.fonteEscolhida !== undefined && typeof body.fonteEscolhida !== "string") {
    console.error("[PUT /api/atividades/[id]] fonteEscolhida inválida:", body.fonteEscolhida)
    return Response.json({ error: "Configuração inválida" }, { status: 400 })
  }
  if (body.acessibilidade !== undefined && (typeof body.acessibilidade !== "object" || body.acessibilidade === null)) {
    console.error("[PUT /api/atividades/[id]] acessibilidade inválida:", body.acessibilidade)
    return Response.json({ error: "Configuração inválida" }, { status: 400 })
  }
  if (body.codigosBNCC !== undefined && (!Array.isArray(body.codigosBNCC) || !body.codigosBNCC.every((c) => typeof c === "string"))) {
    console.error("[PUT /api/atividades/[id]] codigosBNCC inválido:", body.codigosBNCC)
    return Response.json({ error: "Configuração inválida" }, { status: 400 })
  }
  if (body.mostrarBNCC !== undefined && typeof body.mostrarBNCC !== "boolean") {
    console.error("[PUT /api/atividades/[id]] mostrarBNCC inválido:", body.mostrarBNCC)
    return Response.json({ error: "Configuração inválida" }, { status: 400 })
  }

  const atividadeUpdate: Record<string, unknown> = {}
  if (body.formatacao !== undefined) atividadeUpdate.formatacao = body.formatacao
  if (body.fonteEscolhida !== undefined) atividadeUpdate.fonte_escolhida = body.fonteEscolhida
  if (body.acessibilidade !== undefined) atividadeUpdate.acessibilidade = body.acessibilidade
  if (body.codigosBNCC !== undefined) atividadeUpdate.codigos_bncc = body.codigosBNCC
  if (body.mostrarBNCC !== undefined) atividadeUpdate.mostrar_bncc = body.mostrarBNCC
  if (Object.keys(atividadeUpdate).length > 0) {
    const { error } = await supabase.from("atividades").update(atividadeUpdate).eq("id", id)
    if (error) {
      console.error("[PUT /api/atividades/[id]] falha ao salvar configuração da atividade:", error)
      return Response.json({ error: "Não foi possível salvar as alterações." }, { status: 500 })
    }
  }

  // Remove as imagens das questões atuais antes de apagar as questões  sem isso, se a FK
  // questao_imagens.questao_id -> questoes.id não tiver ON DELETE CASCADE, o delete abaixo
  // falharia por violação de chave estrangeira. Os dois deletes checam erro explicitamente
  // (diferente de um "fire and forget"): se a RLS bloquear silenciosamente uma dessas
  // exclusões, o `insert` seguinte deixaria questões/imagens duplicadas em vez de substituir 
  // melhor abortar com um erro claro no log do que gravar dado inconsistente.
  const { data: questoesAntigas, error: buscaAntigasError } = await supabase.from("questoes").select("id").eq("atividade_id", id)
  if (buscaAntigasError) {
    console.error("[PUT /api/atividades/[id]] falha ao buscar questões antigas:", buscaAntigasError)
    return Response.json({ error: "Não foi possível salvar as alterações." }, { status: 500 })
  }
  const idsAntigos = (questoesAntigas ?? []).map((q) => q.id)
  if (idsAntigos.length > 0) {
    const { error: deleteImagensError } = await supabase.from("questao_imagens").delete().in("questao_id", idsAntigos)
    if (deleteImagensError) {
      console.error("[PUT /api/atividades/[id]] falha ao apagar imagens antigas:", deleteImagensError)
      return Response.json({ error: "Não foi possível salvar as alterações." }, { status: 500 })
    }
  }
  const { error: deleteQuestoesError } = await supabase.from("questoes").delete().eq("atividade_id", id)
  if (deleteQuestoesError) {
    console.error("[PUT /api/atividades/[id]] falha ao apagar questões antigas:", deleteQuestoesError)
    return Response.json({ error: "Não foi possível salvar as alterações." }, { status: 500 })
  }

  if (questoes.length > 0) {
    const { data: inseridas, error } = await supabase
      .from("questoes")
      .insert(
        questoes.map((q, i) => ({
          atividade_id: id,
          numero: i + 1,
          tipo: q.tipo,
          enunciado: q.enunciado,
          opcoes: q.opcoes ?? null,
          afirmativas: q.afirmativas ?? null,
          gabarito: q.gabarito,
          layout: q.layout ?? "vertical",
          dificuldade: q.dificuldade ?? null,
          numero_linhas: q.numeroLinhas ?? null,
        }))
      )
      .select("id, numero")
    if (error) {
      console.error("[PUT /api/atividades/[id]] falha ao salvar questões:", error)
      return Response.json({ error: "Não foi possível salvar as alterações." }, { status: 500 })
    }

    // `numero` (1-based, atribuído acima) é único nesta leva recém-inserida  usa ele pra achar
    // o id real de cada linha em vez de assumir que a ordem de retorno do insert bate com a do
    // array enviado.
    const idPorNumero = new Map(inseridas.map((row) => [row.numero, row.id]))
    const imagensParaInserir = questoes
      .map((q, i) => ({ questaoId: idPorNumero.get(i + 1), imagem: q.imagem }))
      .filter((x): x is { questaoId: string; imagem: QuestaoImagemInput } => !!x.questaoId && !!x.imagem)
      .map(({ questaoId, imagem }) => ({
        questao_id: questaoId,
        tipo: imagem.tipo,
        src: imagem.src,
        posicao: imagem.posicao ?? null,
        alinhamento: imagem.alinhamento ?? null,
        largura_px: imagem.larguraPx ?? null,
        altura_px: imagem.alturaPx ?? null,
        ajuste: imagem.ajuste ?? null,
        offset_x_px: imagem.offsetXPx ?? null,
        offset_y_px: imagem.offsetYPx ?? null,
      }))
    if (imagensParaInserir.length > 0) {
      const { error: imagensError } = await supabase.from("questao_imagens").insert(imagensParaInserir)
      if (imagensError) {
        console.error("[PUT /api/atividades/[id]] falha ao salvar imagens das questões:", imagensError)
        return Response.json({ error: "Não foi possível salvar as imagens." }, { status: 500 })
      }
    }
  }

  return Response.json({ ok: true })
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/atividades/[id]">) {
  const { id } = await ctx.params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  // `atividades` não tem usuario_id direto  o dono é quem é dono da turma (turma_id ->
  // turmas.usuario_id). Sem essa checagem, qualquer usuário autenticado poderia apagar o
  // registro/arquivo de QUALQUER atividade só sabendo o UUID (IDOR)  a RLS do banco também
  // deveria bloquear isso, mas essa checagem aqui garante um 403 claro em vez de depender só
  // disso, e cobre o caso de RLS mal configurada.
  const { data: atividade } = await supabase.from("atividades").select("turma_id").eq("id", id).maybeSingle()
  if (!atividade) return Response.json({ error: "Atividade não encontrada" }, { status: 404 })

  const { data: turma } = await supabase.from("turmas").select("usuario_id").eq("id", atividade.turma_id).maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  // Apaga o .docx gerado (atividade, prova ou plano de aula  todas sobem pro mesmo bucket/path,
  // ver /api/atividades/gerar e /api/plano-de-aula/gerar) antes do registro, pra não deixar
  // arquivo órfão no Storage. Best-effort: se falhar, segue com o delete do registro mesmo assim
  //  um arquivo órfão é preferível a travar a exclusão do usuário.
  const { error: storageError } = await supabase.storage.from("atividades").remove([`${user.id}/${id}.docx`])
  if (storageError) console.error("[DELETE /api/atividades/[id]] falha ao remover .docx do Storage:", storageError)

  const { error } = await supabase.from("atividades").delete().eq("id", id)
  if (error) {
    console.error("[DELETE /api/atividades/[id]] falha ao apagar atividade:", error)
    return Response.json({ error: "Não foi possível apagar a atividade." }, { status: 500 })
  }
  return Response.json({ ok: true })
}
