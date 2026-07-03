# AppGen Technical Test Guide

Use este guia para validar tecnicamente o AppGen depois das mudancas no fluxo final.

O guia de teste de negocio fica em:

```text
docs/MVP-TEST-GUIDE.md
```

## 1. Validar o proprio repositorio

Rode na raiz deste repositorio:

```bash
npm test
```

Resultado esperado:

- `npm run check` passa sem erro de sintaxe.
- `node --test tests/*.test.js` passa.
- Os testes de integracao criam projetos temporarios e validam:
  - `appgen install --yes`;
  - reinstalacao sem prompt;
  - `appgen scaffold` a partir do preset default.

## 2. Teste manual limpo em /tmp

Crie um projeto temporario:

```bash
PROJECT_DIR="$(mktemp -d /tmp/appgen-manual-XXXXXX)"
cd "$PROJECT_DIR"
```

Instale usando o CLI local deste repositorio.

Codex:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js install \
  --yes \
  --engine=codex \
  --project-name "Manual Validation" \
  --user-name "Eduardo"
```

Claude Code:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js install \
  --yes \
  --engine=claude-code \
  --project-name "Manual Validation" \
  --user-name "Eduardo"
```

Mais de uma engine no mesmo projeto:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js install \
  --yes \
  --engines=codex,claude-code \
  --project-name "Manual Validation" \
  --user-name "Eduardo"
```

## 3. Company profile instalado

Sem `--company`, o AppGen usa o company profile default que vem no pacote:

```bash
npx appgen install
```

Origem:

```text
presets/default-web-saas/company/
```

Destino no projeto alvo:

```text
.appgen/company/
```

Exemplo de arquivos instalados:

```text
.appgen/company/profile.toml
.appgen/company/standards/backend.md
.appgen/company/standards/frontend.md
.appgen/company/standards/security.md
```

Com `--company`, o AppGen usa o profile local informado em vez do default:

```bash
appgen install --company ./company-profiles/acme
```

Origem esperada:

```text
./company-profiles/acme/profile.toml
./company-profiles/acme/standards/
./company-profiles/acme/templates/
./company-profiles/acme/assets/
./company-profiles/acme/hooks.yml
```

Destino continua sendo:

```text
.appgen/company/
```

Depois da instalacao, os agentes leem `.appgen/company/` para tomar decisoes tecnicas.

Ordem de resolucao:

1. Decisao explicita aprovada no projeto.
2. `.appgen/company/`.
3. Defaults do preset.
4. Defaults internos do AppGen.

Conferir estrutura comum:

```bash
test -f .appgen/state.json
test -f .appgen/company/profile.toml
test -f .agents/skills/appgen/SKILL.md
test -d _appgen_specs
test -d _appgen_work
```

Conferir arquivo de entrada por engine:

```bash
# Codex, Opencode, Antigravity
test -f AGENTS.md

# Claude Code
test -f CLAUDE.md
```

## 4. Validar scaffold

No fluxo real, o scaffold deve esperar as specs aprovadas.

Para teste tecnico de template, rode:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js scaffold \
  --allow-missing-specs \
  --allow-low-score
```

Conferir:

```bash
test -f app/package.json
test -f app/apps/web/package.json
test -f app/apps/api/package.json
test -f app/apps/api/src/main.ts
test -f app/packages/shared/src/index.ts
test -f _appgen_work/scaffold-report.md
```

## 5. Validar acceptance e docker-compose

Ainda dentro do projeto temporario:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js acceptance
```

Conferir:

```bash
test -f app/docker-compose.yml
test -f _appgen_work/preview-report.md
test -f _appgen_work/acceptance-history.jsonl
```

Se Docker Compose estiver instalado, valide a sintaxe sem subir containers:

```bash
cd app
docker compose config
```

Resultado esperado:

- `docker compose config` sai com codigo `0`.
- Os filtros `pnpm --filter @<project>/api` e `pnpm --filter @<project>/web` batem com os nomes em `apps/api/package.json` e `apps/web/package.json`.

Para subir o preview local:

```bash
docker compose up
```

URLs esperadas:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/health`

## 6. Registrar feedback ou aceite

Feedback tecnico:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js acceptance \
  --feedback-type=technical \
  --feedback="Descreva o bug de implementacao encontrado."
```

Feedback de negocio:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js acceptance \
  --feedback-type=business \
  --feedback="Descreva a regra ou escopo que precisa mudar."
```

Feedback de ambiente:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js acceptance \
  --feedback-type=environment \
  --feedback="Descreva o bloqueio local de Docker, porta, permissao ou dependencia."
```

Aceite explicito:

```bash
node /Users/eduardonascimento/Github/appgen/bin/appgen.js acceptance --ok
```

Conferir:

```bash
test -f _appgen_work/user-acceptance.md
tail -n 5 _appgen_work/acceptance-history.jsonl
```

## 7. Teste guiado com ferramenta de IA

Para testar o fluxo com Claude Code, Codex ou outra engine suportada:

1. Crie um diretorio limpo fora deste repo.
2. Rode `appgen install` e selecione a engine desejada.
3. Abra a ferramenta de IA configurada nesse diretorio.
4. Digite `appgen`.
5. Siga o fluxo ate gerar specs suficientes.
6. Rode `appgen scaffold`.
7. Rode `appgen acceptance`.
8. Teste a app localmente.
9. Registre feedback ou aceite.
10. Depois do aceite, rode `appgen docs`.

O gatilho no chat e sempre:

```text
appgen
```

Nao use `/appgen`.

## 8. Limpeza

Depois do teste manual:

```bash
rm -rf "$PROJECT_DIR"
```

Se voce subiu containers:

```bash
cd "$PROJECT_DIR/app"
docker compose down -v
```
