import type { SupabaseClient } from "@supabase/supabase-js"
import type { Plano } from "@/lib/ai/model-por-plano"

// Quantas atividades novas (atividade | prova | plano_aula) cada plano pode gerar por mês.
// "gratis" tem também um teto diário bem menor (ver LIMITE_DIARIO_POR_PLANO)  o mensal aqui
// é só uma rede de segurança, não o controle principal do trial gratuito.
const LIMITE_MENSAL_POR_PLANO: Record<Plano, number> = {
  gratis: 60,
  basico: 150,
  premium: 400,
}

export function obterLimiteMensal(plano: Plano): number {
  return LIMITE_MENSAL_POR_PLANO[plano]
}

// Quantas buscas ENEM/vestibular (`usarBaseVestibular`) cada plano pode fazer por mês  cota
// própria, bem menor que a geral: a busca usa grounding do Google, cobrado à parte pelo Gemini
// e ~37x mais cara que uma geração normal (ver lib/ai/gemini-prompt.ts).
// "gratis" não tem acesso à feature (fica reservada para planos pagos).
const LIMITE_VESTIBULAR_MENSAL_POR_PLANO: Record<Plano, number> = {
  gratis: 0,
  basico: 15,
  premium: 40,
}

export function obterLimiteVestibularMensal(plano: Plano): number {
  return LIMITE_VESTIBULAR_MENSAL_POR_PLANO[plano]
}

// Fronteira do mês em UTC  em troca de simplicidade, vira o mês algumas horas antes/depois do
// horário de Brasília (BRT = UTC-3). Aceitável pra um limite mensal, não um corte exato. Só usada
// como fallback pra quem não tem assinatura paga (ver inicioJanelaCota)  planos pagos usam a
// data real da compra.
function inicioDoMesAtual(): string {
  const agora = new Date()
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1)).toISOString()
}

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Início da janela de 30 dias em que "agora" cai, a partir da data real da assinatura
 * (`assinaturaIniciadaEm`, ver lib/atividades/assinatura.ts)  mesma fórmula de
 * `inicio_janela_cota` no Postgres (ver supabase/migrations/20260802000000_reset_cota_ciclo_pagamento.sql),
 * usada aqui só pelas funções READ-ONLY (verificarLimiteMensal/verificarLimiteVestibular); quem
 * checa E consome cota de verdade (reservarGeracao/reservarBuscaVestibular) refaz essa conta
 * dentro da própria função Postgres, atomicamente. Não usa o período de cobrança do Stripe
 * (current_period_start) porque esse período é anual pro plano premium_anual  com ele a cota
 * nunca resetaria dentro do ano. `null` (sem assinatura paga) cai pro calendário civil de sempre.
 */
function inicioJanelaCota(assinaturaIniciadaEm: string | null | undefined): string {
  if (!assinaturaIniciadaEm) return inicioDoMesAtual()
  const ancora = new Date(assinaturaIniciadaEm).getTime()
  const janelas = Math.max(0, Math.floor((Date.now() - ancora) / TRINTA_DIAS_MS))
  return new Date(ancora + janelas * TRINTA_DIAS_MS).toISOString()
}

export interface LimiteResultado {
  atingiu: boolean
  usadas: number
  limite: number
}

/**
 * Conta gerações registradas em `atividade_geracoes` desde o início da janela de cota atual
 * (30 dias a partir de `assinaturaIniciadaEm` pra quem tem plano pago, ver `inicioJanelaCota`;
 * calendário civil pra quem está no "gratis") e compara com o limite do plano. Não conta
 * `atividades` diretamente: o usuário pode apagar as próprias atividades, o que resetaria a
 * cota  o registro de geração só aceita SELECT pro usuário (RLS, ver
 * supabase/migrations/20260713000000_seguranca_limites_e_rls.sql), então continua contando
 * mesmo se a atividade for apagada depois. Read-only  usada só pra EXIBIR o uso atual (ver
 * app/api/atividades/limite/route.ts); quem checa E consome cota de verdade é `reservarGeracao`.
 */
