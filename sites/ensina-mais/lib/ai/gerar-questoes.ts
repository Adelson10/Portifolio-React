import { GoogleGenAI, Type, type Content } from "@google/genai"
import OpenAI from "openai"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { ArquivoReferencia } from "./extrair-conteudo-arquivo"
import { obterSystemInstruction, REGRAS_BASE_VESTIBULAR, SYSTEM_INSTRUCTION_BUSCA_VESTIBULAR, NIVEL_ENSINO_LABEL, type TipoConteudo } from "./gemini-prompt"
import { obterCacheDeReferencia, invalidarCache } from "./gemini-document-cache"
import { extrairTextoCompletoPdf } from "./filtrar-paginas-pdf"
import { withRetry, ehErroDeSobrecarga } from "./gemini-retry"
import { withRetryOpenAI } from "./openai-retry"
import { paraJsonSchemaOpenAI, parsearJsonOpenAI, verificarRespostaTruncada } from "./openai-schema"
import { logUsoTokens, logUsoTokensOpenAI } from "./log-uso-tokens"

export { ehErroDeSobrecarga }

export type QuestaoTipo = "multipla-escolha" | "dissertativo" | "verdade-falso" | "completar-lacunas" | "matematica" | "assercoes-multiplas"

// Fonte única pras rotas de geração/regeneração validarem input do cliente antes de gravar no
// banco e mandar pro prompt da IA  evita que uma rota valide e a outra esqueça (era o caso antes:
// só /api/questoes/regenerar validava `tipo`, /api/atividades/gerar aceitava qualquer string).
export const TIPOS_QUESTAO_VALIDOS: QuestaoTipo[] = ["multipla-escolha", "dissertativo", "verdade-falso", "completar-lacunas", "matematica", "assercoes-multiplas"]
// Mesmos valores do <select id="dificuldade"> em components/atividades/steps/step-config.tsx.
export const DIFICULDADES_VALIDAS = ["facil", "medio", "dificil", "extremo", "superior", "pos"] as const
// Mesmo teto do <select id="quantidade"> em components/atividades/steps/step-config.tsx (1 a 25).
export const QUANTIDADE_QUESTOES_MAXIMA = 25

export interface QuestaoGerada {
  tipo: QuestaoTipo
  enunciado: string
  opcoes?: string[]
  afirmativas?: string[]
  gabarito: string
  numeroLinhas?: number
}

export interface QuestoesGeradas {
  questoes: QuestaoGerada[]
  tituloSugerido?: string
}

interface GerarQuestoesParams {
  /** "google" (Gemini) ou "openai"  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura).
   *  No provider "openai" o cache de contexto (`cache`/`cachedContentName` abaixo) e a busca
   *  vestibular via grounding do Google são ignorados  ver `gerarQuestoesOpenAI`. */
  provider: "google" | "openai"
  modelo: string
  /** API key do provedor a usar  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura). */
  apiKey: string
  /** Teto de tokens de saída  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura). */
  maxOutputTokens?: number
  /** "atividade" (padrão) ou "prova"  escolhe a persona/system instruction e ajusta o
   *  fraseado do prompt (ver `gemini-prompt.ts`). Provas usam uma persona mais rigorosa,
   *  de banca examinadora, além de reforçar a exigência de raciocínio no próprio prompt. */
  tipoConteudo?: TipoConteudo
  /** Tema digitado pelo usuário  opcional quando há `arquivoReferencia` (o arquivo define o tema). */
  tema?: string
  quantidade: number
  tipos: string[]
  dificuldade: string
  nivelEnsino?: string
  /** Série/ano (ex.: "3º Ano") ou período (ex.: "5º Período") da turma  exclusivos entre si. */
  serieOuPeriodo?: string
  /** Componente curricular/disciplina da turma (ex.: "Matemática")  nome da turma no banco. */
  disciplina?: string
  /** Arquivo de orientação/referência anexado pelo usuário (opcional). */
  arquivoReferencia?: ArquivoReferencia | null
  /** Cliente Supabase + usuário  habilita o cache de contexto do Gemini. Junto de
   *  `arquivoReferencia`, cria/reaproveita um cache pra esse arquivo. Sozinho (sem
   *  `arquivoReferencia`), só é usado pra invalidar `cachedContentName` se o Gemini o rejeitar. */
  cache?: { supabase: SupabaseClient; usuarioId: string }
  /** Nome de um cache de contexto do Gemini já resolvido pelo chamador (ex.: reaproveitado do
   *  hash gravado na atividade, ao regenerar uma questão avulsa muito depois da geração original
   *   sem o arquivo em mãos pra criar um novo). Pula `obterCacheDeReferencia` inteiramente. */
  cachedContentName?: string
  /** Enunciados de questões já existentes na atividade  pede pra não repetir esses temas/abordagens.
   *  Usado ao regenerar uma única questão avulsa no editor, pra não sair igual a alguma já presente. */
  evitarTemas?: string[]
  /** Quando `true`, roda uma etapa extra de busca no Google (ver `buscarQuestoesReaisNaInternet`)
   *  pra puxar questões reais do ENEM e dos principais vestibulares/concursos sobre o tema, e
   *  usá-las (com fonte citada) como base da geração em vez de questões 100% originais. */
  usarBaseVestibular?: boolean
}

