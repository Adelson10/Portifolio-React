import { Document, Footer, HeadingLevel, Packer, Paragraph, TextRun } from "docx"
import type { QuestaoGerada } from "./gerar-questoes"
import type { HabilidadeBNCC } from "@/lib/bncc/api-bncc-dev"

const LETRAS = ["A", "B", "C", "D", "E", "F"]
const ROMANOS = ["I", "II", "III", "IV", "V", "VI"]

/** Resposta do gabarito pronta para exibição  múltipla escolha e assercoes-multiplas ganham a
 *  letra da alternativa (ex.: "B) 550 veículos") pra não ficar só o texto cru repetindo a alternativa certa. */
function formatarRespostaGabarito(questao: QuestaoGerada): string {
  if ((questao.tipo === "multipla-escolha" || questao.tipo === "assercoes-multiplas") && questao.opcoes?.length) {
    const indice = questao.opcoes.indexOf(questao.gabarito)
    if (indice !== -1) return `${LETRAS[indice] ?? indice + 1}) ${questao.gabarito}`
  }
  return questao.gabarito
}

function paragrafosQuestao(questao: QuestaoGerada, numero: number): Paragraph[] {
  const paragrafos = [
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: `${numero}. `, bold: true }),
        new TextRun({ text: questao.enunciado }),
      ],
    }),
  ]

  if (questao.tipo === "assercoes-multiplas" && questao.afirmativas?.length) {
    for (const [i, afirmativa] of questao.afirmativas.entries()) {
      paragrafos.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: `${ROMANOS[i] ?? i + 1} - ${afirmativa}` })],
        })
      )
    }
  }

  if ((questao.tipo === "multipla-escolha" || questao.tipo === "assercoes-multiplas") && questao.opcoes?.length) {
    for (const [i, opcao] of questao.opcoes.entries()) {
      paragrafos.push(
        new Paragraph({
          indent: { left: 360 },
          children: [new TextRun({ text: `${LETRAS[i] ?? i + 1}) ${opcao}` })],
        })
      )
    }
  }

  if (questao.tipo === "verdade-falso") {
    paragrafos.push(
      new Paragraph({
        indent: { left: 360 },
        children: [new TextRun({ text: "(   ) Verdadeiro      (   ) Falso" })],
      })
    )
  }

  if (questao.tipo === "dissertativo" || questao.tipo === "matematica") {
    const linhas = questao.numeroLinhas ?? 4
    for (let i = 0; i < linhas; i++) {
      paragrafos.push(new Paragraph({ text: "_".repeat(90), spacing: { before: 200 } }))
    }
  }

  return paragrafos
}

/** Rodapé com os códigos da BNCC detectados pela IA (ver lib/bncc/detectar-habilidades.ts)  só
 *  os códigos, sem descrição (ex.: "BNCC: EF01LP10, EF01LP05")  chamada só quando a lista não é
 *  vazia (ver `gerarAtividadeDocx` abaixo), pra não desenhar um rodapé em branco. */
function rodapeHabilidadesBNCC(habilidadesBNCC: HabilidadeBNCC[]): Footer {
  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 40 },
        children: [
          new TextRun({ text: "BNCC: ", bold: true, size: 16 }),
          new TextRun({ text: habilidadesBNCC.map((h) => h.codigo).join(", "), size: 16 }),
        ],
      }),
    ],
  })
}

export async function gerarAtividadeDocx(titulo: string, questoes: QuestaoGerada[], habilidadesBNCC: HabilidadeBNCC[] = []): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        ...(habilidadesBNCC.length && { footers: { default: rodapeHabilidadesBNCC(habilidadesBNCC) } }),
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, text: titulo }),
          new Paragraph({ text: "Nome: _____________________________________   Data: ___/___/___", spacing: { after: 300 } }),
          ...questoes.flatMap((questao, i) => paragrafosQuestao(questao, i + 1)),
          new Paragraph({ heading: HeadingLevel.HEADING_2, text: "Gabarito", pageBreakBefore: true }),
          // Dissertativo/matemática repetem o enunciado antes da resposta  sem ele, a resposta
          // sozinha (ex.: só a resolução do cálculo) fica sem contexto nenhum.
          ...questoes.flatMap((questao, i) => {
            const comEnunciado = questao.tipo === "dissertativo" || questao.tipo === "matematica"
            const resposta = formatarRespostaGabarito(questao)
            const paragrafos = [
              new Paragraph({
                spacing: { after: comEnunciado ? 40 : 120 },
                children: [
                  new TextRun({ text: `${i + 1}. `, bold: true }),
                  new TextRun({ text: comEnunciado ? questao.enunciado : resposta }),
                ],
              }),
            ]
            if (comEnunciado) {
              paragrafos.push(new Paragraph({
                indent: { left: 360 },
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: "Resposta: ", bold: true }),
                  new TextRun({ text: resposta }),
                ],
              }))
            }
            return paragrafos
          }),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
