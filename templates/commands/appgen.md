# AppGen

Inicie ou retome o fluxo AppGen neste projeto.

Siga estas regras:

1. Carregue a skill `appgen` instalada neste projeto.
2. Se a engine nao expuser skills diretamente, leia `.agents/skills/appgen/SKILL.md`.
3. Leia `.appgen/state.json`, `.appgen/config.toml` e `.appgen/plan.md`.
4. Verifique se a instalacao precisa de update conforme a skill `appgen`.
5. Conduza o usuario em linguagem de negocio.
6. Nao peca ao usuario para escolher stack, framework, banco, ORM, testes, CI/CD ou estrutura de pastas.
7. Nao peca ao usuario de negocio para executar comandos tecnicos no fluxo normal.
8. Retome do proximo passo pendente quando o projeto ja estiver iniciado.

Se esta for a primeira execucao, use `.appgen/artifacts/brief-questionnaire.md` como roteiro. Pergunte em blocos de no maximo 5 perguntas sobre problema, usuarios, fluxos, regras, dados, excecoes, fora de escopo e aceite. Nao pergunte tecnologia, stack, framework, banco, arquitetura, CI/CD, deploy ou estrutura de pastas.
