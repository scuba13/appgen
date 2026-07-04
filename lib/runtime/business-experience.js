import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export const STEP_EXPERIENCE = {
  brief: {
    title: 'Entender a necessidade',
    action: 'Responder perguntas de negocio sobre problema, usuarios, fluxos, regras, dados e aceite.',
  },
  standards: {
    title: 'Aplicar padroes da empresa',
    action: 'Conferir quais regras corporativas guiam a app.',
  },
  product: {
    title: 'Definir o produto',
    action: 'Transformar a necessidade em escopo testavel.',
  },
  architecture: {
    title: 'Planejar a solucao',
    action: 'Deixar as decisoes tecnicas preparadas sem pedir stack ao usuario.',
  },
  environment: {
    title: 'Conferir ambiente de teste',
    action: 'Verificar Docker/Compose e planejar containers isolados.',
  },
  specs: {
    title: 'Detalhar o que sera construido',
    action: 'Gerar specs por funcionalidade e confirmar se estao prontas.',
  },
  scaffold: {
    title: 'Criar a base da app',
    action: 'Revisar o resumo e criar os arquivos iniciais da aplicacao.',
  },
  slicer: {
    title: 'Organizar entregas',
    action: 'Quebrar a app em partes pequenas para implementar e testar.',
  },
  'implementation-loop': {
    title: 'Construir e validar',
    action: 'Implementar, testar, corrigir e validar o preview antes do usuario.',
  },
  acceptance: {
    title: 'Teste do usuario',
    action: 'Seguir o roteiro de teste e registrar aceite ou ajustes.',
  },
  docs: {
    title: 'Gerar documentacao',
    action: 'Criar guias da app entregue.',
  },
  handoff: {
    title: 'Fechar entrega',
    action: 'Consolidar status, evidencias e proximos passos.',
  },
};

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function firstParagraph(markdown) {
  const paragraph = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .find(block => block && !block.startsWith('#') && !block.startsWith('|'));
  return cleanup(paragraph || '');
}

