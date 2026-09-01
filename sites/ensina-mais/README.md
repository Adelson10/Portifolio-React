# Ensina Plus (Professor Plus)

SaaS voltado para professores que usa IA (Google Gemini) para gerar **atividades**, **provas** e **planos de aula** com formatação configurável (ABNT, APA, IEEE, etc.), organizados por **turma**. Inclui landing page pública, autenticação, assinaturas via Stripe e um editor visual de documentos em folha A4 com exportação para Word.

---

## Stack

| Camada       | Tecnologia                                          |
|--------------|------------------------------------------------------|
| Framework    | Next.js 16 (App Router, React 19)                    |
| Linguagem    | TypeScript 5                                          |
| Estilo       | Tailwind CSS v4                                       |
| Ícones       | Phosphor Icons React                                  |
| Auth         | Supabase Auth (e-mail/senha + OAuth Google)           |
| Banco        | Supabase (PostgreSQL + Row-Level Security), sem ORM   |
| Storage      | Supabase Storage (buckets `atividades`, `modelos`, `avatars`) |
| Pagamento    | Stripe (Checkout Sessions em modo `elements`, assinaturas) |
| IA           | Google Gemini (`@google/genai`), com grounding via Google Search para questões de vestibular |
| Documentos   | `docx` (geração de `.docx`), parser OOXML próprio (`.docx` → JSON), `mammoth` (extração de texto de `.docx`), `pdf-lib` (validação/recorte de páginas de PDF), `unpdf` (extração de texto de PDF para a triagem de páginas por tema) |
| BNCC         | `api.bncc.dev` (API pública, sem key, com as habilidades da BNCC homologadas pelo MEC) |
| Drag & drop  | `@dnd-kit` (reordenação de questões no editor) |

Não há mais `prisma/`: o projeto migrou para acesso direto ao Supabase (Postgres) com RLS como camada de segurança, reforçada por checagens de autorização no próprio código das rotas de API.

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>       # usado só em contexto sem sessão (ex.: webhook Stripe)

# IA (Google Gemini)
GEMINI_API_KEY=<chave-gemini>                       # usada pelos planos "gratis" e "basico"
GEMINI_API_KEY_PREMIUM=<chave-gemini-premium>        # opcional; se ausente, cai no GEMINI_API_KEY

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_PRICE_BASICO_MENSAL=price_...
STRIPE_PRICE_PREMIUM_MENSAL=price_...
STRIPE_PRICE_PREMIUM_ANUAL=price_...
```

O schema do banco (tabelas, RLS, funções RPC) é gerenciado via migrations SQL em `supabase/` (fora do escopo deste README), não via Prisma.

---

## Como rodar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev              # http://localhost:3000

# Build de produção
npm run build
npm start

# Lint
npm run lint

# Reconciliar manualmente uma assinatura Stripe ↔ Supabase (quando o webhook falhou)
npm run sync-stripe -- --usuario-id=<uuid> [--email=<email> | --subscription=sub_xxx]
```

---

## Estrutura de pastas

