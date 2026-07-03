# Exemplo de Regras da Empresa para AppGen

> Este arquivo e um exemplo de standards corporativos para o agente `appgen-standards` consumir. Em um projeto real, o conteudo deve ser instalado em `.appgen/standards/` ou empacotado dentro de um preset corporativo.

## Perfil

**Nome:** Default Web SaaS  
**Versao:** 1.0.0  
**Tipo de app alvo:** Aplicacoes web internas, dashboards operacionais e SaaS B2B.  
**Usuario final do AppGen:** pessoa de negocio.  
**Responsavel por decisoes tecnicas:** agentes tecnicos AppGen, principalmente `appgen-architect`.

## Modelo de Decisao

### OBRIGATORIO

- O usuario de negocio decide escopo, regras, prioridades, fluxos e criterios de aceite.
- O usuario de negocio nao decide framework, ORM, estrutura de pastas, biblioteca de UI, ferramenta de teste, cloud ou CI/CD.
- O `appgen-architect` deve escolher a solucao tecnica mais simples que respeite este standard.
- Qualquer excecao tecnica deve ser registrada em `_appgen_work/decisions.md`.

### PROIBIDO

- Perguntar ao usuario de negocio qual stack usar.
- Escolher tecnologia fora deste standard sem registrar excecao.
- Criar app sem testes minimos.
- Criar app sem lint, typecheck e build configurados.

## Stack Permitida

### OBRIGATORIO

- Linguagem principal: TypeScript.
- Package manager padrao: `pnpm`.
- Frontend web: Next.js com App Router.
- Design system da PoC: Ant Design.
- Icones da PoC: Ant Design Icons.
- Backend padrao: NestJS.
- Banco relacional padrao: PostgreSQL.
- ORM padrao: Prisma.
- Validacao de dados: Zod.
- Testes unitarios: Vitest.
- Testes E2E: Playwright.
- Lint/format: ESLint + Prettier, ou Biome quando o preset declarar explicitamente.

### RECOMENDADO

- Monorepo com `apps/web`, `apps/api` e `packages/shared`.
- Next.js em `apps/web` e NestJS em `apps/api`.

### PROIBIDO

- JavaScript sem TypeScript.
- Banco NoSQL como padrao inicial, salvo excecao aprovada.
- Misturar mais de um ORM no mesmo app.
- Usar bibliotecas sem manutencao ativa.

### EXCECAO_COM_APROVACAO

- Substituir Ant Design pelo design system corporativo oficial quando ele existir para o produto ou empresa.
- Usar outro banco por exigencia contratual.
- Usar outro framework por compatibilidade com plataforma existente.
- Usar microservicos antes de existir necessidade clara.

## Arquitetura

### OBRIGATORIO

- Separar camadas de interface, aplicacao, dominio e infraestrutura quando houver backend dedicado.
- Manter regras de negocio fora de componentes visuais.
- Centralizar validacoes compartilhadas em pacote comum quando houver frontend e backend.
- Definir fronteiras explicitas entre modulos.
- Usar variaveis de ambiente tipadas e validadas na inicializacao.
- Nao acessar banco diretamente a partir da UI.

### RECOMENDADO

- Comecar monolitico modular.
- Evoluir para servicos separados apenas quando houver requisito operacional claro.
- Usar nomes de modulos baseados no dominio de negocio.

### PROIBIDO

- Criar arquitetura distribuida sem necessidade.
- Colocar regra de negocio em handlers HTTP sem camada de aplicacao.
- Colocar secrets em arquivos versionados.
- Criar acoplamento circular entre modulos.

## Estrutura de Pastas

### Monorepo Padrao

```text
apps/
  web/
  api/
packages/
  shared/
  config/
  ui/
infra/
docs/
```

### OBRIGATORIO

- Colocar codigo por feature quando fizer sentido para o dominio.
- Manter componentes compartilhados em `packages/ui` ou `src/components`.
- Manter contratos compartilhados em `packages/shared` ou `src/lib/contracts`.
- Manter testes proximos ao codigo ou em `tests/`, conforme preset.

