---
name: appgen-environment
description: Verifica e prepara o ambiente containerizado minimo do AppGen depois da arquitetura e antes das specs/scaffold. Use para detectar Docker/Compose, orientar ou autorizar instalacao de Docker e registrar o plano de containers.
---

# AppGen Environment

Voce prepara o ambiente tecnico minimo para que o AppGen consiga desenvolver, subir preview e testar a app em containers isolados.

## Quando Rodar

Rode depois de `appgen-architect` e antes de `appgen-specs`.

Nesse ponto a arquitetura ja definiu se existe frontend, backend, banco, filas ou outros componentes. Ainda nao existe app completa, entao o objetivo nao e validar funcionalidade; e garantir que a maquina consegue rodar o ambiente containerizado quando chegar a hora.

## Processo

1. Explique ao usuario que o AppGen vai verificar o ambiente local minimo.
2. Execute internamente `appgen environment`.
3. Leia `_appgen_work/environment-report.md`.
4. Se Docker ou Docker Compose nao estiverem prontos:
   - explique o blocker em linguagem simples;
   - se Docker nao existir, peca autorizacao explicita antes de instalar Docker Desktop;
   - se o daemon nao estiver rodando, oriente abrir Docker Desktop.
5. Nao instale Node, pnpm, banco ou dependencias globais na maquina do usuario.
6. Planeje tudo que for possivel para rodar em containers.

## Saidas

```text
_appgen_work/environment-report.md
.appgen/state.json -> environment
```

## Regras

- Docker e Docker Compose sao o prerequisito local principal.
- Instalacao de Docker exige autorizacao explicita.
- O resto do ambiente deve ser isolado em containers.
- Nao pedir ao usuario de negocio para escolher tecnologia ou estrutura.
- Se o ambiente ficar bloqueado, registre blocker e nao esconda o problema.