```
professor-plus/
├── app/
│   ├── layout.tsx                       # Layout raiz: fonte, metadata, aplica tema antes da hidratação
│   ├── globals.css                      # Tailwind v4 + variáveis de tema + estilos de features (impressão A4, hero da landing)
│   ├── inicio/page.tsx                  # Landing page institucional (servida em ensinaplus.com)
│   ├── privacidade/, termos/, cookies/, conteudo-usuario/, direitos-autorais/,
│   │   isencao-responsabilidade/, politica-conta/, politica-ia/,
│   │   politica-seguranca/, retencao-dados/  # 10 documentos legais (LegalDocument)
│   ├── auth/callback/route.ts           # Troca o "code" OAuth/PKCE do Supabase por sessão
│   ├── checkout/
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Checkout de assinatura via Stripe Elements
│   ├── (auth)/                          # Route group sem sidebar
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── redefinir-senha/page.tsx
│   ├── (dashboard)/                     # Route group autenticado (com sidebar)
│   │   ├── layout.tsx                   # Busca sessão, monta TurmasProvider + Sidebar + NovaTurmaModal
│   │   ├── page.tsx                     # Home: lista de turmas (ContentPage showTurmas)
│   │   ├── pricing/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                 # Planos/preços dentro do app logado
│   │   └── t/[id]/                      # Namespace de rotas por turma
│   │       ├── page.tsx                 # Redireciona para t/[id]/atividades
│   │       ├── atividades/
│   │       │   ├── page.tsx             # Lista atividades da turma
│   │       │   └── editar/
│   │       │       ├── page.tsx         # Criar nova atividade
│   │       │       └── [atividadeId]/page.tsx  # Editar atividade existente
│   │       ├── provas/
│   │       │   ├── page.tsx
│   │       │   └── editar/[atividadeId]/page.tsx
│   │       └── plano-de-aula/
│   │           ├── page.tsx
│   │           └── editar/[atividadeId]/page.tsx
│   └── api/
│       ├── arquivo-referencia/preparar/route.ts # POST  extrai/filtra o arquivo de referência em paralelo, antes do "Gerar"
│       ├── turmas/route.ts              # GET (listar), POST (criar)
│       ├── turmas/[id]/route.ts         # PATCH (editar), DELETE (apagar + limpar storage)
│       ├── atividades/route.ts          # GET (listar por turma), POST (criar vazia)
│       ├── atividades/[id]/route.ts     # GET, PUT (salvar edição), DELETE
│       ├── atividades/gerar/route.ts    # POST  geração via IA (atividade/prova)
│       ├── atividades/limite/route.ts   # GET  status de cota do plano atual
│       ├── plano-de-aula/[id]/route.ts  # GET
│       ├── plano-de-aula/gerar/route.ts # POST  geração de plano de aula via IA
│       ├── questoes/regenerar/route.ts  # POST  regenera uma questão avulsa
│       ├── modelos-template/route.ts    # GET  lista modelos .docx já enviados
│       ├── parse-modelo/route.ts        # GET/POST  parser OOXML de .docx para JSON
│       ├── usuarios/avatar/route.ts     # POST  upload de foto de perfil
│       ├── stripe/checkout/route.ts     # POST  cria Checkout Session
│       ├── stripe/cancelar/route.ts     # POST  agenda cancelamento no fim do período
│       ├── stripe/faturas/route.ts      # GET  histórico de faturas
│       └── webhooks/stripe/route.ts     # POST  sincroniza plano com eventos do Stripe
├── components/
│   ├── sidebar.tsx / mobile-topbar.tsx  # Navegação principal (turmas, cota, perfil)
│   ├── content-page.tsx                 # Página de listagem genérica (turmas ou conteúdo de uma turma)
│   ├── generator-modal.tsx              # Wizard de geração (Estilo → Config → Gerar)
│   ├── turmas-context.tsx               # Estado global de turmas (Context API)
│   ├── nova-turma-modal.tsx             # Modal de criar/editar turma
│   ├── auth-form.tsx                    # Login / cadastro / recuperação de senha
│   ├── checkout-form.tsx                # Stripe Elements (pagamento)
│   ├── pricing-plans.tsx                # Tela de planos (logada)
│   ├── profile-modal.tsx / settings-modal.tsx
│   ├── legal/legal-document.tsx         # Layout compartilhado pelos 10 documentos legais (título, índice, cláusulas)
│   ├── atividades/
│   │   ├── steps/                       # Etapas do wizard (Estilo, Config, Gerar)
│   │   └── editor/                      # Editor A4 completo (preview, paginação, export .docx)
│   ├── plano-de-aula/
│   │   ├── step-config.tsx / step-generate.tsx
│   │   └── editor/plano-aula-editor.tsx
│   └── landing/                         # Seções da landing page pública
├── lib/
│   ├── ai/                              # Prompts, chamadas ao Gemini, geração de .docx, cache de contexto
│   │   ├── selecionar-habilidades-bncc.ts # IA escolhe, entre candidatas oficiais, quais habilidades BNCC a atividade trabalha
│   │   └── filtrar-paginas-pdf.ts       # Filtra páginas de um PDF de referência grande por tema (Gemini Flash-Lite)
│   ├── bncc/                            # Integração com a BNCC: escopo por turma, cliente da api.bncc.dev
│   ├── atividades/                      # Autorização (dono), cotas por plano, resolução de modelo de estilo
│   ├── turmas/niveis.ts                 # Enum de níveis de ensino (compartilhado client/server)
│   ├── auth.ts / auth-errors.ts         # Server actions de autenticação + tradução de erros
│   ├── supabase.ts / supabase-server.ts / supabase-admin.ts
│   ├── stripe.ts / stripe-client.ts
│   ├── site.ts                          # URLs/domínios multi-subdomínio, sanitização de redirect
│   ├── legal-info.tsx                   # Dados de qualificação do responsável, centralizados p/ os 10 docs legais
│   └── theme.ts                         # Tema claro/escuro persistido em cookie
├── scripts/sync-stripe-assinatura.ts    # Reconciliação manual Stripe ↔ Supabase
├── assents/                             # Logo (SVG) e imagens estáticas da landing
├── supabase/                            # Migrations SQL (schema, RLS, funções RPC)
├── next.config.ts                       # Headers de segurança HTTP
└── proxy.ts                             # Middleware: auth, rotas protegidas, rewrite multi-domínio
```

---

## Descrição dos arquivos

### `app/`  layouts, páginas e configuração global

#### `app/layout.tsx`
Layout raiz (Server Component). Define fonte `Inter`, metadata padrão (`"Ensina Plus"`, com template `%s | Ensina Plus` para as demais páginas) e viewport com `viewportFit: "cover"` (necessário para o Safari iOS respeitar `env(safe-area-inset-bottom)` em painéis colados ao fundo da tela). Injeta um script inline no `<head>` que lê o cookie `tema` (não `localStorage`, para funcionar entre subdomínios) e aplica a classe `light`/`dark` no `<html>` **antes** da hidratação do React, evitando flash do tema errado.

#### `app/globals.css`
Tailwind v4 (`@import "tailwindcss"`) com dark mode via classe (`@variant dark`). Paleta definida em `:root`, sobrescrita por `prefers-color-scheme` (tema "Sistema") e por `:root.dark`/`:root.light` (tema forçado pelo usuário, maior especificidade). Contém estilos específicos de features: fundo animado do hero da landing (`.hero-glow-field`, `.triangle-grid`, com respeito a `prefers-reduced-motion`), scrollbar customizada da landing, reset do `<select>` nativo, e um bloco `@media print` que implementa impressão paginada em folhas A4 reais (21×29.7cm) usado pela exportação/preview de atividades.

#### `app/inicio/page.tsx`
Landing page institucional, servida em `ensinaplus.com` (via rewrite do middleware). Busca a sessão do usuário no servidor para decidir entre `HeroAccessCard` (logado) e `HeroLoginCard` (visitante). Monta as seções: Hero → Recursos (`ToolsSection`) → Como funciona (`FlowSteps`) → Segurança (`SecuritySection`) → Planos (`PricingSection`) → FAQ (`FaqAccordion`) → rodapé com links legais.

#### `app/privacidade/`, `app/termos/` e mais 8 documentos legais
`privacidade`, `termos`, `cookies`, `conteudo-usuario`, `direitos-autorais`, `isencao-responsabilidade`, `politica-conta`, `politica-ia`, `politica-seguranca`, `retencao-dados`  10 páginas estáticas, todas renderizadas pelo layout compartilhado `components/legal/legal-document.tsx` (título, resumo, índice navegável, cláusulas numeradas). Dados de qualificação do responsável pela plataforma (razão social, CNPJ, endereço, e-mail do DPO, foro contratual) ficam centralizados em `lib/legal-info.tsx` para não divergir entre os 10 documentos; campos ainda não confirmados usam o componente `<Pendente>`, destacado visualmente até serem preenchidos com validade jurídica antes da publicação. `app/inicio/page.tsx` linka todos no rodapé.

#### `app/auth/callback/route.ts`
Route Handler que finaliza o fluxo OAuth/PKCE do Supabase: troca `code` por sessão (`exchangeCodeForSession`) e redireciona para `next` (sanitizado via `lib/site`) ou `/`. Em erro, redireciona para `/login?error=auth_callback`.

