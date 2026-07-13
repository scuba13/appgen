# {{PROJECT_NAME}}

App corporativo gerado pelo AppGen.

## Stack

- Next.js
- Ant Design
- NestJS
- TypeScript
- PostgreSQL
- Prisma
- pnpm workspace

## Comandos

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:install
pnpm test:e2e
pnpm build
```

## Estrutura

```text
apps/web      # Next.js
apps/api      # NestJS
packages/shared
```

## Observabilidade E Erros

O scaffold ja inclui helpers para as slices usarem desde o primeiro codigo:

- Backend: `apps/api/src/common/logger.ts` para logs JSON estruturados.
- Backend: `apps/api/src/common/app-error.ts` para erros com `code`, `message`, `details` e status HTTP.
- Backend: `apps/api/src/common/http-error.filter.ts` para resposta de erro padronizada com `correlationId`.
- Frontend: `apps/web/src/lib/logger.ts` para logs JSON no browser.
- Frontend: `apps/web/src/lib/api-error.ts` e `apps/web/src/lib/http.ts` para chamadas HTTP com `x-correlation-id` e erro tipado.
- Frontend: `apps/web/src/app/error.tsx` para registrar falhas de render e permitir tentar novamente.

Ao implementar novas slices, reaproveite esses arquivos antes de criar novos padroes de log ou erro.

## Testes E2E

O scaffold inclui Playwright para validar a UI real no navegador.
Antes de rodar `pnpm test:e2e`, suba o preview web em `http://localhost:3000` ou defina `PLAYWRIGHT_BASE_URL`.