### PROIBIDO

- Criar pastas genericas gigantes como `utils` sem criterio.
- Colocar tudo em `components/`.
- Misturar codigo gerado com arquivos de controle do AppGen.

## Boas Praticas de Engenharia

### Backend

#### OBRIGATORIO

- Controllers devem ser finos e nao conter regra de negocio.
- Regras de negocio devem ficar em services, use cases ou camada de aplicacao.
- Dominio nao deve depender de HTTP, framework web, banco, ORM ou detalhes de transporte.
- Toda entrada externa deve ser validada antes de chegar ao dominio.
- Toda operacao privada deve validar autorizacao no backend.
- Erros de dominio devem ter codigo estavel, mensagem segura e sem detalhe interno.
- Operacoes criticas sujeitas a repeticao devem definir estrategia de idempotencia.
- Integracoes externas devem ter timeout, tratamento de falha e retry controlado quando aplicavel.

#### RECOMENDADO

- Nomear services/use cases com verbos de negocio.
- Separar adapters de infraestrutura de regras de aplicacao.
- Preferir funcoes pequenas, coesas e testaveis.
- Evitar abstracoes antes de existir duplicacao real ou fronteira clara.

#### PROIBIDO

- Colocar regra de negocio em controller, resolver, middleware ou componente visual.
- Retornar stack trace, erro de ORM ou detalhe de banco para usuario final.
- Criar dependencia circular entre modulos.
- Ignorar erro de integracao externa ou fazer retry infinito.

### Frontend

#### OBRIGATORIO

- Componentes visuais nao devem conter regra de negocio critica.
- Fluxos de tela devem consumir contratos compartilhados ou schemas derivados da fonte oficial.
- Estado local deve ser preferido para interacoes locais; estado global exige justificativa.
- Formularios devem validar no cliente para UX e no servidor para seguranca.
- Telas privadas devem tratar loading, vazio, erro, sem permissao e sucesso quando aplicavel.
- Componentes de dominio devem usar nomes do negocio.

#### RECOMENDADO

- Separar componentes de layout, componentes de dominio e chamadas de dados.
- Manter transformacoes de dados fora do JSX quando ficarem complexas.
- Evitar duplicar DTOs, enums e validacoes ja existentes no pacote compartilhado.

#### PROIBIDO

- Fazer autorizacao apenas no frontend.
- Duplicar regra de negocio critica em componentes visuais.
- Criar estado global para dados que pertencem a uma unica tela.
- Exibir mensagem tecnica para usuario final.

### Qualidade de Codigo

#### OBRIGATORIO

- Codigo deve passar lint, typecheck, testes e build.
- Funcoes e classes devem ter responsabilidade clara.
- Nomes devem refletir dominio e intencao.
- Dependencias novas devem ser justificadas quando nao forem parte do preset.

#### RECOMENDADO

- Preferir simplicidade e legibilidade a padroes complexos.
- Refatorar duplicacao quando ela representar regra de negocio repetida.
- Usar comentarios apenas para explicar decisao ou contexto nao obvio.

#### PROIBIDO

- Introduzir `any` sem justificativa explicita.
- Silenciar erro de lint/typecheck para passar build.
- Criar abstracao generica sem uso real.

## API

### OBRIGATORIO

- Toda API deve ter contrato documentado antes da implementacao.
- Erros devem seguir formato padrao:

```json
{
  "error": {
    "code": "DOMAIN_ERROR_CODE",
    "message": "Mensagem segura para o usuario",
    "details": {}
  }
}
```

- Endpoints de listagem devem suportar paginacao e limite maximo.
- Filtros e ordenacao devem ser explicitamente definidos.
- Operacoes de escrita criticas devem considerar idempotencia.
- Escritas devem validar payload, permissao e invariantes de negocio.
- Autorizacao deve ser validada no backend.
- Dados sensiveis nao devem aparecer em mensagens de erro.
- Mudancas de contrato devem preservar compatibilidade ou registrar estrategia de evolucao.