#### `app/checkout/page.tsx`
Página de checkout de assinatura (Client Component, fora do grupo `(dashboard)`). Lê `preco` da query string, resolve os dados de exibição do plano localmente (não importa `lib/stripe.ts` diretamente pois esse módulo instancia o SDK server-side), busca `clientSecret` via `POST /api/stripe/checkout` e renderiza o formulário Stripe Elements (`components/checkout-form.tsx`).

#### `app/(auth)/login/page.tsx` e `app/(auth)/redefinir-senha/page.tsx`
Renderizam `AuthForm` em diferentes modos (`login`, `cadastro`, `nova-senha`) conforme query params. `redefinir-senha` é o destino para onde o middleware redireciona sessões do tipo "recovery".

#### `app/(dashboard)/layout.tsx`
Busca o usuário autenticado e seu `avatar_url`, envolve toda a árvore em `TurmasProvider` (estado global de turmas) e monta `Sidebar` + `MobileTopbar` + `NovaTurmaModal` (modal de criação/edição de turma, disponível globalmente, fora do fluxo de rotas).

#### `app/(dashboard)/page.tsx`
Home do dashboard: lista as turmas do professor via `ContentPage showTurmas`.

#### `app/(dashboard)/pricing/page.tsx`
Tela de planos dentro do app logado; busca o plano atual (`/api/atividades/limite`) e renderiza `PricingPlans`.

#### `app/(dashboard)/t/[id]/...`
Namespace de rotas por turma  todo conteúdo (atividades, provas, planos de aula) é sempre relativo a uma turma. `t/[id]/page.tsx` redireciona para `t/[id]/atividades` (aba padrão). Cada seção segue o padrão *lista* (`ContentPage` com `turmaId`) + *editor* (`editar/[atividadeId]`). `ActivityEditor` é reaproveitado tanto para atividades quanto para provas (diferenciado pela prop `tipo="prova"`); planos de aula usam um editor próprio (`PlanoAulaEditor`).

---

### `app/api/`  rotas de backend

Convenções compartilhadas por quase todas as rotas:
- Autenticação via `createServerSupabaseClient()` + `supabase.auth.getUser()`; sem usuário, `401`.
- Como a tabela `atividades` não guarda `usuario_id` diretamente, o dono é sempre resolvido pela cadeia `atividades.turma_id → turmas.usuario_id` (helper `verificarDonoDaAtividade`, em `lib/atividades/dono.ts`).
- As checagens de autorização no código são **defesa em profundidade** além das políticas de Row-Level Security do Supabase  evitam também mensagens de erro genéricas.
- Quando não há registro em `assinaturas`, o plano é sempre tratado como `"gratis"` (nunca cai em plano pago por padrão).

#### `app/api/turmas/route.ts`
- `GET`: lista as turmas do usuário com contagem de atividades/provas (calculada em memória a partir de `atividades.tipo`, sem contar planos de aula).
- `POST`: cria uma turma (`nome`, `nivel` validado contra `lib/turmas/niveis.ts`, `serie`/`periodo` opcionais).

#### `app/api/turmas/[id]/route.ts`
- `PATCH`: edita a turma; o filtro `.eq("usuario_id", user.id)` é embutido na própria query de update  se a turma não pertencer ao usuário, o update não afeta linhas e a resposta é `404`.
- `DELETE`: antes de apagar a turma, remove do Storage os `.docx` de todas as atividades vinculadas (best-effort); a exclusão da turma cascateia no banco a remoção de atividades/questões/planos de aula.

#### `app/api/atividades/route.ts`
- `GET ?turmaId=`: lista atividades/provas/planos de uma turma.
- `POST`: cria uma atividade "vazia" (sem gerar via IA), com formatação/fonte padrão.

#### `app/api/atividades/[id]/route.ts`
- `GET`: retorna a atividade completa (questões + configuração + imagens de questão) para o editor.
- `PUT`: autosave do editor  **substitui** todas as questões (delete + insert) em vez de casar por id, pois IDs do lado do cliente podem ter sido gerados localmente antes de existir linha no banco. Valida cada campo de questão (tipo, layout, dificuldade, imagem) individualmente.
- `DELETE`: apaga o `.docx` do Storage (best-effort) e o registro no banco.

#### `app/api/arquivo-referencia/preparar/route.ts`
`POST`: extrai e (quando há tema e o PDF é grande) filtra por relevância o arquivo de referência. Disparada por `generator-modal.tsx` assim que o modal abre, em paralelo enquanto o professor passa pelas etapas "Estilo"/"Configurações"  esconde a latência dessa etapa extra. O resultado (`arquivoPreprocessado`) é reenviado pelo cliente na chamada final de geração, que pula a extração/filtragem se ele já veio pronto (`tentarParsearArquivoPreprocessado`, em `lib/ai/extrair-conteudo-arquivo.ts`); se o pré-processamento falhar ou não chegar a tempo, o cliente cai de volta para enviar o arquivo cru  sem regressão.

#### `app/api/atividades/gerar/route.ts`
Rota central de geração via IA para atividades/provas. Recebe `multipart/form-data` (turma, título ou arquivo de referência  cru ou já pré-processado via `arquivoPreprocessado` , quantidade/tipos de questão, dificuldade, flag de busca vestibular, modelo de estilo). Fluxo: valida entrada → checa cota (`reservarGeracao`, atômica via RPC Postgres) → opcionalmente busca questões reais de vestibular via grounding do Google (só para provas, cota própria) → chama `gerarQuestoes` (Gemini) → em erro, cancela a reserva de cota → resolve o modelo de estilo → detecta habilidades BNCC compatíveis com o conteúdo gerado (`detectarHabilidadesBNCC`, best-effort  nunca bloqueia a geração) → persiste atividade + questões (+ `codigos_bncc`) → gera `.docx` (`gerarAtividadeDocx`, com o rodapé de habilidades BNCC) → sobe ao Storage → retorna `{ atividadeId, questoes, docxUrl }` (signed URL de 1h).

