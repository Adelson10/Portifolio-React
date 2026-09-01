import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Aviso de Isenção de Responsabilidade",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Natureza do conteúdo gerado",
    conteudo: (
      <p>
        O Conteúdo Gerado pelo {NOME_FANTASIA} (atividades, provas, planos de aula, questões e gabaritos) é
        produzido com o auxílio de inteligência artificial (Google Gemini) e constitui <strong>material de
        apoio</strong> ao trabalho docente  não um material pedagógico pronto para uso irrestrito, avaliado
        ou certificado por qualquer instituição de ensino, banca examinadora ou órgão regulador.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Ausência de garantia de exatidão",
    conteudo: (
      <p>
        Modelos de inteligência artificial podem produzir informações incorretas, desatualizadas,
        incompletas ou incoerentes (“alucinações”), mesmo quando as instruções internas da Plataforma
        orientam o modelo a priorizar precisão factual e a não inventar dados. O {NOME_FANTASIA} não garante
        a exatidão, atualidade, completude ou adequação pedagógica de nenhum Conteúdo Gerado.
      </p>
    ),
  },
  {
    numero: "3",
    titulo: "Dever de revisão do professor",
    conteudo: (
      <p>
        Cabe exclusivamente ao professor revisar, corrigir e validar todo Conteúdo Gerado antes de utilizá-lo
        em sala de aula, em avaliações formais ou em qualquer contexto que produza efeitos sobre terceiros
        (como notas ou aprovação de alunos). A responsabilidade final pelo conteúdo efetivamente aplicado é
        sempre do professor que o revisou e decidiu utilizá-lo, e não do {NOME_FANTASIA} ou do provedor de
        inteligência artificial subjacente.
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Questões de vestibular/ENEM obtidas por busca",
    conteudo: (
      <p>
        Questões reais recuperadas pelo recurso de busca de vestibular/ENEM (grounding do Google Search)
        refletem o resultado de uma busca automatizada e não são verificadas manualmente quanto à
        atualidade, ao gabarito oficial ou à correspondência exata com a fonte original antes da entrega ao
        professor  a conferência cabe ao professor antes do uso.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Disponibilidade do serviço",
    conteudo: (
      <p>
        A Plataforma depende de serviços de terceiros (Supabase, Google Gemini, Google Search, Stripe) para
        funcionar integralmente. Indisponibilidades, degradações de desempenho ou alterações desses
        serviços de terceiros podem afetar temporariamente a disponibilidade ou a qualidade do
        {" "}{NOME_FANTASIA}, sem que isso configure, por si só, defeito na prestação do serviço imputável à
        Plataforma.
      </p>
    ),
  },
  {
    numero: "6",
    titulo: "Limitação de responsabilidade",
    conteudo: (
      <p>
        Este aviso complementa, e não substitui, a Cláusula 13 (Limitação de Responsabilidade) e a Cláusula
        14 (Indenização) dos <a href="/termos" className="underline text-(--brand)">Termos de Uso</a>, que
        regulam a extensão da responsabilidade do {NOME_FANTASIA} nos limites da legislação brasileira
        aplicável, em especial o Código de Defesa do Consumidor.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas sobre este aviso podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function IsencaoResponsabilidadePage() {
  return (
    <LegalDocument
      titulo="Aviso de Isenção de Responsabilidade"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          O conteúdo gerado pelo {NOME_FANTASIA} é material de apoio produzido com auxílio de inteligência
          artificial. Este aviso esclarece os limites dessa geração e o papel indispensável da revisão
          humana do professor.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/politica-ia", label: "Política de IA" },
      ]}
    />
  )
}
