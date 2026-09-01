import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE, EmailEncarregado, PRAZO_CONFIRMACAO_DIAS_UTEIS, PRAZO_RESPOSTA_DIAS_UTEIS } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de Segurança da Informação",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Objetivo",
    conteudo: (
      <p>
        Esta Política descreve, com base na análise técnica do código-fonte da Plataforma, as medidas de
        segurança da informação adotadas pelo {NOME_FANTASIA} para proteger dados pessoais e conteúdo dos
        usuários, em atenção ao art. 46 da LGPD.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Autenticação e controle de acesso",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Autenticação via Supabase Auth, com login por e-mail/senha ou OAuth com Google (fluxo PKCE);</li>
        <li>Senhas nunca são armazenadas ou processadas em texto claro pela aplicação  a gestão de credenciais é delegada ao provedor de autenticação;</li>
        <li>Row-Level Security (RLS) no banco de dados PostgreSQL, restringindo cada usuário ao acesso exclusivo dos próprios registros diretamente no nível do banco;</li>
        <li>Verificações de autorização redundantes (“defesa em profundidade”) no código das rotas de backend, além da RLS  por exemplo, a titularidade de uma atividade é sempre confirmada pela cadeia atividade → turma → usuário antes de qualquer leitura, edição ou exclusão;</li>
        <li>Uso de credenciais de acesso privilegiado (“service role”, que ignora RLS) restrito a contextos sem sessão de usuário, como o processamento de webhooks do Stripe e a verificação de e-mail já cadastrado.</li>
      </ul>
    ),
  },
  {
    numero: "3",
    titulo: "Criptografia",
    conteudo: (
      <p>
        Toda comunicação entre o navegador e os servidores da Plataforma é criptografada via HTTPS/TLS, com
        a política HSTS configurada para forçar conexões seguras por 2 anos, incluindo subdomínios. Os dados
        armazenados em repouso (banco de dados e arquivos) são protegidos pela criptografia em repouso
        oferecida pela infraestrutura do Supabase. Não se trata de criptografia de ponta a ponta no sentido
        técnico estrito (em que nem o próprio provedor do serviço teria acesso ao conteúdo em texto claro) 
        a Plataforma e seus operadores de infraestrutura processam os dados em texto legível na medida
        necessária à prestação do serviço (por exemplo, para gerar o conteúdo solicitado via IA).
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Cabeçalhos de segurança HTTP",
    conteudo: (
      <>
        <p>A Plataforma aplica os seguintes cabeçalhos de segurança em todas as respostas:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li><code>X-Frame-Options: DENY</code>  impede que a Plataforma seja carregada dentro de um <em>iframe</em> de terceiros (proteção contra clickjacking);</li>
          <li><code>Content-Security-Policy</code>  política completa, gerada a cada requisição com um identificador único (<em>nonce</em>) que autoriza a execução apenas dos scripts legítimos da própria Plataforma e de parceiros explicitamente confiáveis (Stripe), bloqueando a execução de scripts injetados por terceiros  a principal linha de defesa técnica contra ataques de Cross-Site Scripting (XSS); também restringe de onde a Plataforma pode carregar estilos, fontes, imagens e conexões de rede, e mantém a diretiva <code>frame-ancestors &apos;none&apos;</code> contra incorporação em <em>iframes</em> de terceiros;</li>
          <li><code>X-Content-Type-Options: nosniff</code>  impede que o navegador reinterprete o tipo de um arquivo de forma perigosa;</li>
          <li><code>Referrer-Policy: strict-origin-when-cross-origin</code>  limita o vazamento de URLs internas para sites de terceiros;</li>
          <li><code>Strict-Transport-Security</code> (HSTS)  força conexões HTTPS por 2 anos, incluindo subdomínios;</li>
          <li><code>Permissions-Policy: camera=(), microphone=(), geolocation=()</code>  bloqueia integralmente, a nível de navegador, o acesso a câmera, microfone e geolocalização, recursos que a Plataforma não utiliza.</li>
        </ul>
      </>
    ),
  },
  {
    numero: "5",
    titulo: "Proteção contra abuso e arquivos maliciosos",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>Limites de tamanho de upload (5MB para arquivos de referência, 2MB para avatar) e de tipo de arquivo (MIME type) aceitos;</li>
        <li>Limite de 30 páginas para arquivos PDF enviados como referência;</li>
        <li>O parser de documentos .docx (usado para extrair o estilo de modelos enviados) inclui proteção explícita contra ataques de “zip bomb” (descompressão excessiva), limitando o tamanho de entrada e o total descomprimido;</li>
        <li>Sanitização de parâmetros de redirecionamento (<code>next</code>) no fluxo de login, para prevenir open redirect;</li>
        <li>Limites de cota (rate limiting funcional) por plano de assinatura, reservados de forma atômica via funções de banco de dados, para evitar condições de corrida e uso indevido em geração de conteúdo via IA.</li>
      </ul>
    ),
  },
  {
    numero: "6",
    titulo: "Isolamento e minimização de segredos",
    conteudo: (
      <p>
        Chaves de API sensíveis (Supabase, Gemini, Stripe) são mantidas exclusivamente em variáveis de
        ambiente do lado do servidor, nunca expostas ao navegador. A chave publicável do Stripe e o carregamento
        do SDK correspondente são isolados em módulo próprio, especificamente para evitar o vazamento
        acidental de segredos ao pacote enviado ao navegador. O pagamento por cartão é processado
        diretamente pelo Stripe (via Stripe Elements)  o {NOME_FANTASIA} nunca recebe nem armazena números
        de cartão de crédito em seus próprios servidores.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Gestão de incidentes de segurança",
    conteudo: (
      <p>
        Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares de
        dados, o {NOME_FANTASIA} comunicará à Autoridade Nacional de Proteção de Dados (ANPD) e aos
        titulares afetados, nos termos do art. 48 da LGPD, informando a natureza dos dados afetados, as
        medidas técnicas de segurança utilizadas, os riscos relacionados e as medidas adotadas para reverter
        ou mitigar os efeitos do incidente. Notificações de possíveis incidentes de segurança devem ser
        enviadas ao Encarregado (<EmailEncarregado />) ou ao suporte ({" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>);
        confirmamos o recebimento em até <strong>{PRAZO_CONFIRMACAO_DIAS_UTEIS} (cinco) dias úteis</strong> e
        damos uma resposta conclusiva (incluindo, se aplicável, as comunicações à ANPD e aos titulares
        afetados exigidas pelo art. 48 da LGPD) em até{" "}
        <strong>{PRAZO_RESPOSTA_DIAS_UTEIS} (quinze) dias úteis</strong> a contar do recebimento.
      </p>
    ),
  },
  {
    numero: "8",
    titulo: "Contato",
    conteudo: (
      <p>
        Relatos de vulnerabilidades de segurança podem ser enviados para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>; dúvidas
        sobre proteção de dados podem ser dirigidas ao Encarregado em <EmailEncarregado />.
      </p>
    ),
  },
]

export default function PoliticaSegurancaPage() {
  return (
    <LegalDocument
      titulo="Política de Segurança da Informação"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política descreve, com base na análise técnica do código-fonte, as medidas de segurança da
          informação efetivamente implementadas na Plataforma {NOME_FANTASIA}.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/retencao-dados", label: "Política de Retenção e Exclusão de Dados" },
      ]}
    />
  )
}
