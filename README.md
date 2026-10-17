# ShortStory

Plataforma de ficção seriada narrada em áudio, organizada em séries e episódios curtos, focada inicialmente no gênero de terror, suspense e mistério no mercado brasileiro.

---

## 🏛️ Arquitetura do Projeto

O projeto é estruturado como um **Monorepo** gerenciado com [Turborepo](https://turbo.build/) e [Bun](https://bun.sh/), dividindo claramente as responsabilidades entre cliente mobile e serviços de backend hospedados em infraestrutura própria (VM).

```
shortstory/
├── apps/
│   ├── mobile/       # Aplicativo React Native (Expo SDK 57, Expo Router)
│   └── backend/      # API e serviços em NestJS 12 (Node.js/Bun, TypeScript, Vitest)
├── packages/         # Pacotes compartilhados futuros (tipos, utilitários, configs)
├── turbo.json        # Configuração do pipeline de tarefas e TUI do Turborepo
└── package.json      # Workspace root
```

### Componentes Principais

1. **Mobile (`apps/mobile`)**
   - **Framework:** Expo SDK 57 (React Native 0.86, React 19) com Expo Router (navegação baseada em arquivos).
   - **Reprodução de Áudio:** Suporte a streaming progressivo via HTTP Range requests, background playback contínuo e persistência de progresso de escuta.
   - **Pagamentos In-App:** Integração com **RevenueCat** via SDK oficial (`react-native-purchases`) para orquestrar compras e assinaturas na Google Play Store e Apple App Store.

2. **Backend (`apps/backend`)**
   - **Framework:** **NestJS v12** (ESM, TypeScript, Vitest).
   - **Infraestrutura:** Backend próprio hospedado em máquina virtual (VM), otimizando custos e eliminando limitações/custos variáveis de BaaS serverless.
   - **Responsabilidades:**
     - Autenticação e gestão de usuários/sessões.
     - Catálogo de séries, temporadas, episódios e metadados.
     - Armazenamento de progresso de escuta (`user_progress`).
     - Geração de URLs pré-assinadas temporárias (Cloudflare R2) para episódios restritos/premium.
     - Recepção e processamento idempotente de Webhooks do **RevenueCat** para atualização de assinaturas e direitos de acesso (*entitlements*).

3. **Armazenamento de Áudio (Cloudflare R2)**
   - Armazenamento de objetos para arquivos de áudio comprimidos.
   - Suporte nativo a requisições HTTP Range.
   - Episódios gratuitos entregues via CDN/distribuição pública e episódios premium protegidos por URLs pré-assinadas temporárias emitidas pelo backend NestJS.

---

## 🚀 Como Executar

### Pré-requisitos
- [Bun](https://bun.sh/) (v1.2+) ou Node.js (v20+)
- Android SDK configurado (para desenvolvimento mobile Android)

### Instalação

Na raiz do repositório, instale as dependências de todos os workspaces:

```bash
bun install
```

### Desenvolvimento

#### Executar todos os serviços com TUI (Terminal UI)
O Turborepo está configurado para exibir uma interface interativa no terminal, isolando os logs de cada serviço em abas próprias:

```bash
bun run dev
```
> **Dica:** Utilize as setas `↑` / `↓` ou os atalhos numéricos no terminal para alternar entre os logs do `@shortstory/mobile` e do `@shortstory/backend`.

#### Comandos Mobile
* **Executar no Android:**
  ```bash
  bun run android
  # ou dentro do workspace:
  cd apps/mobile && expo run:android
  ```
* **Iniciar apenas o Metro Bundler:**
  ```bash
  bun run mobile:dev
  ```

#### Comandos Backend
* **Executar o NestJS em modo watch:**
  ```bash
  bun run backend:dev
  ```
* **Build do NestJS:**
  ```bash
  bun run backend:build
  ```

#### Qualidade de Código e Testes
* **Lint em todos os projetos:**
  ```bash
  bun run lint
  ```
* **Testes unitários e e2e:**
  ```bash
  bun run test
  ```
