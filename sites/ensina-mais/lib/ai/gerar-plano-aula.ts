import { GoogleGenAI, Type, type Content } from "@google/genai"
import OpenAI from "openai"
import type { ArquivoReferencia } from "./extrair-conteudo-arquivo"
import { SYSTEM_INSTRUCTION_PLANO_AULA, NIVEL_ENSINO_LABEL } from "./gemini-prompt"
import { extrairTextoCompletoPdf } from "./filtrar-paginas-pdf"
import { withRetry } from "./gemini-retry"
import { withRetryOpenAI } from "./openai-retry"
import { paraJsonSchemaOpenAI, parsearJsonOpenAI, verificarRespostaTruncada } from "./openai-schema"
import { logUsoTokens, logUsoTokensOpenAI } from "./log-uso-tokens"

// Mesmo teto do <select id="duracaoMinutos"> em components/plano-de-aula/step-config.tsx (DURACOES).
export const DURACAO_MINUTOS_MAXIMA = 120

export interface PlanoAulaGerado {
  tituloSugerido?: string
  duracaoMinutos: number
  objetivoGeral?: string
  objetivosEspecificos?: string[]
  habilidadesBNCC?: string[]
  competencias?: string[]
  conteudo?: string
  metodologia?: string
  recursos?: string[]
  atividadesPropostas?: string[]
  avaliacao?: string
  adaptacoes?: string
  tarefaCasa?: string
  referencias?: string[]
}

interface GerarPlanoAulaParams {
  /** "google" (Gemini) ou "openai"  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura). */
  provider: "google" | "openai"
  modelo: string
  /** API key do provedor a usar  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura). */
  apiKey: string
  /** Teto de tokens de saída do plano  ver `lib/ai/model-por-plano.ts` (varia por plano de assinatura). */
  maxOutputTokens?: number
  /** Tema digitado pelo usuário  opcional quando há `arquivoReferencia` (o arquivo define o tema). */
  tema?: string
  /** Componente curricular/disciplina (ex.: "Matemática")  opcional, texto livre. */
  disciplina?: string
  /** Data da aula no formato ISO (yyyy-mm-dd)  opcional. */
  dataAula?: string
  duracaoMinutos: number
  /** "expositiva" | "pratica" | "grupo" | "tecnologia" | "invertida" | "revisao" (ver `FORMATO_AULA_LABEL`). */
  formatoAula: string
  /** Subconjunto de "objetivos" | "habilidadesBNCC" | "competencias" | "conteudo" | "metodologia" |
   *  "recursos" | "atividadesPropostas" | "avaliacao" | "adaptacoes" | "tarefaCasa" | "referencias" 
   *  só as seções marcadas no step de configuração entram no schema e no plano gerado. */
  secoes: string[]
  nivelEnsino?: string
  /** Série/ano (ex.: "3º Ano") ou período (ex.: "5º Período") da turma  exclusivos entre si. */
  serieOuPeriodo?: string
  /** Arquivo de orientação/referência anexado pelo usuário (opcional). */
  arquivoReferencia?: ArquivoReferencia | null
}

const FORMATO_AULA_LABEL: Record<string, string> = {
  expositiva: "aula expositiva (explicação direta do professor)",
  pratica: "aula prática/laboratório (mão na massa)",
  grupo: "aula em grupo (trabalho colaborativo entre alunos)",
  tecnologia: "aula com uso de tecnologia (recursos digitais)",
  invertida: "sala de aula invertida (alunos estudam antes, aula é aplicação/discussão)",
  revisao: "aula de revisão (retomada e consolidação de conteúdo)",
}

const SECAO_LABEL: Record<string, string> = {
  objetivos: "Objetivos de aprendizagem (geral e específicos)",
  habilidadesBNCC: "Habilidades (BNCC)",
  competencias: "Competências",
  conteudo: "Conteúdo/tema abordado",
  metodologia: "Metodologia (desenvolvimento da aula)",
  recursos: "Recursos didáticos",
  atividadesPropostas: "Atividades propostas",
  avaliacao: "Avaliação",
  adaptacoes: "Adaptações para alunos com necessidades específicas",
  tarefaCasa: "Tarefa de casa",
  referencias: "Referências bibliográficas e materiais de apoio",
}

/** Schema (por seção) de cada campo opcional do plano  só entra na chamada ao Gemini quando a
 *  seção correspondente foi marcada no step de configuração (ver `montarResponseSchema`).
 *  "objetivos" é caso especial (vira duas properties  `objetivoGeral` e `objetivosEspecificos` 
 *  em vez de uma), por isso não aparece neste mapa (ver `montarResponseSchema`). */
