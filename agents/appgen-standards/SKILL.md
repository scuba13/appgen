---
name: appgen-standards
description: Carrega e consolida padroes corporativos para guiar decisoes tecnicas do AppGen. Use antes de qualquer arquitetura, scaffold ou codigo para mapear regras obrigatorias da empresa.
---

# AppGen Standards

Voce transforma os standards da empresa em uma matriz operacional para os demais agentes.

## Entradas

- `.appgen/state.json`
- `.appgen/config.toml`
- `.appgen/config.user.toml`
- `.appgen/company/profile.toml`
- `.appgen/company/standards/`
- `.appgen/standards/`
- `_appgen_specs/brief.md`

## Processo

1. Leia `.appgen/company/profile.toml` quando existir.
2. Leia todos os standards apontados por `.appgen/company/profile.toml`.
3. Leia `.appgen/standards/` como compatibilidade ou complemento legado.
4. Identifique o preset corporativo em `config.toml`.
5. Separe regras por area:
   - arquitetura;
   - frontend;
   - backend;
   - API;
   - banco;
   - boas praticas de engenharia;
   - qualidade de codigo;
   - auth;
   - seguranca;
   - testes;
   - observabilidade;
   - acessibilidade;
   - UI operacional;
   - navegacao;
   - formularios;
   - tabelas/listas;
   - microcopy;
   - responsividade;
   - CI/CD;
   - design system;
   - estrutura de pastas.
6. Classifique cada regra como `OBRIGATORIO`, `PROIBIDO`, `RECOMENDADO` ou `EXCECAO_COM_APROVACAO`.
7. Consolide quality gates e limites de runtime declarados no company profile.
8. Detecte lacunas nos standards que podem bloquear arquitetura, scaffold ou loop de implementacao.

## Saida Obrigatoria

Crie `_appgen_specs/standards-map.md` usando `.appgen/artifacts/standards-map-template.md` como estrutura.

O arquivo deve conter:

- preset aplicado;
- company profile aplicado, versao e caminho;
- ordem de resolucao entre decisao aprovada, company profile, preset e default AppGen;
- regras obrigatorias com IDs `STD-XXX`;
- itens proibidos com IDs `PRO-XXX`;
- stack permitida;
- padroes de UI;
- boas praticas de engenharia;
- estrutura esperada;
- validacoes obrigatorias;
- limites de runtime para loop de implementacao;
- excecoes que precisam de aprovacao;
- lacunas com IDs `GAP-XXX`.

## Gates de Qualidade

Nao considere concluido se:

- nao houver regras com IDs;
- nao houver company profile ou uma justificativa explicita para usar apenas standards legados;
- nao houver stack permitida;
- nao houver padroes de UI quando o app tiver interface web;
- nao houver boas praticas de engenharia para backend, frontend, API, banco, testes, seguranca e observabilidade;
- nao houver validacoes obrigatorias;
- lacunas estiverem implícitas em texto solto.

## Regras

- Nao invente padroes ausentes.
- Se algo tecnico nao estiver definido, registre lacuna.
- Nao pergunte ao usuario de negocio como resolver lacuna tecnica.
- Encaminhe lacunas tecnicas para `appgen-architect`.
- Quando houver conflito tecnico, use a ordem de resolucao do company profile e registre a decisao.

## Handoff

Ao terminar, informe:

- caminho de `standards-map.md`;
- preset usado;
- company profile usado;
- lacunas criticas;
- proximo agente: `appgen-architect`.
