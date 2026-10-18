# 🗺️ Roadmap & Milestones — ShortStory

Documento oficial de acompanhamento do ciclo de vida, arquitetura, etapas e funcionalidades da plataforma **ShortStory**.

> **Diretriz Editorial e de Negócio:** Plataforma de ficção seriada em áudio focada em terror, suspense e mistério no mercado brasileiro. Operação enxuta, modelo "Deslogado First" com camada Premium, backend próprio em VM (NestJS + PostgreSQL + Drizzle ORM com chaves ULID), app mobile Expo com NativeWind/Gluestack UI, player avançado com suporte a reprodução em segundo plano e escuta offline, armazenamento de áudio no Cloudflare R2 e monetização gerenciada via RevenueCat.

---

## 📊 Visão Geral das Fases

| Fase | Escopo Principal | Prazo / Alvo | Status |
| :--- | :--- | :---: | :---: |
| **Fase 1** | Arquitetura Monorepo, Backend Base & Autenticação | Semana 1 | 🟢 **Concluída** |
| **Fase 2** | Modelagem Drizzle, Módulo de Catálogo & Telas de Descoberta | Semana 2 | 🟢 **Concluída** (Busca pendente) |
| **Fase 3** | Player de Áudio Nativo (`expo-audio`), Background & Bottom Sheet | Semana 3 | 🟢 **Concluída** |
| **Fase 4** | Download Offline, Progresso de Escuta & Listas/Favoritos | Semana 4 | 🟡 **Próxima** |
| **Fase 5** | Monetização com RevenueCat (Assinaturas, Paywall & Webhooks) | Semana 5 | ⚪ No MVP |
| **Fase 6** | Polimento, Testes Finais & Publicação nas Lojas (EAS Build) | Semana 6 | ⚪ No MVP |
| **Fase 7** | Pós-Lançamento (Notificações Push, Painel Web Admin & Métricas) | Pós-MVP | ⚪ Futura |

---

## 🧱 Fase 1: Arquitetura Base, Monorepo & Autenticação
> **Objetivo:** Estabelecer a fundação do monorepo, banco de dados PostgreSQL com IDs ULID, backend NestJS v12 e autenticação completa integrada ao app Expo com suporte nativo a visitantes ("Deslogado First").

- [x] **Setup do Monorepo Turborepo + Bun**
  - [x] Estrutura unificada com workspaces `apps/mobile` e `apps/backend`
  - [x] Configuração de pipeline `turbo.json` (`dev`, `build`, `lint`, `test`) com TUI interativa
- [x] **Banco de Dados & Drizzle ORM (PostgreSQL)**
  - [x] Estrutura modular em `src/db/schemas/` com export centralizado de `schema`
  - [x] IDs padronizados e sequenciais via **ULID** (`$defaultFn(() => generateId())`)
  - [x] Tabelas base de autenticação: `users`, `sessions`, `accounts`, `verifications`
  - [x] Módulo Global `DatabaseModule` com token de injeção `DRIZZLE` para o NestJS
  - [x] Migrations automáticas geradas pelo Drizzle Kit
- [x] **Autenticação com Better Auth**
  - [x] Better Auth integrado ao Drizzle Adapter com plugin `@better-auth/expo`
  - [x] Controller do NestJS para rotas `/api/auth/*` com suporte a CORS e local network
  - [x] `AuthGuard`, `OptionalAuthGuard` e decorator `@CurrentUser()`
  - [x] Módulo de usuário com rota `GET /users/me`
- [x] **Design System Mobile & Interface iOS-like**
  - [x] NativeWind v4 + Tailwind CSS integrado com Gluestack UI v2
  - [x] Tema refinado claro/escuro com a cor primária de destaque em bordô (`#800020` / `#A62B32`)
  - [x] Componentes fundamentais: `Box`, `Text`, `Button`, `VStack`, `HStack`, `Input`