### RECOMENDADO

- Usar OpenAPI para APIs REST.
- Usar versionamento ou estrategia de evolucao quando houver consumidores externos.
- Usar IDs opacos em rotas publicas.
- Usar nomes de campos estaveis e orientados ao dominio.
- Separar payload de entrada, resposta e modelo persistido.
- Usar DTOs validados com Zod ou class-validator conforme stack.

### PROIBIDO

- Retornar stack trace para cliente.
- Retornar dados sensiveis por default.
- Retornar entidades persistidas diretamente quando houver campo sensivel ou interno.
- Criar endpoints sem autorizacao quando o recurso for privado.
- Aceitar filtros livres que permitam consulta sem controle.

## Banco de Dados

### OBRIGATORIO

- Usar migrations versionadas.
- Definir constraints para invariantes importantes.
- Indices devem cobrir filtros, ordenacoes, joins e chaves estrangeiras frequentes.
- Operacoes multi-entidade que precisam ser atomicas devem usar transacao.
- Queries de listagem devem evitar N+1.
- Migrations devem ser revisaveis e reversiveis quando possivel.
- Registrar campos de auditoria para entidades criticas:
  - `createdAt`
  - `updatedAt`
  - `createdBy`, quando houver usuario autenticado
  - `updatedBy`, quando aplicavel
- Dados pessoais devem ser classificados.
- Dados sensiveis devem ser classificados no modelo.

### RECOMENDADO

- Definir estrategia de retencao de dados quando houver dado pessoal.
- Usar soft delete apenas quando houver requisito de negocio ou auditoria.
- Preferir nomes de tabelas e colunas alinhados ao dominio.

### PROIBIDO

- Alterar schema manualmente sem migration.
- Salvar segredo, token ou senha em texto claro.
- Usar campo JSON para substituir modelagem relacional quando o dado tiver regra de negocio clara.
- Carregar grandes volumes sem paginacao ou streaming.

## Autenticacao e Autorizacao

### OBRIGATORIO

- Autenticacao padrao: SSO corporativo OIDC.
- Autorizacao deve ser server-side.
- Perfis e permissoes devem estar documentados.
- Rotas privadas devem bloquear usuario nao autenticado.
- A UI pode esconder acoes, mas o backend deve sempre validar permissao.

### RECOMENDADO

- Usar RBAC para apps internos.
- Usar ABAC apenas quando as regras forem dinamicas por atributo.

### PROIBIDO

- Implementar login proprio se SSO estiver disponivel.
- Confiar apenas em checagem no frontend.
- Persistir token em localStorage quando houver alternativa segura.

## Frontend e UI

### Design System da PoC

- O preset `default-web-saas` usa Ant Design como design system de mercado para a PoC.
- O objetivo e garantir consistencia visual entre apps gerados enquanto a empresa ainda nao conectou seu proprio design system.
- Quando houver design system corporativo oficial, ele deve substituir Ant Design no preset da empresa, sem perguntar ao usuario de negocio.
- O agente tecnico deve registrar a substituicao em `_appgen_work/decisions.md`.

### Principios

- Apps internos devem priorizar clareza, velocidade de uso e escaneabilidade.
- A primeira tela deve ser uma experiencia util, como dashboard operacional, fila, lista, calendario, kanban ou formulario principal.
- A interface deve usar linguagem do dominio de negocio, nao nomes tecnicos de implementacao.
- O usuario de negocio nao escolhe biblioteca visual, design system ou arquitetura de frontend.

### OBRIGATORIO

- Usar Ant Design no preset da PoC, salvo substituicao aprovada por design system corporativo.
- Usar componentes acessiveis.
- Usar componentes padronizados para botoes, campos, selects, textarea, checkbox, radio, switch, dialog, notification/message, tabs, tabela, tag/badge, menu, date picker e paginacao.
- Toda tela deve declarar acao primaria, acoes secundarias e acoes destrutivas.
- Toda tela operacional deve ter estados:
  - carregando;
  - vazio;
  - erro;
  - sucesso, quando aplicavel;
  - sem permissao.
