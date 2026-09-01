import { createServerSupabaseClient } from "@/lib/supabase-server"
import { obterConfigIA } from "@/lib/ai/model-por-plano"
import { gerarPlanoAula, DURACAO_MINUTOS_MAXIMA } from "@/lib/ai/gerar-plano-aula"
import { ehErroDeSobrecarga } from "@/lib/ai/gemini-retry"
import { ehErroDeTruncamento } from "@/lib/ai/openai-schema"
import { gerarPlanoAulaDocx } from "@/lib/ai/gerar-plano-aula-docx"
import { extrairConteudoArquivo, tentarParsearArquivoPreprocessado } from "@/lib/ai/extrair-conteudo-arquivo"
import { filtrarPaginasPdf } from "@/lib/ai/filtrar-paginas-pdf"
import { reservarGeracao, confirmarGeracao, cancelarGeracao, obterLimiteDiario, obterLimiteMensal } from "@/lib/atividades/limites"
import { obterAssinaturaEfetiva } from "@/lib/atividades/assinatura"
import { resolverModeloTemplate } from "@/lib/atividades/resolver-modelo-template"
import { verificarDonoDaAtividade } from "@/lib/atividades/dono"

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
  const disciplinaRaw = form.get("disciplina")
  const disciplina = typeof disciplinaRaw === "string" && disciplinaRaw.trim() ? disciplinaRaw.trim() : undefined
  const dataAulaRaw = form.get("dataAula")
  const dataAula = typeof dataAulaRaw === "string" && dataAulaRaw ? dataAulaRaw : undefined
  const duracaoMinutos = Number(form.get("duracaoMinutos"))
  const formatoAula = String(form.get("formatoAula") ?? "expositiva")
  let secoes: unknown
  try {
    secoes = JSON.parse(String(form.get("secoes") ?? "[]"))
  } catch {
    return Response.json({ error: "Campo 'secoes' inválido" }, { status: 400 })
  }
  const atividadeIdRaw = form.get("atividadeId")
  const atividadeId = typeof atividadeIdRaw === "string" && atividadeIdRaw ? atividadeIdRaw : undefined
  const arquivo = form.get("arquivo")
  // Extração+filtragem já rodada em paralelo pelo cliente (ver app/api/arquivo-referencia/preparar)
  //  conta como "tem arquivo" na validação abaixo mesmo quando o `arquivo` cru não foi reenviado.
  const arquivoPreprocessado = tentarParsearArquivoPreprocessado(form.get("arquivoPreprocessado"))
  // .docx de estilo enviado no step-style  ainda não é aplicado na tela A4/Word do plano de
  // aula (ver components/plano-de-aula/editor/plano-aula-editor.tsx), só fica salvo na atividade
  // pra quando essa aplicação for implementada.
  const modeloDocxRaw = form.get("modeloDocx")
  const modeloDocx = modeloDocxRaw instanceof File ? modeloDocxRaw : undefined
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
    !Array.isArray(secoes) ||
    !secoes.length ||
    !secoes.every((s) => typeof s === "string") ||
    !Number.isInteger(duracaoMinutos) ||
    duracaoMinutos < 1 ||
    duracaoMinutos > DURACAO_MINUTOS_MAXIMA
  ) {
    return Response.json({ error: "Dados incompletos para gerar o plano de aula" }, { status: 400 })
  }
  const secoesValidadas = secoes as string[]

  // Regenerar um plano de aula existente aceita um `atividadeId` do cliente  sem essa checagem,
  // qualquer usuário autenticado poderia sobrescrever o plano de OUTRO professor só sabendo o
  // UUID (IDOR). Mesma checagem usada em app/api/atividades/gerar/route.ts.
  if (atividadeId && !(await verificarDonoDaAtividade(supabase, atividadeId, user.id))) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: turma } = await supabase
    .from("turmas")
    .select("nivel, serie, periodo, usuario_id")
    .eq("id", turmaId)
    .maybeSingle()
  if (!turma || turma.usuario_id !== user.id) {
    return Response.json({ error: "Não autorizado" }, { status: 403 })
  }
  // Só um dos dois vem preenchido: `periodo` é exclusivo de superior/pos_graduacao, `serie` dos demais níveis.
  const serieOuPeriodo = turma.serie ?? turma.periodo ?? undefined

  // Sem registro em `assinaturas` (ninguém assinou ainda, webhook não confirmou pagamento, ou
  // status atual não dá mais direito ao plano pago), o usuário fica no trial gratuito  nunca no
  // "basico"/"premium" pago (ver lib/atividades/assinatura.ts).
  const { plano } = await obterAssinaturaEfetiva(supabase, user.id)

  // Toda geração bem-sucedida conta pra cota mensal  inclusive regenerar um plano de aula já
  // existente (atividadeId presente): cada clique em "Gerar Atividade Completa"/"Regerar" chama a
  // IA de novo e deve descontar uma vaga, não só a criação original. Checagem + reserva numa única
  // chamada atômica (ver reservarGeracao) pra fechar a race condition entre duas requisições
  // concorrentes.
  const reserva = await reservarGeracao(supabase, user.id)
  if (!reserva.permitido) {
    const limiteDiario = obterLimiteDiario(plano)
    const atingiuDiario = limiteDiario !== undefined && reserva.usadasDiario >= limiteDiario
    const mensagem = atingiuDiario
      ? `Limite diário do plano atingido (${reserva.usadasDiario}/${limiteDiario} planos de aula). Faça upgrade para gerar mais.`
      : `Limite mensal do plano atingido (${reserva.usadasMensal}/${obterLimiteMensal(plano)} planos de aula). Faça upgrade para gerar mais.`
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
    // páginas relevantes ao tema antes da geração, pra reduzir tokens de entrada. Sem tema, o
    // documento inteiro define o assunto e não é filtrado. Nunca lança (ver
    // lib/ai/filtrar-paginas-pdf.ts)  em qualquer falha, segue com o PDF original.
    if (arquivoReferencia?.tipo === "pdf" && temaDigitado) {
      const { arquivo: arquivoFiltrado } = await filtrarPaginasPdf({ arquivo: arquivoReferencia, tema: temaDigitado })
      arquivoReferencia = arquivoFiltrado
    }
  }

  const { provider, modelo, maxOutputTokens, apiKey } = obterConfigIA(plano)

  let planoGerado
  try {
    planoGerado = await gerarPlanoAula({
      provider,
      modelo,
      apiKey,
      maxOutputTokens,
      tema: temaDigitado || undefined,
      disciplina,
      dataAula,
      duracaoMinutos,
      formatoAula,
      secoes: secoesValidadas,
      nivelEnsino: turma?.nivel,
      serieOuPeriodo,
      arquivoReferencia,
    })
  } catch (err) {
    console.error("[/api/plano-de-aula/gerar] falha ao gerar plano de aula com a IA:", err)
    if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
    const mensagem = ehErroDeSobrecarga(err)
      ? "O serviço de IA está sobrecarregado no momento. Tente novamente em alguns instantes."
      : ehErroDeTruncamento(err)
        ? err.message
        : "Não foi possível gerar o plano de aula com a IA."
    return Response.json({ error: mensagem }, { status: 502 })
  }

  const tituloFinal = temaDigitado || planoGerado.tituloSugerido?.trim() || "Plano de aula gerado"

  // Resolve o modelo de estilo (se algum foi indicado) só depois que a IA gerou o plano com
  // sucesso  se a geração falhar, nada é persistido/reenviado.
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
      .insert({ turma_id: turmaId, tipo: "plano_aula", titulo: tituloFinal, modelo_template_id: modeloTemplateId ?? null })
      .select("id")
      .single()
    if (error) {
      console.error("[/api/plano-de-aula/gerar] falha ao inserir atividade:", error)
      if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
      return Response.json({ error: "Não foi possível salvar o plano de aula." }, { status: 500 })
    }
    atividadeIdFinal = atividade.id
    if (!atividadeIdFinal) {
      if (reservaId) await cancelarGeracao(supabase, user.id, reservaId)
      return Response.json({ error: "ID da atividade não foi gerado." }, { status: 500 })
    }
    if (reservaId) await confirmarGeracao(supabase, user.id, reservaId, atividadeIdFinal)
  } else {
    await supabase
      .from("atividades")
      .update({ titulo: tituloFinal, ...(modeloTemplateId && { modelo_template_id: modeloTemplateId }) })
      .eq("id", atividadeIdFinal)
    if (reservaId) await confirmarGeracao(supabase, user.id, reservaId, atividadeIdFinal)
  }

  const { error: planoError } = await supabase.from("planos_aula").upsert(
    {
      atividade_id: atividadeIdFinal,
      disciplina: disciplina ?? null,
      data_aula: dataAula ?? null,
      duracao_minutos: planoGerado.duracaoMinutos ?? duracaoMinutos,
      formato_aula: formatoAula,
      objetivo_geral: planoGerado.objetivoGeral ?? null,
      objetivos: planoGerado.objetivosEspecificos ?? [],
      habilidades_bncc: planoGerado.habilidadesBNCC ?? [],
      competencias: planoGerado.competencias ?? [],
      conteudo: planoGerado.conteudo ?? null,
      metodologia: planoGerado.metodologia ?? null,
      recursos: planoGerado.recursos ?? [],
      atividades_propostas: planoGerado.atividadesPropostas ?? [],
      avaliacao: planoGerado.avaliacao ?? null,
      adaptacoes: planoGerado.adaptacoes ?? null,
      tarefa_casa: planoGerado.tarefaCasa ?? null,
      referencias: planoGerado.referencias ?? [],
    },
    { onConflict: "atividade_id" }
  )
  if (planoError) {
    console.error("[/api/plano-de-aula/gerar] falha ao salvar plano_aula:", planoError)
    return Response.json({ error: "Não foi possível salvar o plano de aula." }, { status: 500 })
  }

  await supabase.from("atividades").update({ status: "gerada" }).eq("id", atividadeIdFinal)

  const docxBuffer = await gerarPlanoAulaDocx(tituloFinal, planoGerado, disciplina, dataAula)
  const path = `${user.id}/${atividadeIdFinal}.docx`

  const { error: uploadError } = await supabase.storage.from("atividades").upload(path, docxBuffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    upsert: true,
  })
  if (uploadError) {
    console.error("[/api/plano-de-aula/gerar] falha ao subir .docx:", uploadError)
    return Response.json({ error: "Não foi possível gerar o arquivo .docx." }, { status: 500 })
  }

  await supabase.from("exportacoes").insert({ atividade_id: atividadeIdFinal, usuario_id: user.id, tipo: "docx" })
  await supabase.from("atividades").update({ status: "exportada" }).eq("id", atividadeIdFinal)

  const { data: signed } = await supabase.storage.from("atividades").createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  return Response.json({
    atividadeId: atividadeIdFinal,
    titulo: tituloFinal,
    plano: planoGerado,
    docxUrl: signed?.signedUrl ?? null,
  })
}
