import { createServerSupabaseClient } from "@/lib/supabase-server"
import { obterConfigIA } from "@/lib/ai/model-por-plano"
import { obterAssinaturaEfetiva } from "@/lib/atividades/assinatura"
import { ehErroDeSobrecarga, gerarQuestoes, TIPOS_QUESTAO_VALIDOS, DIFICULDADES_VALIDAS, QUANTIDADE_QUESTOES_MAXIMA } from "@/lib/ai/gerar-questoes"
import { ehErroDeTruncamento } from "@/lib/ai/openai-schema"
import { hashArquivo } from "@/lib/ai/gemini-document-cache"
import { gerarAtividadeDocx } from "@/lib/ai/gerar-atividade-docx"
import { extrairConteudoArquivo, tentarParsearArquivoPreprocessado } from "@/lib/ai/extrair-conteudo-arquivo"
import { filtrarPaginasPdf } from "@/lib/ai/filtrar-paginas-pdf"
import {
  reservarGeracao,
  confirmarGeracao,
  cancelarGeracao,
  reservarBuscaVestibular,
  obterLimiteDiario,
  obterLimiteMensal,
  obterLimiteQuestoesPorGeracao,
} from "@/lib/atividades/limites"
import { resolverModeloTemplate } from "@/lib/atividades/resolver-modelo-template"
import { verificarDonoDaAtividade } from "@/lib/atividades/dono"
import { detectarHabilidadesBNCC } from "@/lib/bncc/detectar-habilidades"

