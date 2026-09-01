export type TurmaNivel =
  | "infantil"
  | "fundamental_1"
  | "fundamental_2"
  | "medio"
  | "tecnico"
  | "eja"
  | "superior"
  | "pos_graduacao"

// Fora de components/turmas-context.tsx (que tem "use client") de propósito: os route handlers
// de app/api/turmas/**/*.ts importam NIVEL_LABELS pra validar `nivel`. No Next.js App Router,
// importar um VALOR (não só o tipo) de um módulo "use client" a partir de código só-servidor faz
// o bundler trocar aquele export por uma referência de client component em vez do objeto real 
// `Object.keys(NIVEL_LABELS)` no servidor não devolvia as chaves reais, então a validação
// (`NIVEIS_VALIDOS.includes(body.nivel)`) falhava sempre, mesmo com um nível válido selecionado
// (400 "nome e nivel são obrigatórios" em toda tentativa de criar/editar turma).
export const NIVEL_LABELS: Record<TurmaNivel, string> = {
  infantil: "Educação Infantil",
  fundamental_1: "Fundamental I",
  fundamental_2: "Fundamental II",
  medio: "Ensino Médio",
  tecnico: "Técnico",
  eja: "EJA",
  superior: "Superior",
  pos_graduacao: "Pós-graduação",
}
