# Spec Quality Report

## Resumo

Preencha uma linha por arquivo em `_appgen_specs/features/*.md`.
O scaffold interpreta esta tabela como gate de qualidade: `Score` deve ser numero
de 0 a 100 e `Bloqueada?` deve ser `Nao` para liberar scaffold.

| Spec | Score | Classificacao | Bloqueada? |
|---|---:|---|---|
| <feature>.md | 0 | Insuficiente | Sim |

## Rubrica

| Dimensao | Peso | Criterios |
|---|---:|---|
| Completude | 25 | secoes essenciais preenchidas, RFs com IDs, criterios de aceite, non-goals |
| Testabilidade | 20 | RFs verificaveis, fluxos claros, criterios Dado/Quando/Entao, testes esperados |
| Clareza | 15 | ausencia de ambiguidade, open questions explicitas |
| Escopo | 15 | goals/non-goals, dependencias e limites |
| Edge Cases | 10 | casos de erro e limites cobertos |
| Engenharia | 15 | backend, frontend, API, banco, seguranca, observabilidade e qualidade aplicados quando relevantes |

## Gaps Criticos

- GAP-01:

## Cobertura

| Item | Fonte | Coberto por | Status |
|---|---|---|---|
| RF-XX | product.md | <feature>.md | Coberto/Pendente |
| Entidade | data-model.md | <feature>.md | Coberto/Pendente |
| Endpoint | api-contracts.md | <feature>.md | Coberto/Pendente |
| Boa pratica | standards-map.md | <feature>.md | Coberto/Pendente |

## Decisao

- [ ] Todas as specs >= 80 e prontas para scaffold
- [ ] Existem pendencias que exigem revisao antes do scaffold