#### `app/api/atividades/limite/route.ts`
`GET`: retorna o consumo de cota do usuário no plano atual (mensal, diário quando aplicável, e de buscas vestibular), usado pela UI para barras de progresso e bloqueios.

#### `app/api/plano-de-aula/[id]/route.ts` e `app/api/plano-de-aula/gerar/route.ts`
Estrutura análoga à de atividades, adaptada para planos de aula: seções configuráveis (objetivos, habilidades BNCC, competências, metodologia, avaliação etc.), duração máxima de 120 min, sem busca vestibular. Compartilha a mesma cota mensal/diária de "gerações" com atividades/provas.

#### `app/api/questoes/regenerar/route.ts`
Regenera uma única questão avulsa (botão "Regerar" no editor), sem persistir  devolve a questão nova para o cliente substituir no estado local. Tem cota **própria e diária**, independente da cota de "gerar atividade nova" (evita custo ilimitado de IA via chamadas repetidas). Reaproveita o cache de contexto do Gemini da atividade original quando disponível.

#### `app/api/modelos-template/route.ts` e `app/api/parse-modelo/route.ts`
- `modelos-template` (`GET`): lista os `.docx` de estilo já enviados pelo usuário.
- `parse-modelo` (`GET`/`POST`): parser OOXML de `.docx` escrito à mão (sem biblioteca externa)  descompacta o ZIP e interpreta o XML para extrair parágrafos, tabelas, imagens, formas, text-boxes, listas, cabeçalho/rodapé, bordas e margens de página como uma árvore de `DocxElement[]`, usada para aplicar o "estilo" do modelo enviado às atividades geradas. Tem proteção explícita contra zip bomb (limite de tamanho de entrada e de descompressão total).

#### `app/api/usuarios/avatar/route.ts`
`POST`: upload de foto de perfil (JPEG/PNG/WEBP/GIF, até 2MB) para o bucket `avatars`, com URL pública cache-busted.

#### `app/api/stripe/checkout/route.ts`, `app/api/stripe/cancelar/route.ts`, `app/api/stripe/faturas/route.ts`
- `checkout`: cria uma Stripe Checkout Session em modo `elements` (formulário embutido) para o plano escolhido, associando `usuario_id` via `metadata` (única forma do webhook saber a quem atribuir a assinatura depois).
- `cancelar`: agenda o cancelamento para o fim do período já pago (`cancel_at_period_end`)  não corta acesso imediatamente; quem efetivamente grava `plano: "gratis"` é o webhook, quando o período termina de fato.
- `faturas`: lista o histórico de faturas do cliente Stripe associado ao usuário.

#### `app/api/webhooks/stripe/route.ts`
Única fonte que grava/atualiza `assinaturas.plano` fora do estado inicial "sem registro = gratis". Valida a assinatura HMAC do header `stripe-signature` com o corpo cru da requisição. Trata `checkout.session.completed` (ativa o plano), `customer.subscription.updated` (upgrade/downgrade/status) e `customer.subscription.deleted` (volta para `gratis`).

---

### `components/`  componentes de UI

#### `components/turmas-context.tsx`
Núcleo da feature de **Turmas**: Context API compartilhado por sidebar, listagem "Minhas Turmas", modal de criação/edição e páginas `/t/[id]/*`. Carrega as turmas via `GET /api/turmas` ao montar; expõe `addTurma`/`updateTurma`/`removeTurma` (todas checam `res.ok` explicitamente antes de aceitar a resposta, para não empurrar um erro `{error:...}` do backend para a lista como se fosse uma turma real). Também controla a abertura do `NovaTurmaModal` (criação vs. edição) e o estado da gaveta mobile da sidebar. Re-exporta `NIVEL_LABELS`/`TurmaNivel` de `lib/turmas/niveis.ts`  esse módulo fica deliberadamente fora de qualquer arquivo `"use client"` porque as rotas de API também precisam do valor `NIVEL_LABELS` em runtime de servidor (um import de valor vindo de um módulo client seria substituído pelo bundler por uma referência quebrada).

#### `components/nova-turma-modal.tsx`
Modal de criação/edição de turma (nome, nível de ensino, série ou período  período só se aplica a "superior"/"pós-graduação"). Reidrata o formulário a partir de `turmaEditando` quando em modo edição; mantém o modal aberto e mostra erro se a chamada ao backend falhar.

#### `components/content-page.tsx`
Página de listagem genérica reaproveitada em quatro contextos: "Minhas Turmas" (`showTurmas`), e as listas de atividades/provas/planos de uma turma (`turmaId`). Busca os itens via `GET /api/atividades?turmaId=`, abre o `GeneratorModal` para criar conteúdo novo (a partir de um tema digitado e/ou arquivo anexado) e cada item navega para `/t/{id}/{tipo}/editar/{itemId}`.

#### `components/generator-modal.tsx`
Wizard de geração de conteúdo (único fluxo de geração real do produto). Três etapas: **Estilo** (`StepStyle`) → **Configurações** (`StepConfig` para atividade/prova, `StepConfigPlano` para plano de aula) → **Gerar** (`StepGenerate`/`StepGeneratePlano`). Ao entrar na última etapa, dispara automaticamente `POST /api/atividades/gerar` ou `POST /api/plano-de-aula/gerar`. Ao concluir, navega para o editor (`/t/{turmaId}/{...}/editar/{atividadeId}`). Exige uma turma ativa para permitir gerar.

#### `components/sidebar.tsx` / `components/mobile-topbar.tsx`
Navegação principal: lista de turmas (link para `/t/{id}`), botão "Nova Turma", uso de cota (barra de progresso mensal/diário, via `/api/atividades/limite`), menu de perfil (`ProfileModal`, `SettingsModal`, `/pricing`, logout). Colapsa/expande no desktop (cookie `sidebar-collapsed`); vira gaveta off-canvas no mobile, controlada pelo `TurmasProvider` e aberta pelo `MobileTopbar`.

#### `components/auth-form.tsx`
Formulário único que cobre login, cadastro (com verificação de e-mail já existente via debounce) e os dois passos de recuperação de senha (solicitar link, definir nova senha), incluindo tratamento específico para o Gmail no Android pré-carregar o link de reset e invalidar o token antes do toque do usuário.