export async function verificarLimiteMensal(
  supabase: SupabaseClient,
  usuarioId: string,
  plano: Plano,
  assinaturaIniciadaEm?: string | null
): Promise<LimiteResultado> {
  const limite = obterLimiteMensal(plano)

  const { count, error } = await supabase
    .from("atividade_geracoes")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .gte("criado_em", inicioJanelaCota(assinaturaIniciadaEm))

  // Fail-closed: se a contagem falhar não dá pra saber se o usuário ainda tem cota, então trata
  // como limite atingido em vez de liberar a geração (ver mesma lógica em verificarLimiteDiario
  // e verificarLimiteVestibular).
  if (error) {
    console.error("[verificarLimiteMensal] falha ao contar gerações:", error)
    return { atingiu: true, usadas: limite, limite }
  }

  const usadas = count ?? 0
  return { atingiu: usadas >= limite, usadas, limite }
}

export interface ReservaGeracaoResultado {
  permitido: boolean
  /** ID (uuid) da linha reservada em `atividade_geracoes` (null quando `permitido` é false) 
   *  guarde pra chamar `confirmarGeracao` (sucesso) ou `cancelarGeracao` (falha) depois. */
  reservaId: string | null
  usadasDiario: number
  usadasMensal: number
}

/**
 * Checa a cota diária + mensal e já GRAVA a reserva numa única chamada atômica (função Postgres
 * `reservar_geracao`, ver supabase/migrations/20260803000000_deriva_limite_no_servidor_e_cota_mensal_regeneracao.sql)
 *  ao contrário de duas chamadas separadas (SELECT count + INSERT), isso fecha a race condition
 * em que duas requisições concorrentes do mesmo usuário passariam pela checagem antes de qualquer
 * uma gravar, estourando o limite. `atividade_id` fica NULL na reserva porque a atividade ainda
 * não existe nesse ponto  chame `confirmarGeracao` depois que o INSERT em `atividades` tiver
 * sucesso, ou `cancelarGeracao` se a geração com IA falhar antes disso.
 *
 * Não recebe `plano`/`limite` como parâmetro pro RPC de propósito: a função Postgres deriva o
 * plano e a âncora de janela direto de `assinaturas` por dentro, nunca confiando no que o
 * chamador informa  ela é SECURITY DEFINER com `grant execute to authenticated`, chamável direto
 * pela REST API do Supabase por qualquer usuário logado, então um limite vindo por parâmetro
 * seria um bypass de cota trivial (auditoria de segurança de 03/08/2026, achado F2).
 */
export async function reservarGeracao(supabase: SupabaseClient, usuarioId: string): Promise<ReservaGeracaoResultado> {
  const { data, error } = await supabase.rpc("reservar_geracao", { p_usuario_id: usuarioId }).single()

  // Fail-closed (ver mesma lógica em verificarLimiteMensal): sem confirmação de que a reserva
  // foi feita, trata como limite atingido em vez de liberar a geração.
  if (error || !data) {
    console.error("[reservarGeracao] falha ao reservar cota:", error)
    return { permitido: false, reservaId: null, usadasDiario: 0, usadasMensal: 0 }
  }

  const resultado = data as { permitido: boolean; reserva_id: string | null; usadas_dia: number; usadas_mes: number }
  return {
    permitido: resultado.permitido,
    reservaId: resultado.reserva_id,
    usadasDiario: resultado.usadas_dia,
    usadasMensal: resultado.usadas_mes,
  }
}

/** Liga a reserva feita em `reservarGeracao` à atividade  chame logo após o INSERT em
 *  `atividades` ter sucesso (criação) ou, numa regeneração, logo após o UPDATE na atividade já
 *  existente. Best-effort: se falhar, a cota já foi consumida do mesmo jeito (a reserva existe),
 *  só fica sem o vínculo com a atividade  não vale bloquear a resposta por isso. */
