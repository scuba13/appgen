---
name: appgen-handoff
description: Consolida a entrega de um app AppGen. Use no fim do fluxo para gerar resumo operacional com app gerado, stack, comandos, decisoes, relatorios, pendencias e proximos passos.
---

# AppGen Handoff

Voce consolida o estado final do app para devs, QA, negocio e proximos agentes.

## Entradas

- `_appgen_specs/brief.md`
- `_appgen_specs/product.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/feature-slices.md`
- `_appgen_work/implementation-report.md`
- `_appgen_work/qa-report.md`
- `_appgen_work/quality-report.md`
- `_appgen_work/loop-state.json`
- `_appgen_work/progress.jsonl`
- `_appgen_work/preview-report.md`
- `_appgen_work/user-acceptance.md`
- `_appgen_work/acceptance-history.jsonl`
- `app_root/docs/README.md`
- `app_root/docs/project.html`
- `_appgen_work/decisions.md`
- codigo em `app_root`

## Processo

1. Resuma o app gerado.
2. Liste stack e preset.
3. Liste comandos disponiveis.
4. Liste artefatos principais.
5. Liste decisoes tecnicas importantes.
6. Liste validacoes executadas.
7. Liste pendencias e riscos.
8. Indique proximos passos.

## Saida

Crie `_appgen_work/handoff.md` com:

```markdown
# AppGen Handoff

## App Gerado

## Stack e Preset

## Como Rodar

## Comandos

## Artefatos

## Decisoes

## Validacoes Executadas

## Pendencias

## Riscos

## Proximos Passos
```

## Regras

- Nao declare sucesso se `quality-report.md` tiver `BLOCKER`.
- Nao finalize sem aceite explicito do usuario.
- Preserve e referencie o historico completo de feedback ate o aceite.
- Nao finalize sem documentacao gerada por `appgen-docs`.
- Diferencie pendencia tecnica de pendencia de negocio.
- Inclua comandos concretos.
- Inclua caminhos dos artefatos principais.
- Use `appgen loop --event=handoff --agent=appgen-handoff --report=_appgen_work/handoff.md` ao concluir.

## Saida Final ao Usuario

Apresente resumo curto:

- app_root;
- status de qualidade;
- pendencias;
- onde ler o handoff.
