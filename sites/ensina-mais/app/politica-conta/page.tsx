import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Conta e Exclusão de Conta",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Criação de conta",
    conteudo: (
      <p>
        A conta é criada por e-mail e senha, ou por login com conta Google. Cada conta representa um único
        professor; a Plataforma não possui contas compartilhadas, contas de “escola” com múltiplos
        professores vinculados, nem contas de alunos.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Planos e limites de uso",
    conteudo: (
      <>
        <p>A Plataforma oferece três planos, cada um com limites próprios de geração de conteúdo:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-(--secundary)">
                <th className="py-2 pr-3 font-semibold">Recurso</th>
                <th className="py-2 pr-3 font-semibold">Grátis</th>
                <th className="py-2 pr-3 font-semibold">Básico  R$ 39,90/mês</th>
                <th className="py-2 pr-3 font-semibold">Premium  R$ 89,90/mês (ou R$ 899,90/ano)</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3">Gerações por mês</td>
                <td className="py-2 pr-3">60</td>
                <td className="py-2 pr-3">150</td>
                <td className="py-2 pr-3">400</td>
              </tr>
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3">Gerações por dia</td>
                <td className="py-2 pr-3">2</td>
                <td className="py-2 pr-3">sem teto</td>
                <td className="py-2 pr-3">sem teto</td>
              </tr>
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3">Questões por geração</td>
                <td className="py-2 pr-3">2</td>
                <td className="py-2 pr-3">25</td>
                <td className="py-2 pr-3">25</td>
              </tr>
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3">Buscas de vestibular/ENEM por mês</td>
                <td className="py-2 pr-3">0</td>
                <td className="py-2 pr-3">15</td>
                <td className="py-2 pr-3">40</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Regenerações de questão avulsa por dia</td>
                <td className="py-2 pr-3">10</td>
                <td className="py-2 pr-3">60</td>
                <td className="py-2 pr-3">150</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          O plano Grátis não exige cartão de crédito. Quando não há assinatura paga registrada, a conta é
          sempre tratada como plano Grátis  nunca é cobrada por padrão. Os valores acima podem ser
          reajustados mediante aviso prévio, conforme a Cláusula 15 dos{" "}
          <a href="/termos" className="underline text-(--brand)">Termos de Uso</a>.
        </p>
      </>
    ),
  },
  {
    numero: "3",
    titulo: "Cobrança e pagamento",
    conteudo: (
      <p>
        Os planos pagos são cobrados por assinatura recorrente (mensal ou anual, conforme escolhido),
        processada pelo Stripe. O {NOME_FANTASIA} não armazena dados de cartão de crédito. A confirmação do
        pagamento ativa o plano automaticamente; renovações, upgrades, downgrades e falhas de pagamento são
        refletidos na conta de forma automática via notificação do Stripe.
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Cancelamento de assinatura",
    conteudo: (
      <p>
        Você pode cancelar sua assinatura a qualquer momento, sem multa, em “Configurações → Faturas”. O
        cancelamento é agendado para o fim do período já pago  você mantém acesso aos recursos do plano
        pago até essa data, e a conta retorna automaticamente ao plano Grátis quando o período termina, sem
        necessidade de nova ação.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Exclusão de conta",
    conteudo: (
      <>
        <p>
          A exclusão da conta e de todos os dados a ela associados é feita mediante solicitação ao suporte,
          pelo e-mail{" "}
          <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>. No
          momento, a Plataforma não oferece um botão de autoatendimento para exclusão imediata da conta 
          o pedido é processado manualmente pela equipe de suporte.
        </p>
        <p>
          O prazo de atendimento à solicitação de exclusão é de até <strong>15 (quinze) dias úteis</strong>{" "}
          contados da solicitação, findo o
          qual os dados de cadastro, turmas, conteúdo gerado, avatar e modelos de formatação são removidos,
          ressalvadas as retenções obrigatórias por lei descritas na{" "}
          <a href="/retencao-dados" className="underline text-(--brand)">Política de Retenção e Exclusão de
          Dados</a>. Assinaturas pagas ativas devem ser canceladas antes ou como parte do pedido de exclusão,
          para evitar cobranças futuras.
        </p>
      </>
    ),
  },
  {
    numero: "6",
    titulo: "Suspensão e encerramento pela Plataforma",
    conteudo: (
      <p>
        Aplicam-se as regras de suspensão e cancelamento previstas nas Cláusulas 11 e 12 dos{" "}
        <a href="/termos" className="underline text-(--brand)">Termos de Uso</a>.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Alteração de e-mail e senha",
    conteudo: (
      <p>
        A troca de senha a partir de “Configurações” exige a senha atual. A troca de e-mail exige
        confirmação por link enviado ao novo endereço; o e-mail cadastrado só é efetivamente alterado após
        essa confirmação.
      </p>
    ),
  },
  {
    numero: "8",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas sobre sua conta, cobrança ou exclusão de dados podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function PoliticaContaPage() {
  return (
    <LegalDocument
      titulo="Política de Conta e Exclusão de Conta"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política explica como funcionam os planos, a cobrança, o cancelamento de assinatura e a
          exclusão de conta no {NOME_FANTASIA}.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/retencao-dados", label: "Política de Retenção e Exclusão de Dados" },
      ]}
    />
  )
}
