# AppGen - Guia de Uso Guiado

## Objetivo

Este guia mostra como uma pessoa de negocio usa o AppGen para criar, testar, aprovar ou retomar a geracao de um app corporativo.

Acao esperada: abrir a ferramenta de IA configurada no projeto, iniciar o AppGen e seguir as perguntas em linguagem de negocio. No Claude Code, use `/appgen`. No Codex, use `appgen`, `$appgen` ou selecione AppGen no menu de skills quando a interface mostrar essa opcao.

O usuario de negocio nao precisa escolher tecnologia, arquitetura, banco, framework, estrutura de pastas, testes ou CI/CD. Essas decisoes sao tomadas pelos agentes tecnicos do AppGen com base nos standards da empresa.

## Para Quem

Este guia e para pessoas de negocio, operacao, produto interno, atendimento, financeiro, RH ou qualquer area que precise descrever um app corporativo.

Nao e necessario saber programar.

## Antes de Comecar

O AppGen precisa ser instalado dentro da pasta de cada app que voce quer criar.

Isso e importante:

- cada app deve ter sua propria pasta;
- cada pasta precisa receber `appgen install` uma vez;
- instalar AppGen em uma pasta nao instala automaticamente em outras pastas;
- se a pasta ja tiver AppGen instalado, use `appgen update` antes de continuar.

Depois que a pasta estiver preparada, o uso normal comeca pela ferramenta de IA:

```text
Claude Code: /appgen
Codex: appgen ou $appgen
```

## Preparar A Pasta Do App

Abra um terminal e entre na pasta onde o app sera criado.

Exemplo:

```bash
mkdir -p ~/Projetos/helpdesk-interno
cd ~/Projetos/helpdesk-interno
```

Se essa pasta ainda nao tem AppGen instalado, rode:

```bash
npx appgen install
```

Se essa pasta ja tem AppGen instalado, rode:

```bash
npx appgen update
```

Use `install` para uma pasta nova. Use `update` quando a pasta ja tiver `.appgen/`.

## Como Responder A Instalacao

Durante `npx appgen install`, o AppGen faz algumas perguntas iniciais.

Respostas sugeridas para um teste simples:

```text
Engines Harness to support:
  Selecione Claude Code, Codex ou os dois.

Project name:
  Helpdesk Interno

What should the agents call you?
  Seu nome

Language for agent interactions:
  pt-br

Language for generated documents and specs:
  Portugues

Output folder for specs:
  _appgen_specs

How to handle artifacts in git?
  Commit with the project

How do you prefer to answer agent questions?
  In the chat
```

Escolha a engine que voce realmente vai usar:

- escolha `Claude Code` se vai abrir o projeto no Claude Code;
- escolha `Codex` se vai abrir o projeto no Codex;
- escolha as duas se quer poder usar qualquer uma nessa pasta.

Depois que a instalacao terminar, continue sempre na mesma pasta.

## Abrir Claude Code Ou Codex

Abra a ferramenta escolhida apontando para a mesma pasta onde voce rodou `npx appgen install`.

Exemplo:

```bash
cd ~/Projetos/helpdesk-interno
```

Depois abra Claude Code ou Codex nessa pasta.

Na conversa com a ferramenta, inicie o AppGen:

```text
Claude Code:
  /appgen

Codex:
  appgen
  ou
  $appgen
```

No Codex, voce tambem pode abrir o menu de skills e selecionar AppGen quando a interface mostrar essa opcao.

## Como Iniciar

1. Abra Claude Code ou Codex na pasta do app.
2. Digite `/appgen` no Claude Code, ou `appgen`/`$appgen` no Codex.
3. Descreva o app que voce quer criar.
4. Responda apenas perguntas de negocio.
5. Quando o AppGen apresentar um resumo de etapa, diga algo como `pode seguir`, `continuar` ou `seguir`.

Se voce fechar a ferramenta e voltar depois, abra novamente a mesma pasta e use o mesmo gatilho. O AppGen deve retomar do ponto em que parou.

## O Que Escrever No Primeiro Contato

Voce pode comecar simples.

No Claude Code:

```text
/appgen

Quero criar um app chamado Helpdesk Interno.
Ele deve permitir que colaboradores abram chamados e que a equipe de atendimento acompanhe, priorize e atualize esses chamados.
```

No Codex, troque a primeira linha por `appgen` ou `$appgen`.

Se ja souber mais detalhes, inclua:

- quem usa o app;
- quais perfis existem;
- quais atividades cada perfil faz;
- quais dados sao importantes;
- quais regras nao podem ser quebradas;
- quais telas ou relatorios voce imagina;
- quais integracoes de negocio ja sao conhecidas;
- o que esta fora do escopo.

## Exemplo Completo

Exemplo no Claude Code:

```text
/appgen

Quero criar um app corporativo chamado Helpdesk Interno.

Objetivo:
Permitir que colaboradores abram chamados internos e que uma equipe de atendimento acompanhe, priorize e atualize o status desses chamados.

Usuarios:
- Colaborador: cria chamado, acompanha status e ve comentarios.
- Atendente: visualiza fila de chamados, altera status, prioridade e adiciona comentarios internos.
- Gestor: acompanha volume de chamados por status e prioridade.

Fluxo principal:
1. O colaborador abre um chamado informando titulo, descricao, categoria, prioridade e e-mail de contato.
2. O chamado entra com status aberto.
3. O atendente ve a lista de chamados, filtra por status e prioridade e abre o detalhe.
4. O atendente altera status para em andamento, resolvido ou cancelado.
5. O app registra data de criacao e ultima atualizacao.

Dados importantes:
- Chamado: titulo, descricao, categoria, prioridade, status, nome do solicitante, e-mail do solicitante, data de criacao e data de atualizacao.
- Comentario: chamado, autor, mensagem, se e interno ou visivel ao solicitante, data de criacao.

Telas esperadas:
- dashboard simples com contadores por status;
- lista de chamados;
- formulario para criar chamado;
- detalhe do chamado com comentarios e mudanca de status.

Regras:
- O colaborador nao altera status diretamente.
- O atendente pode alterar status e prioridade.
- O gestor visualiza indicadores.
- O app deve ser simples, mas preparado para evoluir.
```

No Codex, use o mesmo texto, mas comece com `appgen` ou `$appgen`.

## Como O AppGen Vai Conduzir

O AppGen trabalha por etapas. A pessoa de negocio nao precisa chamar agentes pelo nome, mas estes sao os tipos de trabalho executados:

1. Entender a necessidade de negocio.
2. Ler os padroes corporativos instalados.
3. Organizar a especificacao de produto.
4. Tomar decisoes tecnicas internamente.
5. Conferir ambiente de teste isolado.
6. Detalhar as funcionalidades para implementacao.
7. Mostrar um resumo antes de construir.
8. Criar a base do app.
9. Implementar o app por slices.
10. Preparar preview local para aceite.
11. Seguir roteiro de teste e registrar feedback ou aceite explicito.
12. Gerar documentacao e handoff.

O fluxo esperado e:

```text
brief -> standards -> product -> architecture -> environment -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

Ao fim de cada etapa, o AppGen deve mostrar:

- o que foi entendido;
- quais decisoes foram tomadas;
- quais duvidas de negocio ainda existem;
- o que sera feito em seguida.

Antes de criar a base do app, o AppGen deve mostrar um resumo simples com objetivo, usuarios, funcionalidades, regras e telas esperadas. Se esse resumo estiver errado, peca ajuste antes de construir.

Para continuar, responda em linguagem natural:

```text
pode seguir
```

ou

```text
continuar
```

Durante a implementacao por slices, o AppGen deve parar entre uma slice e outra. Quando ele avisar que uma slice terminou, revise o resumo e diga `pode seguir` somente se quiser iniciar a proxima. Se a conversa estiver grande, voce pode limpar/reabrir o contexto antes de continuar; o estado fica salvo na pasta do projeto.

## Perguntas Que O AppGen Pode Fazer

O AppGen pode perguntar:

- qual problema o app resolve;
- quem sao os usuarios;
- quais perfis ou permissoes existem;
- quais fluxos sao obrigatorios;
- quais regras de negocio devem ser respeitadas;
- quais dados sao importantes;
- quais excecoes precisam ser tratadas;
- quais integracoes de negocio existem;
- o que fica fora do escopo;
- como saber se o app atendeu ao objetivo.

Na primeira conversa, o AppGen deve usar um roteiro em blocos pequenos. Ele nao precisa fazer todas as perguntas de uma vez: o ideal e perguntar no maximo 5 por rodada, confirmar entendimento e continuar apenas quando faltar informacao importante.

## Perguntas Que O AppGen Nao Deve Fazer Ao Negocio

O AppGen nao deve pedir que a pessoa de negocio escolha:

- linguagem de programacao;
- framework;
- banco de dados;
- ORM;
- arquitetura;
- estrutura de pastas;
- ferramenta de testes;
- pipeline de CI/CD;
- detalhes de deploy.

Se algo tecnico estiver faltando, o AppGen deve resolver com os standards da empresa ou registrar uma pendencia tecnica para o agente responsavel.

## Quando O AppGen Pode Bloquear

O fluxo pode pausar quando faltar uma informacao de negocio importante, por exemplo:

- uma regra obrigatoria esta ambigua;
- um perfil de usuario nao esta claro;
- um dado sensivel precisa de regra de acesso;
- uma integracao externa e necessaria, mas o comportamento esperado nao foi descrito;
- uma funcionalidade parece fora do escopo inicial.

Quando isso acontecer, o AppGen deve explicar o bloqueio em linguagem simples e fazer uma pergunta objetiva.

## O Que Esperar Ao Final

Ao final do fluxo, o AppGen deve entregar:

- um resumo do app gerado;
- a base do app criada em `app/`;
- documentos de produto e funcionalidades;
- decisoes tecnicas registradas;
- preview local preparado para aceite;
- feedback e aceite registrados quando aplicavel;
- documentacao da app gerada;
- handoff com status, evidencias e proximos passos;
- pendencias claras, se existirem;
- validacoes tecnicas executadas pelo agente ou marcadas como pendentes.

## Checklist Para Negocio

Antes de aprovar o preview da app, confira:

- o objetivo do app esta correto;
- os perfis de usuario estao corretos;
- os fluxos principais fazem sentido;
- as regras de negocio obrigatorias aparecem no resumo;
- os dados importantes foram reconhecidos;
- o que ficou fora do escopo esta claro;
- as perguntas abertas foram respondidas ou aceitas como pendencia;
- o preview local abriu;
- os fluxos principais foram testados;
- feedback foi registrado se algo precisar mudar.

## Como Testar O Preview

Quando a equipe tecnica avisar que o preview esta pronto, abra a URL informada.
O AppGen deve entregar tambem um roteiro de teste com os fluxos e regras que precisam ser conferidos.

Normalmente a URL local sera:

```text
http://localhost:3000
```

Teste como pessoa de negocio:

1. Entre nos fluxos principais descritos no app.
2. Crie ou edite dados de exemplo.
3. Confira se nomes, telas, campos e status fazem sentido.
4. Tente executar as regras importantes.
5. Verifique se algum perfil esta vendo ou fazendo algo que nao deveria.
6. Anote qualquer comportamento estranho, regra faltando ou texto confuso.

Nao e necessario avaliar codigo, framework, banco de dados, estrutura de pastas, testes automatizados ou Docker.

## Como Informar Resultado

Se o app estiver correto, responda na ferramenta de IA:

```text
aprovado
```

ou:

```text
pode registrar aceite
```

Se precisar mudar algo de negocio, descreva objetivamente:

```text
Nao esta aprovado ainda.
O atendente nao deve poder cancelar chamados depois que eles estiverem resolvidos.
Tambem falta o filtro por categoria na lista de chamados.
```

Se o problema for ambiente ou preview, diga isso claramente:

```text
Nao consegui testar porque o preview nao abriu.
A pagina mostrou erro ao acessar http://localhost:3000.
```

## Guia Tecnico

Os comandos para preparar ambiente, rodar fixtures, validar scaffold, Docker Compose, acceptance e docs ficam no guia tecnico:

```text
docs/TECHNICAL-TEST-GUIDE.md
```