const SECAO_SCHEMA: Record<string, { type: typeof Type.STRING | typeof Type.ARRAY; description: string }> = {
  habilidadesBNCC: {
    type: Type.ARRAY,
    description: "Lista de habilidades da BNCC (Base Nacional Comum Curricular) trabalhadas na aula. Cite o código oficial (ex.: \"EF67LP08\") apenas quando tiver certeza de que ele existe e corresponde exatamente à habilidade e ao nível de ensino informados; caso contrário, descreva a habilidade em texto corrido, sem código  nunca invente ou aproxime um código.",
  },
  competencias: {
    type: Type.ARRAY,
    description: "Lista das competências (gerais da BNCC e/ou específicas do componente curricular) desenvolvidas nesta aula, relacionando cada uma ao tema tratado.",
  },
  conteudo: {
    type: Type.STRING,
    description: "Desenvolvimento real do conteúdo a ser ensinado (conceitos, definições, exemplos, dados) em vários parágrafos  não apenas o nome do tema. Deve ter substância suficiente para servir de material de apoio ao professor durante a aula.",
  },
  metodologia: {
    type: Type.STRING,
    description: "Desenvolvimento da aula passo a passo, dividido em etapas com tempo estimado cada uma (a soma deve bater com a duração total da aula), detalhando o que o professor e os alunos fazem em cada etapa  não apenas nomear as etapas.",
  },
  recursos: {
    type: Type.ARRAY,
    description: "Lista completa e específica de recursos/materiais didáticos necessários, condizentes com o formato de aula.",
  },
  atividadesPropostas: {
    type: Type.ARRAY,
    description: "Lista de atividades/exercícios concretos a serem realizados pelos alunos durante a aula (ex.: exercícios práticos, estudos de caso, dinâmicas)  diferente da metodologia (que narra o passo a passo da aula) e da tarefa de casa.",
  },
  avaliacao: {
    type: Type.STRING,
    description: "Como a aprendizagem será avaliada, com critérios claros  deve verificar de fato os objetivos propostos, em um ou mais parágrafos.",
  },
  adaptacoes: {
    type: Type.STRING,
    description: "Estratégias e adaptações gerais para alunos com necessidades específicas (deficiências, transtornos de aprendizagem, altas habilidades etc.), como flexibilizações de material, tempo e avaliação  em termos genéricos de boas práticas de inclusão, nunca referindo-se a um aluno específico.",
  },
  tarefaCasa: {
    type: Type.STRING,
    description: "Tarefa de casa proposta, com instruções claras de como deve ser feita.",
  },
  referencias: {
    type: Type.ARRAY,
    description: "Lista de referências bibliográficas e materiais de apoio (livros, artigos, sites, vídeos) coerentes com o tema e o nível de ensino. Só cite uma obra/autor específico quando tiver certeza real de sua existência; caso contrário, prefira indicar o tipo de material de apoio de forma genérica (ex.: \"livro didático adotado pela escola sobre o tema\") a inventar um título ou autor.",
  },
}

function montarResponseSchema(secoes: string[]) {
  const properties: Record<string, unknown> = {
    tituloSugerido: {
      type: Type.STRING,
      description: "Preencher apenas quando não houver tema explícito  título curto deduzido do arquivo de referência.",
    },
    duracaoMinutos: {
      type: Type.INTEGER,
      description: "Duração da aula em minutos  deve bater com o valor informado no prompt.",
    },
  }
  const required = ["duracaoMinutos"]

  if (secoes.includes("objetivos")) {
    properties.objetivoGeral = {
      type: Type.STRING,
      description: "Objetivo geral da aula: uma frase-síntese do que se pretende alcançar, coerente com o tema e o nível de ensino.",
    }
    properties.objetivosEspecificos = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de pelo menos 3 objetivos específicos, claros, mensuráveis (com verbos de ação: identificar, analisar, resolver, comparar etc.) e coerentes com o objetivo geral, cobrindo diferentes aspectos do tema.",
    }
    required.push("objetivoGeral", "objetivosEspecificos")
  }

  for (const secao of secoes) {
    const schema = SECAO_SCHEMA[secao]
    if (!schema) continue
    properties[secao] =
      schema.type === Type.ARRAY
        ? { type: Type.ARRAY, items: { type: Type.STRING }, description: schema.description }
        : { type: Type.STRING, description: schema.description }
    required.push(secao)
  }

  return {
    type: Type.OBJECT,
    properties,
    required,
  }
}

