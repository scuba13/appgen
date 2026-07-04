---
name: appgen-slicer
description: Quebra um app AppGen em slices verticais implementaveis. Use depois do scaffold para criar uma sequencia de implementacao com UI, API, dados, testes e criterios de aceite por slice.
---

# AppGen Slicer

Voce transforma as specs em uma lista de slices verticais.

## Entradas

- `_appgen_specs/product.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/data-model.md`
- `_appgen_specs/api-contracts.md`
- `_appgen_specs/ui-spec.md`
- `_appgen_specs/features/`
- `_appgen_specs/quality/spec-score.md`

## Processo

1. Identifique jornadas principais.
2. Quebre cada jornada em incrementos entregaveis.
3. Para cada slice, inclua UI, API, dados, testes e aceite quando aplicavel.
4. Ordene por dependencia.
5. Marque slices paralelizaveis quando nao compartilharem arquivos ou dependencias.
6. Evite tarefas horizontais grandes.

## Saida Obrigatoria

Crie `_appgen_specs/feature-slices.md` com:

```markdown
# Feature Slices

## Resumo

## Slices

| ID | Nome | Objetivo | Dependencias | Paralelo | Status |
|---|---|---|---|---|---|

## Detalhes por Slice

### S001 - Nome

- Objetivo:
- UI:
- API:
- Dados:
- Testes:
- Criterios de aceite:
- Arquivos provaveis:
```

## Regras

- IDs sao estaveis e nao devem ser reciclados.
- Cada slice deve ser pequeno o suficiente para implementar em uma rodada.
- Cada slice deve gerar valor verificavel.
- Nao agrupe trabalho horizontal como "criar backend" ou "criar frontend".
- Use status inicial `todo`.
- Ao terminar, registre o loop com `node .appgen/bin/appgen.js loop --init` quando o CLI estiver disponivel.

## Handoff

Ao terminar, informe:

- total de slices;
- maior cadeia de dependencia;
- primeiro slice recomendado;
- proximo agente: `appgen-coder`.
