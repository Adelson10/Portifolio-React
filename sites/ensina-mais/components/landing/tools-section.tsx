const RECURSOS_ACESSIBILIDADE = [
  { desc: "TEA / autismo" },
  { desc: "Baixa visão" },
  { desc: "Dislexia / TDAH" },
  { desc: "Adapta o vocabulário" },
]

export default function ToolsSection() {
  return (
    <section id="recursos" className="flex flex-col gap-6 scroll-mt-15 py-18">
      <div className="flex flex-col items-center text-center gap-3 mb-16">
        <span className="text-lg font-serif text-(--brand)">Recursos</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-balance">O que você cria em minutos</h2>
        <p className="text-base font-serif text-(--foreground)/60 max-w-xl text-balance">Escolha a ferramenta, descreva o conteúdo e a IA faz o resto.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-(--background) rounded-xl p-6 h-60 flex flex-col gap-5">
          <span className="text-4xl font-semibold">Atividades</span>
          <span className="text-sm text-(--foreground)/60 text-balance">
            Múltipla escolha, verdadeiro ou falso, dissertativa, completar lacunas e matemática  pronta pra aplicar em qualquer disciplina.
          </span>
        </div>
        <div className="bg-(--background) rounded-xl p-6 h-60 flex flex-col gap-5">
          <div className="flex justify-between">
            <span className="text-4xl font-semibold">Provas</span>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-(--foreground) bg-(--brand) rounded-full px-2 py-0.5">Fonte real do ENEM</span>
            </div>
          </div>
          <span className="text-sm text-(--foreground)/60 text-balance">
            Igual Atividades, com a opção de buscar questões reais do ENEM e vestibulares, com fonte citada.
          </span>
        </div>
        <div className="bg-(--background) rounded-xl p-6 h-60 flex flex-col gap-5">
          <span className="text-4xl font-semibold">Planos de Aulas</span>
          <span className="text-sm text-(--foreground)/60 text-balance">
            Objetivos de aprendizagem, metodologia, recursos didáticos, avaliação e gestão de tempo.
          </span>
        </div>
        <div className="sm:col-span-2 bg-(--background) rounded-xl p-6 h-auto sm:h-60 flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col gap-5 sm:flex-1">
            <span className="text-4xl font-semibold">Provas Adaptadas</span>
            <div className="hidden sm:grid grid-cols-[repeat(14,max-content)] gap-3">
              {Array.from({ length: 70 }).map((_, i) => (
                <span key={i} className="w-1 h-1 rounded-full bg-(--brand)/80" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-1 sm:justify-center">
            {RECURSOS_ACESSIBILIDADE.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-(--brand) shrink-0" />
                <span className="text-sm">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-(--background) rounded-xl p-6 h-60 flex flex-col gap-5">
          <span className="text-4xl font-semibold">Alinhado à BNCC</span>
          <span className="text-sm text-(--foreground)/60 text-balance">
            Adicione os códigos da Base Nacional Comum Curricular direto na atividade, prova ou plano de aula.
          </span>
        </div>
      </div>
    </section>
  )
}