- [x] **Fluxo Completo de Autenticação Mobile ("Deslogado First")**
  - [x] `AuthContext` com suporte transparente a visitantes (`isGuest`) e sessão persistida no `SecureStore`
  - [x] Tela de **Onboarding** (Entrar, Cadastrar ou Continuar sem Login)
  - [x] Tela de **Login** com validações de e-mail e senha
  - [x] Tela de **Cadastro** com nome, e-mail e senha segura
  - [x] Sistema de feedback visual via **Toast flutuante no topo estilo iOS**
  - [x] Tradução e refinamento completo de mensagens de erro para Português do Brasil

---

## 📚 Fase 2: Catálogo de Séries, Temporadas e Episódios
> **Decisões Alinhadas:** 
> - *Gestão de Conteúdo:* Scripts CLI e Seeds no backend para operação ágil e sem complexidade de painéis adicionais no início.
> - *Regra de Acesso:* Flag booleana individual por episódio (`is_premium: boolean`), concedendo controle editorial fino sobre quais episódios são gratuitos ou fechados.

- [x] **Modelagem no Drizzle ORM (`apps/backend/src/db/schemas/`):**
  - [x] `genre.table.ts` (id ULID, nome, slug, descrição, cor_destaque, ícone, ordem)
  - [x] `story.table.ts` (id ULID, título, slug, sinopse, capa_url, thumbnail_url, autor, status: rascunho/publicado, destaque: boolean, views_count, plays_count, trending_score, last_activity_at)
  - [x] `story-genre.table.ts` (relacionamento N:N entre histórias e gêneros)
  - [x] `episode.table.ts` (id ULID, story_id, número_temporada, número_episódio, título, sinopse, duração_segundos, audio_url, **is_premium: boolean**, status: publicado)
  - [x] `story-metric-event.table.ts` (id ULID, story_id, event_type: view/play_start/play_complete)
  - [x] Atualização e exportação das relações em `src/db/schemas/index.ts` e migração via Drizzle Kit (`0001_gray_falcon.sql`)
- [x] **Módulo de Histórias, Catálogo & Ingestão no NestJS (`apps/backend/src/modules/`):**
  - [x] `GET /stories` (filtros por gênero, busca textual, status e ordenação: trending, popular, recent)
  - [x] `GET /stories/trending` (carrossel de histórias em alta baseado em algoritmo de gravidade/decaimento)
  - [x] `GET /stories/featured` (destaques editoriais)
  - [x] `GET /stories/:idOrSlug` (detalhes da história e lista completa de episódios ordenados)
  - [x] `POST /stories/:id/view` e `POST /episodes/:id/play` (telemetria e recálculo automático de popularidade)
  - [x] `GET /genres` e `GET /genres/:slug` com auto-seeding inicial dos 5 gêneros de terror/suspense
  - [x] **API de Ingestão Admin com `AdminKeyGuard` (`x-admin-key`):**
    - [x] `POST /admin/stories`, `PUT /admin/stories/:id`, `DELETE /admin/stories/:id`
    - [x] `POST /admin/stories/:id/episodes`, `PUT /admin/episodes/:id`, `DELETE /admin/episodes/:id`
    - [x] `POST /admin/stories/bulk-import` (importação completa de história + episódios em lote, otimizada para o app gerador de IA local)
- [ ] **Telas de Catálogo no App Mobile (`apps/mobile`):**
  - [x] **Home / Início (`(app)/books.tsx`):**
    - [x] Header com saudação e atalhos rápidos
    - [x] Banner / Carrossel em destaque com as principais séries de terror
    - [x] Trilhos horizontais filtrados por gênero com capas em proporção poster
    - [x] Cartões de série com cantos arredondados suaves e tags
  - [x] **Detalhes da Série (`story/[id].tsx` / `story-details-page.tsx`):**
    - [x] Header imersivo com imagem de capa, títulos, autores e badges de gênero
    - [x] Sinopse expansível e estatísticas
    - [x] Botão de ação rápida: "Começar a Ouvir" / "Continuar de Onde Parou"
    - [x] Lista de episódios completa com capa miniatura, número do EP, título, sinopse detalhada e duração formatada
    - [x] Indicador de reprodução ativa no episódio atual
  - [ ] **Explorar & Buscar (`(app)/buscar.tsx`):**
    - [ ] Barra de busca instantânea com debounce
    - [ ] Chips filtráveis por gênero
    - [ ] Lista de resultados e tratamento de estado vazio ("Nenhuma história encontrada")

