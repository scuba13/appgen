# AppGen Guided User Flow Test - 2026-07-03

## Objetivo

Validar a experiencia real esperada para uma pessoa usando AppGen:

```text
usuario abre a ferramenta de IA -> usa /appgen, appgen ou $appgen conforme a engine -> segue as perguntas -> testa a app -> aprova
```

O usuario nao executa comandos de scaffold, update, acceptance ou docs. Esses comandos aparecem abaixo apenas como acoes internas que o agente AppGen executou durante a simulacao.

## Cenario

Projeto temporario:

```text
/tmp/appgen-user-flow-WauBj2
```

Estado inicial simulado:

- AppGen ja instalado.
- Engines instaladas: Claude Code e Codex.
- Versao instalada rebaixada para `0.0.1` para simular projeto antigo.
- Um arquivo instalado foi removido para validar restauracao pelo update.
- Um template local foi modificado para validar preservacao de alteracoes do usuario.

App simples usado no teste:

```text
Lista Simples
```

Objetivo de negocio:

```text
Registrar tarefas pequenas, marcar como concluida, reabrir e remover.
```

## Entrada do Usuario Simulada

O usuario final teria enviado apenas mensagens de negocio:

Exemplo no Claude Code:

```text
/appgen

Quero uma app simples chamada Lista Simples.
Ela deve permitir criar tarefas, marcar como concluida, reabrir e remover.
Pode ser bem simples, so para validar o fluxo.
```

No Codex, a primeira linha seria `appgen` ou `$appgen`.

Depois dos resumos de etapa:

```text
seguir
```

No preview:

```text
aprovado
```

## Acoes Internas do AppGen

Estas acoes foram tratadas como trabalho interno do agente, nao como comandos pedidos ao usuario:

1. Leu `.appgen/state.json`, `.appgen/config.toml` e `.appgen/plan.md`.
2. Detectou instalacao antiga e executou update interno em modo offline.
3. Restaurou arquivo instalado que estava ausente.
4. Preservou arquivos modificados localmente.
5. Gerou specs minimas de negocio, produto, arquitetura e feature.
6. Gerou scaffold do app no `app_root`.
7. Implementou uma tela simples de tarefas em memoria.
8. Preparou acceptance e `app/docker-compose.yml`.
9. Registrou aceite explicito.
10. Gerou documentacao em `app/docs/`.
11. Gerou handoff em `_appgen_work/handoff.md`.
12. Marcou o fluxo como completo no state.

## Evidencias

Update interno:

```text
Offline mode: skipping npm registry version check.
Installed version: v0.0.1
1 missing file(s), will be restored:
  + .agents/skills/appgen-docs/SKILL.md
98 file(s) will be updated.
Update complete!
```

Scaffold:

```text
Created files: 27
Skipped files: 0
Report: _appgen_work/scaffold-report.md
```

Acceptance:

```text
Docker: Docker version 29.4.1, build 055a478
Compose: Docker Compose version v5.1.3
Compose file: app/docker-compose.yml
Report: _appgen_work/preview-report.md
```

Docker Compose:

```text
docker compose config
exit code 0
```

Aceite:

```text
User acceptance recorded. Next step: appgen-docs.
```

Docs:

```text
Created files: 8
HTML: app/docs/project.html
```

Status final:

```text
Current phase: complete
Completed: brief, standards, product, architecture, specs, scaffold, slicer, implementation-loop, acceptance, docs, handoff
Pending: none
```

Artefatos finais presentes:

- `_appgen_specs/brief.md`
- `_appgen_specs/product.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/feature-slices.md`
- `_appgen_work/scaffold-report.md`
- `_appgen_work/preview-report.md`
- `_appgen_work/user-acceptance.md`
- `_appgen_work/acceptance-history.jsonl`
- `_appgen_work/handoff.md`
- `app/docker-compose.yml`
- `app/docs/README.md`
- `app/docs/project.html`

## Resultado da App Gerada

A app simples foi implementada no frontend gerado:

- mostra contadores de tarefas pendentes e concluidas;
- cria tarefa com titulo;
- ignora titulo vazio;
- marca tarefa como concluida;
- reabre tarefa;
- remove tarefa.

Arquivo principal:

```text
/tmp/appgen-user-flow-WauBj2/app/apps/web/src/app/page.tsx
```

## Ajustes Feitos no AppGen Durante o Teste

O teste revelou que o orquestrador nao deixava explicito que deveria atualizar internamente uma instalacao antiga quando o usuario digita `appgen`.

Foi ajustado:

- `agents/appgen/SKILL.md`: adicionada regra de verificacao/update interno ao ativar.
- `lib/commands/update.js`: adicionado suporte a `--yes` e `--offline`.
- `lib/commands/update.js`: removido import de prompt/chalk do caminho nao interativo.
- `package.json`: `update.js` entrou no `npm run check`.

## Achados

### PASS - Usuario nao precisa executar comandos no fluxo guiado

O fluxo pode ser conduzido com usuario dizendo apenas `appgen`, descrevendo o app, respondendo `seguir` e aprovando o preview.

### PASS - Update interno preserva alteracoes locais

O update preservou arquivos modificados localmente e restaurou arquivo instalado ausente.

### PASS - Acceptance gera compose valido

`docker compose config` validou o `app/docker-compose.yml` gerado.

### PASS - Docs e handoff foram gerados

`app/docs/project.html`, `app/docs/README.md` e `_appgen_work/handoff.md` existem.

### RESOLVIDO - Update offline eleva para a versao local

`appgen update --yes --offline` agora usa a versao do pacote AppGen local quando disponivel e grava essa versao em `.appgen/version` e `.appgen/state.json`.

Cobertura adicionada:

```text
update --yes --offline upgrades an old install to the local package version
```

### RESOLVIDO - `implementation_loop` preserva o estado real

Ao concluir `implementation-loop`, o runtime agora le `_appgen_work/loop-state.json` e preserva o estado real do loop no `.appgen/state.json`.

Cobertura adicionada:

```text
completeStep preserves loop-state when implementation-loop completes
```

## Conclusao

O teste guiado passou para o fluxo principal de usuario:

```text
appgen -> update interno -> specs -> scaffold -> implementacao simples -> acceptance -> aceite -> docs -> handoff
```

O usuario nao precisou executar comandos tecnicos. Os pontos de consistencia encontrados no primeiro teste foram corrigidos e cobertos por testes automatizados.