const PROVAS_VESTIBULAR_ESCOPO = [
  "ENEM",
  "Fuvest",
  "Unicamp (Comvest)",
  "UFRGS",
  "UERJ",
  "PUC",
  "ITA",
  "IME",
  "concursos públicos técnicos relevantes ao tema",
]

/**
 * Etapa 1 (opcional, só quando `usarBaseVestibular`): pesquisa no Google, via grounding
 * nativo do Gemini, questões reais já aplicadas no ENEM/vestibulares sobre o tema pedido.
 * Roda numa chamada separada da geração final porque a API do Gemini não permite combinar
 * `tools` (grounding) com `responseMimeType`/`responseSchema` (saída JSON estruturada) na
 * mesma chamada. Falha silenciosamente (retorna `null`) em qualquer erro  a etapa 2 sempre
 * consegue gerar questões originais mesmo sem material real encontrado.
 */
async function buscarQuestoesReaisNaInternet(ai: GoogleGenAI, params: GerarQuestoesParams): Promise<string | null> {
  const { tema, quantidade, tipos, dificuldade, nivelEnsino, serieOuPeriodo, disciplina } = params
  const nivelLabel = nivelEnsino ? NIVEL_ENSINO_LABEL[nivelEnsino] ?? nivelEnsino : null
  const dificuldadeLabel = DIFICULDADE_LABEL[dificuldade] ?? dificuldade
  const disciplinaLimpa = disciplina?.trim()

  const prompt = [
    `Pesquise questões reais já aplicadas em provas oficiais sobre o tema: "${tema?.trim()}".`,
    `Provas a considerar: ${PROVAS_VESTIBULAR_ESCOPO.join(", ")}.`,
    `Tipos de questão de interesse: ${tipos.map((t) => TIPO_LABEL[t] ?? t).join(", ")}.`,
    `Nível de dificuldade desejado: ${dificuldadeLabel}.`,
    disciplinaLimpa ? `Componente curricular/disciplina: ${disciplinaLimpa}.` : null,
    nivelLabel ? `Nível de ensino: ${nivelLabel}.` : null,
    serieOuPeriodo ? `Série/ano ou período: ${serieOuPeriodo}.` : null,
    `Busque até ${Math.min(quantidade, 15)} questões reais e relevantes. Se não encontrar nenhuma questão real sobre esse tema específico, diga apenas "NENHUMA QUESTÃO ENCONTRADA"  não invente.`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n")

  try {
    const inicio = new Date()
    const response = await ai.models.generateContent({
      model: params.modelo,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BUSCA_VESTIBULAR,
        tools: [{ googleSearch: {} }],
        ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
      },
    })
    // Grounding (Google Search) é cobrado por requisição, não por token  o custo estimado do
    // helper abaixo NÃO inclui essa taxa extra, só serve pra ver o volume de tokens de texto.
    logUsoTokens("buscarQuestoesReaisNaInternet (grounding)", params.modelo, response.usageMetadata, inicio)
    const texto = response.text?.trim()
    if (!texto || /NENHUMA QUESTÃO ENCONTRADA/i.test(texto)) return null
    return texto
  } catch {
    // Busca é um "bônus"  se falhar (rate limit, indisponibilidade etc.), a geração
    // segue normalmente na etapa 2 sem material real, sem quebrar a experiência do usuário.
    return null
  }
}

