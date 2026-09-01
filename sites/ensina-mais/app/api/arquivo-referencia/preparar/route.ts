import { createServerSupabaseClient } from "@/lib/supabase-server"
import { extrairConteudoArquivo } from "@/lib/ai/extrair-conteudo-arquivo"
import { filtrarPaginasPdf } from "@/lib/ai/filtrar-paginas-pdf"
import { reservarPreprocessamentoArquivo, obterLimitePreprocessamentoArquivoDiario } from "@/lib/atividades/limites"
import { obterAssinaturaEfetiva } from "@/lib/atividades/assinatura"

/**
 * Pré-processa (extrai + filtra por tema, quando aplicável) o arquivo de referência ANTES do
 * clique final em "Gerar"  disparado por `components/generator-modal.tsx` assim que o modal
 * abre, em paralelo enquanto o usuário passa pelos steps "Estilo"/"Configurações". O resultado é
 * reenviado pelo cliente como `arquivoPreprocessado` na chamada final de geração
 * (`/api/atividades/gerar` ou `/api/plano-de-aula/gerar`), que usa `tentarParsearArquivoPreprocessado`
 * pra aceitá-lo e pular a extração/filtragem de novo  ver `lib/ai/extrair-conteudo-arquivo.ts`.
 *
 * Compartilhado entre os três fluxos (atividade, prova, plano de aula) porque a lógica de
 * extração+filtragem é idêntica nos três  não depende de `tipoConteudo`.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 })

  const form = await request.formData()
  const arquivo = form.get("arquivo")
  const tema = form.get("tema")
  const temaLimpo = typeof tema === "string" ? tema.trim() : ""

  if (!(arquivo instanceof File)) {
    return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 })
  }

  let arquivoReferencia
  try {
    arquivoReferencia = await extrairConteudoArquivo(arquivo)
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Não foi possível ler o arquivo enviado." }, { status: 400 })
  }

  // Filtrar páginas por tema chama o Gemini de verdade (ver filtrarPaginasPdf)  sem cota aqui,
  // esta rota virava uma porta de custo de IA sem limite algum: ela roda em paralelo, fora do
  // fluxo de geração, e nunca era contabilizada em lugar nenhum. Cota PRÓPRIA (não a de "regenerar
  // questão avulsa"  esta roda 1x automaticamente por upload no assistente, não é um clique
  // repetido do usuário, então merece um teto calibrado à parte).
  if (arquivoReferencia?.tipo === "pdf" && temaLimpo) {
    const { plano } = await obterAssinaturaEfetiva(supabase, user.id)
    const cota = await reservarPreprocessamentoArquivo(supabase, user.id)
    if (!cota.permitido) {
      return Response.json(
        {
          error: `Limite diário de pré-processamento de arquivo atingido (${cota.usadas}/${obterLimitePreprocessamentoArquivoDiario(plano)}). Tente novamente amanhã.`,
          limiteAtingido: true,
        },
        { status: 403 }
      )
    }
    const { arquivo: arquivoFiltrado } = await filtrarPaginasPdf({ arquivo: arquivoReferencia, tema: temaLimpo })
    arquivoReferencia = arquivoFiltrado
  }

  return Response.json({ arquivoReferencia })
}
