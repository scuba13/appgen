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

1. Crie estrutura de pastas definida em `target-architecture.md`.
2. Crie configs base.
3. Crie scripts obrigatorios.
4. Crie arquivos minimos de app.
5. Crie setup de testes conforme standards.
6. Crie setup de lint/typecheck/build.
7. Registre arquivos criados.
8. Execute ou solicite hooks `after-scaffold`.

## Saidas

Crie:

```text
_appgen_work/scaffold-report.md
_appgen_work/progress.jsonl
```

## Regras

- Nao apagar arquivos existentes sem confirmacao explicita.
- Nao criar estrutura fora de `app_root`, `.appgen/`, `_appgen_specs/` e `_appgen_work/`.
- Nao implementar features completas aqui. O scaffold cria base, nao produto final.
- Registre progresso em JSONL append-only.

## Handoff

Ao terminar, informe:

- app_root;
- resumo em linguagem de negocio do que foi criado;
- validacoes tecnicas executadas pelo agente, quando possivel;
- validacoes tecnicas pendentes, sem pedir ao usuario de negocio para executar comandos;
- proximo passo recomendado para disponibilizar ou revisar o app.
