# CLAUDE.md — cmmv-blog

Guia de contexto para Claude Code (claude.ai/code) neste repositório.

## Visão Geral

**cmmv-blog** é uma plataforma de blog/CMS completa baseada no framework [CMMV](https://cmmv.io).
Monorepo gerenciado com **pnpm workspaces** + **Turborepo**.

**Stack principal**: TypeScript · Vue 3 · Vite · SQLite · CMMV Framework

---

## Estrutura do Monorepo

```
apps/
  api/          → Servidor CMMV (Node.js) — entrada: src/main.ts
  web/          → SSR Vue3 (Vite) — entrada: server.ts
  admin/        → SPA Vue3 (Vite) — painel administrativo

packages/
  plugin/       → Pacote principal @cmmv/blog — toda a lógica de negócio
  newsletter/   → @cmmv/newsletter — campanhas e assinantes
  ai-content/   → @cmmv/ai-content — geração de conteúdo com IA
  rss-aggregation/ → @cmmv/rss-aggregation — coleta de feeds RSS
  yt-aggregation/  → @cmmv/yt-aggregation — coleta de vídeos do YouTube
  access-control/  → @cmmv/access-control — controle de acesso por papel
  affiliate/    → @cmmv/affiliate — sistema de afiliados
  odds/         → @cmmv/odds — odds/apostas esportivas
  eslint-config/   → configuração ESLint compartilhada
  typescript-config/ → tsconfig base compartilhado
```

---

## packages/plugin — Módulos da API

Cada módulo em `packages/plugin/api/<modulo>/` segue o padrão:
- `<modulo>.module.ts` — registro do módulo CMMV
- `<modulo>.service.ts` — lógica de negócio e queries
- `<modulo>.controller.ts` — rotas HTTP
- `<modulo>.interface.ts` — tipos TypeScript

| Módulo | Responsabilidade |
|--------|-----------------|
| `posts` | Artigos/posts do blog |
| `categories` | Categorias dos posts |
| `authors` | Perfis de autores |
| `comments` | Comentários e likes |
| `medias` | Upload e gestão de mídia |
| `themes` | Temas customizáveis |
| `analytics` | Métricas de acesso |
| `settings` | Configurações globais |
| `members` | Membros/assinantes |
| `notifications` | Notificações push |
| `shorturl` | Encurtador de URL |
| `redirects` | Redirecionamentos |
| `sitemap` | Geração de sitemap |
| `feed` | RSS/Atom feed |
| `images` | Processamento de imagens (sharp) |
| `cdn` | Integração CDN |
| `storage` | Armazenamento de arquivos |
| `indexing` | Indexação de conteúdo |
| `autopost` | Publicação automática |
| `backup` | Backup de dados |
| `whitelabel` | Multi-tenant / white label |
| `accounts` | Gestão de contas |
| `profile` | Perfil de usuário |
| `prompts` | Prompts para IA |
| `imports` | Importação de conteúdo |
| `health` | Health check da API |
| `logs` | Logs de sistema |

### Contratos (packages/plugin/contracts/)

Definem os schemas TypeScript compartilhados entre API, admin e web:
- `posts.contract.ts` — estrutura de posts
- `categories.contract.ts` — categorias
- `comments.contract.ts` — comentários
- `themes.contract.ts` — temas
- `medias.contract.ts` — mídias
- `member.contract.ts` — membros
- `whitelabel.contract.ts` — configuração white label
- *(e demais contratos)*

### Admin (packages/plugin/admin/)

Componentes Vue 3 do painel admin — `api.ts` e componentes em `views/`.

### Client (packages/plugin/client/)

Lógica Vue 3 para o frontend público — composables, router, layouts, views.

---

## apps/api — Servidor

**Framework**: CMMV com adaptador HTTP padrão + SQLite via `@cmmv/repository`.

Módulos registrados em `src/main.ts`:
`BlogModule`, `AuthModule`, `AccessControlModule`, `RSSAggregationModule`,
`YTAggregationModule`, `AIContentModule`, `AffiliateModule`, `OddsModule`, `NewsletterModule`

Configurações em `src/config.ts` — lidas de variáveis de ambiente.

---

## apps/web — Frontend SSR

**Stack**: Vue 3 + Vite SSR + Tailwind CSS v4 + `@unhead/vue`
Entrada do servidor: `server.ts`
Configuração Vite: `vite.config.ts` (client) e `vite.config.server.ts` (SSR)

---

## apps/admin — Painel Admin

**Stack**: Vue 3 + Vite SPA + Tailwind CSS v4 + TipTap (editor rich text)
Usa `vue-router` para navegação entre seções.

---

## Comandos Principais

```bash
pnpm install              # Instalar dependências (sempre usar pnpm, NUNCA npm)
pnpm run dev              # Subir todos os apps em modo dev (turbo)
pnpm run build            # Build completo

# Por app individual:
cd apps/api && pnpm dev
cd apps/web && pnpm dev
cd apps/admin && pnpm dev
```

> **Importante**: O projeto roda em **WSL (Linux)** mas o código está em Windows (`B:\cmmv-blog`).
> Sempre usar `pnpm install` (não npm) para instalar os binários corretos para Linux.

---

## Convenções de Código

- **Linguagem**: TypeScript strict em todo o projeto
- **Módulos CMMV**: cada feature tem `.module.ts`, `.service.ts`, `.controller.ts`
- **Contratos**: schemas em `packages/plugin/contracts/` — compartilhados entre apps
- **Serviços**: toda lógica de banco fica nos `*.service.ts`
- **Sem ORM externo**: usa `@cmmv/repository` com SQLite direto
- **Temas**: sistema de temas customizáveis via banco de dados

---

## Variáveis de Ambiente Importantes

Definidas em `.env` na raiz de `apps/api/`:
- `DATABASE_PATH` — caminho do SQLite
- `JWT_SECRET` — chave JWT
- `STORAGE_*` — configuração de storage
- `AI_*` — chave de API para geração de conteúdo

---

## Onde Encontrar o Quê

| O que procuro | Onde está |
|---------------|-----------|
| Lógica de posts | `packages/plugin/api/posts/posts.service.ts` |
| Rotas da API | `packages/plugin/api/*/**.controller.ts` |
| Schemas/Tipos | `packages/plugin/contracts/*.contract.ts` |
| Componentes admin | `packages/plugin/admin/` + `apps/admin/src/` |
| Páginas do blog | `apps/web/src/` + `packages/plugin/client/views/` |
| Configuração do servidor | `apps/api/src/config.ts` |
| Processamento de imagens | `packages/plugin/api/images/` |
| Temas | `packages/plugin/api/themes/` |
