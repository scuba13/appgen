# Handoff - AppGen

## Contexto

Este repositorio e a extracao limpa do AppGen para fora do Reversa.

Diretorio:

```text
/Users/eduardonascimento/Github/appgen
```

Commit inicial:

```text
74b1329 Initial AppGen extraction
```

O desenvolvimento daqui para frente deve acontecer neste repositorio, nao mais dentro de `/Users/eduardonascimento/Github/reversa/appgen`.

## Objetivo do AppGen

AppGen e um framework de agentes para gerar apps corporativas completas a partir de linguagem de negocio e standards da empresa.

O usuario final e de negocio. Ele decide objetivo, regras, prioridades, excecoes e aceite. As decisoes tecnicas ficam com os agentes tecnicos e com o `company profile`.

## Fluxo Final

```text
brief -> standards -> product -> architecture -> environment -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

Agentes instalaveis:

```text
appgen
appgen-brief
appgen-standards
appgen-product
appgen-architect
appgen-environment
appgen-specs
appgen-scaffold
appgen-slicer
appgen-coder
appgen-qa
appgen-quality
appgen-preview-validation
appgen-acceptance
appgen-docs
appgen-handoff
```

Ativacao no chat:

```text
Claude Code: /appgen
Codex: appgen ou $appgen
```

Claude Code recebe um comando local em `.claude/commands/appgen.md`.
Codex usa a skill repo-local em `.agents/skills/appgen`; o caminho explicito documentado e `$appgen` ou o menu `/skills`.

## Estrutura do Repo

```text
agents/      skills dos agentes AppGen
bin/         CLI appgen
lib/         comandos, instalador, runtime e scaffold
presets/     preset default-web-saas, scaffold e company profile default
templates/   templates instalados em projetos alvo
docs/        docs do proprio AppGen
test/        pastas locais para testes manuais com Claude Code e Codex
```

Pastas de teste manual criadas:

```text
test/claude/
test/codex/
```

Essas pastas foram criadas para o usuario executar fluxos reais em cada engine.
Depois dos testes, analisar os artefatos gerados, logs, estado `.appgen/`, comportamento de ativacao no chat e divergencias entre Claude Code e Codex.

## Company Profile

O company profile e a fronteira de customizacao por empresa.

Instalado em projetos alvo como:

```text
.appgen/company/
```

Fonte default no pacote:

```text
presets/default-web-saas/company/
```

Ordem de resolucao:

1. Decisao explicita aprovada para o projeto.
2. Company profile.
3. Preset defaults.
4. AppGen defaults.

## Preview Validation E Acceptance

Decisao de produto/fluxo em andamento:

- durante `appgen install`, considerar uma varredura de ambiente para garantir que existe base para rodar e testar a app;
- decisao atual: nao instalar Node/pnpm/banco/etc. direto na maquina do usuario; preferir ambiente isolado em containers;
- o requisito local principal deve ser Docker/Docker Desktop com Docker Compose;
- criar um agente proprio para preparar ambiente antes de iniciar o projeto, possivelmente `appgen-environment`;
- esse agente deve detectar Docker/Compose, validar se o daemon esta rodando e, se Docker nao existir, pedir autorizacao explicita para instalar Docker Desktop ou orientar instalacao manual;
- depois de Docker pronto, o agente deve criar/validar o ambiente containerizado usado para preview, testes e smoke checks;
- registrar tudo em `.appgen/state.json` e `_appgen_work/environment-report.md`;
- a instalacao de Docker nunca deve acontecer silenciosamente nem misturada com agentes de negocio;
- toda etapa deve mostrar tarefas visiveis para o usuario e registrar progresso/checkpoint em `.appgen/state.json`;
- `appgen-scaffold` cria a base fisica do app e mostra tarefas, mas nao deve validar o produto final;
- `implementation-loop` coordena `appgen-coder`, `appgen-qa` e `appgen-quality` por slice;
- `appgen-coder` e o agente que escreve codigo;
- `appgen-preview-validation` nao deve ser uma etapa macro isolada entre `implementation-loop` e `acceptance`;
- `appgen-preview-validation` deve ser gate interno/final do `implementation-loop`;
- dentro do `implementation-loop`, o ciclo correto e: `appgen-coder` -> `appgen-qa` -> `appgen-quality` -> `appgen-preview-validation`;
- se `preview-validation` falhar por problema tecnico, o loop volta para `appgen-coder`/`appgen-qa`/`appgen-quality` ate corrigir;
- se `preview-validation` falhar por ambiente, registra blocker `environment`;
- se `preview-validation` passar, o `implementation-loop` pode liberar `appgen-acceptance`;
- `appgen-acceptance` so deve envolver o usuario depois do preview tecnico estar pronto ou depois de registrar blocker claro.

Status implementado nesta sessao:

- `appgen-environment` foi criado como etapa macro depois de `appgen-architect` e antes de `appgen-specs`;
- `appgen environment` detecta Node/Git/Docker/Compose, valida daemon Docker, planeja containers e grava `_appgen_work/environment-report.md`;
- `appgen-preview-validation` foi criado como agente/gate tecnico interno do `implementation-loop`;
- `appgen preview-validation` gera/valida `app/docker-compose.yml`, roda `docker compose config`, e quando nao esta em `--prepare-only` tenta `docker compose up -d --build` e smoke test web/API;
- `appgen-scaffold` agora mostra tarefas e registra `scaffold.tasks` em `.appgen/state.json`, mas nao sobe preview;
- `agents/appgen`, `agents/appgen-scaffold`, `agents/appgen-acceptance`, `docs/TECHNICAL-TEST-GUIDE.md`, `templates/plan.md` e `templates/state.json` foram atualizados para o novo fluxo;
- `test/` foi adicionado ao `.gitignore` para nao versionar resultados locais dos testes manuais;
- validacao executada: `npm test` passou com 6/6 testes e `git diff --check` passou;
- commit criado e enviado para `origin/main`: `2b866c2 Add environment and preview validation stages`.

Arquivos relevantes modificados/novos nesta sessao:

```text
agents/appgen-acceptance/SKILL.md
agents/appgen-environment/SKILL.md
agents/appgen-environment/agents/openai.yaml
agents/appgen-preview-validation/SKILL.md
agents/appgen-preview-validation/agents/openai.yaml
agents/appgen-scaffold/SKILL.md
agents/appgen/SKILL.md
bin/appgen.js
docs/TECHNICAL-TEST-GUIDE.md
lib/commands/environment.js
lib/commands/scaffold.js
lib/commands/preview-validation.js
lib/installer/agent-ids.js
lib/runtime/flow.js
lib/runtime/preview.js
lib/scaffold/copier.js
package.json
templates/plan.md
templates/state.json
tests/install-scaffold.test.js
```

Proximo passo recomendado ao retomar:

1. Rodar teste manual real em `test/claude/` e `test/codex/` com o novo fluxo.
2. Avaliar se `appgen-environment` deve rodar automaticamente ao final do install ou apenas como etapa do fluxo.
3. Melhorar `implementation-loop` para registrar explicitamente o resultado de `preview_validation` como gate final antes de liberar acceptance.
4. Revisar a experiencia para pessoa nao tecnica: reduzir decisoes tecnicas expostas, explicar progresso em linguagem de negocio e garantir que erros de ambiente virem instrucoes claras.

## UX Para Usuario Nao Tecnico

Decisao registrada:

- pontos 1 e 2 ficam para discutir depois: instalacao mais guiada e perguntas iniciais menos tecnicas;
- pontos 3 a 7 foram priorizados para implementacao agora.

Pontos 3 a 7 implementados:

- resumo antes de construir: `appgen next` quando a proxima etapa e `scaffold`, e `appgen scaffold`, geram `_appgen_work/build-summary.md`;
- progresso em linguagem de negocio: `appgen status`, `appgen next`, `appgen scaffold`, `appgen environment` e `appgen preview-validation` mostram mensagens mais claras para uma pessoa nao tecnica;
- erros com instrucao clara: bloqueios de Docker explicam que ele e necessario para teste isolado e que instalacao so acontece com autorizacao explicita;
- aceite com roteiro: `appgen acceptance` gera `_appgen_work/acceptance-test-guide.md` e registra `acceptance.test_guide` no state;
- modo retomada: `appgen status` e `appgen next` mostram ultima etapa, proximo passo e acao recomendada.

Ponto 2 implementado depois:

- perguntas iniciais menos tecnicas: `appgen-brief` agora usa `.appgen/artifacts/brief-questionnaire.md`;
- o roteiro pergunta em blocos de no maximo 5 perguntas sobre problema, usuarios, fluxos, regras, dados, integracoes conhecidas, fora de escopo e aceite;
- perguntas tecnicas como stack, framework, banco, ORM, arquitetura, CI/CD, deploy e estrutura de pastas ficaram explicitamente proibidas;
- `brief-template.md`, `templates/commands/appgen.md`, `templates/engines/AGENTS.md`, `templates/engines/CLAUDE.md`, docs e testes foram atualizados.

Correcao apos teste Codex:

- problema encontrado: durante `appgen-environment`, o agente tentou rodar `appgen environment`, mas o `appgen` do PATH apontava para uma instalacao global antiga `0.1.0` sem esse comando;
- causa: o pacote local tinha evoluido sem bump de versao e os agentes usavam comando global;
- correcao: pacote foi versionado para `0.2.0`, instalacoes novas criam `.appgen/bin/appgen.js`, e as skills foram atualizadas para usar `node .appgen/bin/appgen.js ...` em comandos internos;
- regra daqui para frente: usuario pode chamar AppGen no chat, mas agentes tecnicos devem usar o runner local do projeto, nunca depender do `appgen` global do PATH.

Correcao em andamento apos revisar `test/codex` ate environment:

- problema: `environment.status = needs_attention` com Docker daemon desligado estava sendo marcado como etapa concluida no plano e o fluxo seguia para specs;
- objetivo: environment so pode concluir quando `environment.status = ready`;
- `appgen next` e `appgen status` devem priorizar blocker de ambiente antes de sugerir specs;
- `environment-report.md` deve diferenciar Docker nao instalado de Docker instalado com daemon desligado;
- quando Docker ja existe, nao sugerir reinstalacao; orientar abrir Docker Desktop e rodar `node .appgen/bin/appgen.js environment`;
- `appgen environment` deve corrigir states antigos, removendo `environment` de completed e desmarcando o plano se o ambiente continuar bloqueado;
- tasks finalizadas de environment devem registrar `started_at` e `completed_at`; isso agora tem cobertura em `tests/install-scaffold.test.js`.

Checkpoint para novo teste Codex:

- `test/codex/` foi limpo para iniciar um teste do zero;
- objetivo do proximo teste: instalar AppGen novamente em `test/codex`, rodar o fluxo no Codex ate `appgen-environment`, validar se Docker blocker, `status`, `next`, plano, state e `environment-report.md` ficaram coerentes;
- comando recomendado para instalar no teste: `node /Users/eduardonascimento/Github/appgen/bin/appgen.js install --yes --engines=codex,claude-code --project-name "teste codex" --user-name "Ale"`;

Correcao apos novo teste Codex:

- problema encontrado: no Codex, o seletor de skills mostrava os agentes AppGen tecnicos, mas nao deixava claro o comando/skill principal `$appgen` do fluxo;
- decisao: o fluxo principal deve aparecer como `AppGen`/`$appgen`, separado dos agentes de etapa como `appgen-brief`, `appgen-product`, etc.;
- correcao aplicada: `agents/appgen/SKILL.md` recebeu frontmatter mais completo no padrao do Reversa, com `description` iniciando por "Fluxo principal do AppGen" e gatilho `$appgen` logo no inicio;
- correcao aplicada: `agents/appgen/agents/openai.yaml` agora usa `display_name: "AppGen"`, `default_prompt: "$appgen"` e `policy.allow_implicit_invocation: true`;
- versao local ajustada para `0.2.1`, para que instalacoes existentes em `0.2.0` recebam a correcao via `node .appgen/bin/appgen.js update --yes --offline`;
- cobertura adicionada: teste de instalacao Codex valida que o skill principal instalado em `.agents/skills/appgen` contem `name: appgen`, `$appgen`, `role: orchestrator` e metadata OpenAI de UI.
- ao usar comandos internos depois do install, preferir `node .appgen/bin/appgen.js ...`.

Correcao apos typecheck no teste Codex:

- problema observado no fluxo real: o primeiro typecheck encontrou uso de tipos do Express sem dependencia de tipos declarada;
- decisao: agentes nao devem importar tipos de pacotes transientes sem declarar dependencia explicita;
- correcao aplicada: `appgen-coder` agora orienta usar tipos locais minimos para request/response em helpers NestJS quando `express`/`@types/express` nao fizer parte da API publica do app;
- correcao aplicada: `appgen-quality` trata falha de typecheck por tipo ausente ou pacote nao declarado como `BLOCKER` que volta para `appgen-coder`;
- correcao aplicada: o standard backend default proibe importar tipos Express/Fastify diretamente sem dependencia declarada;
- versao local ajustada para `0.2.2` para permitir update offline em instalacoes existentes;
- validacao executada: `pnpm --filter @codex/api typecheck` passou em `test/codex/app`.

Correcao apos testes/build no teste Codex:

- problema observado: Vitest na API nao resolvia `@codex/shared` em specs;
- correcao aplicada: scaffold da API agora cria `vitest.config.ts` com alias para `packages/shared/src/index.ts`;
- problema observado: runtime CommonJS da API precisava consumir `@<package>/shared` compilado, nao o `src/index.ts`;
- correcao aplicada: scaffold do pacote shared agora emite `dist`, gera declarations, usa `module: "CommonJS"` e aponta `main`/`types` para `dist`;
- correcao aplicada: scaffold da API agora declara `@<package>/shared` como dependencia `workspace:*`;
- versao local ajustada para `0.2.3` para permitir update offline em instalacoes existentes;
- validacoes executadas em `test/codex/app`: `pnpm --filter @codex/api test` passou e `pnpm -r build` passou.

Correcao apos runtime no teste Codex:

- problema observado: API falhou em runtime porque o scaffold usava `ValidationPipe` global do Nest sem instalar `class-validator`/`class-transformer`;
- decisao: no preset default, validacoes devem ser explicitas por Zod/schema nos endpoints e services, salvo quando o projeto declarar class-validator/class-transformer;
- correcao aplicada: `apps/api/src/main.ts.tpl` nao instala mais `ValidationPipe` global;
- correcao aplicada: standard backend proibe habilitar `ValidationPipe` sem as dependencias e uso correspondente;
- melhoria aplicada: AppGen agora cria `_appgen_work/activity-log.md` como diario Markdown de eventos, comandos, reports, bloqueios e proximos passos, porque nao e viavel capturar literalmente a tela do Codex de dentro do AppGen;
- melhoria aplicada: `implementation-loop` registra `preview_environment` e recomenda rodar `node .appgen/bin/appgen.js preview-validation` antes da primeira slice para subir/validar o preview tecnico inicial quando Docker estiver pronto;
- melhoria aplicada: smoke test do preview aceita tanto `http://localhost:3001/health` quanto `http://localhost:3001/api/v1/health`;
- versao local ajustada para `0.2.4` para permitir update offline em instalacoes existentes.

