import type { TurmaNivel } from "./niveis"

// Grade fixa de disciplinas do Ensino Fundamental I  a BNCC usa o mesmo conjunto de
// componentes curriculares do 1º ao 9º ano, só variando habilidades por ano (ver
// `lib/bncc/mapear-turma.ts`). Nomes aqui já batem exatamente com as chaves reconhecidas por
// `resolverEscopoBNCC` (a normalização de acento/maiúscula é feita lá). Robótica é exceção: sem
// componente BNCC próprio (sem entrada em `COMPONENTE_EF_POR_NOME`), então a sugestão de
// habilidades BNCC é pulada pra ela, igual já acontece com qualquer disciplina fora da grade oficial.
const DISCIPLINAS_EF1 = [
  "Língua Portuguesa",
  "Matemática",
  "Ciências",
  "História",
  "Geografia",
  "Arte",
  "Educação Física",
  "Língua Inglesa",
  "Ensino Religioso",
  "Robótica",
]

// Fundamental II: mesma base do Fundamental I, mais Língua Espanhola e Filosofia  comuns na
// grade a partir do 6º ano (Filosofia mais no 8º/9º) mas sem componente BNCC próprio (mesmo caso
// de Robótica acima: sem sugestão automática de habilidades).
const DISCIPLINAS_EF2 = [...DISCIPLINAS_EF1, "Língua Espanhola", "Filosofia"]

// Grade fixa do Ensino Médio  mantém Biologia/Física/Química/História/Geografia/Sociologia/
// Filosofia como disciplinas separadas (como o professor pensa no dia a dia), mesmo que por
// baixo dos panos `resolverEscopoBNCC` agrupe cada uma numa área do conhecimento do Novo Ensino
// Médio (ver `AREA_EM_POR_NOME` em `lib/bncc/mapear-turma.ts`).
const DISCIPLINAS_EM = [
  "Língua Portuguesa",
  "Matemática",
  "Biologia",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Sociologia",
  "Filosofia",
  "Arte",
  "Educação Física",
  "Língua Inglesa",
  "Língua Espanhola",
  "Redação",
]

/** Lista fixa de disciplinas pra um nível de ensino, ou `null` quando o nível não tem uma grade
 *  padronizada (Infantil é por campos de experiência; Técnico/EJA/Superior/Pós variam demais
 *  entre instituições)  nesses casos o nome da disciplina continua sendo texto livre. */
export function disciplinasFixasPorNivel(nivel: TurmaNivel): string[] | null {
  if (nivel === "fundamental_1") return DISCIPLINAS_EF1
  if (nivel === "fundamental_2") return DISCIPLINAS_EF2
  if (nivel === "medio") return DISCIPLINAS_EM
  return null
}
