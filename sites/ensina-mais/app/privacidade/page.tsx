import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE, QualificacaoResponsavel, EmailEncarregado, REGIAO_SUPABASE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Privacidade",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Controlador dos dados",
    conteudo: (
      <p>
        O controlador dos dados pessoais tratados nesta Política, nos termos do art. 5º, VI, da Lei nº
        13.709/2018 (LGPD), é <QualificacaoResponsavel />. Dúvidas, solicitações e exercício de direitos
        relacionados a dados pessoais podem ser encaminhados ao Encarregado de Proteção de Dados (DPO) em{" "}
        <EmailEncarregado /> ou, alternativamente, ao suporte em{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Dados coletados e como são coletados",
    conteudo: (
      <>
        <p>Coletamos apenas os dados descritos abaixo, obtidos diretamente do usuário ou gerados pelo uso da Plataforma:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><strong>Dados de cadastro:</strong> nome completo e e-mail, fornecidos no cadastro por e-mail/senha ou recebidos do Google no login via OAuth; e senha, armazenada de forma criptografada pelo provedor de autenticação (Supabase Auth)  o {NOME_FANTASIA} não tem acesso à sua senha em texto claro.</li>
          <li><strong>Foto de perfil (avatar):</strong> imagem enviada opcionalmente pelo usuário (JPEG, PNG, WEBP ou GIF, até 2MB).</li>
          <li><strong>Dados de turmas:</strong> nome da turma, nível de ensino, série ou período  informações organizacionais definidas pelo próprio professor, sem identificação de alunos específicos exigida pela Plataforma.</li>
          <li><strong>Conteúdo enviado para geração de material:</strong> temas digitados, arquivos de referência opcionalmente anexados (PDF, DOCX ou TXT, até 5MB) e modelos de formatação (.docx) enviados para orientar o estilo do material gerado.</li>
          <li><strong>Conteúdo gerado e editado:</strong> atividades, provas, planos de aula, questões, gabaritos e as edições feitas pelo professor no editor.</li>
          <li><strong>Dados de pagamento e assinatura:</strong> identificador de cliente e de assinatura no Stripe, plano contratado e status da assinatura. O {NOME_FANTASIA} <strong>não coleta nem armazena</strong> números de cartão de crédito  o pagamento é processado diretamente pelo Stripe.</li>
          <li><strong>Dados de uso e cota:</strong> contadores de gerações, buscas de questões de vestibular e regenerações realizadas, usados para aplicar os limites do plano contratado.</li>
          <li><strong>Dados técnicos e de sessão:</strong> cookies de sessão de autenticação e preferências de interface (tema claro/escuro, estado da barra lateral)  detalhados na <a href="/cookies" className="underline text-(--brand)">Política de Cookies</a>.</li>
        </ul>
        <p>
          <strong>Não foi identificado no código analisado</strong> qualquer coleta de dados de
          geolocalização, câmera, microfone, ou de dados pessoais de alunos além do que o próprio professor
          eventualmente inclua, por sua conta e risco, em temas ou arquivos de referência que envie à
          Plataforma. A configuração de segurança da Plataforma (<code>Permissions-Policy</code>) bloqueia
          explicitamente o acesso a câmera, microfone e geolocalização pelo navegador.
        </p>
      </>
    ),
  },
  {
    numero: "3",
    titulo: "Base legal do tratamento (LGPD)",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li><strong>Execução de contrato (art. 7º, V):</strong> dados de cadastro, turmas, conteúdo gerado e dados de pagamento, necessários para prestar o serviço contratado.</li>
        <li><strong>Cumprimento de obrigação legal ou regulatória (art. 7º, II):</strong> dados fiscais e de faturamento retidos pelo prazo exigido pela legislação tributária.</li>
        <li><strong>Legítimo interesse (art. 7º, IX):</strong> dados técnicos e de uso estritamente necessários à segurança, prevenção a fraude e manutenção da Plataforma, sempre limitados ao necessário e sem prejuízo aos direitos e liberdades fundamentais do titular.</li>
        <li><strong>Consentimento (art. 7º, I):</strong> cookies não essenciais, quando existentes, conforme a <a href="/cookies" className="underline text-(--brand)">Política de Cookies</a>.</li>
      </ul>
    ),
  },
  {
    numero: "4",
    titulo: "Finalidades do tratamento",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Criar e autenticar sua conta, e permitir a recuperação de acesso;</li>
        <li>Gerar, via inteligência artificial, as atividades, provas e planos de aula solicitados, incluindo, quando aplicável, a busca de questões reais de vestibular/ENEM;</li>
        <li>Organizar o conteúdo por turma e manter o histórico de materiais criados;</li>
        <li>Processar pagamentos e gerenciar assinaturas, planos e cotas de uso;</li>
        <li>Prevenir fraudes e abusos, e garantir a segurança da Plataforma;</li>
        <li>Prestar suporte ao usuário e comunicar informações relevantes sobre a conta ou o serviço.</li>
      </ul>
    ),
  },
  {
    numero: "5",
    titulo: "Compartilhamento de dados",
    conteudo: (
      <>
        <p>
          Não vendemos dados pessoais. O compartilhamento ocorre apenas com operadores estritamente
          necessários à prestação do serviço, nos limites de suas respectivas finalidades:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><strong>Supabase</strong> (hospedagem de banco de dados PostgreSQL, autenticação e armazenamento de arquivos)  infraestrutura onde residem conta, turmas, conteúdo gerado, avatares e modelos de formatação.</li>
          <li><strong>Google (Gemini API / Google Search grounding)</strong>  recebe o tema, o conteúdo de arquivos de referência e, quando aplicável a provas em planos pagos, consultas de busca ao Google Search, exclusivamente para gerar o material solicitado. Ver detalhes na <a href="/politica-ia" className="underline text-(--brand)">Política de IA</a>.</li>
          <li><strong>Google (login via OAuth)</strong>  quando você opta por entrar com sua conta Google, o Google processa a autenticação e compartilha conosco os dados básicos de perfil autorizados por você nesse fluxo.</li>
          <li><strong>Stripe</strong>  processa pagamentos e dados de faturamento; recebe seu identificador de usuário (para associar a assinatura à sua conta) e, diretamente do seu navegador, os dados do seu cartão, que não trafegam pelos servidores do {NOME_FANTASIA}.</li>
        </ul>
        <p>
          Podemos ainda compartilhar dados quando exigido por ordem judicial ou autoridade competente, ou
          para proteger direitos, segurança ou propriedade do {NOME_FANTASIA}, de seus usuários ou de
          terceiros.{" "}
          <strong>Não foi identificado no código analisado</strong> nenhum compartilhamento com redes de
          publicidade, corretores de dados (“data brokers”) ou ferramentas de analytics de terceiros.
        </p>
      </>
    ),
  },
  {
    numero: "6",
    titulo: "Armazenamento",
    conteudo: (
      <p>
        Os dados são armazenados em banco de dados PostgreSQL gerenciado pelo Supabase, protegido por
        políticas de Row-Level Security (RLS) que restringem cada usuário ao acesso exclusivo de seus
        próprios registros, complementadas por verificações de autorização no código das rotas de backend.
        Arquivos (avatares, modelos de formatação e documentos .docx gerados) ficam em buckets de
        armazenamento do Supabase Storage, com acesso controlado por URLs assinadas de curta duração para
        os documentos gerados. O projeto Supabase utilizado está hospedado na região{" "}
        <strong>{REGIAO_SUPABASE}</strong>  ou seja, dentro do Brasil, sem transferência internacional
        para essa parte específica da infraestrutura (banco de dados e armazenamento de arquivos).
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Segurança",
    conteudo: (
      <p>
        Adotamos medidas técnicas e administrativas para proteger seus dados de acessos não autorizados e
        situações de destruição, perda, alteração, comunicação ou difusão indevida, incluindo criptografia
        em trânsito (HTTPS/TLS, com HSTS forçando conexões seguras) e em repouso (fornecida pela
        infraestrutura do Supabase), controle de acesso por autenticação e RLS, e cabeçalhos de segurança
        HTTP contra clickjacking e MIME-sniffing. Detalhes completos estão na{" "}
        <a href="/politica-seguranca" className="underline text-(--brand)">Política de Segurança da
        Informação</a>.
      </p>
    ),
  },
  {
    numero: "8",
    titulo: "Direitos do titular",
    conteudo: (
      <>
        <p>Nos termos do art. 18 da LGPD, você pode, mediante solicitação ao Encarregado (<EmailEncarregado />) ou ao suporte (<a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>):</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Confirmar a existência de tratamento e acessar seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados (parte diretamente editável em “Configurações” no painel);</li>
          <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD;</li>
          <li>Solicitar a portabilidade dos dados a outro fornecedor de serviço, observados os segredos comercial e industrial;</li>
          <li>Solicitar a eliminação dos dados tratados com base no consentimento;</li>
          <li>Obter informação sobre entidades públicas e privadas com as quais o controlador compartilhou dados;</li>
          <li>Revogar o consentimento, quando essa for a base legal aplicável;</li>
          <li>Se opor a tratamento realizado com base em hipótese legal diversa do consentimento, em caso de descumprimento da LGPD.</li>
        </ul>
        <p>Respondemos às solicitações no prazo legal aplicável, podendo solicitar informações adicionais para confirmar sua identidade antes de executar o pedido.</p>
      </>
    ),
  },
  {
    numero: "9",
    titulo: "Exclusão de dados",
    conteudo: (
      <p>
        Você pode excluir turmas e os materiais nelas contidos a qualquer momento, diretamente no painel  a
        exclusão de uma turma remove também os documentos .docx associados no armazenamento. A exclusão da
        conta em si é feita mediante solicitação ao suporte (<a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>),
        conforme detalhado na <a href="/politica-conta" className="underline text-(--brand)">Política de
        Conta e Exclusão de Conta</a> e na <a href="/retencao-dados" className="underline text-(--brand)">Política
        de Retenção e Exclusão de Dados</a>.
      </p>
    ),
  },
  {
    numero: "10",
    titulo: "Retenção",
    conteudo: (
      <p>
        Mantemos seus dados pelo tempo necessário ao cumprimento das finalidades descritas nesta Política,
        observadas obrigações legais de retenção (por exemplo, dados fiscais de pagamentos). Prazos
        detalhados por categoria de dado constam na{" "}
        <a href="/retencao-dados" className="underline text-(--brand)">Política de Retenção e Exclusão de
        Dados</a>.
      </p>
    ),
  },
  {
    numero: "11",
    titulo: "Cookies e tecnologias de rastreamento",
    conteudo: (
      <p>
        Utilizamos cookies estritamente funcionais  de sessão de autenticação e de preferência de
        interface  descritos em detalhe na <a href="/cookies" className="underline text-(--brand)">Política
        de Cookies</a>.{" "}
        <strong>Não foi identificado no código analisado</strong> o uso de cookies ou pixels de publicidade,
        rastreamento entre sites ou ferramentas de analytics de terceiros (como Google Analytics ou Meta
        Pixel).
      </p>
    ),
  },
  {
    numero: "12",
    titulo: "Transferência internacional de dados",
    conteudo: (
      <p>
        Alguns dos operadores que utilizamos  Google (Gemini API, Google Search e login OAuth), OpenAI
        (API do GPT-5 Mini, plano Premium) e Stripe  processam dados em infraestrutura que pode estar
        localizada fora do Brasil (predominantemente Estados Unidos). Essas transferências internacionais
        são realizadas com base nas hipóteses do art. 33 da LGPD. Os três operadores publicam, em seus
        termos padrão de processamento de dados (Data Processing Addendum), a adoção de Cláusulas
        Contratuais Padrão (Standard Contractual Clauses) da União Europeia como mecanismo de garantia
        para transferência internacional  mecanismo reconhecido pela ANPD como apto a atender o art. 33,
        II, “a”, da LGPD enquanto normas específicas equivalentes não são editadas pela autoridade
        brasileira. Não formalizamos aditivos contratuais bespoke além dos termos padrão publicados por
        cada operador.
      </p>
    ),
  },
  {
    numero: "13",
    titulo: "Alterações desta política",
    conteudo: (
      <p>
        Podemos atualizar esta Política periodicamente. Alterações relevantes serão comunicadas com
        antecedência razoável, por e-mail ou aviso na Plataforma, antes de entrarem em vigor.
      </p>
    ),
  },
  {
    numero: "14",
    titulo: "Contato do controlador",
    conteudo: (
      <p>
        Dúvidas sobre esta Política ou sobre o tratamento dos seus dados podem ser enviadas ao Encarregado
        de Proteção de Dados em <EmailEncarregado /> ou ao suporte em{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function PrivacidadePage() {
  return (
    <LegalDocument
      titulo="Política de Privacidade"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política explica, em conformidade com a Lei Geral de Proteção de Dados (LGPD  Lei nº
          13.709/2018), quais dados pessoais o {NOME_FANTASIA} coleta, para quê os utiliza, com quem os
          compartilha e quais direitos você pode exercer sobre eles.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/cookies", label: "Política de Cookies" },
        { href: "/retencao-dados", label: "Política de Retenção e Exclusão de Dados" },
        { href: "/politica-ia", label: "Política de IA" },
        { href: "/politica-seguranca", label: "Política de Segurança da Informação" },
        { href: "/politica-conta", label: "Política de Conta e Exclusão de Conta" },
      ]}
    />
  )
}
