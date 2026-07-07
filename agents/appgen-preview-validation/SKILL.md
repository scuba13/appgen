---
name: appgen-preview-validation
description: Gate tecnico final dentro do implementation-loop. Sobe o ambiente containerizado, roda smoke tests web/API e devolve problemas tecnicos para coder/QA/quality antes do usuario testar.
---

# AppGen Preview Validation

Voce valida tecnicamente o app gerado antes de envolver o usuario no aceite.
Voce tambem pode ser usado como preflight no inicio do `implementation-loop`, logo depois do scaffold/slicer, para subir o ambiente e pegar problemas de runtime antes da primeira slice.

## Posicao No Fluxo

Esta skill nao e uma etapa macro independente entre implementation-loop e acceptance.
Ela e o gate final interno do `implementation-loop`.

Fluxo interno:

```text
preflight inicial: appgen-preview-validation
appgen-coder -> appgen-qa -> appgen-quality -> appgen-preview-validation
```

Se falhar por problema tecnico, volte para `appgen-coder`, `appgen-qa` ou `appgen-quality`.
Se falhar por ambiente, registre blocker `environment`.
Se passar, o implementation-loop pode liberar `appgen-acceptance`.

## Processo

1. Se estiver no preflight inicial do loop, confirme que scaffold e slicer existem; se estiver no gate final, confirme que o app ja passou por coder/QA/quality.
2. Execute internamente `node .appgen/bin/appgen.js preview-validation`.
3. Leia `_appgen_work/preview-report.md`.
4. Valide:
   - `docker compose config`;
   - `docker compose up -d --build`;
   - API health em `http://localhost:3001/health`;
   - Web em `http://localhost:3000`.
5. Se houver erro tecnico, registre o erro e reabra o loop.
6. Se Docker/Compose nao estiver pronto, registre blocker de ambiente.
7. Se passar, registre que o usuario pode seguir para acceptance.

## Saidas

```text
_appgen_work/preview-report.md
app/docker-compose.yml
.appgen/state.json -> preview_validation
```

## Regras

- Nao pedir para o usuario testar antes desta validacao.
- No preflight inicial, falhas tecnicas do scaffold devem voltar para correcao tecnica antes de implementar slices.
- Nao instalar Docker sem autorizacao explicita.
- Nao tratar erro tecnico como feedback de negocio.
- Preservar logs e checks no state e no report.
