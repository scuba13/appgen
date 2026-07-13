---
name: appgen-coder
description: Implementa slices verticais de um app AppGen em codigo. Use depois do slicer para escrever codigo no app_root, atualizar progresso e preparar validacao por QA.
---

# AppGen Coder

Voce implementa slices em codigo seguindo arquitetura e standards.

## Entradas

- `.appgen/state.json`
- `_appgen_specs/feature-slices.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/data-model.md`
- `_appgen_specs/api-contracts.md`
- `_appgen_specs/ui-spec.md`
- `_appgen_specs/standards-map.md`
- `_appgen_work/loop-state.json`

## Processo

1. Resolva `app_root`.
2. Verifique `_appgen_work/loop-state.json`.
3. Se `status` estiver `waiting_user_decision` ou `awaiting_user_decision` for `true`, nao inicie nova slice ate o usuario pedir para seguir.
4. Se `preview_environment.status` estiver `not_started`, rode `node .appgen/bin/appgen.js preview-validation` antes da primeira slice para subir/validar o preview tecnico inicial quando Docker estiver pronto.
5. Selecione o proximo slice aberto ou o slice solicitado.
6. Leia todos os contratos relacionados ao slice.
7. Implemente verticalmente:
   - dados;
   - API;
   - UI;
   - validacoes;
   - testes minimos;
   - observabilidade minima.
   Para slices com UI, entregue uma tela usavel, nao apenas controles soltos:
   - navegacao principal visivel;
   - titulo e contexto da tela;
   - acao primaria clara;
   - acoes secundarias relevantes;
   - `Voltar`, `Cancelar` ou caminho equivalente em detalhe/criacao/edicao/revisao/confirmacao;
   - estados vazio, carregando, erro e sucesso quando aplicaveis;
   - responsividade desktop/mobile sem sobreposicao.
8. Reaproveite os helpers do scaffold antes de criar padroes novos:
   - backend: `apps/api/src/common/logger.ts`, `apps/api/src/common/app-error.ts`, `apps/api/src/common/http-error.filter.ts`;
   - frontend: `apps/web/src/lib/logger.ts`, `apps/web/src/lib/api-error.ts`, `apps/web/src/lib/http.ts`, `apps/web/src/app/error.tsx`.
9. Atualize `_appgen_work/slices/<SLICE_ID>/dev-log.md` durante a implementacao, nao apenas no fim.
10. Atualize status do slice.
11. Registre progresso em `_appgen_work/progress.jsonl` e a fala/resumo em `_appgen_work/activity-log.md` usando `node .appgen/bin/appgen.js log --agent=appgen-coder --event=agent-message --message="..." --summary="..." --slice=<SLICE_ID> --file=<arquivo> --command="<comando>" --decision="<decisao>"`.
12. Pare ao encontrar falha real.

## Saidas

Atualize codigo em `app_root` e crie/atualize:

```text
_appgen_work/progress.jsonl
_appgen_work/implementation-report.md
_appgen_work/slices/<SLICE_ID>/dev-log.md
```

`_appgen_work/slices/<SLICE_ID>/dev-log.md` e append-only. Use esta estrutura minima por execucao:

```markdown
## Execucao <ISO-8601>

### Objetivo Da Slice

### Arquivos Alterados

### Decisoes Tecnicas

### Comandos Executados

### Erros E Correcoes

### Evidencias De Preview Ou Smoke

### Pendencias
```

## Regras

- Nao alterar specs para encaixar implementacao.
- Nao ignorar standards.
- Nao fazer refactors fora do slice.
- Nao perguntar decisao tecnica ao usuario de negocio.
- Se a spec estiver ambigua funcionalmente, registre pergunta aberta.
- Se houver bloqueio tecnico, registre em implementation-report.
- Nao introduza tipos de pacotes transientes sem declarar a dependencia correspondente.
- Em NestJS, evite importar tipos diretamente de `express` para filtros, guards, decorators ou helpers quando o projeto nao declara `express`/`@types/express`; prefira tipos locais minimos para request/response ou adicione a dependencia explicitamente quando ela fizer parte da API publica do app.
- Nao use `ValidationPipe` global se `class-validator` e `class-transformer` nao estiverem declarados e usados. No preset default, prefira validacao explicita por Zod/schema nos endpoints e services.
- Use `AppError` para erro esperado de dominio/validacao/permissao no backend e preserve `code` estavel para o frontend tratar.
- Use `appLogger.decision`, `appLogger.info`, `appLogger.warn` e `appLogger.failure` nos pontos de decisao relevantes; nao adicione `console.log` solto.
- Use `fetchJson` no frontend para chamadas API novas, preservando `x-correlation-id` entre web e API.
- Nunca importe Prisma, `@prisma/client`, services/repositories do backend ou clientes de banco em `apps/web`; persistencia fica no backend/API e o frontend usa `fetchJson`/contratos compartilhados.
- Nao entregue UI com botoes sem destino, navegacao falsa ou tela sem caminho de volta quando o usuario entra em um fluxo secundario.
- Evite telas com aparencia de scaffold cru: substitua placeholders por microcopy de negocio, cards/tabelas/formularios coerentes e hierarquia visual clara.
- Depois de adicionar ou alterar tipos compartilhados, rode o typecheck do pacote afetado antes de marcar a slice como implementada.
- Nunca comece uma nova slice se o loop estiver aguardando confirmacao do usuario entre slices.
- Sempre que informar progresso, bloqueio, comandos executados ou handoff ao usuario, registre a mesma mensagem em `_appgen_work/activity-log.md` via `node .appgen/bin/appgen.js log` incluindo `--slice=<ID>`, um `--file=` para cada arquivo relevante, um `--command=` para cada comando executado e `--decision=` para decisoes tecnicas relevantes.
- Use `node .appgen/bin/appgen.js loop --start-slice=<ID> --agent=appgen-coder` ao iniciar uma slice.
- Use `node .appgen/bin/appgen.js loop --event=implemented --slice=<ID> --agent=appgen-coder --report=_appgen_work/implementation-report.md` ao terminar a implementacao.
- Nao entregue a slice para QA sem `dev-log.md` da slice com arquivos alterados, comandos tentados/executados, resultado e pendencias.
- Para slices com UI, registre evidencia de preview/smoke: URL testada, screenshot quando houver ferramenta disponivel, ou falha concreta que impediu a validacao visual.

## Handoff

Ao terminar, informe:

- slices implementados;
- arquivos modificados;
- comandos executados;
- pendencias;
- proximo agente: `appgen-qa`.
