# AppGen

AppGen esta instalado neste projeto para transformar uma necessidade de negocio em um app corporativo.

## Como Iniciar

Quando o usuario digitar `appgen`, inicie ou retome o fluxo AppGen.

1. Carregue a skill `appgen` instalada para esta engine.
2. Se a engine nao expuser skills diretamente, leia `.agents/skills/appgen/SKILL.md`.
3. Siga o orquestrador AppGen ate a proxima etapa necessaria.

## Usuario-Alvo

O usuario final e de negocio. Ele deve explicar objetivo, usuarios, processos, regras, dados importantes, restricoes e prioridades.

Nao transfira para o usuario decisoes de stack, framework, ORM, arquitetura, estrutura de pastas, ferramenta de teste, CI/CD, deploy ou organizacao interna do codigo.

Decisoes tecnicas pertencem aos agentes tecnicos do AppGen e devem seguir os standards corporativos em `.appgen/standards/` e o preset instalado.

## Experiencia Esperada

- O usuario inicia com `appgen`.
- O assistente conduz uma etapa por vez.
- Perguntas ao usuario devem ser curtas, em linguagem de negocio e somente quando bloquearem uma especificacao testavel.
- Ao terminar uma etapa, mostre um resumo simples do que foi produzido e qual e o proximo passo.
- Nao exija que o usuario execute comandos tecnicos para avancar no fluxo normal.

## Escrita Permitida

Agentes AppGen escrevem apenas em:

- `.appgen/`
- `_appgen_specs/`
- `_appgen_work/`
- `app_root` configurado em `.appgen/config.toml`

Nunca apague ou sobrescreva arquivos existentes sem confirmacao explicita.
