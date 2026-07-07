# AppGen

AppGen e um framework de agentes para gerar apps corporativos completos a partir de linguagem de negocio e padroes da empresa.

A pessoa de negocio descreve objetivo, usuarios, regras, prioridades, excecoes e criterios de aceite. As decisoes tecnicas, como stack, banco, arquitetura, testes, observabilidade e convencoes de deploy, ficam com os agentes tecnicos do AppGen usando o company profile instalado.

## Status Do Projeto

Este repositorio esta em fase de MVP e validacao local. Hoje, o caminho confiavel para testar e instalar a partir da fonte local deste repo.

Distribuicao via `npx appgen install` em outras maquinas ainda depende de publicacao/empacotamento do AppGen. Esse trabalho esta registrado para uma etapa futura.

## Fluxo Principal

O fluxo atual gera mais do que um scaffold:

```text
brief -> standards -> product -> architecture -> environment -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

Responsabilidades principais:

- `brief`: entende a necessidade de negocio sem perguntar stack ao usuario.
- `standards`: aplica o company profile e os standards corporativos.
- `product`: organiza a especificacao de produto.
- `architecture`: toma decisoes tecnicas e registra arquitetura, dominio, dados, API e UI.
- `environment`: valida Docker/Compose e planeja ambiente isolado.
- `specs`: detalha funcionalidades testaveis.
- `scaffold`: mostra resumo de negocio antes de criar a base fisica do app.
- `implementation-loop`: implementa por slices com coder, QA, quality e preview-validation.
- `acceptance`: entrega roteiro de teste, registra feedback e aceite explicito.
- `docs`: gera documentacao da app.
- `handoff`: consolida status, evidencias, riscos e proximos passos.

## Instalar Em Um Projeto

Para validar este repo localmente, primeiro guarde o caminho do clone do AppGen:

```bash
export APPGEN_REPO="/caminho/para/appgen"
```

Depois crie ou abra uma pasta de app e rode o CLI local:

```bash
node "$APPGEN_REPO/bin/appgen.js" install
```

Modo nao interativo para fixtures e testes:

```bash
node "$APPGEN_REPO/bin/appgen.js" install \
  --yes \
  --engines=codex,claude-code \
  --project-name "Helpdesk Interno" \
  --user-name "Eduardo"
```

Use `--engine=codex` para instalar apenas Codex, `--engine=claude-code` para instalar apenas Claude Code, ou `--engines=codex,claude-code` para instalar os dois.

Cada pasta de app precisa receber uma instalacao propria. Instalar AppGen em uma pasta nao instala em outras.

## Ativar No Chat

Depois da instalacao, abra Claude Code ou Codex na mesma pasta do app.

```text
Claude Code: /appgen
Codex: appgen ou $appgen
```

No Codex, `$appgen` e o caminho explicito para ativar a skill principal. A skill tambem pode aparecer como `AppGen` no menu de skills, dependendo da superficie usada.

## Atualizar Uma Instalacao

Se a pasta ja tem `.appgen/`, atualize antes de continuar:

```bash
node .appgen/bin/appgen.js update --yes --offline
```

O runner local em `.appgen/bin/appgen.js` evita pegar um `appgen` global antigo no `PATH`. Agentes AppGen devem usar esse runner para comandos internos.

## Comandos Principais

```bash
node .appgen/bin/appgen.js status
node .appgen/bin/appgen.js next
node .appgen/bin/appgen.js environment
node .appgen/bin/appgen.js scaffold
node .appgen/bin/appgen.js loop
node .appgen/bin/appgen.js preview-validation
node .appgen/bin/appgen.js acceptance
node .appgen/bin/appgen.js docs
```

`status` e `next` mostram retomada, proximo passo e bloqueios. Se o Docker estiver instalado mas o daemon nao estiver ativo, o fluxo deve orientar abrir o Docker Desktop e rodar novamente `environment`, em vez de seguir para specs.

## Activity Log

Durante o fluxo, AppGen registra um diario em Markdown:

```text
_appgen_work/activity-log.md
```

Esse arquivo serve para revisar o que aconteceu no Codex ou Claude Code sem depender da tela do chat: agentes executados, eventos, comandos relevantes, reports, bloqueios e proximos passos.

Agentes devem registrar tambem a mensagem que mostraram ao usuario:

```bash
node .appgen/bin/appgen.js log --agent=appgen-quality --event=agent-message --message="mensagem exibida ao usuario" --summary="resumo objetivo"
```

## Ambiente Isolado

AppGen usa Docker/Docker Compose como base de preview e validacao local.

O comando `environment`:

- detecta Node, Git, Docker e Compose;
- valida se o Docker daemon esta ativo;
- planeja containers da app;
- registra tarefas e resultado em `.appgen/state.json`;
- gera `_appgen_work/environment-report.md`.

Se Docker nao estiver pronto, o fluxo fica bloqueado em `environment` com uma acao clara. AppGen nao deve instalar Docker silenciosamente.

## Company Profile

O company profile e a fronteira de customizacao por empresa. Sem `--company`, AppGen instala o profile default do pacote em:

```text
.appgen/company/
```

Para usar um profile local:

```bash
node "$APPGEN_REPO/bin/appgen.js" install --company ./company-profiles/acme
```

Ordem de resolucao tecnica:

1. Decisao explicita aprovada no projeto.
2. Company profile instalado.
3. Defaults do preset.
4. Defaults internos do AppGen.

Veja mais em `docs/COMPANY-PROFILE.md`.

## App Gerado

O preset default cria um monorepo em `app/`:

```text
app/
  apps/web
  apps/api
  packages/shared
  docs/
```

O scaffold cria a base fisica e registra progresso. A validacao de preview acontece no `implementation-loop`, via `preview-validation`, antes de liberar o aceite da pessoa de negocio.

No inicio do `implementation-loop`, o fluxo recomenda rodar `node .appgen/bin/appgen.js preview-validation` para subir/validar o preview tecnico antes da primeira slice, quando Docker estiver pronto.

Entre uma slice e outra, o AppGen deve parar e pedir confirmacao para seguir. Isso permite limpar o contexto do Codex/Claude Code sem perder estado, porque o progresso fica em `.appgen/state.json`, `_appgen_work/loop-state.json` e `_appgen_work/activity-log.md`.

## Guias De Teste

Guia para pessoa de negocio:

```text
docs/MVP-TEST-GUIDE.md
```

Guia tecnico:

```text
docs/TECHNICAL-TEST-GUIDE.md
```

Fluxo completo:

```text
docs/FINAL-FLOW.md
```

## Desenvolvimento Do AppGen

Na raiz deste repo:

```bash
npm test
```

Essa suite valida sintaxe, instalacao, update offline, scaffold, environment, preview-validation e regras de retomada do fluxo.
