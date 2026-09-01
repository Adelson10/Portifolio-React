import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE, QualificacaoResponsavel, ForoContratual } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Termos de Uso",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Objeto",
    conteudo: (
      <>
        <p>
          Estes Termos de Uso (“Termos”) regulam o acesso e a utilização da plataforma {NOME_FANTASIA}, um
          software como serviço (SaaS) que utiliza inteligência artificial (Google Gemini) para auxiliar
          professores na criação de atividades, provas e planos de aula, organizados por turma, com editor
          visual de documentos em formato A4 e exportação para Word (.docx).
        </p>
        <p>
          O {NOME_FANTASIA} é operado por <QualificacaoResponsavel />. Ao criar uma conta, acessar ou usar a
          Plataforma, você concorda integralmente com estes Termos e com a nossa{" "}
          <a href="/privacidade" className="underline text-(--brand)">Política de Privacidade</a>. Se você não
          concordar com qualquer disposição, não deve utilizar a Plataforma.
        </p>
      </>
    ),
  },
  {
    numero: "2",
    titulo: "Definições",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li><strong>Usuário/Professor:</strong> pessoa física que cria uma conta e utiliza a Plataforma.</li>
        <li><strong>Conta:</strong> credenciais de acesso (e-mail e senha, ou login via Google) vinculadas a um usuário.</li>
        <li><strong>Turma:</strong> agrupamento organizacional criado pelo usuário (nome, nível de ensino, série/período) ao qual pertencem as atividades, provas e planos de aula.</li>
        <li><strong>Conteúdo Gerado:</strong> atividades, provas, planos de aula e gabaritos produzidos com o auxílio de inteligência artificial a partir de instruções e/ou arquivos de referência fornecidos pelo usuário.</li>
        <li><strong>Conteúdo do Usuário:</strong> temas, textos, arquivos de referência (PDF, DOCX, TXT) e modelos de formatação (.docx) enviados pelo usuário à Plataforma.</li>
        <li><strong>Plano:</strong> nível de assinatura contratado (Grátis, Básico ou Premium), cada um com limites próprios de uso descritos na <a href="/politica-conta" className="underline text-(--brand)">Política de Conta e Exclusão de Conta</a>.</li>
      </ul>
    ),
  },
  {
    numero: "3",
    titulo: "Cadastro",
    conteudo: (
      <>
        <p>
          O acesso à Plataforma exige a criação de uma conta, mediante e-mail e senha ou autenticação via
          conta Google (OAuth). No cadastro por e-mail e senha, coletamos nome completo, e-mail e senha; no
          cadastro via Google, recebemos os dados básicos de perfil autorizados pelo próprio Google no
          momento da autenticação. A confirmação do cadastro por e-mail é feita por link enviado
          automaticamente pelo provedor de autenticação (Supabase Auth).
        </p>
        <p>
          Você se compromete a fornecer informações verdadeiras, completas e atualizadas no cadastro e a
          mantê-las assim, sob pena de suspensão ou cancelamento da conta.
        </p>
      </>
    ),
  },
  {
    numero: "4",
    titulo: "Elegibilidade",
    conteudo: (
      <p>
        A Plataforma é destinada a educadores maiores de 18 (dezoito) anos ou emancipados nos termos da lei
        civil brasileira, com plena capacidade para contratar. Não é destinada ao cadastro direto de
        crianças ou adolescentes, tampouco de alunos  os únicos titulares de conta são os próprios
        professores. Ao se cadastrar, você declara preencher esse requisito.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Responsabilidades do usuário",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Manter a confidencialidade de suas credenciais de acesso e notificar imediatamente qualquer uso não autorizado da sua conta pelo e-mail <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.</li>
        <li>Ser o único responsável por todo Conteúdo do Usuário enviado à Plataforma, inclusive quanto à titularidade de direitos autorais sobre arquivos de referência e modelos de formatação enviados.</li>
        <li>Revisar pedagogicamente todo Conteúdo Gerado antes de utilizá-lo em sala de aula, avaliações ou qualquer contexto formal  a Plataforma é uma ferramenta de apoio, e a decisão final sobre uso, adequação e correção do material é sempre do professor, nos termos da <a href="/politica-ia" className="underline text-(--brand)">Política de IA</a> e do <a href="/isencao-responsabilidade" className="underline text-(--brand)">Aviso de Isenção de Responsabilidade</a>.</li>
        <li>Não inserir, em temas, arquivos de referência ou modelos enviados, dados pessoais sensíveis de alunos (ex.: dados de saúde, origem racial, condição socioeconômica identificável) além do estritamente necessário e permitido por lei, sendo o professor o controlador desses dados perante seus próprios alunos e responsáveis legais.</li>
        <li>Utilizar a Plataforma em conformidade com a lei, com estes Termos e com a <a href="/conteudo-usuario" className="underline text-(--brand)">Política de Conteúdo do Usuário</a>.</li>
      </ul>
    ),
  },
  {
    numero: "6",
    titulo: "Responsabilidades da plataforma",
    conteudo: (
      <p>
        Cabe ao {NOME_FANTASIA} manter a infraestrutura técnica necessária à prestação do serviço com
        esforços razoáveis de disponibilidade, aplicar as medidas de segurança descritas na{" "}
        <a href="/politica-seguranca" className="underline text-(--brand)">Política de Segurança da Informação</a>,
        tratar dados pessoais conforme a <a href="/privacidade" className="underline text-(--brand)">Política
        de Privacidade</a> e comunicar alterações relevantes nestes Termos com antecedência razoável. A
        Plataforma não garante disponibilidade ininterrupta (ver Cláusula 13  Limitação de Responsabilidade)
        nem a exatidão pedagógica ou factual do Conteúdo Gerado por inteligência artificial.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Uso permitido",
    conteudo: (
      <p>
        É permitido usar a Plataforma para criar, editar, organizar e exportar atividades, provas e planos
        de aula para fins educacionais legítimos, dentro dos limites de uso (cota) do plano contratado,
        conforme detalhado na <a href="/politica-conta" className="underline text-(--brand)">Política de
        Conta e Exclusão de Conta</a>.
      </p>
    ),
  },
  {
    numero: "8",
    titulo: "Uso proibido",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Gerar ou tentar gerar conteúdo ilegal, discriminatório, difamatório, obsceno ou que viole direitos de terceiros (incluindo propriedade intelectual e dados pessoais).</li>
        <li>Tentar acessar, sem autorização, contas, dados ou turmas de outros usuários, ou contornar as políticas de autorização e controle de acesso da Plataforma.</li>
        <li>Utilizar meios automatizados (bots, scraping, engenharia reversa) para extrair dados da Plataforma ou sobrecarregar seus sistemas, inclusive para contornar os limites de cota do plano contratado.</li>
        <li>Revender, sublicenciar ou redistribuir o acesso à Plataforma a terceiros sem autorização expressa.</li>
        <li>Fazer upload de arquivos de referência ou modelos de formatação sobre os quais não detenha os direitos necessários (ver <a href="/direitos-autorais" className="underline text-(--brand)">Aviso de Direitos Autorais</a>).</li>
        <li>Utilizar a Plataforma para fins diversos do apoio à docência, incluindo geração de conteúdo não educacional em volume que caracterize abuso do serviço.</li>
      </ul>
    ),
  },
  {
    numero: "9",
    titulo: "Propriedade intelectual",
    conteudo: (
      <>
        <p>
          O software, a marca {NOME_FANTASIA}, o layout, o código-fonte, os modelos de formatação
          pré-configurados (ABNT, APA, IEEE, entre outros) e demais elementos da Plataforma são de
          titularidade do {NOME_FANTASIA} ou de seus licenciantes, protegidos pela Lei nº 9.610/1998 (Lei de
          Direitos Autorais) e pela Lei nº 9.609/1998 (Lei de Software), sendo vedada sua reprodução,
          modificação ou exploração comercial não autorizada.
        </p>
        <p>
          A titularidade sobre o Conteúdo Gerado com auxílio de inteligência artificial é tratada
          especificamente na <a href="/direitos-autorais" className="underline text-(--brand)">Aviso de
          Direitos Autorais</a> e na <a href="/politica-ia" className="underline text-(--brand)">Política de
          IA</a>, em razão das particularidades da legislação autoral brasileira aplicável a obras
          geradas por IA.
        </p>
      </>
    ),
  },
  {
    numero: "10",
    titulo: "Licença de uso",
    conteudo: (
      <p>
        Concedemos a você uma licença pessoal, limitada, não exclusiva, intransferível e revogável para
        acessar e usar a Plataforma exclusivamente para os fins previstos nestes Termos, enquanto durar sua
        conta ativa. Essa licença não inclui o direito de copiar, modificar, criar obras derivadas do
        software, fazer engenharia reversa ou extrair o código-fonte da Plataforma.
      </p>
    ),
  },
  {
    numero: "11",
    titulo: "Suspensão de contas",
    conteudo: (
      <p>
        Podemos suspender, temporariamente e de forma proporcional, o acesso a uma conta em caso de
        violação destes Termos, suspeita razoável de fraude, uso que coloque em risco a segurança da
        Plataforma ou de terceiros, ou inadimplência em planos pagos, mediante comunicação ao e-mail
        cadastrado sempre que possível antes ou imediatamente após a suspensão, exceto quando a urgência do
        risco justificar ação imediata.
      </p>
    ),
  },
  {
    numero: "12",
    titulo: "Cancelamento",
    conteudo: (
      <p>
        Você pode deixar de usar a Plataforma a qualquer momento. O cancelamento de planos pagos é feito
        diretamente no painel (“Configurações → Faturas”), sem multa, e produz efeitos ao final do período
        já pago  a conta não perde acesso imediatamente, apenas retorna ao plano Grátis quando o período
        vigente terminar. A exclusão definitiva da conta e dos dados associados segue o procedimento descrito
        na <a href="/politica-conta" className="underline text-(--brand)">Política de Conta e Exclusão de
        Conta</a>. Podemos encerrar contas por violação grave e reiterada destes Termos, respeitado o
        contraditório sempre que a natureza da violação permitir.
      </p>
    ),
  },
  {
    numero: "13",
    titulo: "Limitação de responsabilidade",
    conteudo: (
      <>
        <p>
          O Conteúdo Gerado por inteligência artificial pode conter imprecisões, erros factuais ou
          inadequações pedagógicas. O {NOME_FANTASIA} não se responsabiliza por consequências decorrentes do
          uso do Conteúdo Gerado sem a devida revisão humana pelo professor, nos termos detalhados no{" "}
          <a href="/isencao-responsabilidade" className="underline text-(--brand)">Aviso de Isenção de
          Responsabilidade</a>.
        </p>
        <p>
          A Plataforma é fornecida “como está” (“as is”), sem garantias de disponibilidade ininterrupta,
          ausência de falhas ou adequação a uma finalidade específica não descrita nestes Termos. Na máxima
          extensão permitida pela legislação brasileira aplicável  em especial o Código de Defesa do
          Consumidor, que não admite exclusão de responsabilidade por vícios do serviço ou danos ao
          consumidor decorrentes de defeito na prestação do serviço , a responsabilidade do{" "}
          {NOME_FANTASIA} por danos indiretos, lucros cessantes ou danos morais não decorrentes de conduta
          dolosa ou gravemente culposa fica limitada ao valor efetivamente pago pelo usuário nos 12 (doze)
          meses anteriores ao evento, quando aplicável a planos pagos.
        </p>
      </>
    ),
  },
  {
    numero: "14",
    titulo: "Indenização",
    conteudo: (
      <p>
        Você concorda em indenizar e manter o {NOME_FANTASIA} indene de reclamações, perdas e danos de
        terceiros decorrentes (i) do uso indevido da Plataforma em violação a estes Termos; (ii) de Conteúdo
        do Usuário enviado sem os direitos necessários; ou (iii) da não realização da revisão pedagógica do
        Conteúdo Gerado antes de seu uso efetivo, ressalvados os casos em que o dano decorra
        comprovadamente de falha exclusiva e direta da Plataforma.
      </p>
    ),
  },
  {
    numero: "15",
    titulo: "Alterações dos Termos",
    conteudo: (
      <p>
        Podemos alterar estes Termos a qualquer momento para refletir mudanças legais, técnicas ou no
        modelo de negócio. Alterações relevantes serão comunicadas com antecedência razoável, por e-mail
        ou aviso na Plataforma, antes de entrarem em vigor. O uso continuado da Plataforma após a vigência
        das alterações constitui aceitação das novas condições; caso não concorde, você pode encerrar sua
        conta conforme a Cláusula 12.
      </p>
    ),
  },
  {
    numero: "16",
    titulo: "Legislação aplicável",
    conteudo: (
      <p>
        Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial pela Lei nº
        13.709/2018 (LGPD), pela Lei nº 12.965/2014 (Marco Civil da Internet), pela Lei nº 8.078/1990
        (Código de Defesa do Consumidor, quando aplicável) e pelas Leis nº 9.609/1998 e 9.610/1998
        (proteção de software e direitos autorais).
      </p>
    ),
  },
  {
    numero: "17",
    titulo: "Foro",
    conteudo: (
      <p>
        Fica eleito o foro da <ForoContratual />, com renúncia a qualquer outro, por mais privilegiado que
        seja, para dirimir controvérsias oriundas destes Termos, ressalvado o direito do consumidor de optar
        pelo foro de seu domicílio, nos termos do art. 101, I, do Código de Defesa do Consumidor.
      </p>
    ),
  },
]

export default function TermosPage() {
  return (
    <LegalDocument
      titulo="Termos de Uso"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Estes Termos de Uso regulam o acesso e uso da plataforma {NOME_FANTASIA}. Ao criar uma conta ou
          usar o serviço, você concorda com as condições descritas abaixo, em conjunto com os demais
          documentos legais listados ao final desta página.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/cookies", label: "Política de Cookies" },
        { href: "/politica-ia", label: "Política de IA" },
        { href: "/conteudo-usuario", label: "Política de Conteúdo do Usuário" },
        { href: "/direitos-autorais", label: "Aviso de Direitos Autorais" },
        { href: "/politica-seguranca", label: "Política de Segurança da Informação" },
        { href: "/retencao-dados", label: "Política de Retenção e Exclusão de Dados" },
        { href: "/isencao-responsabilidade", label: "Aviso de Isenção de Responsabilidade" },
        { href: "/politica-conta", label: "Política de Conta e Exclusão de Conta" },
      ]}
    />
  )
}
