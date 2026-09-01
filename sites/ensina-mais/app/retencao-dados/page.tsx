import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE, EmailEncarregado, PLANO_SUPABASE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Retenção e Exclusão de Dados",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Objetivo",
    conteudo: (
      <p>
        Esta Política detalha por quanto tempo cada categoria de dado pessoal e de conteúdo é mantida pelo{" "}
        {NOME_FANTASIA}, e como ocorre sua exclusão, em complemento à{" "}
        <a href="/privacidade" className="underline text-(--brand)">Política de Privacidade</a>, em
        atenção ao princípio da necessidade e ao direito de eliminação previstos na LGPD (art. 6º, III, e
        art. 16).
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Prazos de retenção por categoria",
    conteudo: (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-(--secundary)">
              <th className="py-2 pr-3 font-semibold">Categoria</th>
              <th className="py-2 pr-3 font-semibold">Retenção enquanto ativo</th>
              <th className="py-2 pr-3 font-semibold">Após exclusão pelo usuário / encerramento da conta</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Dados de cadastro (nome, e-mail)</td>
              <td className="py-2 pr-3">Enquanto a conta estiver ativa</td>
              <td className="py-2 pr-3">Excluídos após solicitação de exclusão de conta, ressalvado o prazo mínimo indicado na Cláusula 4</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Turmas, atividades, provas, planos de aula e gabaritos</td>
              <td className="py-2 pr-3">Enquanto não excluídos pelo próprio usuário ou até o encerramento da conta</td>
              <td className="py-2 pr-3">Exclusão de turma remove imediatamente os documentos .docx associados no armazenamento; exclusão de conta remove o restante conforme Cláusula 4</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Modelos de formatação (.docx) enviados</td>
              <td className="py-2 pr-3">Enquanto reaproveitados pelo usuário para novas gerações</td>
              <td className="py-2 pr-3">Removidos com a exclusão da conta</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Foto de perfil (avatar)</td>
              <td className="py-2 pr-3">Enquanto a conta estiver ativa, ou até nova substituição pelo usuário</td>
              <td className="py-2 pr-3">Removida com a exclusão da conta</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Cache de contexto de IA (Gemini) do arquivo de referência enviado</td>
              <td className="py-2 pr-3">Até 1 hora após a última reutilização (expiração automática do cache na Google)</td>
              <td className="py-2 pr-3">Expira automaticamente; não é excluído manualmente</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Contadores de cota (gerações, buscas de vestibular, regenerações)</td>
              <td className="py-2 pr-3">Enquanto a conta estiver ativa, para controle mensal/diário do plano</td>
              <td className="py-2 pr-3">Removidos com a exclusão da conta</td>
            </tr>
            <tr className="border-b border-(--secundary)/50">
              <td className="py-2 pr-3">Dados de assinatura e faturamento (Stripe)</td>
              <td className="py-2 pr-3">Enquanto a assinatura estiver ativa</td>
              <td className="py-2 pr-3">Registros de cobrança são retidos pelo prazo legal de guarda fiscal de <strong>5 (cinco) anos</strong>, conforme a regra geral de decadência do art. 173 do Código Tributário Nacional (CTN), mesmo após a exclusão da conta, exclusivamente para cumprimento de obrigação legal</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">Registros de segurança/autenticação (logs de acesso)</td>
              <td className="py-2 pr-3">Gerados automaticamente pela infraestrutura (Supabase/hospedagem)</td>
              <td className="py-2 pr-3">Mantidos pelo prazo mínimo de <strong>6 (seis) meses</strong> exigido pelo Marco Civil da Internet (art. 15) para registros de acesso a aplicações, podendo ser retidos por período adicional conforme a política padrão de logs do provedor de infraestrutura</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    numero: "3",
    titulo: "Critérios utilizados para definir os prazos",
    conteudo: (
      <p>
        Os prazos acima consideram (i) a necessidade do dado para a prestação do serviço contratado; (ii)
        obrigações legais de guarda, especialmente fiscais e de registros de acesso (Marco Civil da
        Internet); (iii) o exercício regular de direitos em eventual processo judicial, administrativo ou
        arbitral; e (iv) limitações técnicas de expiração automática impostas por operadores terceiros
        (como o cache de contexto do Gemini).
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Exclusão de conta",
    conteudo: (
      <p>
        A exclusão da conta é processada mediante solicitação ao suporte (
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>), que
        remove os dados de cadastro, turmas, conteúdo gerado, avatar e modelos de formatação associados à
        conta, ressalvados os dados cuja retenção seja exigida por lei (Cláusula 2). O prazo interno para
        conclusão do procedimento de exclusão é de até <strong>15 (quinze) dias úteis</strong> a
        contar da solicitação, conforme detalhado na{" "}
        <a href="/politica-conta" className="underline text-(--brand)">Política de Conta e Exclusão de
        Conta</a>.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Backups",
    conteudo: (
      <p>
        A infraestrutura de banco de dados (Supabase) mantém rotinas de backup para fins de continuidade e
        recuperação de desastres, geridas pelo próprio provedor de infraestrutura. Dados excluídos podem
        persistir temporariamente em cópias de backup até sua rotação natural, mesmo após removidos do
        banco de dados em produção. O projeto utiliza o plano <strong>{PLANO_SUPABASE}</strong> do
        Supabase, que inclui backups diários com retenção padrão de <strong>7 (sete) dias</strong>,
        armazenados de forma criptografada pelo próprio Supabase.
      </p>
    ),
  },
  {
    numero: "6",
    titulo: "Anonimização como alternativa à exclusão",
    conteudo: (
      <p>
        Quando a exclusão completa não for possível em razão de obrigação legal de retenção, poderemos
        manter os dados de forma anonimizada ou pseudonimizada, de modo que não seja mais possível
        associá-los, direta ou indiretamente, a você.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas sobre prazos de retenção ou solicitações de exclusão podem ser enviadas ao Encarregado em{" "}
        <EmailEncarregado /> ou ao suporte em{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function RetencaoDadosPage() {
  return (
    <LegalDocument
      titulo="Política de Retenção e Exclusão de Dados"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política detalha, por categoria de dado, quanto tempo o {NOME_FANTASIA} retém informações
          pessoais e conteúdo gerado, e como ocorre sua exclusão, complementando a{" "}
          <a href="/privacidade" className="underline text-(--brand)">Política de Privacidade</a>.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/politica-conta", label: "Política de Conta e Exclusão de Conta" },
        { href: "/politica-seguranca", label: "Política de Segurança da Informação" },
      ]}
    />
  )
}