---

## 🎧 Fase 3: Player de Áudio Nativo (`expo-audio`) & Background
> **Decisões Alinhadas:**
> - Reprodutor nativo de alta performance baseado em `expo-audio` com suporte nativo a background, lockscreen controls e centro de controle.
> - Suporte progressivo via HTTP e streaming compatível com Cloudflare R2.

- [x] **Configuração de Áudio Nativo (Android & iOS):**
  - [x] Plugin `expo-audio` no `app.json` configurado com `enableBackgroundPlayback: true`
  - [x] `AudioControlsService` registrado no `AndroidManifest.xml` para controles de tela de bloqueio e barra de status
  - [x] `setAudioModeAsync` com `playsInSilentMode: true`, `interruptionMode: 'doNotMix'` e `shouldPlayInBackground: true`
- [x] **Contexto Global de Áudio (`AudioPlayerContext`):**
  - [x] Controle central de estado de reprodução (`currentStory`, `currentEpisode`, `isPlaying`, `currentTime`, `duration`)
  - [x] Métodos globais de controle (`playEpisode`, `togglePlayPause`, `seekTo`, `skipForward(15)`, `skipBackward(15)`, `playNextEpisode`, `playPreviousEpisode`)
  - [x] Telemetria automática no backend a cada início de reprodução (`/episodes/:id/play`)
- [x] **Mini-Player Flutuante (`MiniAudioPlayer`):**
  - [x] Estilo liquid glass flutuando perfeitamente sobre a bottom tab bar sem encavalar
  - [x] Capa miniatura em 1:1, título do episódio, nome da série e botão play/pause redondo
  - [x] Barra fina de progresso integrada na base do card
  - [x] Toque no card abre o bottom sheet em tela cheia suavemente
- [x] **Player Completo em Bottom Sheet Modal (`FullScreenAudioPlayerModal`):**
  - [x] Abertura animada de baixo para cima
  - [x] Capa em proporção 1:1 em destaque com badge de temporada/episódio
  - [x] Título do episódio, série e botão de favoritar
  - [x] Barra de progresso deslizável (*scrubber*) com `PanResponder` contínuo, sem jitter/flicker e minutagens início/fim
  - [x] Botão Play/Pause circular em destaque acompanhado de avançar/voltar 15s e anterior/próximo episódio
  - [x] Linha de utilitários perfeitamente centralizada e proporcional: Sleep Timer (15/30/45m), Seletor de Velocidade (1.0x-2.0x) e Modal expansível com Fila de Episódios
  - [x] Ação de compartilhamento nativo integrada no topo

---

## 💾 Fase 4: Escuta Offline, Progresso & Favoritos
> **Decisões Alinhadas:**
> - *Offline no MVP:* Usuário pode baixar episódios no aparelho para ouvir em locais sem conexão de internet.
> - Sincronização contínua de progresso para que o usuário nunca perca o minuto onde parou.

- [ ] **Download de Episódios para Escuta Offline (Mobile):**
  - [ ] Gerenciador de downloads locais usando `expo-file-system`
  - [ ] Armazenamento dos arquivos de áudio e metadados no armazenamento seguro do dispositivo
  - [ ] Indicador visual de download concluído nos episódios da lista
  - [ ] Gerenciamento de espaço: opção para excluir episódios baixados individualmente ou todos de uma vez
  - [ ] Reprodução inteligente: se o arquivo estiver baixado localmente, toca direto do disco sem gastar dados móveis
- [ ] **Sincronização de Progresso de Reprodução (`user_progress`):**
  - [ ] Tabela no Drizzle `user_progress.table.ts` (`user_id`, `episode_id`, `position_seconds`, `is_completed`, `updated_at`)
  - [ ] Armazenamento local no `AsyncStorage` para usuários no modo visitante
  - [ ] Endpoint `POST /playback/progress` chamado a cada intervalo (ex: a cada 15 segundos) e ao pausar
  - [ ] Endpoint `GET /playback/resume` para recuperar o último episódio ouvido
  - [ ] Trilho "Continuar Ouvindo" destacado no topo da tela inicial
