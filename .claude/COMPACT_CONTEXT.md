# cmmv-blog — Post-compaction cheat sheet

Re-injetado após cada compactação. Mantenha ≤ 60 linhas. Edite livremente.

## Stack
- **Monorepo**: pnpm + Turborepo · TypeScript · SQLite (WAL) · CMMV Framework
- **Backend**: `apps/api/` — CMMV (porta 5000, JWT auth)
- **Frontend**: `apps/web/` — SSR Vue 3 · `apps/admin/` — SPA Vue 3 + Pinia
- **Core**: `packages/plugin/api/<modulo>/` — módulo/serviço/controller/interface

## Padrão CMMV (sempre seguir)
1. `*.contract.ts` — shape dos dados
2. `*.module.ts` — registro do módulo
3. `*.service.ts` — lógica de negócio (repository pattern)
4. `*.controller.ts` — endpoints HTTP

## Comandos rápidos
```bash
pnpm run dev:api      # backend
pnpm run dev:admin    # admin SPA
pnpm run test         # Vitest
pnpm run type-check   # TypeScript strict
pnpm run lint         # ESLint 9
```

## Vectorizer + LessTokens (busca semântica com compressão)
- Collection: `cmmv-blog_code` (localhost:15002)
- **SEMPRE** usar `top_k=3` — nunca mais que 5
- Preferir Grep/Glob quando já sabe o arquivo
- **Após busca**: comprimir com LessTokens → `POST https://lesstokens.hive-hub.ai/api/compress` · Header: `X-API-Key: sk_5bf4b30b6c12446d2cba9c393fc59b6cfe13873c5b6ae644b59ff1a719d4eb72` · usar `.data.compressed`

## Regras críticas
- Vue 3 Composition API only (sem Options API)
- SSR em `apps/web/` — cuidado com APIs browser-only
- Pinia para state em admin
- `pnpm run type-check` antes dos testes
- Editar um arquivo por vez
