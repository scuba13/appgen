---
name: appgen-scaffold
description: Cria a base fisica de um app AppGen conforme arquitetura e preset corporativo. Use para gerar estrutura de projeto, configs, scripts, arquivos base e setup inicial no app_root.
---

# AppGen Scaffold

Voce cria a base do app. Esta e a primeira etapa que escreve codigo no `app_root`.

## Entradas

- `.appgen/state.json`
- `.appgen/config.toml`
- `_appgen_specs/product.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/domain-model.md`
- `_appgen_specs/data-model.md`
- `_appgen_specs/api-contracts.md`
- `_appgen_specs/ui-spec.md`
- `_appgen_specs/features/`
- `_appgen_specs/quality/spec-score.md`
- `_appgen_specs/standards-map.md`

Se qualquer entrada obrigatoria nao existir, pare. Nao gere scaffold.
Retorne para o agente responsavel pela proxima spec pendente.

## Pre-voo

1. Resolva `app_root`.
2. Se `app_root` nao existir, crie.
3. Se `app_root` existir e tiver arquivos, mostre resumo e peca confirmacao antes de escrever.
4. Leia hooks `before-scaffold`, se existirem.

## Processo

1. Informe ao usuario que a etapa sera acompanhada por tarefas visiveis.
2. Apresente `_appgen_work/build-summary.md` com objetivo, usuarios, funcionalidades, regras e telas esperadas.
3. Se o usuario disser que o resumo esta incorreto, volte para product/specs antes de construir.
4. Execute internamente `appgen scaffold` somente quando o resumo estiver alinhado.
5. Acompanhe as tarefas registradas em `.appgen/state.json` no campo `scaffold.tasks`.
6. Crie estrutura de pastas definida em `target-architecture.md`.
7. Crie configs base.
8. Crie scripts obrigatorios.
9. Crie arquivos minimos de app.
10. Crie setup de testes conforme standards.
11. Crie setup de lint/typecheck/build.
12. Registre arquivos criados.
13. Execute ou solicite hooks `after-scaffold`.

## Saidas

Crie:

```text
_appgen_work/build-summary.md
_appgen_work/scaffold-report.md
_appgen_work/progress.jsonl
```

Atualize tambem `.appgen/state.json`:

```text
scaffold.status
scaffold.current_task
scaffold.tasks[]
```

## Regras

- Nao apagar arquivos existentes sem confirmacao explicita.
- Nao criar estrutura fora de `app_root`, `.appgen/`, `_appgen_specs/` e `_appgen_work/`.
- Nao implementar features completas aqui. O scaffold cria base, nao produto final.
- Registre progresso em JSONL append-only.
- Nao subir Docker Compose aqui. Preview tecnico pertence ao gate `appgen-preview-validation` dentro do implementation-loop.
- Mostre tarefas em linguagem de negocio. Prefira "criar base inicial da app" a "gerar estrutura fisica".

## Handoff

Ao terminar, informe:

- app_root;
- resumo em linguagem de negocio do que foi criado;
- arquivos base criados;
- tarefas registradas;
- proximo passo recomendado para disponibilizar ou revisar o app.
