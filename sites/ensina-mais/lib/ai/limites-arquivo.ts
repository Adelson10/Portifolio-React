// Sem dependências  importado tanto por código de cliente (content-page.tsx, pra validar na
// hora da seleção do arquivo) quanto de servidor (extrair-conteudo-arquivo.ts), então não pode
// puxar nada pesado (ex.: pdf-lib) pro bundle do navegador.

/** Vercel limita o corpo de request/response de Serverless Functions a 4.5MB (FUNCTION_PAYLOAD_TOO_LARGE
 *  além disso)  e esse arquivo faz esse trajeto DUAS vezes antes de chegar na IA: primeiro como
 *  upload cru pra `/api/arquivo-referencia/preparar` (pré-processamento em paralelo, ver
 *  generator-modal.tsx), depois como o base64 já extraído voltando no corpo de
 *  `/api/atividades/gerar`/`/api/plano-de-aula/gerar`. Base64 já infla o arquivo original em ~33%
 *  sozinho; somado à margem que o modelo de estilo (`TAMANHO_MAXIMO_MODELO_DOCX_BYTES`) também
 *  disputa na segunda viagem, 2MB de arquivo real (~2.7MB em base64) é o teto que sobra folga
 *  confortável nas duas pontas. Não aumentar sem reconsiderar o formato de transporte (hoje é
 *  reenviado inteiro pelo cliente, não cacheado no servidor). */
export const TAMANHO_MAXIMO_ARQUIVO_BYTES = 2 * 1024 * 1024
export const TAMANHO_MAXIMO_ARQUIVO_MB = TAMANHO_MAXIMO_ARQUIVO_BYTES / (1024 * 1024)

/** Modelo de estilo (.docx de cabeçalho/logo, ver step-style.tsx)  enviado cru (sem base64) junto
 *  do resto do FormData de `/api/atividades/gerar`/`/api/plano-de-aula/gerar`. Sem limite próprio,
 *  um único upload já bastava pra estourar o teto de 4.5MB da Vercel (ver `TAMANHO_MAXIMO_ARQUIVO_BYTES`
 *  acima)  foi o gatilho mais provável do 413 em produção, já que esse campo nunca tinha validação
 *  de tamanho. 1MB é folgado pra um cabeçalho com logo. */
export const TAMANHO_MAXIMO_MODELO_DOCX_BYTES = 1 * 1024 * 1024
export const TAMANHO_MAXIMO_MODELO_DOCX_MB = TAMANHO_MAXIMO_MODELO_DOCX_BYTES / (1024 * 1024)

/** Só se aplica a PDF (único formato com contagem de páginas confiável sem renderizar o
 *  documento)  .txt/.docx viram texto simples embutido no prompt, sem noção de "página". */
export const MAX_PAGINAS_PDF = 30

/** Teto do PDF ORIGINAL (antes do recorte) no fluxo premium de "PDF com mais de `MAX_PAGINAS_PDF`
 *  páginas"  ver `components/pdf-page-range-modal.tsx`. Esse arquivo nunca é enviado ao servidor
 *  neste tamanho: contagem de páginas, miniaturas e o recorte em si acontecem inteiramente no
 *  navegador (pdfjs-dist + pdf-lib), e só o PDF já recortado (sujeito a `TAMANHO_MAXIMO_ARQUIVO_BYTES`
 *  normalmente) sai do cliente  por isso o teto aqui é só uma proteção contra o navegador travar
 *  tentando renderizar um arquivo absurdamente grande, não uma restrição de rede/Vercel. */
export const TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_BYTES = 50 * 1024 * 1024
export const TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_MB = TAMANHO_MAXIMO_ARQUIVO_PDF_GRANDE_BYTES / (1024 * 1024)
