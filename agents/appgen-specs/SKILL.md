---
name: appgen-specs
description: Decompoe product spec e arquitetura AppGen em feature specs SDD prontas para implementacao. Use antes do scaffold para gerar specs por feature, score de qualidade e gates de completude.
---

# AppGen Specs

Voce transforma produto e arquitetura em specs executaveis por feature. O objetivo e que um agente de codificacao consiga implementar sem perguntar o basico.

## Entradas

- `_appgen_specs/product.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/domain-model.md`
- `_appgen_specs/data-model.md`
- `_appgen_specs/api-contracts.md`
- `_appgen_specs/ui-spec.md`
- `_appgen_specs/standards-map.md`

## Processo

1. Leia todos os artefatos obrigatorios.
2. Decomponha o produto em componentes/features coesas.
3. Para cada feature, crie uma spec em `_appgen_specs/features/<feature-kebab-case>.md`.
4. Use `.appgen/artifacts/feature-spec-template.md` como estrutura minima.
5. Cada spec deve conter RFs, non-goals, fluxo principal, alternativos, UI, API, dados, edge cases, seguranca, boas praticas de engenharia, testes e open questions.
   - Em UI, especifique navegacao, acao primaria, acoes secundarias, voltar/cancelar, estados vazio/carregando/erro/sucesso e comportamento mobile.
   - Em dados/arquitetura, mantenha Prisma e persistencia no backend; frontend deve consumir API/helpers/contratos compartilhados.
6. Avalie cada spec usando a rubrica:
   - Completude: 25
   - Testabilidade: 20
   - Clareza: 15
   - Escopo: 15
   - Edge cases: 10
   - Engenharia: 15
7. Gere `_appgen_specs/quality/spec-score.md` usando `.appgen/artifacts/spec-score-template.md`.
8. Preencha o resumo do score com uma linha por arquivo de feature, score numerico de 0 a 100 e `Bloqueada?` como `Sim` ou `Nao`.
9. Preencha a matriz de cobertura RF/entidade/endpoint/boa pratica. Qualquer item pendente deve marcar a spec relacionada como bloqueada.

## Gates de Qualidade

- Cada feature spec deve ter score minimo 80.
- Se alguma spec ficar abaixo de 80, registre gaps e nao libere scaffold.
- Toda feature Must do `product.md` deve estar coberta por pelo menos uma spec.
- Toda entidade persistida deve aparecer em `data-model.md` e em pelo menos uma feature spec.
- Todo endpoint necessario deve aparecer em `api-contracts.md` e em pelo menos uma feature spec.
- Toda boa pratica obrigatoria aplicavel do `standards-map.md` deve aparecer na feature spec ou ser marcada como nao aplicavel com justificativa.
- Specs com UI de detalhe/criacao/edicao/revisao/confirmacao devem declarar caminho de voltar/cancelar e criterios de UX verificaveis; se faltar, marque bloqueada.
- `_appgen_specs/quality/spec-score.md` deve ter uma tabela `Resumo` parseavel pelo CLI com colunas `Spec`, `Score`, `Classificacao` e `Bloqueada?`.
- Marque `Todas as specs >= 80 e prontas para scaffold` somente se todas as linhas tiverem score >= 80 e `Bloqueada?` = `Nao`.

## Saidas Obrigatorias

```text
_appgen_specs/features/<feature>.md
_appgen_specs/quality/spec-score.md
```

## Regras

- Escreva comportamento esperado, nao implementacao detalhada.
- Nao mude stack; use as decisoes do arquiteto.
- Se faltar decisao tecnica, registre gap em `_appgen_work/decisions.md` e retorne para `appgen-architect`.
- Se faltar regra de negocio, registre Open Question e pergunte ao usuario.

## Handoff

Ao terminar, informe:

- features geradas;
- score por feature;
- gaps criticos;
- se o scaffold esta liberado ou bloqueado;
- proximo agente: `appgen-scaffold`.
