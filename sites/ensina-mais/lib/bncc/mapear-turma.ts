import type { TurmaNivel } from "@/lib/turmas/niveis"

/** Escopo BNCC de uma turma real: o par etapa+componente+ano (Fundamental) ou etapa+área (Médio)
 *  usado pra filtrar, na api.bncc.dev, só as habilidades que fazem sentido pra aquela turma 
 *  ver `lib/bncc/api-bncc-dev.ts`. */
export type EscopoBNCC =
  | { etapa: "EF"; componenteSigla: string; ano: number }
  | { etapa: "EM"; areaId: string }

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim()
}

// Sigla de componente curricular do Ensino Fundamental (ver `componentes_curriculares` em
// GET /v1/estrutura)  chaves já normalizadas (sem acento, minúsculas). Cobre os nomes de
// disciplina mais comuns que um professor digita ao criar a turma; nomes que não baterem aqui
// simplesmente não geram sugestão de BNCC (fallback seguro, não uma tentativa de adivinhar).
const COMPONENTE_EF_POR_NOME: Record<string, string> = {
  "arte": "AR",
  "artes": "AR",
  "educacao artistica": "AR",
  "ciencias": "CI",
  "ciencia": "CI",
  "ciencias da natureza": "CI",
  // No Fundamental a BNCC não separa Biologia/Física/Química como no Médio  tudo cai no único
  // componente "Ciências"  mas é comum a turma (principalmente 9º ano) ser nomeada por uma
  // dessas áreas mesmo assim.
  "biologia": "CI",
  "fisica": "CI",
  "quimica": "CI",
  "educacao fisica": "EF",
  "ed. fisica": "EF",
  "ed fisica": "EF",
  "ensino religioso": "ER",
  "geografia": "GE",
  "historia": "HI",
  "lingua inglesa": "LI",
  "ingles": "LI",
  "lingua portuguesa": "LP",
  "portugues": "LP",
  "lingua portuguesa e literatura": "LP",
  "literatura": "LP",
  "redacao": "LP",
  "matematica": "MA",
}

// Id de área do conhecimento do Ensino Médio (ver `areas_conhecimento` em GET /v1/estrutura) 
// o Novo Ensino Médio não organiza a BNCC por componente/ano como o Fundamental, só por área
// (ver `buscarHabilidadesEM`), então várias disciplinas tradicionais caem na mesma área.
const AREA_EM_POR_NOME: Record<string, string> = {
  "lingua portuguesa": "em-area-lgg",
  "portugues": "em-area-lgg",
  "redacao": "em-area-lgg",
  "literatura": "em-area-lgg",
  "arte": "em-area-lgg",
  "artes": "em-area-lgg",
  "educacao fisica": "em-area-lgg",
  "ed. fisica": "em-area-lgg",
  "ed fisica": "em-area-lgg",
  "lingua inglesa": "em-area-lgg",
  "ingles": "em-area-lgg",
  "lingua espanhola": "em-area-lgg",
  "espanhol": "em-area-lgg",
  "matematica": "em-area-mat",
  "biologia": "em-area-cnt",
  "fisica": "em-area-cnt",
  "quimica": "em-area-cnt",
  "ciencias da natureza": "em-area-cnt",
  "historia": "em-area-chs",
  "geografia": "em-area-chs",
  "sociologia": "em-area-chs",
  "filosofia": "em-area-chs",
  "ciencias humanas": "em-area-chs",
}

/**
 * Resolve o escopo BNCC (etapa + componente/área + ano) de uma turma a partir do nível e da
 * série, e o nome da disciplina (`turmas.nome`)  usado pra restringir a busca de habilidades
 * candidatas na api.bncc.dev antes de pedir pra IA escolher (ver
 * `lib/ai/selecionar-habilidades-bncc.ts`).
 *
 * Devolve `null` quando a BNCC não se aplica ou a turma não dá informação suficiente pra
 * resolver com segurança  nesses casos a sugestão de BNCC é simplesmente pulada (a atividade é
 * gerada normalmente, só sem habilidades no rodapé):
 * - `infantil`: a BNCC organiza a Educação Infantil por campos de experiência, não por
 *   componente/ano  fora do escopo desta v1 (atividades avaliativas não fazem muito sentido
 *   pra essa faixa etária de qualquer forma).
 * - `tecnico`/`superior`/`pos_graduacao`: fora da Educação Básica coberta pela BNCC.
 * - `eja`: sem uma série/ano numérico direto (usa "1ª Etapa" etc.) pra mapear com confiança.
 * - nome da disciplina sem correspondência num componente/área conhecido (ex.: eletivas,
 *   nomes muito específicos)  melhor não sugerir do que adivinhar errado.
 */
export function resolverEscopoBNCC(
  turma: { nivel: TurmaNivel; serie: string | null | undefined },
  disciplina: string
): EscopoBNCC | null {
  const nome = normalizar(disciplina)

  if (turma.nivel === "fundamental_1" || turma.nivel === "fundamental_2") {
    const componenteSigla = COMPONENTE_EF_POR_NOME[nome]
    // `turma.serie` vem como "6º Ano"  parseInt já para no primeiro caractere não numérico.
    const ano = turma.serie ? parseInt(turma.serie, 10) : NaN
    if (!componenteSigla || !Number.isInteger(ano) || ano < 1 || ano > 9) return null
    return { etapa: "EF", componenteSigla, ano }
  }

  if (turma.nivel === "medio") {
    const areaId = AREA_EM_POR_NOME[nome]
    if (!areaId) return null
    return { etapa: "EM", areaId }
  }

  return null
}
