# Relatório de Análise Jurídico-Técnica  Ensina Plus (Professor Plus)

**Data da análise:** 21 de julho de 2026
**Metodologia:** leitura integral do código-fonte do repositório (`app/`, `components/`, `lib/`, `proxy.ts`, `next.config.ts`, `package.json`, `.env.local`  apenas nomes de variáveis, nunca valores), sem acesso a sistemas externos (Supabase, Stripe, Google Cloud) nem a documentação de negócio fora do repositório.
**Regra seguida:** nenhuma funcionalidade, integração ou dado foi presumido. Onde a informação não estava no código, isso é dito explicitamente como "não identificado no código analisado".

---

## 1. Recursos encontrados

| Recurso | Descrição | Status no código |
|---|---|---|
| Autenticação | Supabase Auth  e-mail/senha e OAuth Google (PKCE) | Completo |
| Recuperação de senha | Fluxo "esqueci minha senha" via e-mail | Completo |
| Turmas | CRUD de turmas por nível de ensino (8 níveis) | Completo |
| Geração de atividades/provas via IA | Google Gemini, com upload opcional de arquivo de referência e modelo de estilo | Completo |
| Geração de planos de aula via IA | Seções configuráveis (objetivos, BNCC, metodologia, avaliação etc.) | Completo |
| Busca de questões reais de vestibular/ENEM | Grounding via Google Search, só em planos pagos, para provas | Completo |
| Upload/parse de modelo `.docx` de estilo | Parser OOXML próprio (sem lib externa), com proteção contra zip bomb | Completo |
| Editor visual A4 | Preview paginado, drag-and-drop de questões, modos de acessibilidade | Completo |
| Regeneração de questão avulsa | Cota diária própria, independente da geração completa | Completo |
| Exportação para Word (.docx) | Biblioteca `docx` | Completo |
| Cotas/limites por plano | Reserva atômica via RPC Postgres | Completo |
| Assinaturas via Stripe | Checkout Elements + webhook de sincronização | Completo |
| Upload de avatar | JPEG/PNG/WEBP/GIF, até 2MB | Completo |
| Landing page pública | `ensinaplus.com` | Completo |
| Aplicação do modelo de estilo no plano de aula | Salvo, mas ainda não renderizado na tela A4 | Parcial |
| CSP completa | Nonce por request (`proxy.ts`), cobre `script-src`/`style-src`/`img-src`/`connect-src`/`frame-src` etc. | Completo |
| Exclusão de conta self-service | Não existe botão  processo manual via e-mail de suporte, com SLA de 15 dias úteis | Não implementado |
| Sistema de moderação/denúncia de conteúdo | Não identificado  não há compartilhamento de conteúdo entre usuários | Não implementado |

**Não identificados no código:** chat, notificações push, geolocalização, câmera, microfone (aliás, explicitamente bloqueados via `Permissions-Policy`), analytics/tracking de terceiros, envio de e-mail próprio (fora do Supabase Auth), sistema de backup próprio (delegado à infraestrutura do Supabase).

---

## 2. Dados pessoais tratados

| Dado | Origem | Titular | Onde fica armazenado |
|---|---|---|---|
| Nome completo, e-mail | Cadastro (formulário ou OAuth Google) | Professor (usuário) | Supabase Auth / tabela `usuarios` |
| Senha | Cadastro por e-mail/senha | Professor | Gerida pelo Supabase Auth  a aplicação não acessa a senha em texto claro |
| Foto de perfil | Upload opcional | Professor | Supabase Storage, bucket `avatars` |
| Nome/nível/série da turma | Criado pelo professor |  (dado organizacional, não de aluno identificado) | Tabela `turmas` |
| Temas, arquivos de referência, modelos `.docx` | Enviados pelo professor para gerar conteúdo | Professor (e, incidentalmente, terceiros cujo conteúdo o professor tenha copiado no arquivo) | Enviados à API do Gemini; modelos `.docx` também ficam no bucket `modelos` |
| Conteúdo gerado (atividades, provas, planos, gabaritos) | Gerado por IA a partir do input do professor | Professor | Tabelas de atividades/questões/planos + bucket `atividades` (arquivo `.docx`) |
| ID de cliente/assinatura Stripe, plano, status | Processamento de pagamento | Professor | Tabela `assinaturas` |
| Contadores de cota (gerações, buscas, regenerações) | Uso da Plataforma | Professor | Tabelas de controle de cota |
| Cookies de sessão e preferência | Navegação | Professor | Navegador do usuário |

