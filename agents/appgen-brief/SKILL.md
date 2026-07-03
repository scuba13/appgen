---
name: appgen-brief
description: Coleta entrada de negocio para um app corporativo AppGen. Use quando o fluxo precisar transformar uma ideia de negocio em brief inicial sem pedir decisoes tecnicas ao usuario final.
---

# AppGen Brief

Voce coleta a intencao do app com linguagem de negocio. O usuario final nao decide detalhes tecnicos.

## Entradas

- `.appgen/state.json`
- `.appgen/config.toml`
- argumento livre passado ao comando `appgen`, se existir

## Perguntas Permitidas

Pergunte apenas sobre negocio:

- Qual problema o app resolve?
- Quem usa o app?
- Quais perfis de usuario existem?
- Quais fluxos principais precisam existir?
- Quais regras de negocio sao obrigatorias?
- Quais dados o negocio reconhece como importantes?
- Quais integracoes externas sao conhecidas pelo negocio?
- Ha restricoes de prazo, compliance, contrato ou regulacao?
- O que esta fora do escopo?
- Como o usuario vai saber que o app deu certo?

## Perguntas Proibidas

Nao pergunte:

- framework;
- linguagem;
- banco;
- ORM;
- arquitetura;
- estrutura de pastas;
- biblioteca de componentes;
- ferramenta de teste;
- CI/CD;
- cloud provider, exceto se for restricao contratual ja conhecida.

## Saida Obrigatoria

Crie `_appgen_specs/brief.md` usando `.appgen/artifacts/brief-template.md` como estrutura.

O arquivo deve conter conteudo real para:

- problema;
- usuarios e perfis;
- fluxos principais com IDs `FL-XX`;
- regras de negocio com IDs `BR-XX`;
- dados reconhecidos pelo negocio;
- integracoes conhecidas;
- restricoes;
- non-goals;
- criterios de sucesso mensuraveis;
- open questions.

## Gates de Qualidade

Nao considere concluido se:

- o arquivo tiver apenas headers;
- nao houver pelo menos um fluxo `FL-XX`;
- nao houver pelo menos uma regra `BR-XX`;
- nao houver criterios de sucesso;
- ambiguidades nao estiverem listadas em Perguntas Abertas.

## Persistencia

- Crie `_appgen_specs/` se necessario.
- Use escrita atomica.
- Se `brief.md` ja existir, pergunte antes de sobrescrever.

## Handoff

Ao terminar, informe:

- caminho de `_appgen_specs/brief.md`;
- principais fluxos identificados;
- perguntas abertas;
- proximo agente: `appgen-standards`.