const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const form = await request.formData()
  const turmaId = form.get("turmaId")
  const titulo = form.get("titulo")
  const quantidadeQuestoes = Number(form.get("quantidadeQuestoes"))
  let tipos: unknown
  try {
    tipos = JSON.parse(String(form.get("tipos") ?? "[]"))
  } catch {
    return Response.json({ error: "Campo 'tipos' inválido" }, { status: 400 })
  }
  const dificuldade = String(form.get("dificuldade") ?? "medio")
  // "atividade" (padrão) ou "prova"  decide a persona da IA e o valor gravado em `atividades.tipo`.
  const tipoConteudo: "atividade" | "prova" = form.get("tipo") === "prova" ? "prova" : "atividade"
  // Marcação "usar ENEM/vestibulares" do step de configurações  busca questões reais antes de gerar.
  const usarBaseVestibular = form.get("usarBaseVestibular") === "true"
  const atividadeIdRaw = form.get("atividadeId")
  const atividadeId = typeof atividadeIdRaw === "string" && atividadeIdRaw ? atividadeIdRaw : undefined
  const arquivo = form.get("arquivo")
  // Extração+filtragem já rodada em paralelo pelo cliente (ver app/api/arquivo-referencia/preparar)
  //  conta como "tem arquivo" na validação abaixo mesmo quando o `arquivo` cru não foi reenviado.
  const arquivoPreprocessado = tentarParsearArquivoPreprocessado(form.get("arquivoPreprocessado"))
  // .docx de estilo enviado no step-style  só sobe pro Storage depois que a IA gerar com sucesso.
  const modeloDocxRaw = form.get("modeloDocx")
  const modeloDocx = modeloDocxRaw instanceof File ? modeloDocxRaw : undefined
  // Ou a referência de um modelo já enviado antes (reaproveitado  sem reupload).
  const modeloTemplateIdRaw = form.get("modeloTemplateId")
  const modeloTemplateIdExistente =
    typeof modeloTemplateIdRaw === "string" && modeloTemplateIdRaw ? modeloTemplateIdRaw : undefined
  // Logo da instituição enviado no step-style  só tem efeito junto de um modelo pronto de sistema.
  const logoInstituicaoRaw = form.get("logoInstituicao")
  const logoInstituicao = logoInstituicaoRaw instanceof File ? logoInstituicaoRaw : undefined

  const temaDigitado = typeof titulo === "string" ? titulo.trim() : ""

  if (
    typeof turmaId !== "string" ||
    !turmaId ||
    (!temaDigitado && !(arquivo instanceof File) && !arquivoPreprocessado) ||
    !Array.isArray(tipos) ||
    !tipos.length ||
    !tipos.every((t) => TIPOS_QUESTAO_VALIDOS.includes(t)) ||
    !DIFICULDADES_VALIDAS.includes(dificuldade as (typeof DIFICULDADES_VALIDAS)[number]) ||
    !Number.isInteger(quantidadeQuestoes) ||
    quantidadeQuestoes < 1 ||
    quantidadeQuestoes > QUANTIDADE_QUESTOES_MAXIMA
  ) {
    return Response.json({ error: "Dados incompletos para gerar a atividade" }, { status: 400 })
  }
  const tiposValidados = tipos as string[]

  // Regenerar uma atividade/prova existente aceita um `atividadeId` do cliente  sem essa
  // checagem, qualquer usuário autenticado poderia apagar/sobrescrever as questões de OUTRO
  // professor só sabendo o UUID (IDOR). A RLS (`atividades_update_own`/`questoes_delete_own`,
  // ver supabase/migrations/20260713000000_seguranca_limites_e_rls.sql) também deveria bloquear,
  // mas esta checagem garante um 403 claro em vez de depender só disso.
  if (atividadeId && !(await verificarDonoDaAtividade(supabase, atividadeId, user.id))) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  // Mesma lógica: `turmaId` também vem do cliente  sem filtrar por dono, um usuário poderia
  // criar uma atividade dentro da turma de outro professor (a RLS `atividades_insert_own` cobre
  // isso via join até `turmas.usuario_id`, mas o filtro explícito aqui é defesa em profundidade).
  const { data: turma } = await supabase
    .from("turmas")
    .select("nome, nivel, serie, periodo, usuario_id")
    .eq("id", turmaId)
    .maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }
  // Só um dos dois vem preenchido: `periodo` é exclusivo de superior/pos_graduacao, `serie` dos demais níveis.
  const serieOuPeriodo = turma.serie ?? turma.periodo ?? undefined

  // Sem registro em `assinaturas` (ninguém assinou ainda, webhook não confirmou pagamento, ou
  // status atual não dá mais direito ao plano pago  ex.: past_due/unpaid/canceled), o usuário
  // fica no trial gratuito  nunca no "basico"/"premium" pago (ver lib/atividades/assinatura.ts).
  const { plano } = await obterAssinaturaEfetiva(supabase, user.id)

  // Teto de questões POR geração (separado da cota de quantas atividades o plano permite criar,
  // ver reservarGeracao abaixo)  hoje só restringe o plano "gratis". Checa antes de reservar
  // cota pra não gastar uma vaga de geração numa requisição que nem devia ter sido enviada.
  const limiteQuestoes = obterLimiteQuestoesPorGeracao(plano)
  if (limiteQuestoes !== undefined && quantidadeQuestoes > limiteQuestoes) {
    return Response.json(
      {
        error: `O plano gratuito permite gerar no máximo ${limiteQuestoes} questões por vez. Faça upgrade para gerar mais.`,
        limiteAtingido: true,
      },
      { status: 403 }
    )
  }

  // Toda geração bem-sucedida conta pra cota mensal  inclusive regenerar uma atividade/prova já
  // existente (atividadeId presente): cada clique em "Gerar Atividade Completa"/"Regerar" chama a
  // IA de novo e deve descontar uma vaga, não só a criação original. A checagem + reserva
  // acontece numa única chamada atômica (ver reservarGeracao) pra não deixar brecha de duas
  // requisições concorrentes passarem da checagem ao mesmo tempo.
  const reserva = await reservarGeracao(supabase, user.id)
  if (!reserva.permitido) {
    const limiteDiario = obterLimiteDiario(plano)
    const atingiuDiario = limiteDiario !== undefined && reserva.usadasDiario >= limiteDiario
    const mensagem = atingiuDiario
      ? `Limite diário do plano atingido (${reserva.usadasDiario}/${limiteDiario} atividades). Faça upgrade para gerar mais.`
      : `Limite mensal do plano atingido (${reserva.usadasMensal}/${obterLimiteMensal(plano)} atividades). Faça upgrade para gerar mais.`
    return Response.json({ error: mensagem, limiteAtingido: true }, { status: 403 })
  }
  const reservaId: string | null = reserva.reservaId

  // Se o cliente já rodou a extração+filtragem em paralelo (enquanto o usuário configurava o
  // resto do wizard  ver components/generator-modal.tsx e app/api/arquivo-referencia/preparar),
  // reaproveita o resultado direto e pula tudo abaixo.
  let arquivoReferencia = arquivoPreprocessado

  if (!arquivoReferencia) {
    try {
      arquivoReferencia = arquivo instanceof File ? await extrairConteudoArquivo(arquivo) : null
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Não foi possível ler o arquivo enviado." }, { status: 400 })
    }

    // Com tema explícito, o PDF de referência não precisa entrar inteiro no prompt  filtra pras
    // páginas relevantes ao tema antes de tudo (hash, cache, geração) pra reduzir tokens de entrada.
    // Sem tema, o documento inteiro define o assunto e não é filtrado. Nunca lança (ver
    // lib/ai/filtrar-paginas-pdf.ts)  em qualquer falha, segue com o PDF original.
    if (arquivoReferencia?.tipo === "pdf" && temaDigitado) {
      const { arquivo: arquivoFiltrado } = await filtrarPaginasPdf({ arquivo: arquivoReferencia, tema: temaDigitado })
      arquivoReferencia = arquivoFiltrado
    }
  }

  // Persistido na atividade (não o arquivo em si) pra permitir reaproveitar o cache de contexto
  // do Gemini ao regenerar uma questão avulsa depois, sem o arquivo original em mãos.
  const arquivoHash = arquivoReferencia ? hashArquivo(arquivoReferencia, tipoConteudo) : null

  const { provider, modelo, maxOutputTokens, apiKey } = obterConfigIA(plano)

  // Busca ENEM/vestibular só existe pra prova  grounding é cobrado à parte pelo Gemini e é
  // ~37x mais caro que uma geração normal, então ignora silenciosamente pra atividade mesmo que
  // o cliente mande a flag ligada. Dentro de prova, ainda tem cota própria mensal (bem menor que
  // a cota geral de gerações): se estourou, cai pra geração sem busca real em vez de bloquear a
  // prova inteira  a busca é só um "bônus" de fonte real, não algo que deva travar o professor.
  let usarBaseVestibularEfetivo = usarBaseVestibular && tipoConteudo === "prova"
  if (usarBaseVestibularEfetivo) {
    const { permitido } = await reservarBuscaVestibular(supabase, user.id)
    usarBaseVestibularEfetivo = permitido
  }

  let resultado
  try {
    resultado = await gerarQuestoes({
      provider,
      modelo,
      apiKey,
      maxOutputTokens,
      tipoConteudo,
      usarBaseVestibular: usarBaseVestibularEfetivo,
      tema: temaDigitado || undefined,
      quantidade: quantidadeQuestoes,
      tipos: tiposValidados,
      dificuldade,
      nivelEnsino: turma?.nivel,
      serieOuPeriodo,
      disciplina: turma?.nome,
      arquivoReferencia,
      // Habilita o cache de contexto do Gemini para o arquivo anexado  evita reenviar o
      // documento inteiro a cada "Regerar" (ver lib/ai/gemini-document-cache.ts).
      cache: arquivoReferencia ? { supabase, usuarioId: user.id } : undefined,
    })
  } catch (err) {
    console.error("[/api/atividades/gerar] falha ao gerar questões com a IA:", err)
    // A geração falhou antes de criar a atividade  desfaz a reserva de cota, senão o usuário
    // perde uma vaga por uma tentativa que não gerou nada.
    if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
    const mensagem = ehErroDeSobrecarga(err)
      ? "O serviço de IA está sobrecarregado no momento. Tente novamente em alguns instantes."
      : ehErroDeTruncamento(err)
        ? err.message
        : "Não foi possível gerar as questões com a IA."
    return Response.json({ error: mensagem }, { status: 502 })
  }

  const tituloFinal =
    temaDigitado || resultado.tituloSugerido?.trim() || (tipoConteudo === "prova" ? "Prova gerada" : "Atividade gerada")

  // Identifica as habilidades da BNCC que as questões geradas trabalham  consultando a base
  // oficial (api.bncc.dev) em vez de deixar a IA "lembrar" códigos de memória (ver
  // lib/bncc/detectar-habilidades.ts). "Melhor esforço": turma fora do escopo da BNCC, base
  // indisponível ou nenhuma habilidade compatível encontrada só resultam numa lista vazia  nunca
  // impedem a atividade (já gerada com sucesso) de ser salva.
  const habilidadesBNCC = turma
    ? await detectarHabilidadesBNCC({
        turma: { nivel: turma.nivel, serie: turma.serie },
        disciplina: turma.nome,
        tema: temaDigitado || undefined,
        questoes: resultado.questoes,
      })
    : []
  // Só os códigos (sem descrição)  é o que fica salvo em `atividades.codigos_bncc` e volta pro
  // cliente, que os trata como o campo editável de sempre (ver components/atividades/editor/
  // editor-sidebar.tsx). A descrição oficial de cada código é resolvida de novo, contra a mesma
  // base, na hora de montar o rodapé do Word (ver generate-word.ts)  assim uma edição manual do
  // professor (adicionar/remover código) também passa pela base oficial, não só a detecção inicial.
  const codigosBNCC = habilidadesBNCC.map((h) => h.codigo)

  // Resolve o modelo de estilo (se algum foi indicado) só depois que a IA gerou as questões
  // com sucesso  se a geração falhar, nada é persistido/reenviado.
  const { modeloTemplateId, error: modeloTemplateError } = await resolverModeloTemplate({
    supabase,
    usuarioId: user.id,
    modeloDocx,
    modeloTemplateIdExistente,
    logoInstituicao,
  })
  if (modeloTemplateError) {
    if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
    return Response.json({ error: modeloTemplateError }, { status: 500 })
  }

  let atividadeIdFinal = atividadeId
  if (!atividadeIdFinal) {
    const { data: atividade, error } = await supabase
      .from("atividades")
      .insert({
        turma_id: turmaId,
        tipo: tipoConteudo,
        titulo: tituloFinal,
        quantidade_questoes: quantidadeQuestoes,
        dificuldade,
        modelo_template_id: modeloTemplateId ?? null,
        gemini_arquivo_hash: arquivoHash,
        codigos_bncc: codigosBNCC.length ? codigosBNCC : null,
      })
      .select("id")
      .single()
    if (error) {
      console.error("[/api/atividades/gerar] falha ao inserir atividade:", error)
      if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
      return Response.json({ error: "Não foi possível salvar a atividade." }, { status: 500 })
    }
    atividadeIdFinal = atividade.id
    if (!atividadeIdFinal) {
      if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
      return Response.json({ error: "ID da atividade não foi gerado." }, { status: 500 })
    }
    if (reservaId) await confirmarGeracao(supabase, user.id, reservaId, atividadeIdFinal)
  } else {
    await supabase.from("questoes").delete().eq("atividade_id", atividadeIdFinal)
    await supabase
      .from("atividades")
      .update({
        titulo: tituloFinal,
        quantidade_questoes: quantidadeQuestoes,
        dificuldade,
        gemini_arquivo_hash: arquivoHash,
        codigos_bncc: codigosBNCC.length ? codigosBNCC : null,
        ...(modeloTemplateId && { modelo_template_id: modeloTemplateId }),
      })
      .eq("id", atividadeIdFinal)
    if (reservaId) await confirmarGeracao(supabase, user.id, reservaId, atividadeIdFinal)
  }

  const { error: questoesError } = await supabase.from("questoes").insert(
    resultado.questoes.map((q, i) => ({
      atividade_id: atividadeIdFinal,
      numero: i + 1,
      tipo: q.tipo,
      enunciado: q.enunciado,
      opcoes: q.opcoes ?? null,
      afirmativas: q.afirmativas ?? null,
      gabarito: q.gabarito,
      numero_linhas: q.numeroLinhas ?? null,
    }))
  )
  if (questoesError) {
    console.error("[/api/atividades/gerar] falha ao inserir questões:", questoesError)
    return Response.json({ error: "Não foi possível salvar as questões." }, { status: 500 })
  }

  await supabase.from("atividades").update({ status: "gerada" }).eq("id", atividadeIdFinal)

  const docxBuffer = await gerarAtividadeDocx(tituloFinal, resultado.questoes, habilidadesBNCC)
  const path = `${user.id}/${atividadeIdFinal}.docx`

  const { error: uploadError } = await supabase.storage.from("atividades").upload(path, docxBuffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    upsert: true,
  })
  if (uploadError) {
    console.error("[/api/atividades/gerar] falha ao subir .docx:", uploadError)
    return Response.json({ error: "Não foi possível gerar o arquivo .docx." }, { status: 500 })
  }

  await supabase.from("exportacoes").insert({ atividade_id: atividadeIdFinal, usuario_id: user.id, tipo: "docx" })
  await supabase.from("atividades").update({ status: "exportada" }).eq("id", atividadeIdFinal)

  const { data: signed } = await supabase.storage.from("atividades").createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  return Response.json({
    atividadeId: atividadeIdFinal,
    titulo: tituloFinal,
    questoes: resultado.questoes,
    codigosBNCC,
    docxUrl: signed?.signedUrl ?? null,
  })
}