Melhoria de controle de contexto entre slices:

- decisao: entre uma slice e outra no `implementation-loop`, o agente deve parar e perguntar se pode seguir, para permitir limpar contexto do Codex/Claude Code sem perder estado;
- correcao aplicada: runtime do loop agora usa `pause_between_slices: true` por default;
- quando `loop --complete-slice=<ID>` conclui uma slice e ainda existem slices abertas, o status vira `waiting_user_decision` e `awaiting_user_decision: true`;
- `appgen-coder` nao deve iniciar nova slice enquanto o loop estiver aguardando confirmacao;
- `appgen-quality` deve resumir a slice aprovada, apontar `_appgen_work/activity-log.md` e aguardar o usuario pedir para seguir;
- versao local ajustada para `0.2.5` para permitir update offline em instalacoes existentes.

Melhoria do activity log:

- problema observado: `_appgen_work/activity-log.md` registrava eventos tecnicos, mas nao a fala real do agente para o usuario;
- decisao: para analise e melhoria do fluxo, o log precisa registrar tambem a mensagem que o agente mostrou ao usuario;
- correcao aplicada: novo comando `node .appgen/bin/appgen.js log --agent=<agente> --event=agent-message --message="..." --summary="..."`;
- `activity-log.md` agora cria uma secao `Mensagem Ao Usuario` para essas entradas;
- `appgen`, `appgen-coder`, `appgen-qa` e `appgen-quality` foram instruidos a registrar mensagens relevantes no log;
- versao local ajustada para `0.2.6` para permitir update offline em instalacoes existentes.

