---
name: appgen-docs
description: Gera documentacao da app criada pelo AppGen, incluindo guias em Markdown e um HTML amigavel/offline com as principais informacoes do projeto. Use depois do implementation-loop e antes do handoff.
---

# AppGen Docs

Voce gera a documentacao da app criada. A documentacao e parte do produto gerado, nao apenas um relatorio interno do AppGen.

## Entradas

- `.appgen/state.json`
- `.appgen/company/profile.toml`
- `_appgen_specs/brief.md`
- `_appgen_specs/product.md`
- `_appgen_specs/standards-map.md`
- `_appgen_specs/target-architecture.md`
- `_appgen_specs/domain-model.md`
- `_appgen_specs/data-model.md`
- `_appgen_specs/api-contracts.md`
- `_appgen_specs/ui-spec.md`
- `_appgen_specs/feature-slices.md`
- `_appgen_work/implementation-report.md`
- `_appgen_work/qa-report.md`
- `_appgen_work/quality-report.md`
- `_appgen_work/user-feedback.md`
- `_appgen_work/user-acceptance.md`
- `_appgen_work/acceptance-history.jsonl`
- `_appgen_work/loop-state.json`
- codigo em `app_root`

## Processo

1. Resolva `app_root` a partir de `.appgen/state.json`.
2. Leia os artefatos principais de produto, arquitetura, API, UI, slices, QA e quality.
3. Gere documentacao em `app_root/docs/`.
4. Gere um HTML amigavel em `app_root/docs/project.html`, inspirado no conceito do Reversa Docs:
   - abre via `file://`;
   - nao depende de CDN;
   - nao usa `fetch()` para arquivos locais;
   - contem CSS e dados essenciais embutidos;
   - resume objetivo, stack, telas, API, dados, slices, validacoes, riscos e proximos passos.
   - mostra feedback do usuario, historico de acceptance e aceite final de forma clara.
5. Registre progresso em `_appgen_work/progress.jsonl` quando usar o CLI.

## Saidas Obrigatorias

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

Se `app_root` nao for `app`, use o app_root configurado.

## Comando Recomendado

Quando o CLI estiver disponivel, use:

```bash
appgen docs
appgen next --complete=docs --file=app/docs/README.md --file=app/docs/project.html
```

## Gates de Qualidade

- `project.html` deve abrir sem servidor local.
- `project.html` nao pode depender de CDN.
- `project.html` nao pode usar `fetch()` para ler arquivos locais.
- Os Markdown devem conter conteudo util, nao apenas headers.
- A documentacao deve separar claramente:
  - uso por usuario final;
  - operacao/admin;
  - desenvolvimento;
  - API;
  - testes;
  - feedback e aceite do usuario;
  - riscos/pendencias.

## Regras

- Nao altere specs para fazer a documentacao parecer melhor.
- Nao declare validacao executada se ela nao aparece em reports.
- Nao esconda pendencias de quality ou QA.
- Nao escreva fora de `app_root/docs/` e `_appgen_work/`.

## Handoff

Ao terminar, informe:

- docs Markdown geradas;
- caminho do HTML amigavel;
- principais pendencias documentadas;
- proximo agente: `appgen-handoff`.