const TIPO_LABEL: Record<string, string> = {
  "multipla-escolha": "múltipla escolha (5 alternativas, uma correta)",
  "dissertativo": "dissertativa (resposta em texto livre)",
  "verdade-falso": "verdadeiro ou falso",
  "completar-lacunas": "completar lacunas",
  "matematica": "problema matemático (com fórmulas e resolução passo a passo)",
  "assercoes-multiplas": "asserções múltiplas (afirmativas numeradas em romano + alternativas que julgam combinações delas)",
}

const DIFICULDADE_LABEL: Record<string, string> = {
  facil: "fácil",
  medio: "médio",
  dificil: "difícil",
  extremo: "extremo (alta complexidade, múltiplos passos de raciocínio)",
  superior: "nível superior (graduação)",
  pos: "pós-graduação (rigor acadêmico, discussão crítica)",
}

/**
 * Distribui `quantidade` questões entre os `tipos` escolhidos o mais equilibradamente
 * possível (ex.: 10 questões / 3 tipos → 4/3/3), para o prompt não deixar a cargo do
 * modelo decidir a proporção e sub-representar algum tipo.
 */
function distribuirTipos(quantidade: number, tipos: string[]): string {
  const base = Math.floor(quantidade / tipos.length)
  const resto = quantidade % tipos.length
  return tipos
    .map((tipo, i) => {
      const n = base + (i < resto ? 1 : 0)
      return `${n}x ${TIPO_LABEL[tipo] ?? tipo}`
    })
    .join(", ")
}

/** Linha de abertura do prompt  muda de fraseado quando o material de referência já está no
 *  contexto via cache (não precisa ser reintroduzido) em vez de anexado na própria mensagem. */
function montarLinhaTema(temaLimpo: string | undefined, materialViaCache: boolean, tipoConteudo: TipoConteudo): string {
  const substantivo = tipoConteudo === "prova" ? "uma prova escolar completa" : "uma atividade escolar completa"
  if (temaLimpo) return `Crie ${substantivo} sobre o tema: "${temaLimpo}".`
  return materialViaCache
    ? `Crie ${substantivo} com base no material de referência já compartilhado nesta conversa (não há tema digitado pelo usuário).`
    : `Crie ${substantivo} com base no arquivo de referência anexado (não há tema digitado pelo usuário).`
}

function montarBlocoParametros({ quantidade, tipos, dificuldade, nivelEnsino, serieOuPeriodo, disciplina, evitarTemas, tipoConteudo }: GerarQuestoesParams): string[] {
  const nivelLabel = nivelEnsino ? NIVEL_ENSINO_LABEL[nivelEnsino] ?? nivelEnsino : null
  const dificuldadeLabel = DIFICULDADE_LABEL[dificuldade] ?? dificuldade
  const disciplinaLimpa = disciplina?.trim()
  return [
    `Parâmetros:`,
    `- Quantidade total de questões: exatamente ${quantidade}.`,
    `- Distribuição obrigatória por tipo: ${distribuirTipos(quantidade, tipos)}.`,
    `- Nível de dificuldade: ${dificuldadeLabel}.`,
    tipoConteudo === "prova"
      ? `- Mesmo sendo nível "${dificuldadeLabel}", trate isto como uma prova formal: eleve o rigor e a exigência de raciocínio em relação a uma atividade de sala comum do mesmo nível  este material vai valer nota.`
      : null,
    disciplinaLimpa ? `- Componente curricular/disciplina: ${disciplinaLimpa}.` : null,
    nivelLabel ? `- Nível de ensino da turma: ${nivelLabel}.` : null,
    serieOuPeriodo ? `- Série/ano ou período da turma: ${serieOuPeriodo}.` : null,
    evitarTemas?.length
      ? [`- Evite repetir os temas/abordagens das questões já existentes nesta atividade:`, ...evitarTemas.map((e) => `  - ${e}`)].join("\n")
      : null,
  ].filter((linha): linha is string => linha !== null)
}

/** Bloco com o material real pesquisado (etapa 1) + as regras de como usá-lo  `null` quando
 *  `usarBaseVestibular` não achou nada (ou não foi pedido), e nesse caso não aparece no prompt. */
function montarBlocoVestibular(materialVestibular: string | null): string | null {
  if (!materialVestibular) return null
  return [``, REGRAS_BASE_VESTIBULAR, ``, `"""\n${materialVestibular}\n"""`].join("\n")
}

/**
 * `textoPdfExtraido` só é passado pelo caminho OpenAI (`gerarQuestoesOpenAI`)  o Gemini anexa o
 * PDF nativo via `inlineData` (ver `montarContents`), bem mais barato lá (~258 tokens/página) do
 * que o texto extraído custaria como tokens de prompt. Sem esse parâmetro, o PDF vira só uma
 * linha avisando que o arquivo está anexado "nesta mensagem" (usado pelo Gemini).
 */
