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
