import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Cookies",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "O que são cookies",
    conteudo: (
      <p>
        Cookies são pequenos arquivos de texto armazenados pelo seu navegador quando você visita um site ou
        usa uma aplicação web, utilizados para lembrar preferências, manter sessões autenticadas ou
        registrar informações de uso.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Cookies utilizados pelo Ensina Plus",
    conteudo: (
      <>
        <p>
          Levantamos, a partir do código-fonte da Plataforma, exatamente os cookies abaixo. Não foi
          identificado nenhum outro cookie além destes.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-(--secundary)">
                <th className="py-2 pr-3 font-semibold">Cookie</th>
                <th className="py-2 pr-3 font-semibold">Finalidade</th>
                <th className="py-2 pr-3 font-semibold">Categoria</th>
                <th className="py-2 pr-3 font-semibold">Duração</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3 font-mono">sb-*-auth-token (e variantes geridas pelo Supabase Auth)</td>
                <td className="py-2 pr-3">Mantém sua sessão autenticada entre requisições e entre os subdomínios {NOME_FANTASIA}.</td>
                <td className="py-2 pr-3">Estritamente necessário</td>
                <td className="py-2 pr-3">Duração da sessão / conforme configuração do provedor de autenticação</td>
              </tr>
              <tr className="border-b border-(--secundary)/50">
                <td className="py-2 pr-3 font-mono">tema</td>
                <td className="py-2 pr-3">Guarda sua preferência de aparência (claro, escuro ou padrão do sistema), aplicada antes mesmo do carregamento da página para evitar o "flash" do tema errado.</td>
                <td className="py-2 pr-3">Funcional / preferência</td>
                <td className="py-2 pr-3">12 meses</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono">sidebar-collapsed</td>
                <td className="py-2 pr-3">Lembra se você prefere a barra lateral do painel recolhida ou expandida.</td>
                <td className="py-2 pr-3">Funcional / preferência</td>
                <td className="py-2 pr-3">12 meses</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Não foi identificado no código analisado</strong> o uso de cookies de publicidade,
          rastreamento entre sites (cross-site tracking), análise comportamental por terceiros (ex.: Google
          Analytics) ou pixels de redes sociais.
        </p>
      </>
    ),
  },
  {
    numero: "3",
    titulo: "Cookies estritamente necessários e consentimento",
    conteudo: (
      <p>
        Os cookies de autenticação são estritamente necessários ao funcionamento da Plataforma  sem eles,
        não é possível manter você conectado à sua conta  e, por isso, dispensam consentimento específico,
        nos termos do art. 7º, II e V, da LGPD (execução de contrato e cumprimento de obrigação legal, no
        que couber) e do art. 11 do Marco Civil da Internet. Os cookies de preferência (tema e barra
        lateral) também têm natureza funcional, não publicitária, e existem apenas para preservar escolhas
        de interface que você mesmo define.
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Como gerenciar ou desativar cookies",
    conteudo: (
      <p>
        Você pode configurar seu navegador para bloquear ou apagar cookies a qualquer momento. Bloquear o
        cookie de autenticação impedirá o funcionamento do login e das áreas restritas da Plataforma;
        bloquear os cookies de preferência apenas fará com que suas escolhas de tema e layout da barra
        lateral não sejam lembradas entre sessões.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Alterações desta política",
    conteudo: (
      <p>
        Se novos cookies forem adicionados à Plataforma no futuro (por exemplo, para métricas de uso ou
        marketing), esta página será atualizada antes da entrada em vigor da mudança, com indicação da
        data de revisão no topo desta página.
      </p>
    ),
  },
  {
    numero: "6",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas sobre esta Política de Cookies podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function CookiesPage() {
  return (
    <LegalDocument
      titulo="Política de Cookies"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política lista, de forma exaustiva e baseada na análise do código-fonte da Plataforma, todos
          os cookies utilizados pelo {NOME_FANTASIA}, sua finalidade e duração.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/termos", label: "Termos de Uso" },
      ]}
    />
  )
}