- Telas que dependem de dados externos tambem devem prever erro recuperavel com tentativa novamente.
- Formularios devem ter validacao client-side e server-side.
- Erros de formulario devem aparecer perto do campo e explicar como corrigir.
- Tabelas e listas operacionais devem ter estado vazio, carregamento, busca ou filtro principal, paginacao quando houver volume e acao clara para abrir detalhe.
- Status, prioridade e permissao devem usar texto visivel alem de cor.
- Acoes destrutivas devem pedir confirmacao.
- Telas de detalhe devem mostrar resumo, metadados relevantes, historico quando existir e acoes contextuais.
- Dashboards so devem existir quando houver metrica util para decisao de negocio.

### RECOMENDADO

- Layouts densos e objetivos para apps operacionais.
- Navegacao previsivel.
- Feedback visual imediato em acoes do usuario.
- Componentes com nomes de dominio quando forem especificos de feature.
- Usar `Layout`, `Menu`, `Breadcrumb`, `Table`, `Form`, `Modal`, `Drawer`, `Tabs`, `Tag`, `Badge`, `Descriptions`, `Alert`, `Empty` e `Skeleton` do Ant Design quando aplicavel.
- Navegacao lateral ou superior consistente para apps com mais de tres telas.
- Usar badges para status e prioridade.
- Agrupar formularios longos por secoes de negocio.
- Usar tabelas para trabalho recorrente de comparacao e listas responsivas quando a tela for estreita.
- Usar cards apenas para itens repetidos, resumo de metricas ou agrupamentos reais.
- Microcopy deve ser direto, orientado a acao e sem jargao tecnico.
- Mensagens de erro devem dizer o que aconteceu e qual acao o usuario pode tomar.

### PROIBIDO

- Criar landing page se o objetivo for ferramenta operacional.
- Usar texto de marketing como tela principal de um app interno.
- Usar componentes inacessiveis.
- Exibir dados sensiveis sem necessidade.
- Usar cor como unico indicador de status, prioridade, erro ou sucesso.
- Criar interface dominada por elementos decorativos que reduzem densidade operacional.
- Colocar cards dentro de cards.
- Criar graficos quando uma tabela ou contador resolver melhor a tarefa.
- Expor nomes de endpoint, stack trace, erro de banco ou detalhe tecnico para usuario final.

## Responsividade e Densidade

### OBRIGATORIO

- Desktop deve ser priorizado para apps operacionais, mas telas nao podem quebrar em mobile.
- Tabelas em telas pequenas devem virar lista resumida ou permitir rolagem controlada sem esconder acoes principais.
- Texto de botoes, badges e celulas nao pode sobrepor outros elementos.
- Acoes primarias devem continuar acessiveis em telas pequenas.

### RECOMENDADO

- Usar densidade compacta para filas, tabelas e dashboards.
- Usar densidade confortavel para formularios complexos.
- Definir limites de largura para conteudo de leitura e formularios.

## Acessibilidade

### OBRIGATORIO

- Elementos interativos devem ser acessiveis por teclado.
- Campos devem ter labels.
- Erros de formulario devem ser associados ao campo.
- Contraste deve atender WCAG AA.
- Modais devem gerenciar foco.
- Icon-only buttons precisam de nome acessivel.

### PROIBIDO

- Remover outline de foco sem alternativa.
- Usar cor como unico indicador de estado.
- Criar botao sem nome acessivel.

## Testes

### OBRIGATORIO

- Testes unitarios para regras de negocio.
- Testes de integracao para contratos criticos.
- Testes E2E para fluxos principais.
- Testes devem rodar por comando documentado.
- Testes devem ser deterministas e nao depender de ordem.
- Dados de teste devem usar factories, builders ou fixtures claras.
- O agente `appgen-qa` deve gerar `test-plan.md` e `qa-report.md`.