#### `components/checkout-form.tsx`
`StripeElementsProvider` (detecta tema claro/escuro via `matchMedia`, pois o iframe da Stripe não enxerga variáveis CSS da página) e `ConfirmarAssinaturaButton` (confirma o pagamento via Stripe Checkout Elements).

#### `components/pricing-plans.tsx` / `components/profile-modal.tsx` / `components/settings-modal.tsx`
- `pricing-plans`: grade de planos (Grátis/Básico/Premium, mensal/anual) com os números de limite vindos da mesma fonte usada pelo backend (`lib/atividades/limites.ts`), para nunca divergir do que é de fato aplicado.
- `profile-modal`: edição de nome e avatar (recorte de imagem via `react-easy-crop`).
- `settings-modal`: abas Geral (tema), Faturas (histórico Stripe + cancelamento), Segurança (troca de e-mail/senha), Conta.

---

### `components/atividades/`  wizard e editor de atividades/provas

#### `steps/step-style.tsx`
Etapa 1: upload de um `.docx` como referência de estilo (com atalho para reaproveitar o último modelo enviado) ou seleção de um modelo  próprio ou pronto de sistema  na grade (`ModelSelector`).

`ModelSelector` busca em paralelo `/api/modelos-template` ("Meus modelos", uploads do próprio usuário) e `/api/modelos-prontos` ("Modelos prontos", `modelos_template` com `usuario_id null`  hoje "Clássico" e "Moderno", semeados por `scripts/seed-modelos-prontos.ts`). Ambos são o mesmo mecanismo (`modeloEstilo.tipo === "existente"`)  um modelo pronto nada mais é que um `modelos_template` sem dono, então a mesma checagem de posse em `lib/atividades/resolver-modelo-template.ts` aceita os dois. Cada card mostra um preview real do cabeçalho (`ModeloPreviewThumb`): busca `GET /api/parse-modelo?modeloTemplateId=`, e renderiza o `header` parseado com o mesmo `RepeatingHeader` do editor de verdade  nos modelos prontos, isso inclui a caixa que marca onde entra o logo da instituição.

#### `steps/step-config.tsx`
Etapa 2: quantidade de questões (teto varia por plano), tipos de questão, dificuldade, e  só para provas em planos pagos  opção de usar questões reais de vestibular/ENEM (com cota própria exibida na UI).

#### `steps/step-generate.tsx`
Etapa 3: estados de carregamento/erro/sucesso e preview textual das questões geradas, com destaque do gabarito.

#### `editor/activity-editor.tsx`
Tela principal do editor  ponto de entrada das rotas `.../editar/[atividadeId]`. Define o modelo de dados central `DocxElement` (union type que representa qualquer elemento estrutural de um `.docx`: parágrafo, tabela, imagem, forma, text-box, listas, cabeçalho/rodapé etc.), usado tanto pelo parser (`/api/parse-modelo`) quanto pelo renderer de preview e pelo exportador. Orquestra `A4Sheet`/`A4Zoom` (preview) e `EditorSidebar` (configurações). Persistência é manual: `salvarAgora()` dispara `PUT /api/atividades/[id]` só quando o professor clica em "Salvar" (nunca automaticamente). Também permite regenerar a atividade inteira ou uma questão avulsa, e baixar o `.docx` (questões ou gabarito).

#### `editor/a4-sheet.tsx`
Núcleo visual do editor (~1400 linhas): renderiza a pré-visualização paginada em folhas A4, combinando o modelo `.docx` importado com as questões. Mede alturas reais via uma camada invisível portada fora da tela (`createPortal`) para paginar corretamente (`paginateBlocks`); separa elementos de posição livre do `.docx` original ("anchors", só exibidos na página 1) do fluxo normal de texto; aplica presets de formatação (`formatting-presets.ts`) com prioridade do modelo sobre o preset; suporta reordenação de questões por drag-and-drop (`@dnd-kit`), redimensionamento de imagem inline, modos de acessibilidade (fonte grande, alto contraste, espaçamento, menos questões) e um modo "gabarito".

#### `editor/a4-zoom.tsx`
Encolhe a folha A4 (794px fixos) via `transform: scale()` para caber na largura disponível, usando `ResizeObserver`.

#### `editor/editor-sidebar.tsx`
Painel lateral do editor: configurações gerais (formatação, dificuldade, base vestibular, códigos BNCC, acessibilidade, quantidade/tipos de questão) ou, quando uma questão está selecionada, um painel de edição específico (enunciado, alternativas, imagem com posição/alinhamento/corte, dificuldade e número de linhas de resposta).

#### `editor/formatting-presets.ts`
Fonte única de verdade das normas de formatação suportadas (ABNT, APA, Vancouver, IEEE, ACM, SBC, MLA, Chicago, Harvard)  margens, fonte e espaçamento. Consumida tanto pelo preview (`a4-sheet.tsx`) quanto pela exportação (`generate-word.ts`), garantindo paridade entre tela e Word.

#### `editor/generate-word.ts`
Gera o `.docx` final usando a biblioteca `docx`, espelhando fielmente o que é renderizado na tela: converte cada `DocxElement` em `Paragraph`/`Table`, reconstrói elementos de posição livre (incluindo um patch manual de geometria de formas, já que a biblioteca força retângulos por padrão) e monta o gabarito em página separada.

#### `editor/mock-questoes.ts` e `editor/pagination.ts`
- `mock-questoes.ts`: tipos e constantes de questão/imagem de questão (apesar do nome, não contém dados fictícios).
- `pagination.ts`: algoritmo guloso de empacotamento de blocos em páginas, com base nas alturas medidas.

---

### `components/plano-de-aula/`

#### `step-config.tsx` / `step-generate.tsx`
Análogos aos steps de atividades: configuração (disciplina, data, duração, formato de aula, seções a incluir) e preview do plano gerado.