function montarPrompt(params: GerarQuestoesParams, materialVestibular: string | null, textoPdfExtraido?: string | null): string {
  const { tema, arquivoReferencia, tipoConteudo = "atividade" } = params
  const temaLimpo = tema?.trim()

  return [
    montarLinhaTema(temaLimpo, false, tipoConteudo),
    arquivoReferencia?.tipo === "texto"
      ? `\nMaterial de referência/orientação anexado pelo usuário:\n"""\n${arquivoReferencia.texto}\n"""`
      : arquivoReferencia?.tipo === "pdf"
        ? textoPdfExtraido
          ? `\nMaterial de referência/orientação extraído do PDF anexado pelo usuário:\n"""\n${textoPdfExtraido}\n"""`
          : `\nHá também um arquivo PDF de referência/orientação anexado nesta mensagem  use-o como base.`
        : null,
    montarBlocoVestibular(materialVestibular),
    ``,
    ...montarBlocoParametros(params),
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n")
}

/** Mesmo prompt de `montarPrompt`, mas sem embutir o material de referência  usado quando o
 *  material já está disponível via cache de contexto do Gemini (ver `gemini-document-cache.ts`). */
function montarPromptComCache(params: GerarQuestoesParams, materialVestibular: string | null): string {
  return [
    montarLinhaTema(params.tema?.trim(), true, params.tipoConteudo ?? "atividade"),
    montarBlocoVestibular(materialVestibular),
    ``,
    ...montarBlocoParametros(params),
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n")
}

function montarContents(params: GerarQuestoesParams, materialVestibular: string | null): string | Content[] {
  const promptTexto = montarPrompt(params, materialVestibular)
  if (params.arquivoReferencia?.tipo !== "pdf") return promptTexto

  return [
    {
      role: "user",
      parts: [{ text: promptTexto }, { inlineData: { mimeType: "application/pdf", data: params.arquivoReferencia.base64 } }],
    },
  ]
}

/** Parâmetros de geração comuns às duas variantes de chamada (com e sem cache)  só o
 *  `contents` e a origem da instrução de sistema (`systemInstruction` vs `cachedContent`) mudam. */
const GERACAO_CONFIG = {
  temperature: 0.8,
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      tituloSugerido: {
        type: Type.STRING,
        description: "Preencher apenas quando não houver tema explícito  título curto deduzido do arquivo de referência.",
      },
      questoes: {
        type: Type.ARRAY,
        description: "Lista de questões geradas, respeitando exatamente a quantidade e a distribuição por tipo pedidas.",
        items: {
          type: Type.OBJECT,
          properties: {
            tipo: {
              type: Type.STRING,
              enum: ["multipla-escolha", "dissertativo", "verdade-falso", "completar-lacunas", "matematica", "assercoes-multiplas"],
              description: "Tipo da questão  deve bater com a distribuição pedida no prompt.",
            },
            enunciado: {
              type: Type.STRING,
              description: "Texto da pergunta. Para completar-lacunas, use \"_____\" em cada lacuna.",
            },
            opcoes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Multipla-escolha: exatamente 5 alternativas. Assercoes-multiplas: 4 a 5 alternativas, cada uma julgando uma combinação das afirmativas (ex.: \"As afirmativas I, II e III estão corretas\").",
            },
            afirmativas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Só para assercoes-multiplas: de 3 a 5 afirmativas a serem julgadas (texto de cada uma, sem o numeral romano  ele é adicionado na renderização).",
            },
            gabarito: {
              type: Type.STRING,
              description:
                "Resposta correta. Múltipla escolha e assercoes-multiplas: texto exato da alternativa certa (em opcoes). Verdade-falso: \"Verdadeiro\" ou \"Falso\". Dissertativo: resposta modelo completa. Completar-lacunas: respostas na ordem das lacunas, separadas por vírgula. Matemática: resolução passo a passo até o resultado final.",
            },
            numeroLinhas: {
              type: Type.INTEGER,
              description: "Para dissertativo (3 a 6) ou matematica (4 a 8): quantidade sugerida de linhas para resposta/cálculo.",
            },
          },
          required: ["tipo", "enunciado", "gabarito"],
        },
      },
    },
    required: ["questoes"],
  },
}