Correcao dos reports por slice:

- problema observado no teste em `test/codex`: `_appgen_work/test-plan.md`, `_appgen_work/qa-report.md` e `_appgen_work/quality-report.md` ficaram apenas com a slice S003, indicando que agentes estavam sobrescrevendo os arquivos gerais a cada slice;
- decisao: reports gerais devem ser acumulados append-only, preservando slices anteriores;
- decisao: cada slice tambem deve ter artefatos isolados em `_appgen_work/slices/<SLICE_ID>/test-plan.md`, `_appgen_work/slices/<SLICE_ID>/qa-report.md` e `_appgen_work/slices/<SLICE_ID>/quality-report.md`;
- em reexecucao da mesma slice, o agente deve adicionar uma subsecao `### Reexecucao <ISO-8601>` sem apagar a execucao anterior;
- `appgen-qa`, `appgen-quality` e `appgen` foram atualizados para registrar essa regra;
- `loop --report` agora deve apontar para o report isolado da slice, mantendo os reports gerais como visao acumulada;
- versao local ajustada para `0.2.7` para permitir update offline em instalacoes existentes.

Arquivos principais desse ajuste:

```text
lib/runtime/business-experience.js
templates/artifacts/brief-questionnaire.md
lib/installer/writer.js
lib/commands/next.js
lib/commands/status.js
lib/commands/scaffold.js
lib/commands/acceptance.js
lib/commands/environment.js
lib/commands/preview-validation.js
agents/appgen/SKILL.md
agents/appgen-scaffold/SKILL.md
agents/appgen-acceptance/SKILL.md
templates/state.json
tests/install-scaffold.test.js
```

