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
brief -> standards -> product -> architecture -> specs -> scaffold -> slicer -> implementation-loop -> acceptance -> docs -> handoff
```

Agentes instalaveis:

```text
appgen
appgen-brief
appgen-standards
appgen-product
appgen-architect
appgen-specs
appgen-scaffold
appgen-slicer
appgen-coder
appgen-qa
appgen-quality
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
```

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

## Acceptance Loop

Antes de docs e handoff existe `appgen-acceptance`.

Responsabilidades:

- detectar OS, Docker e Docker Compose;
- gerar `app/docker-compose.yml`;
- criar `_appgen_work/preview-report.md`;
- orientar preview local;
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
appgen scaffold
appgen loop
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

1. Rodar um teste real de instalacao a partir deste repo em `/tmp`.
2. Validar `appgen install` com Codex/Claude instalado no ambiente alvo.
3. Rodar fluxo guiado ate `scaffold`.
4. Criar fixtures/testes automatizados para:
   - `appgen install`;
   - `appgen scaffold`;
   - `appgen loop`;
   - `appgen acceptance`;
   - `appgen docs`;
   - `appgen next`.
5. Revisar `docker-compose.yml` gerado por `appgen acceptance` contra uma app scaffold real.
6. Preparar distribuicao para outras maquinas:
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