export async function confirmarGeracao(
  supabase: SupabaseClient,
  usuarioId: string,
  reservaId: string,
  atividadeId: string
): Promise<void> {
  const { error } = await supabase.rpc("confirmar_geracao", {
    p_reserva_id: reservaId,
    p_usuario_id: usuarioId,
    p_atividade_id: atividadeId,
  })
  if (error) console.error("[confirmarGeracao] falha ao confirmar reserva:", error)
}

/** Desfaz uma reserva não confirmada  chame quando a geração com IA falhar antes de chegar a
 *  criar a atividade, pra não descontar cota de uma tentativa que não gerou nada. */
export async function cancelarGeracao(
  supabase: SupabaseClient,
  usuarioId: string,
  reservaId: string
): Promise<void> {
  const { error } = await supabase.rpc("cancelar_geracao", { p_reserva_id: reservaId, p_usuario_id: usuarioId })
  if (error) console.error("[cancelarGeracao] falha ao cancelar reserva:", error)
}

export interface ReservaVestibularResultado {
  permitido: boolean
  usadas: number
}

/**
 * Mesma ideia de `reservarGeracao`, mas pra cota de busca ENEM/vestibular (grounding)  checa e
 * grava numa única chamada atômica. Conta toda chamada que realmente ligou `usarBaseVestibular`
 *  inclusive regenerações e "Regerar questão" avulsa  porque o Gemini cobra o grounding a
 * cada chamada, não só na criação da atividade; por isso não tem "cancelarReserva" aqui: ao
 * contrário da geração, o uso já é considerado consumido assim que a chamada com grounding é
 * decidida, mesmo que a geração em si falhe depois (mesmo comportamento de antes).
 *
 * Mesmo motivo de `reservarGeracao` pra não receber `plano`/`limite` como parâmetro do RPC  a
 * função Postgres deriva tudo de `assinaturas` internamente (achado F2 da auditoria de
 * segurança de 03/08/2026).
 */
export async function reservarBuscaVestibular(supabase: SupabaseClient, usuarioId: string): Promise<ReservaVestibularResultado> {
  const { data, error } = await supabase.rpc("reservar_busca_vestibular", { p_usuario_id: usuarioId }).single()

  if (error || !data) {
    console.error("[reservarBuscaVestibular] falha ao reservar cota:", error)
    return { permitido: false, usadas: 0 }
  }

  const resultado = data as { permitido: boolean; usadas: number }
  return { permitido: resultado.permitido, usadas: resultado.usadas }
}

/**
 * Conta buscas ENEM/vestibular registradas em `vestibular_buscas` desde o início do mês corrente
 * e compara com o limite do plano. Read-only  usada só pra EXIBIR quanto ainda resta (ver
 * app/api/atividades/limite/route.ts); quem checa E consome cota de verdade é `reservarBuscaVestibular`.
 */
export async function verificarLimiteVestibular(
  supabase: SupabaseClient,
  usuarioId: string,
  plano: Plano,
  assinaturaIniciadaEm?: string | null
): Promise<LimiteResultado> {
  const limite = obterLimiteVestibularMensal(plano)

  const { count, error } = await supabase
    .from("vestibular_buscas")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .gte("criado_em", inicioJanelaCota(assinaturaIniciadaEm))

  // Fail-closed (ver mesma lógica e justificativa em verificarLimiteMensal).
  if (error) {
    console.error("[verificarLimiteVestibular] falha ao contar buscas:", error)
    return { atingiu: true, usadas: limite, limite }
  }

  const usadas = count ?? 0
  return { atingiu: usadas >= limite, usadas, limite }
}

// Só o plano "gratis" (trial sem assinatura) tem teto diário  os planos pagos ficam só com a
// cota mensal acima. Ausente no mapa = sem controle diário pra esse plano.
const LIMITE_DIARIO_POR_PLANO: Partial<Record<Plano, number>> = {
  gratis: 2,
}