#### `editor/plano-aula-editor.tsx`
Visualização/exportação do plano de aula já gerado, renderizado como folha A4  reaproveita toda a infraestrutura de renderização e paginação de `components/atividades/editor/` (sem edição/regeneração por seção, ao contrário do editor de atividades). Converte os campos do plano (objetivos, habilidades BNCC, metodologia, avaliação etc.) em `DocxElement[]` e insere o corpo do modelo de estilo antes do conteúdo gerado.

---

### `components/landing/`

Seções da landing page pública, todas usadas por `app/inicio/page.tsx`: `site-nav` (navegação fixa, com modo "legal" para as páginas de termos/privacidade), `hero-intro`/`hero-login-card`/`hero-access-card`/`hero-glow-background` (bloco principal), `tools-section` (recursos do produto), `flow-steps` (carrossel "como funciona"), `security-section` (confiança/LGPD), `pricing-section` (espelha `pricing-plans.tsx` para visitantes deslogados) e `faq-accordion`.

---

### `lib/`  lógica de domínio e integrações

#### `lib/ai/`
- `gemini-prompt.ts`: centraliza as *personas* (system instructions) de geração de atividade, prova e plano de aula, com regras rígidas contra invenção de dados e regras específicas por tipo de questão.
- `gerar-questoes.ts`: pipeline de geração de questões  distribui tipos proporcionalmente, opcionalmente busca questões reais de vestibular via grounding do Google Search (chamada separada, pois grounding não pode ser combinado com `responseSchema`), suporta cache de contexto Gemini.
- `gerar-plano-aula.ts`: pipeline de geração de plano de aula, com schema JSON dinâmico conforme as seções escolhidas.
- `gemini-document-cache.ts`: cache de contexto do Gemini (`ai.caches`) por hash do arquivo de referência, para não reenviar o documento inteiro a cada regeneração.
- `gemini-retry.ts`: retry automático (até 3 tentativas) em erros 503/429 do Gemini.
- `model-por-plano.ts`: mapeia o plano de assinatura para o modelo Gemini e a API key a usar (planos pagos usam modelo mais robusto; premium pode ter chave de API dedicada para não competir por cota com os planos gratuitos).
- `extrair-conteudo-arquivo.ts`: extrai conteúdo de PDF/TXT/DOCX anexado como material de referência (PDF vai direto como base64 multimodal para o Gemini; DOCX é extraído com `mammoth`). Também expõe `tentarParsearArquivoPreprocessado`, que valida e reaproveita o resultado vindo do pré-processamento paralelo (`app/api/arquivo-referencia/preparar`), caindo em `null` para qualquer formato inesperado.
- `filtrar-paginas-pdf.ts`: quando há tema explícito e o PDF de referência tem mais de 8 páginas, extrai o texto de cada página (`unpdf`), pede ao Gemini Flash-Lite (sempre o modelo mais barato, independente do plano) para apontar as páginas relevantes ao tema e reconstrói um PDF só com elas (`pdf-lib`)  a geração final continua enviando o PDF nativo, não o texto extraído aqui. Best-effort: qualquer falha devolve o PDF original.
- `selecionar-habilidades-bncc.ts`: depois que a atividade é gerada, pede à IA para escolher, entre as habilidades BNCC candidatas já resolvidas na base oficial (`lib/bncc/`), quais o conteúdo das questões realmente trabalha. `responseSchema` restringe a saída a um `enum` com só os códigos candidatos  estruturalmente impossível a IA inventar um código; best-effort, nunca bloqueia a geração.
- `gerar-atividade-docx.ts` / `gerar-plano-aula-docx.ts`: geram o `.docx` final a partir do JSON estruturado retornado pela IA (incluindo o rodapé de habilidades BNCC, quando detectadas).
- `parse-negrito.ts`: interpreta marcação `**negrito**` residual da IA para virar formatação real no Word.
- `limites-arquivo.ts`: constantes de tamanho máximo de arquivo de referência (2MB  abaixo do limite de payload de Serverless Function da Vercel, já que o base64 extraído faz esse trajeto duas vezes até a geração), tamanho máximo do modelo de estilo (1MB) e páginas de PDF (30).

#### `lib/bncc/`
Integração com a Base Nacional Comum Curricular, usada por `app/api/atividades/gerar` depois que as questões já foram geradas:
- `api-bncc-dev.ts`: cliente para `api.bncc.dev` (API pública, gratuita, sem key, com as habilidades extraídas e verificadas contra o documento homologado do MEC)  busca habilidades por componente+ano (Fundamental) ou área (Médio), resolve um único código e resolve uma lista de códigos digitados manualmente pelo professor. Tudo "melhor esforço": qualquer falha devolve `null`/lista vazia em vez de lançar.
- `mapear-turma.ts`: resolve o escopo BNCC (etapa + componente/área + ano) de uma turma a partir do nível, série e do nome da disciplina (`turmas.nome`); devolve `null` quando a BNCC não se aplica (Infantil, Técnico, Superior, EJA) ou a disciplina não bate com um componente/área conhecido  nesses casos a sugestão de BNCC é simplesmente pulada, nunca adivinhada.
- `detectar-habilidades.ts`: ponto de entrada único  encadeia `mapear-turma` → `api-bncc-dev` (busca candidatas) → `lib/ai/selecionar-habilidades-bncc.ts` (IA escolhe entre elas). Qualquer etapa sem sucesso resulta em `[]`, sem nunca travar a geração da atividade.

#### `lib/atividades/`
- `limites.ts`: toda a lógica de cotas por plano  limites mensais/diários de geração, de questões por geração, de buscas vestibular e de regeneração avulsa de questão; reservas atômicas via funções RPC do Postgres para evitar condição de corrida entre requisições concorrentes.
- `dono.ts`: verifica se o usuário é dono de uma atividade via `turma_id → turmas.usuario_id`.
- `resolver-modelo-template.ts`: resolve/persiste o modelo de estilo `.docx` (reaproveita existente ou faz upload de um novo).

#### `lib/turmas/niveis.ts`
Define os 8 níveis de ensino válidos para turmas (`infantil`, `fundamental_1`, `fundamental_2`, `medio`, `tecnico`, `eja`, `superior`, `pos_graduacao`) e seus rótulos em português. Deliberadamente fora de qualquer módulo `"use client"` para que as rotas de API possam importá-lo como valor em runtime de servidor.