## Acceptance Loop

Antes de docs e handoff existe `appgen-acceptance`. O preview tecnico deve ter sido validado dentro do `implementation-loop` por `appgen-preview-validation`.

Responsabilidades:

- detectar OS, Docker e Docker Compose;
- gerar `app/docker-compose.yml`;
- criar `_appgen_work/preview-report.md`;
- subir/validar preview local antes do usuario quando possivel;
- orientar preview local somente depois de validacao tecnica ou blocker claro;
- registrar feedback do usuario;
- preservar todo o historico ate o aceite;
- registrar aceite explicito.

Arquivos:

```text
_appgen_work/preview-report.md
_appgen_work/user-feedback.md
_appgen_work/user-acceptance.md
_appgen_work/acceptance-history.jsonl
```

Feedback routing:

```text
technical   -> implementation-loop
business    -> product/specs
environment -> blocker de preview
```

Docker:

- macOS com Homebrew: pode instalar via `brew install --cask docker`, somente com autorizacao.
- Windows com winget: pode instalar via `winget install Docker.DockerDesktop`, somente com autorizacao.
- Linux: por enquanto registra plano manual por distro/sudo.

## Docs da App Gerada

`appgen-docs` gera documentacao dentro do `app_root`:

```text
app/docs/README.md
app/docs/user-guide.md
app/docs/admin-guide.md
app/docs/developer-guide.md
app/docs/operations.md
app/docs/api.md
app/docs/testing.md
app/docs/project.html
```

