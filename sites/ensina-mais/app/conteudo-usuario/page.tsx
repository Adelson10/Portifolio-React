import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Conteúdo do Usuário",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Escopo",
    conteudo: (
      <p>
        Esta Política trata do “Conteúdo do Usuário” enviado ao {NOME_FANTASIA}: temas digitados, arquivos
        de referência (PDF, DOCX ou TXT, até 5MB, sendo até 30 páginas no caso de PDF) e modelos de
        formatação (.docx) enviados para orientar o estilo do material gerado. A Plataforma não possui
        recursos de publicação, compartilhamento entre contas ou visualização de conteúdo por outros
        usuários  cada professor acessa exclusivamente o conteúdo vinculado à sua própria conta.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Titularidade e responsabilidade",
    conteudo: (
      <p>
        Você mantém a titularidade sobre o Conteúdo do Usuário que enviar, na medida em que já a detenha, e
        é o único responsável por sua legalidade, veracidade e adequação, incluindo a garantia de que possui
        os direitos necessários para fazer o upload de arquivos de referência e modelos de formatação (ver{" "}
        <a href="/direitos-autorais" className="underline text-(--brand)">Aviso de Direitos Autorais</a>).
      </p>
    ),
  },
  {
    numero: "3",
    titulo: "Licença concedida à Plataforma",
    conteudo: (
      <p>
        Ao enviar Conteúdo do Usuário, você concede ao {NOME_FANTASIA} uma licença limitada, não exclusiva e
        pelo tempo necessário à prestação do serviço, para armazenar, processar e transmitir esse conteúdo a
        provedores de infraestrutura e de inteligência artificial (Supabase e Google Gemini, conforme a{" "}
        <a href="/politica-ia" className="underline text-(--brand)">Política de IA</a>) exclusivamente para
        gerar o material solicitado e operar a Plataforma. Essa licença não transfere titularidade e se
        extingue com a exclusão do conteúdo ou da conta, ressalvados os prazos de retenção descritos na{" "}
        <a href="/retencao-dados" className="underline text-(--brand)">Política de Retenção e Exclusão de
        Dados</a>.
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Conteúdo proibido",
    conteudo: (
      <p>
        É vedado enviar ou tentar gerar, por meio da Plataforma, conteúdo ilegal, discriminatório,
        difamatório, obsceno, que incite violência ou ódio, que viole direitos autorais ou de imagem de
        terceiros, ou que contenha dados pessoais sensíveis de alunos além do estritamente necessário e
        permitido por lei (ver Cláusula 5 dos <a href="/termos" className="underline text-(--brand)">Termos
        de Uso</a>).
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Moderação e limites técnicos do modelo de IA",
    conteudo: (
      <p>
        A geração de conteúdo é realizada por modelo de linguagem de terceiro (Google Gemini), que possui
        suas próprias políticas de uso aceitável e pode recusar-se a gerar determinados conteúdos.{" "}
        <strong>Não foi identificado no código analisado</strong> um sistema próprio de moderação de
        conteúdo, denúncia entre usuários ou revisão humana do {NOME_FANTASIA} sobre o conteúdo gerado antes
        da entrega ao professor  a responsabilidade pela adequação final do material é do usuário, nos
        termos do <a href="/isencao-responsabilidade" className="underline text-(--brand)">Aviso de Isenção
        de Responsabilidade</a>.
      </p>
    ),
  },
  {
    numero: "6",
    titulo: "Remoção de conteúdo",
    conteudo: (
      <p>
        Você pode excluir suas atividades, provas, planos de aula e turmas a qualquer momento diretamente no
        painel. Podemos remover Conteúdo do Usuário que viole esta Política, os{" "}
        <a href="/termos" className="underline text-(--brand)">Termos de Uso</a> ou a legislação aplicável,
        mediante notificação prévia sempre que possível, ou em resposta a ordem de autoridade competente.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas ou denúncias relacionadas a Conteúdo do Usuário podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function ConteudoUsuarioPage() {
  return (
    <LegalDocument
      titulo="Política de Conteúdo do Usuário"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política trata dos temas, arquivos de referência e modelos de formatação que você envia ao{" "}
          {NOME_FANTASIA}, incluindo titularidade, responsabilidade e limites de uso.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/direitos-autorais", label: "Aviso de Direitos Autorais" },
        { href: "/politica-ia", label: "Política de IA" },
      ]}
    />
  )
}
