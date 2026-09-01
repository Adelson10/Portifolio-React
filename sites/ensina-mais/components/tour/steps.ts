/** Lado preferido do tooltip em relação ao alvo (ver `escolherPosicaoTooltip` em tour-overlay.tsx). */
export type TourLado = "direita" | "esquerda" | "cima" | "baixo"

/** Cena exibida pelo `MockApp` (components/tour/mock-app.tsx) enquanto o passo está ativo.
 *  `wizardGerar` é a etapa "Gerar" do assistente (resultado + Concluir), separada de
 *  `wizardConfig` (a etapa "Configurações" com os tipos de questão). */
export type TourCena = "home" | "modal" | "turma" | "wizardEstilo" | "wizardConfig" | "wizardGerar" | "editor" | "editorQuestao"

/** Ação decorativa aplicada pelo `snapshotForStep` ao entrar num passo - todas fictícias (nunca
 *  chamam API real): abrem/fecham telas falsas do MockApp, nunca criam nada de verdade. */
export type TourAcao =
  | "abrirModal"
  | "criarTurma"
  | "abrirWizard"
  | "avancarWizard"
  | "gerar"
  | "selecionarQuestao"
  | "enviarImagem"

export interface TourStep {
  /** `data-tour="<target>"` do elemento falso a destacar dentro do MockApp. Ausente nos passos "centro". */
  target?: string
  /** Passos sem `target` são exibidos como um cartão centralizado (boas-vindas/conclusão). */
  tipo?: "centro"
  /** Cena que o MockApp deve mostrar assim que este passo se torna o atual. */
  cena: TourCena
  /** Ação fictícia aplicada ao SAIR deste passo (avançar) - ver `snapshotForStep`. */
  acao?: TourAcao
  titulo: string
  texto: string
  lado?: TourLado
  /** Só usados nos passos "centro" (o cartão tem dois botões em vez de Voltar/Avançar). */
  primario?: string
  secundario?: string
}

/** Port do `PASSOS` do mockup (Tutorial Interativo.dc.html) para uma simulação local: nada aqui
 *  chama a API real, cria turma de verdade ou consome IA - é só uma encenação, exatamente como o
 *  mockup original. Passo extra (índice 8, "selecionar-proprio-modelo") a pedido do usuário:
 *  o mockup original só explicava "usar um modelo pronto", não o caminho de enviar o próprio
 *  cabeçalho da instituição. */
