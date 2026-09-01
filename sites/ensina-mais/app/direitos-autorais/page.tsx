import type { Metadata } from "next"
import LegalDocument, { type Clausula } from "@/components/legal/legal-document"
import { NOME_FANTASIA, EMAIL_SUPORTE, PRAZO_CONFIRMACAO_DIAS_UTEIS, PRAZO_RESPOSTA_DIAS_UTEIS } from "@/lib/legal-info"

export const metadata: Metadata = {
  title: "Aviso de Direitos Autorais",
}

const ULTIMA_ATUALIZACAO = "27 de julho de 2026"

const clausulas: Clausula[] = [
  {
    numero: "1",
    titulo: "Propriedade intelectual da Plataforma",
    conteudo: (
      <p>
        O software, a marca {NOME_FANTASIA}, o código-fonte, o layout, os modelos de formatação
        pré-configurados (ABNT, APA, Vancouver, IEEE, ACM, SBC, MLA, Chicago, Harvard) e demais elementos
        criativos da Plataforma são protegidos pela Lei nº 9.610/1998 (Lei de Direitos Autorais) e pela Lei
        nº 9.609/1998 (Lei de Software), de titularidade do {NOME_FANTASIA} ou de seus licenciantes. É
        vedada a reprodução, distribuição ou exploração comercial não autorizada desses elementos.
      </p>
    ),
  },
  {
    numero: "2",
    titulo: "Responsabilidade do usuário sobre o conteúdo enviado",
    conteudo: (
      <p>
        Ao enviar um arquivo de referência (PDF, DOCX ou TXT) ou um modelo de formatação (.docx) à
        Plataforma, você declara deter os direitos autorais sobre esse material, ou autorização válida de
        seu titular para utilizá-lo dessa forma. O {NOME_FANTASIA} não verifica previamente a origem ou a
        titularidade de arquivos enviados pelos usuários  a responsabilidade por eventual violação de
        direitos autorais de terceiros é exclusiva de quem realizou o envio.
      </p>
    ),
  },
  {
    numero: "3",
    titulo: "Titularidade do conteúdo gerado por inteligência artificial",
    conteudo: (
      <>
        <p>
          A legislação brasileira de direitos autorais (Lei nº 9.610/1998) protege obras resultantes de
          criação intelectual humana. Conteúdo integralmente gerado por inteligência artificial, sem
          contribuição criativa humana relevante, encontra-se em zona de incerteza jurídica quanto à sua
          proteção autoral  tema ainda não pacificado na doutrina, jurisprudência ou legislação brasileiras
          no momento da elaboração deste aviso.
        </p>
        <p>
          Diante dessa incerteza, o {NOME_FANTASIA} adota a seguinte posição contratual: você é livre para
          usar, editar, reproduzir e distribuir o material gerado através da sua conta para os fins
          educacionais a que se destina, na extensão de seus direitos de uso da Plataforma. Havendo edição,
          seleção, organização ou adaptação humana relevante do material pelo professor no editor  o que é
          incentivado e esperado, nos termos do{" "}
          <a href="/isencao-responsabilidade" className="underline text-(--brand)">Aviso de Isenção de
          Responsabilidade</a> , essa contribuição humana poderá, a depender do caso concreto, qualificar o
          resultado final como obra autoral do professor, nos termos gerais da Lei nº 9.610/1998. O{" "}
          {NOME_FANTASIA} não reivindica titularidade autoral exclusiva sobre o Conteúdo Gerado específico
          da sua conta.
        </p>
      </>
    ),
  },
  {
    numero: "4",
    titulo: "Conteúdo de vestibular/ENEM obtido por busca",
    conteudo: (
      <p>
        Quando você utiliza o recurso de busca de questões reais de vestibular/ENEM (disponível em planos
        pagos, para provas), a Plataforma recupera questões existentes por meio de grounding do Google
        Search. Essas questões podem estar protegidas por direitos autorais de terceiros (bancas
        examinadoras e instituições responsáveis pelos exames de origem). O uso desse material é de
        responsabilidade do professor, que deve observar as regras de uso justo aplicáveis a fins
        educacionais e, quando exigido, a atribuição da fonte original.
      </p>
    ),
  },
  {
    numero: "5",
    titulo: "Notificação de violação de direitos autorais",
    conteudo: (
      <>
        <p>
          Como a Plataforma não publica ou compartilha conteúdo entre usuários  cada conta acessa apenas
          seus próprios materiais , o risco de infração a terceiros limita-se ao uso individual de arquivos
          enviados pelo próprio usuário. Ainda assim, se você é titular de direitos autorais e acredita que
          um usuário do {NOME_FANTASIA} os violou por meio de material enviado ou gerado na Plataforma, entre
          em contato pelo e-mail{" "}
          <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>,
          informando: (i) identificação da obra supostamente violada; (ii) descrição do material
          infrator e, se possível, como localizá-lo; (iii) seus dados de contato; e (iv) declaração de boa-fé
          de que o uso não foi autorizado pelo titular ou pela lei.
        </p>
        <p>
          <strong>Não foi identificado no código analisado</strong> um mecanismo automatizado de
          notificação e retirada (“notice and takedown”) integrado à Plataforma  o tratamento de
          notificações de violação de direitos autorais é, no momento, um processo manual conduzido pelo
          suporte, pelo canal indicado acima. Confirmamos o recebimento da notificação em até{" "}
          <strong>{PRAZO_CONFIRMACAO_DIAS_UTEIS} (cinco) dias úteis</strong> e damos uma resposta
          conclusiva  incluindo, se procedente, a remoção ou desativação do acesso ao material
          apontado  em até <strong>{PRAZO_RESPOSTA_DIAS_UTEIS} (quinze) dias úteis</strong> a contar do
          recebimento.
        </p>
      </>
    ),
  },
  {
    numero: "6",
    titulo: "Contato",
    conteudo: (
      <p>
        Questões sobre direitos autorais podem ser enviadas para{" "}
        <a href={`mailto:${EMAIL_SUPORTE}`} className="underline text-(--brand)">{EMAIL_SUPORTE}</a>.
      </p>
    ),
  },
]

export default function DireitosAutoraisPage() {
  return (
    <LegalDocument
      titulo="Aviso de Direitos Autorais"
      ultimaAtualizacao={ULTIMA_ATUALIZACAO}
      resumo={
        <p>
          Este aviso trata da propriedade intelectual da Plataforma, da responsabilidade do usuário sobre
          material enviado e da titularidade do conteúdo gerado com auxílio de inteligência artificial.
        </p>
      }
      clausulas={clausulas}
      relacionados={[
        { href: "/termos", label: "Termos de Uso" },
        { href: "/conteudo-usuario", label: "Política de Conteúdo do Usuário" },
        { href: "/politica-ia", label: "Política de IA" },
      ]}
    />
  )
}
