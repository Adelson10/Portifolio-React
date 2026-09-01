/** Dados de qualificação do responsável pela plataforma, centralizados aqui para não divergir
 *  entre os 10 documentos legais. */
export const NOME_FANTASIA = "Ensina Plus"
export const DOMINIO_INSTITUCIONAL = "ensinaplus.com"
export const DOMINIO_APP = "chat.ensinaplus.com"
export const EMAIL_SUPORTE = "faleconosco@ensinaplus.com"

export const NOME_RESPONSAVEL = "Adelson Barros Dos Santos"
export const CPF_RESPONSAVEL = "080.355.771-07"
export const ENDERECO_RESPONSAVEL = "Avenida Tiradentes, 1348, Centro, Colinas do Tocantins/TO, CEP 77760-000"
export const COMARCA_RESPONSAVEL = "Colinas do Tocantins/TO"

/** Corresponsável (sociedade de fato entre pessoas físicas, sem CNPJ registrado  ver arts. 986–990
 *  do Código Civil)  qualificada só por nome e CPF; o endereço acima é usado como sede/domicílio
 *  operacional da Plataforma para fins de notificação, comum a ambos os corresponsáveis. */
export const NOME_RESPONSAVEL_2 = "Jaqueline Rodrigues Correia"
export const CPF_RESPONSAVEL_2 = "058.340.641-67"

export function QualificacaoResponsavel() {
  return (
    <>
      {NOME_FANTASIA}, nome fantasia sob o qual <strong>{NOME_RESPONSAVEL}</strong>, pessoa física
      inscrita no CPF sob o nº {CPF_RESPONSAVEL}, e <strong>{NOME_RESPONSAVEL_2}</strong>, pessoa
      física inscrita no CPF sob o nº {CPF_RESPONSAVEL_2}, em sociedade de fato, com sede/domicílio
      operacional comum em {ENDERECO_RESPONSAVEL}, oferecem, conjunta e solidariamente, a
      Plataforma, doravante designados simplesmente <strong>{NOME_FANTASIA}</strong>,{" "}
      <strong>Plataforma</strong> ou <strong>nós</strong>.
    </>
  )
}

export function EmailEncarregado() {
  return <>{EMAIL_SUPORTE}</>
}

export function ForoContratual() {
  return <>comarca de {COMARCA_RESPONSAVEL}</>
}

/** Prazo de confirmação de recebimento (ex.: notificação de incidente de segurança, denúncia de
 *  direitos autorais) e prazo de resposta conclusiva  mesmo padrão já usado pra exclusão de conta
 *  (Política de Retenção de Dados, Cláusula 4), reaproveitado aqui pra não divergir entre documentos. */
export const PRAZO_CONFIRMACAO_DIAS_UTEIS = 5
export const PRAZO_RESPOSTA_DIAS_UTEIS = 15

/** Infraestrutura confirmada pelo responsável da Plataforma (não inferida do código). */
export const REGIAO_SUPABASE = "South America (São Paulo)"
export const PLANO_SUPABASE = "Pro"