export function obterLimiteDiario(plano: Plano): number | undefined {
  return LIMITE_DIARIO_POR_PLANO[plano]
}

// Máximo de questões geradas POR atividade/prova numa única chamada  separado da cota de
// gerações (LIMITE_DIARIO_POR_PLANO / LIMITE_MENSAL_POR_PLANO), que limita quantas atividades
// o usuário cria, não o tamanho de cada uma. Só "gratis" tem teto reduzido; planos pagos ficam
// sem entrada aqui e usam o teto geral do sistema (QUANTIDADE_QUESTOES_MAXIMA, ver
// lib/ai/gerar-questoes.ts). Puro (sem I/O) de propósito  importado também pelo client
// (StepConfig) pra já limitar as opções do seletor, além da checagem no backend.
const LIMITE_QUESTOES_POR_GERACAO_POR_PLANO: Partial<Record<Plano, number>> = {
  gratis: 2,
}

export function obterLimiteQuestoesPorGeracao(plano: Plano): number | undefined {
  return LIMITE_QUESTOES_POR_GERACAO_POR_PLANO[plano]
}

// Fronteira do dia em UTC  mesma ressalva de `inicioDoMesAtual`: vira o dia algumas horas
// antes/depois do horário de Brasília (BRT = UTC-3). Aceitável pra um teto de trial gratuito.
function inicioDoDiaAtual(): string {
  const agora = new Date()
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate())).toISOString()
}

/**
 * Mesma lógica de `verificarLimiteMensal`, mas com corte em início do dia  só deve ser chamada
 * quando `obterLimiteDiario(plano)` retornar um número (hoje, só para o plano "gratis").
 */
export async function verificarLimiteDiario(
  supabase: SupabaseClient,
  usuarioId: string,
  plano: Plano
): Promise<LimiteResultado> {
  const limite = obterLimiteDiario(plano) ?? Infinity

  const { count, error } = await supabase
    .from("atividade_geracoes")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .gte("criado_em", inicioDoDiaAtual())

  // Fail-closed (ver mesma lógica e justificativa em verificarLimiteMensal).
  if (error) {
    console.error("[verificarLimiteDiario] falha ao contar gerações:", error)
    return { atingiu: true, usadas: limite, limite }
  }

  const usadas = count ?? 0
  return { atingiu: usadas >= limite, usadas, limite }
}

// Teto diário pra regenerar questão avulsa (botão "Regerar" no editor, ver
// app/api/questoes/regenerar/route.ts)  cota PRÓPRIA e independente da cota de "atividades
// novas" acima: cada chamada aqui custa uma questão só (bem mais barato que uma atividade
// inteira), mas antes deste teto a rota não tinha NENHUM limite, então um script autenticado
// podia chamá-la em loop sem restrição. Todo plano tem entrada aqui (ao contrário de
// LIMITE_DIARIO_POR_PLANO, que só existe pro trial gratuito).
const LIMITE_REGENERACAO_QUESTAO_DIARIO_POR_PLANO: Record<Plano, number> = {
  gratis: 2,
  basico: 10,
  premium: 20,
}

export function obterLimiteRegeneracaoQuestaoDiario(plano: Plano): number {
  return LIMITE_REGENERACAO_QUESTAO_DIARIO_POR_PLANO[plano]
}

const LIMITE_REGENERACAO_QUESTAO_MENSAL_POR_PLANO: Partial<Record<Plano, number>> = {
  basico: 150,
  premium: 300,
}

export function obterLimiteRegeneracaoQuestaoMensal(plano: Plano): number | undefined {
  return LIMITE_REGENERACAO_QUESTAO_MENSAL_POR_PLANO[plano]
}