function cleanup(value) {
  return String(value || '')
    .replace(/`/g, '')
    .replace(/\*\*/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSection(markdown, names) {
  const lines = markdown.split('\n');
  const wanted = names.map(name => name.toLowerCase());
  let collecting = false;
  const section = [];

  for (const line of lines) {
    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      const title = heading[1].toLowerCase();
      collecting = wanted.some(name => title.includes(name));
      continue;
    }
    if (collecting) section.push(line);
  }

  return section.join('\n').trim();
}

function itemsFrom(markdown, names, limit = 5) {
  const section = extractSection(markdown, names);
  const source = section || markdown;
  const items = source
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^([-*]|\d+\.)\s+/.test(line))
    .map(line => cleanup(line.replace(/^([-*]|\d+\.)\s+/, '')))
    .filter(Boolean);

  return [...new Set(items)].slice(0, limit);
}

function featureNames(projectRoot, specsDir, limit = 5) {
  const featuresDir = join(projectRoot, specsDir, 'features');
  if (!existsSync(featuresDir)) return [];
  return readdirSync(featuresDir)
    .filter(file => file.endsWith('.md'))
    .map(file => cleanup(file.replace(/\.md$/, '').replace(/[-_]+/g, ' ')))
    .filter(Boolean)
    .slice(0, limit);
}

function bulletList(items, fallback) {
  const list = items.filter(Boolean);
  if (!list.length) return `- ${fallback}`;
  return list.map(item => `- ${item}`).join('\n');
}

export function buildSummaryPath(state) {
  return join(state.work_folder || '_appgen_work', 'build-summary.md');
}

export function acceptanceGuidePath(state) {
  return join(state.work_folder || '_appgen_work', 'acceptance-test-guide.md');
}

export function writeBuildSummary(projectRoot, state) {
  const specsDir = state.output_folder || '_appgen_specs';
  const workRelPath = buildSummaryPath(state);
  const brief = readIfExists(join(projectRoot, specsDir, 'brief.md'));
  const product = readIfExists(join(projectRoot, specsDir, 'product.md'));
  const ui = readIfExists(join(projectRoot, specsDir, 'ui-spec.md'));
  const slices = readIfExists(join(projectRoot, specsDir, 'feature-slices.md'));
  const source = [product, brief, slices].join('\n\n');

  const purpose = firstParagraph(product) || firstParagraph(brief) || 'Objetivo de negocio ainda nao resumido nas specs.';
  const users = itemsFrom(source, ['usuario', 'usuário', 'persona', 'ator', 'perfil'], 5);
  const capabilities = [
    ...itemsFrom(source, ['funcionalidade', 'escopo', 'fluxo', 'jornada', 'must', 'deve'], 6),
    ...featureNames(projectRoot, specsDir, 6),
  ].slice(0, 6);
  const rules = itemsFrom(source, ['regra', 'criterio', 'critério', 'restricao', 'restrição', 'aceite'], 6);
  const screens = itemsFrom(ui, ['tela', 'view', 'pagina', 'página', 'interface'], 6);

  const markdown = `# Resumo Antes De Construir

## Objetivo

${purpose}

## Quem Vai Usar

${bulletList(users, 'Perfis de usuario serao inferidos a partir do brief e produto.')}

## O Que Sera Construido

${bulletList(capabilities, 'Funcionalidades serao construidas conforme as specs aprovadas.')}

## Regras Importantes

${bulletList(rules, 'Regras de negocio serao seguidas conforme as specs aprovadas.')}

## Telas Esperadas

${bulletList(screens, 'Telas serao definidas pela UI spec.')}

## Decisao Antes Do Scaffold

Se esse resumo estiver alinhado com o esperado, o AppGen pode criar a base da app.
Se algo estiver errado, volte para product/specs antes de construir.
`;

  const path = join(projectRoot, workRelPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown, 'utf8');
  return {
    path: workRelPath,
    purpose,
    users,
    capabilities,
    rules,
    screens,
  };
}

export function writeAcceptanceGuide(projectRoot, state) {
  const specsDir = state.output_folder || '_appgen_specs';
  const workRelPath = acceptanceGuidePath(state);
  const product = readIfExists(join(projectRoot, specsDir, 'product.md'));
  const slices = readIfExists(join(projectRoot, specsDir, 'feature-slices.md'));
  const ui = readIfExists(join(projectRoot, specsDir, 'ui-spec.md'));
  const source = [product, slices, ui].join('\n\n');
  const flows = [
    ...itemsFrom(source, ['fluxo', 'jornada', 'funcionalidade', 'cenarios', 'cenários'], 5),
    ...featureNames(projectRoot, specsDir, 5),
  ].slice(0, 5);
  const rules = itemsFrom(source, ['regra', 'criterio', 'critério', 'aceite', 'validacao', 'validação'], 5);
  const appRoot = state.app_root || 'app';

  const flowSteps = flows.length
    ? flows.map((flow, index) => `${index + 1}. Teste: ${flow}`).join('\n')
    : '1. Abra a app e execute o fluxo principal descrito no produto.';
  const ruleSteps = rules.length
    ? rules.map((rule, index) => `${index + 1}. Confira se a regra foi respeitada: ${rule}`).join('\n')
    : '1. Confira se as regras principais do produto foram respeitadas.';

  const markdown = `# Roteiro De Teste Do Usuario

## Antes De Comecar

- A app deve estar aberta em http://localhost:3000.
- O teste deve focar no comportamento de negocio, nao em codigo, framework ou banco.
- Se algo estiver errado, registre o feedback dizendo se e regra de negocio, bug ou ambiente.

## Fluxo Principal

${flowSteps}

## Regras Para Conferir

${ruleSteps}

## Como Aprovar

Quando o comportamento estiver correto, registre aceite com:

\`\`\`bash
node .appgen/bin/appgen.js acceptance --ok
\`\`\`

## Como Pedir Ajuste

\`\`\`bash
node .appgen/bin/appgen.js acceptance --feedback-type=business --feedback="Descreva a regra ou fluxo que precisa mudar."
node .appgen/bin/appgen.js acceptance --feedback-type=technical --feedback="Descreva o comportamento que falhou."
node .appgen/bin/appgen.js acceptance --feedback-type=environment --feedback="Descreva o bloqueio para abrir ou testar a app."
\`\`\`

## Como Parar O Preview

\`\`\`bash
cd ${appRoot}
docker compose down
\`\`\`
`;

  const path = join(projectRoot, workRelPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, markdown, 'utf8');
  return {
    path: workRelPath,
    flows,
    rules,
  };
}

export function describeStep(id) {
  return STEP_EXPERIENCE[id] || {
    title: id || 'Fluxo AppGen',
    action: 'Continuar o fluxo AppGen.',
  };
}

export function environmentBlocker(state) {
  const environment = state.environment;
  if (!environment || !['needs_attention', 'blocked', 'failed'].includes(environment.status)) {
    return null;
  }

  if (environment.docker?.installed && environment.compose?.installed && environment.docker_daemon_ready === false) {
    return {
      title: 'Docker Desktop precisa estar ativo',
      action: 'Abra o Docker Desktop, aguarde o engine iniciar e rode node .appgen/bin/appgen.js environment novamente.',
      command: 'node .appgen/bin/appgen.js environment',
    };
  }

  if (!environment.docker?.installed) {
    return {
      title: 'Docker precisa ser instalado',
      action: 'Instale Docker Desktop com autorizacao explicita ou rode node .appgen/bin/appgen.js environment --install-docker.',
      command: 'node .appgen/bin/appgen.js environment --install-docker',
    };
  }

  if (!environment.compose?.installed) {
    return {
      title: 'Docker Compose precisa estar disponivel',
      action: 'Atualize ou reinstale Docker Desktop e rode node .appgen/bin/appgen.js environment novamente.',
      command: 'node .appgen/bin/appgen.js environment',
    };
  }

  return {
    title: 'Ambiente de teste precisa de atencao',
    action: 'Revise _appgen_work/environment-report.md e rode node .appgen/bin/appgen.js environment novamente.',
    command: 'node .appgen/bin/appgen.js environment',
  };
}

export function resumeMessage(state, nextStep) {
  const completed = state.completed ?? [];
  const last = completed.length ? describeStep(completed[completed.length - 1]).title : 'nenhuma etapa concluida';
  const blocker = environmentBlocker(state);
  if (blocker) {
    return {
      last,
      nextTitle: blocker.title,
      nextAction: blocker.action,
    };
  }

  if (!nextStep) {
    return {
      last,
      nextTitle: 'Fluxo concluido',
      nextAction: 'Revisar handoff e documentacao final.',
    };
  }
  const next = describeStep(nextStep.id);
  return {
    last,
    nextTitle: next.title,
    nextAction: next.action,
  };
}