#### `lib/auth.ts` / `lib/auth-errors.ts`
Server actions de autenticação (`signIn`, `signUp`, `signOut`, `changePassword`, `updateEmail`, `updateProfile` etc.) e tradução de mensagens de erro do Supabase Auth para português.

#### `lib/supabase.ts` / `lib/supabase-server.ts` / `lib/supabase-admin.ts`
Clients Supabase para, respectivamente: navegador, Server Components/Route Handlers (cookies via `next/headers`), e acesso com service-role (ignora RLS  restrito a contextos sem sessão, como o webhook do Stripe).

#### `lib/stripe.ts` / `lib/stripe-client.ts`
SDK Stripe server-side (singleton lazy) com o mapa de planos/preços (`PRECOS`), e o loader client-side (`loadStripe`) isolado em módulo próprio para não vazar a secret key para o bundle do navegador.

#### `lib/site.ts`
URLs e domínios do produto (multi-subdomínio), resolução do domínio de cookie compartilhado (`.ensinaplus.com`) e sanitização de `next`/redirect para evitar open redirect.

#### `lib/theme.ts`
Aplica e persiste o tema claro/escuro/sistema via cookie (não `localStorage`, para funcionar entre subdomínios).

#### `lib/crop-image.ts`
Recorte de imagem (avatar) inteiramente no `<canvas>` do navegador.

#### `scripts/sync-stripe-assinatura.ts`
Script CLI de reconciliação manual entre Stripe (fonte da verdade) e a tabela `assinaturas`, para os casos em que o webhook falhou.

---

### Configuração e infraestrutura

#### `next.config.ts`
Define headers de segurança HTTP globais (`X-Frame-Options`, CSP parcial, `X-Content-Type-Options`, HSTS, `Permissions-Policy`) aplicados a todas as rotas.

#### `proxy.ts`
Middleware do Next.js (arquivo renomeado de `middleware.ts`, mas com a mesma função). Responsável por: reescrever `/` para `/inicio` nos domínios de marketing (`ensinaplus.com`); repassar `code` OAuth para `/auth/callback` mesmo vindo da raiz de um domínio de marketing; proteger rotas (`/pricing`, `/checkout`, `/`, e implicitamente tudo sob `(dashboard)`) redirecionando visitantes não autenticados para `/login`; forçar sessões do tipo "recovery" para `/redefinir-senha`; e evitar que um usuário já logado veja a tela de login.

---

## Fluxo de autenticação

```
Login (email/senha)
  └─► AuthForm → signIn() (server action) → supabase.auth.signInWithPassword()
        └─► Sucesso: redirect para "next" sanitizado ou "/"
        └─► Erro: mensagem traduzida (lib/auth-errors.ts)

Cadastro
  └─► AuthForm → checkEmailExists() (debounce) → signUp() → supabase.auth.signUp()

OAuth (Google)
  └─► supabase.auth.signInWithOAuth() → provider → /auth/callback
        └─► exchangeCodeForSession(code) → redirect "next" ou "/"

Recuperação de senha
  └─► AuthForm (esqueci-senha) → resetPasswordForEmail()
        └─► link no e-mail → sessão "recovery" → proxy.ts força /redefinir-senha
              └─► AuthForm (nova-senha) → updatePassword()

Logout
  └─► signOut() (server action) → supabase.auth.signOut() → redirect "/login"
```

Rotas protegidas: `/`, `/pricing`, `/checkout` e tudo sob `(dashboard)`. `proxy.ts` (middleware) verifica a sessão a cada requisição e redireciona para `/login` quando ausente.

---

## Fluxo de turmas

Turmas são o conceito organizador central do produto: toda atividade, prova e plano de aula pertence a uma turma. Não é possível gerar conteúdo sem uma turma ativa.

```
TurmasProvider (app/(dashboard)/layout.tsx)
  └─► GET /api/turmas ao montar → estado global `turmas`

Criar turma
  └─► Sidebar/ContentPage → openNovaTurma() → NovaTurmaModal
        └─► addTurma({nome, nivel, serie|periodo}) → POST /api/turmas
              └─► valida nivel contra lib/turmas/niveis.ts → insere no Supabase (RLS: dono = usuario_id)

Navegar por turma
  └─► /t/[id] → redirect /t/[id]/atividades
        ├─► /t/[id]/atividades  → ContentPage(turmaId)  → GET /api/atividades?turmaId=
        ├─► /t/[id]/provas      → idem, tipo "prova"
        └─► /t/[id]/plano-de-aula → idem, tipo "plano_aula"

Editar/excluir turma
  └─► updateTurma()/removeTurma() → PATCH|DELETE /api/turmas/[id]
        └─► DELETE também limpa os .docx da turma no Storage antes de apagar (cascata no banco)
```

---

## Fluxo de geração de conteúdo (Atividade / Prova / Plano de Aula)

### Entrada do usuário

Em `content-page.tsx`, dentro de uma turma, o professor pode digitar um **tema** e/ou anexar um **arquivo de referência** (PDF, DOCX ou TXT, até 2MB). Ao enviar, o `GeneratorModal` abre com esses dados e a `turmaId` ativa.

Assim que o modal abre, dispara em paralelo (sem bloquear a navegação pelas etapas) um pré-processamento do arquivo via `POST /api/arquivo-referencia/preparar`: extração de conteúdo e, se houver tema e o PDF for grande, filtragem das páginas relevantes (`lib/ai/filtrar-paginas-pdf.ts`). O resultado é reaproveitado na chamada final de geração; se ainda não tiver terminado ou falhar, o arquivo cru é enviado normalmente  sem regressão de comportamento.

### Etapas do modal