- [ ] **Listas e Favoritos (`(app)/listas.tsx`):**
  - [ ] Tabela `user_favorites.table.ts` no backend
  - [ ] Ação de favoritar série apenas usuarios logados
  - [ ] Aba "Minha Lista" (séries salvas/favoritadas)
- [ ] **Perfil do Usuário (`(app)/perfil.tsx`):**
  - [ ] Exibição das informações do usuário autenticado
  - [ ] Seletor de tema (Escuro / Claro / Sistema)
  - [ ] Visualização do status da assinatura atual
  - [ ] Botão de Logout e fluxo obrigatório de **Exclusão de Conta** (requisito App Store & Google Play)

---

## 💎 Fase 5: Monetização com RevenueCat (Assinaturas & Paywall)
> **Objetivo:** Orquestrar o modelo de assinatura com validação estrita no servidor, sem confiar apenas em respostas locais do aplicativo.

- [ ] **Configuração do RevenueCat:**
  - [ ] Criação de projeto no painel do RevenueCat e associação com Google Play Console e Apple App Store Connect
  - [ ] Configuração de produtos de assinatura (ex: Plano Mensal e Anual)
  - [ ] Definição do Entitlement: `shortstory_premium`
- [ ] **Integração no Aplicativo Mobile:**
  - [ ] Configuração do SDK `react-native-purchases`
  - [ ] Identificação do usuário logado via `userId` (ULID) no RevenueCat
  - [ ] **Tela de Paywall:** Apresentação persuasiva dos benefícios premium (acesso irrestrito a todos os episódios bloqueados, novos lançamentos e escuta ilimitada)
  - [ ] Fluxo de compra in-app e botão "Restaurar Compras" (*Restore Purchases*)
- [ ] **Backend Webhooks & Direitos de Acesso (`apps/backend`):**
  - [ ] Tabela `subscriptions.table.ts` (`user_id`, `revenuecat_id`, `status: active | canceled | past_due`, `expires_at`, `plan_id`)
  - [ ] Endpoint `POST /webhooks/revenuecat` com validação de token de autorização
  - [ ] Processamento idempotente de eventos de assinatura (`INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`)
  - [ ] Guard no NestJS que bloqueia acesso a episódios com `is_premium = true` caso o usuário não possua assinatura ativa

---

## 🚀 Fase 6: Polimento, Testes & Publicação nas Lojas (MVP Launch)
> **Objetivo:** Garantir a estabilidade da experiência, desempenho suave e submissão aos canais de distribuição oficiais.

- [ ] **Polimento Visual & Experiência do Usuário:**
  - [ ] Ícones oficiais do app, splash screen adaptativa e banners das séries piloto
  - [ ] Tratamento cuidadoso de quedas de rede, modo avião e transições entre telas
  - [ ] Feedback tátil (*haptics*) em botões de ação e reprodução
- [ ] **Qualidade de Código & Testes:**
  - [ ] Testes automatizados no backend NestJS (Vitest) para endpoints de catálogo, autenticação e webhooks
  - [ ] Validação de builds em dispositivos físicos reais (Android e iOS)
- [ ] **Publicação via Expo Application Services (EAS):**
  - [ ] Configuração do `eas.json` para builds de produção (AAB para Google Play e IPA para App Store)
  - [ ] Submissão do aplicativo e conformidade com diretrizes das lojas

---

## 🔮 Fase 7: Pós-Lançamento & Expansão
> **Objetivo:** Adicionar ferramentas de retenção e métricas avançadas conforme validação do produto com o público real.

- [ ] **Notificações Push:** Envio de alertas quando novas temporadas ou episódios de séries favoritas forem disponibilizados
- [ ] **Painel Web Administrativo:** Dashboard visual interno no monorepo para upload de áudios, gerenciamento de capas e edição de roteiros
- [ ] **Avaliações & Engajamento:** Sistema de notas/curtidas por episódio para identificar as histórias de maior retenção
- [ ] **Métricas de Retenção Editorial:** Análise de drop-off por minuto de áudio para orientar os roteiristas na criação dos próximos episódios