### RECOMENDADO

- Testes por slice vertical.
- Factories para dados de teste.
- Mocks apenas nas fronteiras externas.
- Testar comportamento observavel, nao detalhes internos de implementacao.
- Criar teste de regressao para bug corrigido.

### PROIBIDO

- Entregar app sem ao menos um teste do fluxo principal.
- Testar apenas detalhes de implementacao.
- Ignorar falha de teste por conveniencia.
- Remover teste para passar pipeline.
- Ignorar falha intermitente sem registrar causa.
- Mockar regra de negocio interna no teste da propria feature.

## Observabilidade

### OBRIGATORIO

- Logs estruturados no backend.
- Logs nao podem conter segredo ou dado pessoal sensivel.
- Erros inesperados devem ter correlation ID.
- Health check deve existir para backend dedicado.
- Operacoes criticas devem registrar eventos auditaveis.
- Eventos auditaveis devem registrar quem fez, quando fez, qual recurso foi afetado e resultado da operacao.
- Falhas de integracao externa devem ser registradas com contexto suficiente para suporte, sem payload sensivel.
- Logs devem diferenciar evento de negocio, erro tecnico e evento de seguranca.

### RECOMENDADO

- Separar logs de negocio e logs tecnicos.
- Incluir metricas basicas de latencia e erro.
- Registrar duracao de operacoes criticas.
- Incluir identificador de requisicao em respostas de erro inesperado.

### PROIBIDO

- Usar `console.log` disperso como estrategia final de observabilidade.
- Logar payload completo com dados sensiveis.
- Depender de screenshots ou relatos manuais como unica forma de diagnostico.

## Seguranca

### OBRIGATORIO

- Validar entrada no servidor.
- Validar autorizacao no servidor para toda operacao privada.
- Sanitizar ou escapar conteudo exibido quando aplicavel.
- Usar headers de seguranca recomendados pelo framework.
- Proteger rotas privadas.
- Nao commitar `.env` com valores reais.
- Dependencias devem passar por auditoria basica.
- Secrets devem ser lidos apenas de variaveis de ambiente ou secret manager.
- Dados sensiveis devem ser minimizados em respostas, logs, eventos e testes.
- Uploads, quando existirem, devem validar tipo, tamanho e permissao.
- Rate limit ou protecao equivalente deve ser considerada para endpoints sensiveis.

### PROIBIDO

- Expor segredo no bundle frontend.
- Ignorar autorizacao no backend.
- Retornar mensagens internas detalhadas para usuario final.
- Persistir senha, token ou segredo sem hashing/criptografia apropriada.
- Usar dados reais de producao em ambiente de teste sem anonimizar.

## CI/CD e Qualidade

### OBRIGATORIO

O app gerado deve ter comandos:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Antes de handoff, o agente `appgen-quality` deve verificar:

- lint;
- typecheck;
- testes;
- build;
- seguranca basica;
- acessibilidade basica;
- aderencia a estrutura de pastas;
- ausencia de dependencias proibidas.

### PROIBIDO

- Declarar entrega pronta com build quebrado.
- Declarar entrega pronta com findings `BLOCKER`.
- Remover verificacao para passar pipeline.

## Severidade de Findings

### BLOCKER

- app nao compila;
- build falha;
- fluxo principal nao funciona;
- falha critica de auth/autorizacao;
- vazamento de dado sensivel;
- ausencia total de testes do fluxo principal.

### HIGH

- regra de negocio principal parcialmente incorreta;
- endpoint privado sem cobertura de autorizacao suficiente;
- teste critico ausente;
- acessibilidade bloqueia uso por teclado em fluxo principal.

### MEDIUM

- inconsistencia visual relevante;
- observabilidade incompleta;
- cobertura parcial de edge cases;
- duplicacao tecnica que deve ser corrigida no ciclo atual.

### LOW

- melhoria de nomenclatura;
- refino visual pequeno;
- teste adicional desejavel;
- documentacao complementar.