```
Etapa 0  Estilo (StepStyle)
  - Upload de um .docx como referência de formatação, ou
  - Seleção de um modelo já enviado / modelo pronto (ModelSelector)

Etapa 1  Configurações
  Atividade/Prova (StepConfig):
    - Quantidade de questões (teto varia por plano)
    - Dificuldade
    - Tipos de questão (múltipla escolha, V/F, dissertativo, completar lacunas, matemática)
    - [Prova, planos pagos] Usar questões reais de vestibular/ENEM
  Plano de Aula (StepConfigPlano):
    - Disciplina, data, duração (até 120 min), formato de aula
    - Seções a incluir (objetivos, habilidades BNCC, metodologia, avaliação, etc.)

Etapa 2  Gerar (StepGenerate / StepGeneratePlano)
  Dispara automaticamente POST /api/atividades/gerar ou /api/plano-de-aula/gerar
  Mostra loading → preview do resultado → erro (com link de upgrade se for limite de plano)
```

### O que a rota de geração faz (`/api/atividades/gerar` e `/api/plano-de-aula/gerar`)

1. Valida a entrada e verifica que o usuário é dono da turma.
2. Reserva cota de geração atomicamente (função RPC no Postgres  evita corrida entre requisições concorrentes).
3. [Só prova] Opcionalmente busca questões reais de vestibular via grounding do Google Search (cota própria; se estourada, degrada para geração sem busca real em vez de bloquear).
4. Extrai o conteúdo do arquivo de referência, se houver, e reaproveita/cria um cache de contexto no Gemini.
5. Chama o Gemini (`gerarQuestoes`/`gerarPlanoAula`) com o modelo/chave de API correspondentes ao plano do usuário. Em erro, cancela a reserva de cota.
6. Resolve o modelo de estilo (upload novo ou reaproveitamento).
7. [Só atividade/prova] Detecta habilidades BNCC compatíveis com o conteúdo gerado (`lib/bncc/detectar-habilidades.ts`  best-effort, nunca bloqueia a geração).
8. Persiste o registro em `atividades` (+ `questoes`/`codigos_bncc` ou `planos_aula`), gera o `.docx` e sobe ao Supabase Storage.
9. Retorna `{ atividadeId, questoes|plano, docxUrl }` (signed URL válida por 1h).

### Depois de gerar

O `GeneratorModal` navega para `/t/{turmaId}/{atividades|provas|plano-de-aula}/editar/{atividadeId}`, abrindo o **editor A4** (`ActivityEditor` ou `PlanoAulaEditor`), onde o professor pode reordenar/editar questões, trocar imagens, regenerar uma questão avulsa, ajustar formatação/acessibilidade, salvar (`PUT /api/atividades/[id]`) e baixar o `.docx` final (questões ou gabarito).

---

## Planos e cotas

| Recurso                                  | Grátis        | Básico | Premium |
|-------------------------------------------|:-------------:|:------:|:-------:|
| Gerações por mês                          | 60 (rede de segurança) | 150 | 400 |
| Gerações por dia                          | 2             | sem teto | sem teto |
| Questões por geração                      | 2             | 25     | 25      |
| Buscas de vestibular/ENEM por mês         | 0             | 15     | 40      |
| Regenerações de questão avulsa por dia    | 4             | 60     | 150     |
| Modelo de IA                              | Gemini Flash Lite | Gemini Flash Lite | Gemini Flash |

Todos os limites são centralizados em `lib/atividades/limites.ts` e reutilizados tanto pelo backend (para bloquear) quanto pelo frontend (`pricing-plans.tsx`, `pricing-section.tsx`, `app/checkout/page.tsx`) para exibição, garantindo que a UI nunca prometa números diferentes dos aplicados.

---

## Fluxo de assinatura (Stripe)

```
PricingPlans / pricing-section → /checkout?preco={basico_mensal|premium_mensal|premium_anual}
  └─► POST /api/stripe/checkout → cria Checkout Session (modo "elements", subscription)
        metadata.usuario_id → única forma do webhook saber a quem atribuir depois
  └─► CheckoutForm (Stripe Elements) → checkout.confirm()

Stripe → POST /api/webhooks/stripe (validado via assinatura HMAC)
  ├─► checkout.session.completed        → upsert em `assinaturas` (plano ativo)
  ├─► customer.subscription.updated     → atualiza plano/status (upgrade, downgrade, atraso)
  └─► customer.subscription.deleted     → volta para plano "gratis"

Cancelamento (usuário)
  └─► POST /api/stripe/cancelar → cancel_at_period_end: true
        (o plano só muda para "gratis" quando o Stripe dispara subscription.deleted no fim do período)
```

`npm run sync-stripe` permite reconciliar manualmente um usuário específico caso o webhook não tenha rodado.

---

## Status de implementação

| Funcionalidade                              | Status                     |
|----------------------------------------------|----------------------------|
| Autenticação (Supabase Auth: e-mail + Google)| Completo                   |
| Recuperação de senha                         | Completo                   |
| Turmas (CRUD, níveis de ensino)              | Completo                   |
| Sidebar, navegação por turma                 | Completo                   |
| Geração de atividades/provas via IA (Gemini) | Completo                   |
| Geração de planos de aula via IA             | Completo                   |
| Busca de questões reais de vestibular/ENEM   | Completo                   |
| Upload/parse de modelo `.docx` de estilo     | Completo (parser OOXML próprio) |
| Editor visual A4 (atividades/provas)         | Completo                   |
| Editor visual A4 (plano de aula)             | Completo (somente leitura/exportação, sem edição por seção) |
| Regeneração de questão avulsa                | Completo                   |
| Exportação para Word (.docx)                 | Completo                   |
| Cotas/limites por plano                      | Completo                   |
| Assinaturas via Stripe (checkout + webhook)  | Completo                   |
| Landing page pública                         | Completo                   |
| Upload de avatar                             | Completo                   |
| Aplicação do modelo de estilo no plano de aula | Salvo, mas ainda não renderizado na tela A4 |
| CSP completa (Content-Security-Policy)       | Completo (nonce por request via `proxy.ts`, `script-src`/`style-src`/`img-src`/`connect-src` etc.) |
| Detecção automática de habilidades BNCC      | Completo (via api.bncc.dev + IA, best-effort) |
| Pré-processamento paralelo do arquivo de referência | Completo (extração + filtragem de páginas por tema) |
| Páginas legais (Termos, Privacidade + 8 outras) | Completo (10 documentos), com dados de qualificação do responsável (CNPJ, endereço, DPO) ainda pendentes de confirmação (`<Pendente>`) |