/** Equivalente a `buscarQuestoesReaisNaInternet`, mas usando o tool `web_search` nativo da
 *  Responses API da OpenAI em vez do grounding do Google usado no provider "google". Mesmo
 *  contrato: melhor esforço, nunca lança  qualquer falha (rede, indisponibilidade) devolve
 *  `null` e a etapa 2 segue gerando questões originais normalmente. */
async function buscarQuestoesReaisNaInternetOpenAI(openai: OpenAI, params: GerarQuestoesParams): Promise<string | null> {
  const { tema, quantidade, tipos, dificuldade, nivelEnsino, serieOuPeriodo, disciplina } = params
  const nivelLabel = nivelEnsino ? NIVEL_ENSINO_LABEL[nivelEnsino] ?? nivelEnsino : null
  const dificuldadeLabel = DIFICULDADE_LABEL[dificuldade] ?? dificuldade
  const disciplinaLimpa = disciplina?.trim()

  const prompt = [
    `Pesquise questões reais já aplicadas em provas oficiais sobre o tema: "${tema?.trim()}".`,
    `Provas a considerar: ${PROVAS_VESTIBULAR_ESCOPO.join(", ")}.`,
    `Tipos de questão de interesse: ${tipos.map((t) => TIPO_LABEL[t] ?? t).join(", ")}.`,
    `Nível de dificuldade desejado: ${dificuldadeLabel}.`,
    disciplinaLimpa ? `Componente curricular/disciplina: ${disciplinaLimpa}.` : null,
    nivelLabel ? `Nível de ensino: ${nivelLabel}.` : null,
    serieOuPeriodo ? `Série/ano ou período: ${serieOuPeriodo}.` : null,
    `Busque até ${Math.min(quantidade, 15)} questões reais e relevantes. Se não encontrar nenhuma questão real sobre esse tema específico, diga apenas "NENHUMA QUESTÃO ENCONTRADA"  não invente.`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n")

  try {
    const inicio = new Date()
    const response = await openai.responses.create({
      model: params.modelo,
      instructions: SYSTEM_INSTRUCTION_BUSCA_VESTIBULAR,
      input: prompt,
      tools: [{ type: "web_search" }],
      max_output_tokens: params.maxOutputTokens,
      reasoning: { effort: "low" },
    })
    // Igual ao grounding do Gemini: web search é cobrado à parte (por chamada, não por token) 
    // o custo estimado pelo helper abaixo não inclui essa taxa extra.
    logUsoTokensOpenAI("buscarQuestoesReaisNaInternet (web_search)", params.modelo, response.usage, inicio)
    const texto = response.output_text?.trim()
    if (!texto || /NENHUMA QUESTÃO ENCONTRADA/i.test(texto)) return null
    return texto
  } catch {
    return null
  }
}

/**
 * Caminho "openai" de `gerarQuestoes`  usado pelo plano premium (ver `model-por-plano.ts`).
 * Sem cache de contexto próprio: a OpenAI faz cache automático de prefixos repetidos (sem API pra
 * gerenciar, ao contrário do `cachedContent` do Gemini), mas isso só ajuda em chamadas repetidas
 * com o MESMO prompt  não reduz o custo da primeira geração de cada arquivo/tema novo.
 *
 * PDF de referência entra como texto extraído (`extrairTextoCompletoPdf`), nunca como anexo
 * nativo (`input_file`): testamos anexo nativo com `detail: "low"` e o número de tokens de entrada
 * não caiu nada  a Responses API aparentemente não respeita `detail` em blocos `input_file`, só
 * em `input_image`. Texto extraído evita esse custo de imagem por página inteiramente.
 */
async function gerarQuestoesOpenAI(params: GerarQuestoesParams): Promise<QuestoesGeradas> {
  const openai = new OpenAI({ apiKey: params.apiKey })
  const tipoConteudo = params.tipoConteudo ?? "atividade"

  const materialVestibular =
    params.usarBaseVestibular && params.tema?.trim()
      ? await buscarQuestoesReaisNaInternetOpenAI(openai, params)
      : null

  const textoPdfExtraido =
    params.arquivoReferencia?.tipo === "pdf" ? await extrairTextoCompletoPdf(params.arquivoReferencia.base64) : null

  const promptTexto = montarPrompt(params, materialVestibular, textoPdfExtraido)

  const inicio = new Date()
  const response = await withRetryOpenAI(() =>
    openai.responses.create({
      model: params.modelo,
      instructions: obterSystemInstruction(tipoConteudo),
      input: promptTexto,
      max_output_tokens: params.maxOutputTokens,
      // Sem isso, o modelo usa o esforço de raciocínio padrão (que nos testes gastou mais da
      // metade da saída em "pensamento" e é a causa mais provável do time-to-first-token de ~80s
      // que vimos em benchmark pra modelos GPT-5 em modo "high")  "low" corta latência e tokens
      // de raciocínio; ajustar pra cima se a qualidade do conteúdo gerado cair perceptivelmente.
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: "questoes_geradas",
          schema: paraJsonSchemaOpenAI(GERACAO_CONFIG.responseSchema),
          strict: true,
        },
      },
    })
  )

  logUsoTokensOpenAI("gerarQuestoes", params.modelo, response.usage, inicio)
  verificarRespostaTruncada(response)

  const texto = response.output_text
  if (!texto) throw new Error("A IA não retornou conteúdo")

  const parsed = parsearJsonOpenAI<QuestoesGeradas>(texto)
  if (!parsed.questoes?.length) throw new Error("A IA não retornou nenhuma questão")

  return parsed
}

