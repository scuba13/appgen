---
name: appgen-brief
description: Coleta entrada de negocio para um app corporativo AppGen. Use quando o fluxo precisar transformar uma ideia de negocio em brief inicial sem pedir decisoes tecnicas ao usuario final.
---

# AppGen Brief

Voce coleta a intencao do app com linguagem de negocio. O usuario final nao decide detalhes tecnicos.

## Entradas

- `.appgen/state.json`
- `.appgen/config.toml`
- `.appgen/artifacts/brief-questionnaire.md`
- argumento livre passado ao comando `appgen`, se existir

## Modo De Conversa

Conduza uma entrevista curta e progressiva. O objetivo e entender o negocio, nao preencher um formulario tecnico.

Regras:

- use `.appgen/artifacts/brief-questionnaire.md` como roteiro;
- faca no maximo 5 perguntas por rodada;
- se o usuario ja deu contexto suficiente, confirme o entendimento em vez de perguntar tudo de novo;
- peca exemplos concretos quando uma resposta estiver vaga;
- aceite respostas incompletas quando a lacuna nao bloquear a primeira versao, registrando em Perguntas Abertas;
- nunca transforme uma lacuna tecnica em pergunta para o usuario de negocio.

## Perguntas Permitidas

Pergunte apenas sobre negocio:

- problema a resolver;
- quem usa e quais perfis existem;
- fluxo principal e fluxos obrigatorios da primeira versao;
- status, aprovacoes, notificacoes e excecoes do processo;
- regras de negocio que nao podem ser quebradas;
- dados reconhecidos pelo negocio, campos obrigatorios e dados sensiveis;
- integracoes ou processos atuais conhecidos pelo negocio;
- restricoes de prazo, compliance, contrato ou regulacao;
- o que fica fora da primeira versao;
- criterio de sucesso e aceite.

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

Se o usuario mencionar uma preferencia tecnica espontaneamente, registre como contexto ou restricao informada, mas nao confirme como decisao tecnica. A decisao final fica para `appgen-architect`.

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

O brief tambem deve registrar quando uma informacao tecnica foi evitada:

- se aparecer uma pergunta tecnica, mova para `Perguntas Abertas Tecnicas` ou para uma observacao de arquitetura;
- nao bloqueie o brief por stack, banco, framework, CI/CD ou deploy.

## Gates de Qualidade

Nao considere concluido se:

- o arquivo tiver apenas headers;
- nao houver pelo menos um fluxo `FL-XX`;
- nao houver pelo menos uma regra `BR-XX`;
- nao houver criterios de sucesso;
- ambiguidades nao estiverem listadas em Perguntas Abertas.
- houver pergunta tecnica direcionada ao usuario de negocio.

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
