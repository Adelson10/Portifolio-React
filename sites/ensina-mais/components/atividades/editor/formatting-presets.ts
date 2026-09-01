// Normas de formatação acadêmica suportadas pelo editor.
// Fonte única de verdade para margens, fontes, espaçamento e alinhamento de título.
// IEEE e ACM estão incluídas mas com margens nulas (definidas por template externo).

export interface FormattingPreset {
  id: string
  nome: string
  /** Fontes permitidas pela norma, em ordem de preferência */
  fontes: string[]
  defaultFonte: string
  /** Tamanho de fonte CSS. Pode ser único ou por fonte (APA). */
  tamanhoFonte: string | Record<string, string>
  /** Multiplicador de line-height (1 = simples, 1.5, 2 = duplo) */
  espacamento: number
  /** Margens em px. null = definidas pelo template externo */
  margens: { top: number; bottom: number; left: number; right: number } | null
  tituloAlinhamento: "left" | "center" | "right"
  tituloNegrito?: boolean
  /** Se o corpo do texto deve ser justificado */
  textJustify: boolean
}

export const FORMATTING_PRESETS: FormattingPreset[] = [
  {
    id: "abnt",
    nome: "ABNT",
    fontes: ["Arial", "Times New Roman"],
    defaultFonte: "Arial",
    tamanhoFonte: "16px",
    espacamento: 1.5,
    margens: { top: 113, bottom: 76, left: 113, right: 76 },
    tituloAlinhamento: "center",
    textJustify: true,
  },
  {
    id: "apa",
    nome: "APA",
    fontes: ["Times New Roman", "Arial", "Calibri", "Georgia", "Lucida Sans Unicode", "Aptos"],
    defaultFonte: "Times New Roman",
    tamanhoFonte: {
      "Times New Roman":     "16px",
      "Arial":               "15px",
      "Calibri":             "15px",
      "Georgia":             "15px",
      "Lucida Sans Unicode": "13px",
      "Aptos":               "16px",
    },
    espacamento: 2,
    margens: { top: 96, bottom: 96, left: 96, right: 96 },
    tituloAlinhamento: "center",
    tituloNegrito: true,
    textJustify: false,
  },
  {
    id: "vancouver",
    nome: "Vancouver",
    fontes: ["Arial", "Times New Roman"],
    defaultFonte: "Arial",
    tamanhoFonte: "16px",
    espacamento: 1.5,
    margens: { top: 94, bottom: 94, left: 94, right: 94 },
    tituloAlinhamento: "center",
    textJustify: true,
  },
  {
    id: "ieee",
    nome: "IEEE",
    fontes: ["Times New Roman"],
    defaultFonte: "Times New Roman",
    tamanhoFonte: "13px",
    espacamento: 1,
    margens: null,
    tituloAlinhamento: "center",
    textJustify: true,
  },
  {
    id: "acm",
    nome: "ACM",
    fontes: ["Libertine", "Linux Biolinum"],
    defaultFonte: "Libertine",
    tamanhoFonte: "12px",
    espacamento: 1,
    margens: null,
    tituloAlinhamento: "center",
    textJustify: true,
  },
  {
    id: "sbc",
    nome: "SBC",
    fontes: ["Times New Roman"],
    defaultFonte: "Times New Roman",
    tamanhoFonte: "13px",
    espacamento: 1,
    margens: { top: 132, bottom: 94, left: 113, right: 113 },
    tituloAlinhamento: "center",
    textJustify: true,
  },
  {
    id: "mla",
    nome: "MLA",
    fontes: ["Times New Roman"],
    defaultFonte: "Times New Roman",
    tamanhoFonte: "16px",
    espacamento: 2,
    margens: { top: 96, bottom: 96, left: 96, right: 96 },
    tituloAlinhamento: "left",
    textJustify: false,
  },
  {
    id: "chicago",
    nome: "Chicago/Turabian",
    fontes: ["Times New Roman"],
    defaultFonte: "Times New Roman",
    tamanhoFonte: "16px",
    espacamento: 2,
    margens: { top: 96, bottom: 96, left: 96, right: 96 },
    tituloAlinhamento: "center",
    textJustify: false,
  },
  {
    id: "harvard",
    nome: "Harvard",
    fontes: ["Arial", "Times New Roman"],
    defaultFonte: "Arial",
    tamanhoFonte: "16px",
    espacamento: 1.5,
    margens: { top: 94, bottom: 94, left: 94, right: 94 },
    tituloAlinhamento: "center",
    textJustify: true,
  },
]

/** Fallback para normas cujas margens são definidas pelo template (IEEE, ACM). */
const TEMPLATE_MARGINS = { top: 96, bottom: 96, left: 96, right: 96 }

export function getPreset(id: string): FormattingPreset {
  return FORMATTING_PRESETS.find((p) => p.id === id) ?? FORMATTING_PRESETS[0]
}

export function getPresetMargins(preset: FormattingPreset) {
  return preset.margens ?? TEMPLATE_MARGINS
}

/** Retorna o tamanho de fonte CSS para a fonte selecionada. */
export function getPresetFontSize(preset: FormattingPreset, font: string): string {
  if (typeof preset.tamanhoFonte === "string") return preset.tamanhoFonte
  return preset.tamanhoFonte[font] ?? "16px"
}