export const TOUR_STEPS: TourStep[] = [
  {
    tipo: "centro",
    cena: "home",
    titulo: "Bem-vindo ao Ensina Plus",
    texto: "Em um minuto você vê como criar a sua primeira turma e sair com uma atividade pronta para imprimir. É só uma demonstração - nada aqui é salvo de verdade. Pode sair quando quiser: o tutorial fica guardado no botão de ajuda.",
    primario: "Começar",
    secundario: "Agora não",
  },
  {
    target: "nova-turma",
    cena: "home",
    acao: "abrirModal",
    titulo: "Comece pela turma",
    texto: "Tudo o que você criar (atividade, prova, plano de aula) fica dentro de uma turma. Clique em Nova Turma.",
    lado: "direita",
  },
  {
    target: "campos-turma",
    cena: "modal",
    titulo: "Três campos e pronto",
    texto: "Disciplina, nível de ensino e a série. Em Superior e Pós-graduação o último campo passa a ser Período.",
    lado: "direita",
  },
  {
    target: "criar-turma",
    cena: "modal",
    acao: "criarTurma",
    titulo: "Crie a turma",
    texto: "Ela aparece na lista da esquerda e passa a ser a turma ativa.",
    lado: "cima",
  },
  {
    target: "abas",
    cena: "turma",
    titulo: "Escolha o que criar",
    texto: "Atividade, Prova ou Plano de Aula. A prova é igual à atividade, com a opção de buscar questões reais do ENEM e de vestibulares.",
    lado: "baixo",
  },
  {
    target: "campo-tema",
    cena: "turma",
    acao: "abrirWizard",
    titulo: "Diga o tema",
    texto: "Escreva em uma linha - \"Regra de três\" - ou use o clipe para anexar o material de apoio (PDF, DOCX ou TXT, até 2 MB). Depois clique na seta.",
    lado: "baixo",
  },
  {
    target: "modelo-pronto",
    cena: "wizardEstilo",
    titulo: "Etapa 1: use um modelo pronto...",
    texto: "Escolha entre os modelos disponíveis pra definir a aparência e a estrutura da atividade. É a opção mais rápida.",
    lado: "direita",
  },
  {
    target: "selecionar-proprio-modelo",
    cena: "wizardEstilo",
    titulo: "...ou envie o cabeçalho da sua escola",
    texto: "Um .docx contendo só as informações do cabeçalho - pode usar o recurso de Cabeçalho do Word (Inserir → Cabeçalho) ou simplesmente deixar só isso no topo da página, sem nada no corpo do documento. É o que aparece no exemplo abaixo: logo(s) da instituição e uma tabela com Nome, Turma e Data. Da próxima vez ele já vem selecionado.",
    lado: "esquerda",
  },
  {
    target: "avancar-wizard",
    cena: "wizardEstilo",
    acao: "avancarWizard",
    titulo: "Siga para as configurações",
    texto: "Clique em Próximo.",
    lado: "cima",
  },
  {
    target: "tipos",
    cena: "wizardConfig",
    titulo: "Etapa 2: as questões",
    texto: "Quantidade, dificuldade e os tipos de questão. Marque ao menos um tipo, senão o botão de gerar fica desligado.",
    lado: "direita",
  },
  {
    target: "avancar-wizard",
    cena: "wizardConfig",
    acao: "gerar",
    titulo: "Gere a atividade",
    texto: "A IA escreve as questões, checa as habilidades da BNCC e monta o documento. Leva alguns segundos.",
    lado: "cima",
  },
  {
    target: "avancar-wizard",
    cena: "wizardGerar",
    titulo: "Veja o resultado e conclua",
    texto: "Dá uma olhada no que a IA gerou e clique em Concluir para abrir a atividade no editor.",
    lado: "cima",
  },
  {
    target: "questao",
    cena: "editor",
    acao: "selecionarQuestao",
    titulo: "A folha, como vai imprimir",
    texto: "Este é o editor. Clique em qualquer questão para editar só ela.",
    lado: "direita",
  },
  {
    target: "imagem",
    cena: "editorQuestao",
    acao: "enviarImagem",
    titulo: "Adicione uma imagem",
    texto: "Envie do computador ou cole um endereço. Depois escolha onde ela entra, o tamanho e o alinhamento - ou arraste as alças na folha.",
    lado: "esquerda",
  },
  {
    target: "regerar",
    cena: "editorQuestao",
    titulo: "Não gostou? Regere",
    texto: "Refaz somente essa questão, mantendo o resto da atividade intacto.",
    lado: "esquerda",
  },
  {
    target: "acessibilidade",
    cena: "editor",
    titulo: "Adapte para a sua sala",
    texto: "Fonte grande, alto contraste, menos alternativas, mais espaçamento, linguagem simplificada. Valem na tela e no Word.",
    lado: "esquerda",
  },
  {
    target: "salvar",
    cena: "editor",
    titulo: "Salve as suas edições",
    texto: "Nada é salvo automaticamente: clique em Salvar Atualização quando terminar.",
    lado: "baixo",
  },
  {
    target: "baixar",
    cena: "editor",
    titulo: "Baixe em Word",
    texto: "Dois arquivos .docx: a prova e o gabarito, já com o cabeçalho da escola.",
    lado: "esquerda",
  },
  {
    tipo: "centro",
    cena: "editor",
    titulo: "É isso!",
    texto: "Turma → tema → estilo → configurações → editor → Word. Essa telinha toda foi só uma demonstração; para criar de verdade, feche o tutorial e comece pela Nova Turma. Para rever este passo a passo, clique no botão de ajuda no canto da tela.",
    primario: "Concluir",
    secundario: "Rever depois",
  },
]