export interface ReservaRegeneracaoQuestaoResultado {
  permitido: boolean
  usadas: number
  /** Contagem do mês corrente  antes desta correção o teto mensal (`obterLimiteRegeneracaoQuestaoMensal`)
   *  era só decorativo: só o diário era checado de fato (achado F3 da auditoria de segurança de
   *  03/08/2026). Agora o RPC checa os dois na mesma transação. */
  usadasMensal: number
}

/**
 * Checa e grava numa única chamada atômica (função Postgres `reservar_regeneracao_questao`, ver
 * supabase/migrations/20260803000000_deriva_limite_no_servidor_e_cota_mensal_regeneracao.sql) 
 * mesmo padrão de `reservarBuscaVestibular`: não tem "cancelar", o uso conta assim que a chamada
 * é decidida, mesmo que a geração com IA falhe depois.
 *
 * Não recebe `plano`/`limite` como parâmetro do RPC pelo mesmo motivo de `reservarGeracao`  a
 * função deriva tudo de `assinaturas` internamente (achado F2 da mesma auditoria).
 */
export async function reservarRegeneracaoQuestao(supabase: SupabaseClient, usuarioId: string): Promise<ReservaRegeneracaoQuestaoResultado> {
  const { data, error } = await supabase.rpc("reservar_regeneracao_questao", { p_usuario_id: usuarioId }).single()

  // Fail-closed (ver mesma lógica em reservarGeracao).
  if (error || !data) {
    console.error("[reservarRegeneracaoQuestao] falha ao reservar cota:", error)
    return { permitido: false, usadas: 0, usadasMensal: 0 }
  }

  const resultado = data as { permitido: boolean; usadas: number; usadas_mes: number }
  return { permitido: resultado.permitido, usadas: resultado.usadas, usadasMensal: resultado.usadas_mes }
}

// Teto diário pra pré-processar arquivo de referência (`/api/arquivo-referencia/preparar`) 
// cota PRÓPRIA, separada da de "regenerar questão avulsa" acima. As duas foram compartilhadas
// numa primeira versão da correção do achado F1 (auditoria de 03/08/2026), mas o padrão de uso é
// diferente: pré-processamento roda automaticamente 1x por upload de arquivo no assistente de
// criação (atividade/prova/plano de aula), não é um clique repetido do usuário como "Regerar" 
// compartilhar o mesmo balde deixava pouca sobra pro uso normal de ambas as features juntas.
const LIMITE_PREPROCESSAMENTO_ARQUIVO_DIARIO_POR_PLANO: Record<Plano, number> = {
  gratis: 5,
  basico: 30,
  premium: 60,
}

export function obterLimitePreprocessamentoArquivoDiario(plano: Plano): number {
  return LIMITE_PREPROCESSAMENTO_ARQUIVO_DIARIO_POR_PLANO[plano]
}

export interface ReservaPreprocessamentoArquivoResultado {
  permitido: boolean
  usadas: number
}

/**
 * Checa e grava numa única chamada atômica (função Postgres `reservar_preprocessamento_arquivo`,
 * ver supabase/migrations/20260803000000_deriva_limite_no_servidor_e_cota_mensal_regeneracao.sql)
 *  mesmo padrão de `reservarRegeneracaoQuestao`, incluindo derivar o plano internamente a partir
 * de `assinaturas` em vez de receber o limite por parâmetro (achado F2 da auditoria de segurança
 * de 03/08/2026).
 */
export async function reservarPreprocessamentoArquivo(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<ReservaPreprocessamentoArquivoResultado> {
  const { data, error } = await supabase.rpc("reservar_preprocessamento_arquivo", { p_usuario_id: usuarioId }).single()

  // Fail-closed (ver mesma lógica em reservarGeracao).
  if (error || !data) {
    console.error("[reservarPreprocessamentoArquivo] falha ao reservar cota:", error)
    return { permitido: false, usadas: 0 }
  }

  const resultado = data as { permitido: boolean; usadas: number }
  return { permitido: resultado.permitido, usadas: resultado.usadas }
}
