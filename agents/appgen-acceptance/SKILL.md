---
name: appgen-acceptance
description: Prepara a app AppGen para teste do usuario, valida Docker/Docker Compose, sobe ou orienta preview, coleta aceite e direciona feedback tecnico, funcional ou de ambiente antes de docs e handoff.
---

# AppGen Acceptance

Voce conduz o teste da app pelo usuario antes de documentacao final e handoff.

## Objetivo

Garantir que a app foi testada por uma pessoa e recebeu aceite explicito. Se o usuario nao aprovar, registre feedback e volte para o ponto correto:

- problema tecnico: `implementation-loop`;
- problema de regra/escopo/definicao: `appgen-product` ou `appgen-specs`;
- problema de ambiente: blocker de preview.

## Entradas

- `.appgen/state.json`
- `_appgen_specs/product.md`
- `_appgen_specs/feature-slices.md`
- `_appgen_work/loop-state.json`
- `_appgen_work/qa-report.md`
- `_appgen_work/quality-report.md`
- codigo em `app_root`

## Processo

1. Resolva `app_root`.
2. Verifique `.appgen/state.json` no campo `preview_validation`.
3. Se `preview_validation.status` nao estiver pronto para teste do usuario, volte para `implementation-loop` e rode `appgen-preview-validation`.
4. Execute `node .appgen/bin/appgen.js acceptance --prepare` somente quando precisar atualizar o relatorio de aceite/preview.
5. Verifique o relatorio `_appgen_work/preview-report.md`.
6. Se Docker nao existir:
   - detecte o OS;
   - explique a instalacao recomendada;
   - peca autorizacao explicita antes de qualquer tentativa de instalar;
   - se a autorizacao nao vier, registre blocker de ambiente.
7. Gere e entregue `_appgen_work/acceptance-test-guide.md` com roteiro de teste em linguagem de negocio, orientado por perfis, fluxos e regras visiveis.
8. Quando o preview tecnico estiver validado, entregue URLs ao usuario:
   - Web: `http://localhost:3000`
   - API health: `http://localhost:3001/health`
9. Peça ao usuario para seguir o roteiro, conferindo fluxo principal, regras importantes e sinais de problema.
10. Se o usuario aprovar, registre `node .appgen/bin/appgen.js acceptance --ok`.
11. Se o usuario reprovar, registre feedback:
   - `node .appgen/bin/appgen.js acceptance --feedback-type=technical --feedback="..."`
   - `node .appgen/bin/appgen.js acceptance --feedback-type=business --feedback="..."`
   - `node .appgen/bin/appgen.js acceptance --feedback-type=environment --feedback="..."`

## Instalacao de Docker

Docker pode ser instalado pelo agente somente com autorizacao explicita do usuario.

Regras:

- Nunca instale Docker silenciosamente.
- Primeiro rode deteccao de OS e mostre o comando/acao que sera executado.
- macOS: preferir Docker Desktop via Homebrew Cask quando `brew` existir; caso contrario, orientar instalacao manual do Docker Desktop.
- Windows: preferir Docker Desktop via `winget` quando disponivel; caso contrario, orientar instalacao manual.
- Linux: identificar distro quando possivel; usar o gerenciador apropriado apenas com autorizacao e registrar comandos executados.
- Se a instalacao exigir GUI, reinicio, permissao admin ou login, registre blocker de ambiente ate o usuario concluir.

## Saidas Obrigatorias

```text
_appgen_work/preview-report.md
_appgen_work/acceptance-test-guide.md
_appgen_work/user-acceptance.md
_appgen_work/user-feedback.md
_appgen_work/acceptance-history.jsonl
app/docker-compose.yml
```

`user-feedback.md` so e obrigatorio quando houver reprovacao ou pedido de ajuste.

## Historico Obrigatorio

- `_appgen_work/user-feedback.md` deve ser append-only.
- `_appgen_work/user-acceptance.md` deve preservar cada tentativa e o aceite final.
- `_appgen_work/acceptance-history.jsonl` deve registrar todos os eventos:
  - preview preparado;
  - feedback recebido;
  - classificacao do feedback;
  - rota recomendada;
  - aceite final.
- Nunca sobrescreva feedback antigo para deixar a entrega parecer aprovada mais cedo.

## Gates

- Nao avance para `appgen-docs` sem aceite explicito do usuario.
- Nao entregue URLs ao usuario se `preview_validation.status` estiver `failed`, `needs_attention`, `blocked_environment` ou sem validacao equivalente em `_appgen_work/preview-report.md`.
- Nao pedir para o usuario "testar livremente" sem roteiro. Entregue passos claros para negocio validar.
- O roteiro nao pode ser uma lista tecnica de slices, comandos ou criterios internos. Ele deve explicar o que cada perfil de usuario deve tentar fazer, qual resultado esperar e que tipo de problema reportar.
- Nao apague historico de feedback anterior.
- Se o feedback for funcional, nao trate como bug tecnico.
- Se o feedback for tecnico, volte para coder/QA/quality conforme o caso.
- Se Docker/Compose nao estiver disponivel e nao houver autorizacao para instalar, registre blocker de ambiente.

## Handoff

Ao terminar, informe:

- status do preview;
- URLs de teste;
- aceite do usuario ou feedback registrado;
- proximo passo: `appgen-docs` se aprovado, ou retorno apropriado se reprovado.
