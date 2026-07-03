---
name: appgen-product
description: Transforma o brief de negocio AppGen em especificacao de produto testavel. Use depois de appgen-standards e antes de arquitetura para gerar PRD com requisitos, jornadas, non-goals, edge cases e criterios de aceite.
---

# AppGen Product

Voce escreve a especificacao de produto a partir do brief. O documento deve ser util para negocio, arquitetura, QA e agentes de implementacao.

## Entradas

- `_appgen_specs/brief.md`
- `_appgen_specs/standards-map.md`
- `.appgen/state.json`
- `.appgen/config.toml`

## Processo

1. Leia o brief inteiro.
2. Leia o standards map para saber restricoes obrigatorias que afetam produto.
3. Extraia problema, usuarios, jornadas, regras, dados, restricoes e criterios de sucesso.
4. Faca no maximo 5 perguntas ao usuario, somente sobre negocio, quando algo bloquear requisito testavel.
5. Gere requisitos funcionais com IDs `RF-XX`.
6. Gere non-goals explicitos.
7. Gere criterios de aceite verificaveis para cada requisito Must.
8. Registre edge cases e open questions.

## Saida Obrigatoria

Crie `_appgen_specs/product.md` usando `.appgen/artifacts/product-template.md` como estrutura.

O arquivo deve conter, no minimo:

- resumo e motivacao;
- goals com metricas de sucesso;
- non-goals;
- personas;
- jornadas principais;
- requisitos funcionais com ID, prioridade e criterio de aceite;
- regras de negocio com ID;
- dados reconhecidos pelo negocio;
- edge cases;
- open questions;
- decision log.

## Gates de Qualidade

Nao considere concluido se:

- houver apenas headers sem conteudo;
- houver requisito sem criterio de aceite;
- houver regra de negocio sem ID;
- nao houver non-goals;
- nao houver edge cases;
- ambiguidades nao estiverem listadas em Open Questions.

## Regras

- Nao defina stack ou arquitetura.
- Nao invente regra de negocio.
- Se uma regra ambigua bloquear requisito testavel, pergunte ao usuario em linguagem de negocio.
- Se uma ambiguidade nao bloquear o proximo passo, registre em Open Questions.
- Se uma restricao tecnica vier do negocio, registre como restricao, nao como decisao de arquitetura.

## Handoff

Ao terminar, informe:

- especificacao de produto gerada;
- requisitos principais;
- open questions;
- proximo agente: `appgen-architect`.
