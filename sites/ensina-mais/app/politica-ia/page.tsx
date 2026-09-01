import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Política de IA",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Qual inteligência artificial usamos",
    conteudo: (
      <p>
        O {NOME_FANTASIA} utiliza modelos de dois provedores, dependendo do plano contratado: os planos
        Grátis e Básico utilizam o modelo “Gemini Flash Lite”, da Google (por meio da API{" "}
        <code>@google/genai</code>); o plano Premium utiliza o modelo “GPT-5 Mini”, da OpenAI (por meio da
        API <code>openai</code>), escolhido para oferecer aos assinantes Premium uma IA de qualidade e
        persona diferentes das usadas no plano gratuito/básico. Não utilizamos modelos de outros
        provedores (como Anthropic ou DeepSeek) em nenhuma etapa da geração de conteúdo.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "O que é enviado à IA",
    conteudo: (
      <ul className="list-disc pl-5 flex flex-col gap-1">
        <li>O tema digitado pelo professor;</li>
        <li>O conteúdo extraído de arquivos de referência eventualmente anexados (PDF enviado diretamente como dado multimodal; DOCX e TXT convertidos em texto antes do envio);</li>
        <li>Parâmetros de configuração: quantidade e tipos de questão, dificuldade, seções desejadas do plano de aula, duração da aula, entre outros definidos pelo professor;</li>
        <li>Para provas em planos pagos com a opção “usar questões reais de vestibular/ENEM” habilitada: uma consulta de busca é enviada ao Google Search (grounding), para recuperar questões reais existentes.</li>
      </ul>
    ),
  },
  {
    numero: "3",
    titulo: "Cache de contexto",
    conteudo: (
      <p>
        Para evitar reenviar o arquivo de referência inteiro a cada regeneração de questão, o conteúdo pode
        ser mantido em cache de contexto na infraestrutura do Gemini por até 1 (uma) hora após o último uso,
        associado a um hash do arquivo (nunca ao arquivo em texto legível fora desse mecanismo). Esse cache
        expira automaticamente e não é utilizado para nenhuma outra finalidade além de acelerar
        regenerações dentro da mesma janela de tempo.
      </p>
    ),
  },
  {
    numero: "4",
    titulo: "Uso do conteúdo para treinamento de modelos",
    conteudo: (
      <>
        <p>
          É compromisso do {NOME_FANTASIA} não utilizar o conteúdo que você envia para treinar ou aprimorar
          modelos de inteligência artificial, próprios ou de terceiros. Suas atividades, provas, planos de
          aula e materiais de referência permanecem de uso exclusivo da sua conta.
        </p>
        <p>
          Para o modelo Gemini (planos Grátis e Básico): a Plataforma opera sob a API paga do Gemini
          (com faturamento vinculado junto à Google), modalidade em que, pelos termos padrão da própria
          Google, os dados enviados <strong>não</strong> são usados para treinar ou melhorar seus produtos 
          diferentemente do nível gratuito de acesso à API, que a Google pode usar para essa finalidade.
        </p>
        <p>
          Para o modelo GPT-5 Mini (plano Premium): pelos termos padrão da OpenAI para acesso via API, os
          dados enviados <strong>não</strong> são usados para treinar ou melhorar modelos por padrão,
          independentemente do nível de faturamento contratado. A OpenAI mantém registros de uso para fins de
          monitoramento de abuso por até 30 dias, mesmo quando o dado em si não é usado para treinamento.
        </p>
      </>
    ),
  },
  {
    numero: "5",
    titulo: "Limites de qualidade e regras aplicadas à geração",
    conteudo: (
      <p>
        As instruções internas dadas ao modelo determinam regras de rigor pedagógico e factual, incluindo a
        orientação explícita para não inventar fatos, dados, datas ou referências bibliográficas específicas
        sem certeza de que existem, e para tratar adaptações de acessibilidade em termos gerais de boas
        práticas, nunca descrevendo ou diagnosticando um aluno real. Ainda assim, como todo modelo de
        linguagem, o Gemini pode produzir eventuais imprecisões (“alucinações”)  por isso a revisão humana
        do professor antes do uso do material é indispensável (ver{" "}
        <a href="/isencao-responsabilidade" className="underline text-(--brand)">Aviso de Isenção de
        Responsabilidade</a>).
      </p>
    ),
  },
  {
    numero: "6",
    titulo: "Decisões automatizadas",
    conteudo: (
      <p>
        A IA gera sugestões de conteúdo pedagógico, não decisões automatizadas que produzam efeitos
        jurídicos ou impactem significativamente terceiros (como notas, aprovação/reprovação de alunos ou
        avaliações institucionais)  essas decisões permanecem integralmente sob responsabilidade do
        professor. Nos termos do art. 20 da LGPD, você tem direito a solicitar revisão de decisões tomadas
        unicamente com base em tratamento automatizado de seus próprios dados pessoais; até o momento, não
        identificamos, no código analisado, decisões dessa natureza sendo tomadas pela Plataforma sobre o
        professor.
      </p>
    ),
  },
  {
    numero: "7",
    titulo: "Transferência internacional",
    conteudo: (
      <p>
        O processamento pela API do Gemini e pelo Google Search (Google) e pela API do GPT-5 Mini (OpenAI,
        plano Premium) ocorre em infraestrutura desses provedores, que pode estar localizada fora do
        Brasil, nos termos do art. 33 da LGPD  ver detalhes na{" "}
        <a href="/privacidade" className="underline text-(--brand)">Política de Privacidade</a>, Cláusula
        12.
      </p>
    ),
  },
  {
    numero: "8",
    titulo: "Contato",
    conteudo: (
      <p>
        Dúvidas sobre o uso de inteligência artificial na Plataforma podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function PoliticaIaPage() {
  return (
    <LegalDocument
      titulo="Política de IA"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Esta política explica, com base na análise do código-fonte, como o {NOME_FANTASIA} utiliza
          inteligência artificial para gerar atividades, provas e planos de aula: qual modelo é usado, o que
          é enviado a ele, e quais são seus limites.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/privacidade", label: "Política de Privacidade" },
        { href: "/isencao-responsabilidade", label: "Aviso de Isenção de Responsabilidade" },
        { href: "/direitos-autorais", label: "Aviso de Direitos Autorais" },
      ]}
    />
  )
}