`project.html` deve:

- abrir via duplo clique;
- nao depender de CDN;
- nao usar `fetch()` local;
- mostrar feedback e aceite do usuario.

## CLI Atual

Comandos principais:

```bash
appgen install
appgen status
appgen next
appgen environment
appgen scaffold
appgen loop
appgen preview-validation
appgen acceptance
appgen docs
appgen add-agent
appgen add-engine
appgen update
appgen uninstall
```

Comandos de acceptance:

```bash
appgen acceptance
appgen acceptance --install-docker
appgen acceptance --install-docker --yes
appgen acceptance --feedback-type=technical --feedback="..."
appgen acceptance --feedback-type=business --feedback="..."
appgen acceptance --feedback-type=environment --feedback="..."
appgen acceptance --ok
```

## Validacao Executada

No repositorio novo:

```bash
npm run check
rg -n "reversa|_reversa|/reversa|MVP|mvp" . --glob '!**/node_modules/**' --glob '!package-lock.json'
git status --short
git log --oneline -1
```

Resultado:

- `npm run check` passou.
- A busca por referencias antigas nao encontrou nada.
- `git status --short` estava limpo.
- Commit inicial criado: `74b1329 Initial AppGen extraction`.

## Proximos Passos Recomendados

1. Aguardar o usuario rodar os testes manuais em `test/claude/` e `test/codex/`.
2. Analisar os resultados desses testes, incluindo instalacao, update, ativacao no chat, estado `.appgen/`, specs, scaffold e eventuais erros.
3. Rodar um teste real de instalacao a partir deste repo em `/tmp`.
4. Validar `appgen install` com Codex/Claude instalado no ambiente alvo.
5. Rodar fluxo guiado ate `scaffold`.
6. Criar fixtures/testes automatizados para:
   - `appgen install`;
   - `appgen scaffold`;
   - `appgen loop`;
   - `appgen acceptance`;
   - `appgen docs`;
   - `appgen next`.
7. Revisar `docker-compose.yml` gerado por `appgen acceptance` contra uma app scaffold real.
8. Preparar distribuicao para outras maquinas:
   - decidir nome do pacote (`appgen` publico ou pacote scoped como `@org/appgen`);
   - remover/ajustar `"private": true` no `package.json`;
   - ajustar `appgen update` para ler o nome real do pacote a partir do `package.json` em vez de assumir `appgen`;
   - adicionar `prepublishOnly` rodando `npm test`;
   - validar com `npm pack` e instalacao do `.tgz` em outra maquina antes de publicar;
   - decidir registry: npm publico, npm privado, GitHub Packages ou distribuicao via tarball.

## Como Retomar

Abra uma nova sessao do Codex em:

```text
/Users/eduardonascimento/Github/appgen
```

Peça:

```text
ler HANDOFF.md e continuar o desenvolvimento do AppGen a partir dos proximos passos
```