export async function gerarQuestoes(params: GerarQuestoesParams): Promise<QuestoesGeradas> {
  if (!params.tema?.trim() && !params.arquivoReferencia) {
    throw new Error("É necessário um tema ou um arquivo de referência")
  }

  if (params.provider === "openai") return gerarQuestoesOpenAI(params)

  const ai = new GoogleGenAI({ apiKey: params.apiKey })
  const tipoConteudo = params.tipoConteudo ?? "atividade"

  // Etapa 1 (opcional): busca questões reais do ENEM/vestibulares antes da geração final 
  // só faz sentido com um tema explícito pra pesquisar (sem tema, não há o que buscar).
  const materialVestibular =
    params.usarBaseVestibular && params.tema?.trim()
      ? await buscarQuestoesReaisNaInternet(ai, params)
      : null

  const chamarSemCache = () => ai.models.generateContent({
    model: params.modelo,
    contents: montarContents(params, materialVestibular),
    config: {
      systemInstruction: obterSystemInstruction(tipoConteudo),
      ...GERACAO_CONFIG,
      ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
    },
  })

  // Cache de contexto do Gemini para o material anexado  evita reenviar o documento inteiro.
  // Duas origens possíveis: (1) `cachedContentName` já resolvido pelo chamador (ex.: hash gravado
  // na atividade, reaproveitado ao regenerar uma questão avulsa sem o arquivo em mãos); ou (2)
  // criado/reaproveitado aqui mesmo a partir de `arquivoReferencia` + `cache` (route.ts opta por
  // habilitar). `obterCacheDeReferencia` falha silenciosamente (retorna null) quando o documento é
  // pequeno demais para o mínimo exigido pela API, a cota estourou etc.
  const cache = params.cache
  const cachedContentName = params.cachedContentName ?? (
    params.arquivoReferencia && cache
      ? await obterCacheDeReferencia(ai, params.arquivoReferencia, params.modelo, cache.supabase, cache.usuarioId, tipoConteudo)
      : null
  )

  const inicio = new Date()
  let response
  if (cachedContentName) {
    try {
      response = await withRetry(() => ai.models.generateContent({
        model: params.modelo,
        contents: montarPromptComCache(params, materialVestibular),
        config: {
          cachedContent: cachedContentName,
          ...GERACAO_CONFIG,
          ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
        },
      }))
    } catch {
      // O cache pode ter expirado/sido removido do lado do Gemini antes do previsto 
      // descarta o registro (quando temos como) e tenta uma vez com o material inline.
      if (cache) await invalidarCache(cache.supabase, cache.usuarioId, cachedContentName)
      response = await withRetry(chamarSemCache)
    }
  } else {
    response = await withRetry(chamarSemCache)
  }

  logUsoTokens("gerarQuestoes", params.modelo, response.usageMetadata, inicio)

  const texto = response.text
  if (!texto) throw new Error("A IA não retornou conteúdo")

  // responseMimeType+responseSchema já forçam JSON puro, mas removemos eventuais
  // cercas de código (```json ... ```) como salvaguarda contra desvios do modelo.
  const jsonLimpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")

  const parsed = JSON.parse(jsonLimpo) as QuestoesGeradas
  if (!parsed.questoes?.length) throw new Error("A IA não retornou nenhuma questão")

  return parsed
}