**Ponto de atenção:** não existe, na estrutura de dados identificada no código, um campo dedicado a "dados de aluno" (nome, CPF, matrícula etc.). Qualquer dado pessoal de aluno que apareça na Plataforma só chega ali porque o próprio professor o incluiu livremente em um tema digitado ou em um arquivo de referência anexado  nesse cenário, o professor atua como controlador desses dados perante seus alunos, e a Plataforma como operadora incidental. Isso está refletido nos Termos de Uso (Cláusula 5).

**Não identificado no código:** coleta de CPF, RG, telefone, endereço, data de nascimento, geolocalização, dados biométricos ou dados de saúde.

---

## 3. APIs e integrações externas identificadas

| Serviço | Uso confirmado no código | Dado(s) enviado(s) |
|---|---|---|
| **Supabase** (Postgres + Auth + Storage) | Banco de dados, autenticação, armazenamento de arquivos | Todos os dados pessoais e conteúdo da conta |
| **Google Gemini API** (`@google/genai`) | Geração de atividades/provas/planos de aula | Tema, conteúdo de arquivos de referência, parâmetros de configuração |
| **Google Search (grounding)** | Busca de questões reais de vestibular/ENEM (provas, planos pagos) | Consulta de busca derivada do tema/disciplina |
| **Google OAuth** | Login social | Dados básicos de perfil autorizados pelo usuário |
| **Stripe** | Checkout, assinaturas, faturas, webhook | Identificador de usuário (metadata), e-mail/dados de cobrança (diretamente no Stripe) |

**Não identificados no código:** Firebase, Mercado Pago, Meta, Apple, AWS (direto), Cloudflare (direto), OpenAI, Anthropic, DeepSeek, qualquer ferramenta de analytics, e-mail transacional próprio (Resend/SendGrid/Mailgun/SMTP customizado), ou qualquer outro SDK de terceiro além dos listados na tabela.

---

## 4. Cookies utilizados

| Cookie | Finalidade | Categoria |
|---|---|---|
| `sb-*-auth-token` (Supabase Auth) | Sessão autenticada | Estritamente necessário |
| `tema` | Preferência de aparência (claro/escuro/sistema) | Funcional |
| `sidebar-collapsed` | Preferência de layout da barra lateral | Funcional |

Nenhum cookie de publicidade, analytics ou rastreamento entre sites foi identificado.

---

## 5. Bibliotecas relevantes (`package.json`)

`next` 16, `react`/`react-dom` 19, `@supabase/supabase-js` + `@supabase/ssr`, `@google/genai`, `stripe` + `@stripe/stripe-js` + `@stripe/react-stripe-js`, `docx` (geração de .docx), `mammoth` (extração de texto de .docx), `pdf-lib` (validação de PDF), `@dnd-kit/*` (drag-and-drop), `react-easy-crop` (recorte de avatar), `@react-pdf/renderer`, `@phosphor-icons/react`, Tailwind CSS v4.

---

## 6. Riscos jurídicos encontrados

