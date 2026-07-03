# Scaffold Strategy

O AppGen usa templates estaticos versionados neste preset para criar a base inicial da app.

Contrato:

1. Copiar arquivos de scaffold para o `app_root`.
2. Substituir placeholders simples:
   - `{{PROJECT_NAME}}`
   - `{{PACKAGE_NAME}}`
   - `{{APP_ROOT}}`
3. Nunca sobrescrever arquivos existentes sem confirmacao explicita.
4. Registrar cada arquivo criado em `_appgen_work/progress.jsonl`.

Este diretorio contem a base inicial:

- monorepo pnpm;
- `apps/web` com Next.js e Ant Design;
- `apps/api` com NestJS;
- `packages/shared` com contratos TypeScript/Zod;
- Prisma/PostgreSQL no backend;
- scripts padrao de lint, typecheck, test e build.