/** `textoPdfExtraido` só é passado pelo caminho OpenAI  ver mesma nota em `gerar-questoes.ts`. */
function montarPrompt(params: GerarPlanoAulaParams, textoPdfExtraido?: string | null): string {
  const { tema, disciplina, dataAula, duracaoMinutos, formatoAula, secoes, nivelEnsino, serieOuPeriodo, arquivoReferencia } = params
  const temaLimpo = tema?.trim()
  const disciplinaLimpa = disciplina?.trim()
  const nivelLabel = nivelEnsino ? NIVEL_ENSINO_LABEL[nivelEnsino] ?? nivelEnsino : null

  return [
    temaLimpo
      ? `Crie um plano de aula completo sobre o tema: "${temaLimpo}".`
      : arquivoReferencia
        ? `Crie um plano de aula completo com base no arquivo de referência anexado (não há tema digitado pelo usuário).`
        : `Crie um plano de aula completo.`,
    arquivoReferencia?.tipo === "texto"
      ? `\nMaterial de referência/orientação anexado pelo usuário:\n"""\n${arquivoReferencia.texto}\n"""`
      : arquivoReferencia?.tipo === "pdf"
        ? textoPdfExtraido
          ? `\nMaterial de referência/orientação extraído do PDF anexado pelo usuário:\n"""\n${textoPdfExtraido}\n"""`
          : `\nHá também um arquivo PDF de referência/orientação anexado nesta mensagem  use-o como base.`
        : null,
    ``,
    `Parâmetros:`,
    disciplinaLimpa ? `- Componente curricular/disciplina: ${disciplinaLimpa}.` : null,
    dataAula ? `- Data da aula: ${dataAula}.` : null,
    `- Duração da aula: ${duracaoMinutos} minutos.`,
    `- Formato da aula: ${FORMATO_AULA_LABEL[formatoAula] ?? formatoAula}.`,
    `- Seções a preencher: ${secoes.map((s) => SECAO_LABEL[s] ?? s).join(", ")}.`,
    nivelLabel ? `- Nível de ensino da turma: ${nivelLabel}.` : null,
    serieOuPeriodo ? `- Série/ano ou período da turma: ${serieOuPeriodo}.` : null,
    `- Importante: ${duracaoMinutos} minutos é uma aula relativamente longa  capriche na extensão e no detalhamento de cada seção pedida (especialmente "conteudo" e "metodologia"). Um plano curto/resumido não serve para o professor usar de fato em sala.`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n")
}

function montarContents(params: GerarPlanoAulaParams): string | Content[] {
  const promptTexto = montarPrompt(params)
  if (params.arquivoReferencia?.tipo !== "pdf") return promptTexto

  return [
    {
      role: "user",
      parts: [{ text: promptTexto }, { inlineData: { mimeType: "application/pdf", data: params.arquivoReferencia.base64 } }],
    },
  ]
}

/**
 * Caminho "openai" de `gerarPlanoAula`. PDF de referência entra como texto extraído
 * (`extrairTextoCompletoPdf`), não como anexo nativo (`input_file`)  anexo nativo com
 * `detail: "low"` não reduziu o número de tokens de entrada em teste real (a Responses API não
 * parece respeitar `detail` em blocos `input_file`, só em `input_image`); ver mesma nota em
 * `gerar-questoes.ts`.
 */
async function gerarPlanoAulaOpenAI(params: GerarPlanoAulaParams): Promise<PlanoAulaGerado> {
  const openai = new OpenAI({ apiKey: params.apiKey })

  const textoPdfExtraido =
    params.arquivoReferencia?.tipo === "pdf" ? await extrairTextoCompletoPdf(params.arquivoReferencia.base64) : null

  const inicio = new Date()
  const response = await withRetryOpenAI(() =>
    openai.responses.create({
      model: params.modelo,
      instructions: SYSTEM_INSTRUCTION_PLANO_AULA,
      input: montarPrompt(params, textoPdfExtraido),
      // Sem `temperature`  modelos da família GPT-5 (reasoning models) rejeitam qualquer valor
      // diferente do padrão (1) com 400 Bad Request. `reasoning.effort: "low"` cumpre um papel
      // parecido (menos tokens de raciocínio = respostas mais rápidas e baratas), sem 400.
      reasoning: { effort: "low" },
      max_output_tokens: params.maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: "plano_aula",
          schema: paraJsonSchemaOpenAI(montarResponseSchema(params.secoes)),
          strict: true,
        },
      },
    })
  )

  logUsoTokensOpenAI("gerarPlanoAula", params.modelo, response.usage, inicio)
  verificarRespostaTruncada(response)

  const texto = response.output_text
  if (!texto) throw new Error("A IA não retornou conteúdo")

  return parsearJsonOpenAI<PlanoAulaGerado>(texto)
}

export async function gerarPlanoAula(params: GerarPlanoAulaParams): Promise<PlanoAulaGerado> {
  if (!params.tema?.trim() && !params.arquivoReferencia) {
    throw new Error("É necessário um tema ou um arquivo de referência")
  }
  if (!params.secoes.length) throw new Error("Selecione ao menos uma seção do plano")

  if (params.provider === "openai") return gerarPlanoAulaOpenAI(params)

  const ai = new GoogleGenAI({ apiKey: params.apiKey })

  const inicio = new Date()
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: params.modelo,
      contents: montarContents(params),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PLANO_AULA,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: montarResponseSchema(params.secoes),
        ...(params.maxOutputTokens ? { maxOutputTokens: params.maxOutputTokens } : {}),
      },
    })
  )

  logUsoTokens("gerarPlanoAula", params.modelo, response.usageMetadata, inicio)

  const texto = response.text
  if (!texto) throw new Error("A IA não retornou conteúdo")

  // responseMimeType+responseSchema já forçam JSON puro, mas removemos eventuais
  // cercas de código (```json ... ```) como salvaguarda contra desvios do modelo.
  const jsonLimpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "")

  return JSON.parse(jsonLimpo) as PlanoAulaGerado
}