1. ~~**Discrepância entre a claim de marketing e a realidade técnica de criptografia.**~~ **Corrigido.** `components/landing/security-section.tsx` afirmava "criptografia de ponta a ponta" e "ninguém além de você tem acesso ao conteúdo", o que era tecnicamente incorreto (os dados são processados em texto claro pela própria Plataforma e por seus operadores  Supabase, Gemini) e podia configurar propaganda enganosa (art. 37, CDC). O texto foi reescrito para "criptografia em trânsito (HTTPS/TLS) e em repouso", alinhado com a linguagem usada nos documentos jurídicos.
2. ~~**Ausência de SLA para exclusão de conta.**~~ **Corrigido parcialmente.** A LGPD (art. 18) garante o direito de eliminação; o processo continua manual (e-mail ao suporte  a implementação de exclusão self-service foi avaliada e adiada por ora), mas agora tem um prazo formal de **até 15 dias úteis**, refletido na aba "Conta" das Configurações (`components/settings-modal.tsx`) e nos documentos `/politica-conta` e `/retencao-dados`. Recomenda-se, no médio prazo, avaliar um botão de autoatendimento.
3. ~~**CSP incompleta.**~~ **Corrigido.** Antes só a diretiva `frame-ancestors` estava implementada. Agora a CSP é gerada por request em `proxy.ts` (nonce por request para `script-src`, com `strict-dynamic` + fallback `https://js.stripe.com`) e cobre também `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `object-src`, `base-uri` e `form-action`, restritos aos domínios efetivamente usados (Supabase, Google Fonts, Stripe.js). **Trade-off aceito:** ler o nonce via `headers()` no `RootLayout` opta toda a aplicação por renderização dinâmica (perde a geração estática/cache de páginas puramente públicas como termos, privacidade etc.).
4. ~~**Licença do repositório (MIT) incompatível com produto proprietário.**~~ **Corrigido.** O arquivo `LICENSE` era uma licença MIT, que permite uso, cópia e redistribuição irrestritos do código por qualquer pessoa  incompatível com um SaaS proprietário. Foi substituído por uma licença "todos os direitos reservados", que preserva a titularidade exclusiva do código e remete o uso da aplicação hospedada aos Termos de Uso. **Recomenda-se ainda assim revisão por advogado**, sobretudo se o repositório vier a ser tornado público ou compartilhado com terceiros (investidores, colaboradores).
5. **Cláusula de "não uso para treinamento de IA" depende de contrato com a Google não verificável pelo código.** A promessa (também feita no marketing) de que os dados não são usados para treinar modelos de IA depende da modalidade de acesso à API do Gemini efetivamente contratada  API paga padrão da Google normalmente garante isso; camadas gratuitas do "AI Studio" podem não garantir. Não há como confirmar essa modalidade a partir do código-fonte.
6. **Transferência internacional de dados não formalizada.** Supabase, Google e Stripe podem processar dados fora do Brasil. O código não permite confirmar a região de hospedagem do projeto Supabase, nem a existência de cláusulas contratuais padrão formalizadas com os operadores, exigidas pelo art. 33 da LGPD.
7. **Ausência de registro formal de operações de tratamento (RIPD/ROPA) e de processo formal de resposta a incidentes** (art. 48, LGPD)  não identificados no código, o que é esperado (são artefatos de governança, não de software), mas ficam como pendência de adequação.

---

## 7. Pontos de melhoria (não jurídicos, mas relevantes)

- Implementar CSP completa (`script-src`, `style-src`, `img-src`, `connect-src`) cobrindo Supabase, Google e Stripe.
- Adicionar um fluxo de exclusão de conta self-service no painel, com confirmação e período de carência, reduzindo a dependência de processo manual.
- Adicionar, na tela de upload de arquivo de referência, um aviso curto lembrando o professor de não incluir dados sensíveis de alunos.
- Definir e documentar formalmente (fora do código) os prazos de retenção de backups e de logs de acesso junto ao Supabase/hospedagem, hoje não configuráveis via aplicação.

---

## 8. Pendências para adequação à LGPD

- [ ] Confirmar e formalizar a base legal e o instrumento contratual (cláusulas-padrão contratuais ou equivalente) para a transferência internacional de dados a Google e Stripe.
- [ ] Definir e documentar o prazo de resposta a solicitações de titulares (acesso, correção, eliminação) e o processo interno de atendimento.
- [x] Definir SLA formal para exclusão de conta mediante solicitação ao suporte (15 dias úteis, já refletido no código e nos documentos).
- [ ] Nomear formalmente um Encarregado de Proteção de Dados (DPO) e publicar seu contato (hoje pendente  ver Nota Final).
- [ ] Confirmar junto à Google a modalidade de acesso à API do Gemini utilizada, para validar a promessa de "não treinamento de IA" feita ao usuário.
- [x] Avaliar e revisar a licença do repositório (Risco 4)  trocada de MIT para "todos os direitos reservados"; validação final por advogado ainda recomendada.
- [x] Alinhar a copy de marketing ("criptografia de ponta a ponta") com a linguagem tecnicamente precisa usada nos documentos legais.
- [ ] Definir prazos internos de retenção de dados fiscais/faturamento e de logs de acesso (Marco Civil, art. 15).
- [ ] Considerar a elaboração de um Relatório de Impacto à Proteção de Dados (RIPD), dado o uso de IA para processar conteúdo potencialmente sensível (mesmo que incidental, via material enviado por professores).

---

## 9. Checklist de conformidade jurídica

| Item | Status |
|---|---|
| Termos de Uso publicados e completos | ✅ Implementado (`/termos`) |
| Política de Privacidade conforme LGPD | ✅ Implementado (`/privacidade`) |
| Política de Cookies | ✅ Implementado (`/cookies`) |
| Política de Retenção e Exclusão de Dados | ✅ Implementado (`/retencao-dados`) |
| Aviso de Direitos Autorais | ✅ Implementado (`/direitos-autorais`) |
| Política de Conteúdo do Usuário | ✅ Implementado (`/conteudo-usuario`) |
| Política de IA | ✅ Implementado (`/politica-ia`) |
| Política de Segurança da Informação | ✅ Implementado (`/politica-seguranca`) |
| Aviso de Isenção de Responsabilidade | ✅ Implementado (`/isencao-responsabilidade`) |
| Política de Conta e Exclusão de Conta | ✅ Implementado (`/politica-conta`) |
| Identificação do Controlador (razão social/CNPJ/endereço) | ❌ Pendente  placeholders nos documentos |
| Encarregado de Proteção de Dados nomeado e publicado | ❌ Pendente  placeholder nos documentos |
| Base legal para transferência internacional formalizada | ❌ Pendente |
| CSP completa | ⚠️ Parcial |
| Mecanismo self-service de exclusão de conta | ⚠️ Processo manual (e-mail ao suporte), agora com SLA publicado de 15 dias úteis |
| Licença do código compatível com modelo de negócio proprietário | ✅ Corrigido  LICENSE trocado de MIT para "todos os direitos reservados" |

---

## 10. Onde os documentos foram publicados

Os 10 documentos foram implementados como páginas Next.js reais (não apenas markdown), reaproveitando o layout visual já existente das páginas de Termos/Privacidade (`SiteNav`, tipografia, container), com um componente compartilhado novo (`components/legal/legal-document.tsx`) que gera automaticamente um índice navegável e a numeração de cláusulas:

- `/termos`  Termos de Uso
- `/privacidade`  Política de Privacidade
- `/cookies`  Política de Cookies
- `/retencao-dados`  Política de Retenção e Exclusão de Dados
- `/direitos-autorais`  Aviso de Direitos Autorais
- `/conteudo-usuario`  Política de Conteúdo do Usuário
- `/politica-ia`  Política de IA
- `/politica-seguranca`  Política de Segurança da Informação
- `/isencao-responsabilidade`  Aviso de Isenção de Responsabilidade
- `/politica-conta`  Política de Conta e Exclusão de Conta

Todas foram linkadas no rodapé da landing page (`app/inicio/page.tsx`) e as 5 mais relevantes foram adicionadas ao menu de navegação das páginas legais (`components/landing/site-nav.tsx`). Trechos que dependem de dados que a empresa ainda não informou aparecem destacados visualmente (fundo âmbar) em cada página, usando o componente `<Pendente>`.

---

## Nota final  informações que dependem de confirmação do proprietário do sistema

Os documentos foram publicados com os seguintes campos marcados como pendentes (visualmente destacados em cada página, e centralizados em `lib/legal-info.tsx` para facilitar o preenchimento em um único lugar):

1. **Razão social** (ou nome civil completo, caso operado como pessoa física).
2. **CNPJ** (ou CPF, caso pessoa física).
3. **Endereço completo** (sede ou domicílio do responsável).
4. **E-mail do Encarregado de Proteção de Dados (DPO)**  pode ser o mesmo e-mail de suporte, mas precisa ser formalmente designado.
5. **Comarca/foro** para a cláusula de eleição de foro dos Termos de Uso.
6. **Prazo interno de guarda fiscal** dos registros de cobrança (regra geral do CTN é de até 5 anos, mas deve ser confirmado com o contador responsável).
7. **Região de hospedagem do projeto Supabase**, para precisar a cláusula de transferência internacional de dados.
8. **Modalidade de acesso à API do Gemini** (para validar a promessa de não utilização dos dados para treinamento de IA).
9. **Mecanismos contratuais formais de transferência internacional** (cláusulas contratuais padrão ou equivalente) com Google e Stripe.

O prazo de exclusão de conta (item que antes era pendente) já foi definido em 15 dias úteis e aplicado tanto no código (`components/settings-modal.tsx`) quanto nos documentos `/politica-conta` e `/retencao-dados`.

Assim que os dados acima forem fornecidos, basta atualizá-los em `lib/legal-info.tsx` (itens 1–5) e nos pontos específicos marcados com `<Pendente>` em cada página (itens 6–9) para que os documentos fiquem prontos para valer juridicamente. **Recomenda-se revisão final por advogado antes da publicação em produção**, especialmente quanto à Cláusula de Foro e à limitação de responsabilidade.

---

## Nota sobre esta reconstrução

Este relatório e os 10 documentos legais foram gerados uma primeira vez nesta mesma sessão de trabalho, mas um `git reset` seguido de `git pull` no repositório local descartou todo o trabalho ainda não commitado (arquivos novos foram removidos, arquivos existentes voltaram ao conteúdo anterior). Este arquivo é uma reconstrução fiel do conteúdo original, já incorporando as 3 correções solicitadas em seguida (marketing de criptografia, licença do repositório e SLA de exclusão de conta). **Recomenda-se commitar este trabalho assim que possível** para evitar nova perda em caso de outro reset/pull.
