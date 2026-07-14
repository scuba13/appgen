import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { arch, platform, release, type } from 'os';
import { dirname, join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { appendProgressEvent, reopenImplementationSlice } from '../runtime/implementation-loop.js';
import { writeAcceptanceGuide } from '../runtime/business-experience.js';

async function loadChalk() {
  try {
    const mod = await import('chalk');
    return mod.default;
  } catch {
    const passthrough = text => text;
    return {
      bold: passthrough,
      cyan: passthrough,
      gray: passthrough,
      yellow: passthrough,
      red: passthrough,
      hex: () => passthrough,
    };
  }
}

function getArg(args, prefix) {
  const found = args.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function hasArg(args, name) {
  return args.includes(name);
}

function commandVersion(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function detectEnvironment() {
  const dockerVersion = commandVersion('docker', ['--version']);
  const composeVersion = dockerVersion ? commandVersion('docker', ['compose', 'version']) : null;
  return {
    os: {
      platform: platform(),
      type: type(),
      release: release(),
      arch: arch(),
    },
    docker: {
      installed: Boolean(dockerVersion),
      version: dockerVersion,
    },
    compose: {
      installed: Boolean(composeVersion),
      version: composeVersion,
    },
  };
}

function dockerInstallPlan(env) {
  if (env.os.platform === 'darwin') {
    const hasBrew = Boolean(commandVersion('brew', ['--version']));
    return hasBrew
      ? {
          method: 'homebrew-cask',
          command: 'brew install --cask docker',
          note: 'Depois de instalar, abra o Docker Desktop e aguarde o engine iniciar.',
        }
      : {
          method: 'manual-docker-desktop',
          command: 'Instalar Docker Desktop para macOS manualmente e abrir o app.',
          note: 'Homebrew nao foi detectado.',
        };
  }

  if (env.os.platform === 'win32') {
    const hasWinget = Boolean(commandVersion('winget', ['--version']));
    return hasWinget
      ? {
          method: 'winget',
          command: 'winget install Docker.DockerDesktop',
          note: 'Depois de instalar, abra o Docker Desktop. Pode exigir reinicio ou WSL2.',
        }
      : {
          method: 'manual-docker-desktop',
          command: 'Instalar Docker Desktop para Windows manualmente.',
          note: 'winget nao foi detectado.',
        };
  }

  if (env.os.platform === 'linux') {
    return {
      method: 'linux-package-manager',
      command: 'Instalar Docker Engine e docker compose plugin pelo gerenciador da distro.',
      note: 'O comando exato depende da distribuicao. Exige sudo e autorizacao explicita.',
    };
  }

  return {
    method: 'unsupported-os',
    command: 'Instalacao automatizada nao definida para este OS.',
    note: 'Instale Docker e Docker Compose manualmente.',
  };
}

async function confirmInstall(chalk, installPlan, assumeYes) {
  if (assumeYes) return true;
  const { default: inquirer } = await import('inquirer');
  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: `Install Docker using "${installPlan.command}"?`,
    default: false,
  }]);
  if (!proceed) {
    console.log(chalk.yellow('\n  Docker installation cancelled by user.\n'));
  }
  return proceed;
}

async function installDockerIfApproved({ chalk, env, installPlan, assumeYes }) {
  if (env.docker.installed && env.compose.installed) {
    return { attempted: false, status: 'already_installed', message: 'Docker and Docker Compose are already available.' };
  }

  const supported = installPlan.method === 'homebrew-cask' || installPlan.method === 'winget';
  if (!supported) {
    return {
      attempted: false,
      status: 'manual_required',
      message: `Automatic install is not supported for method "${installPlan.method}". ${installPlan.note}`,
    };
  }

  const approved = await confirmInstall(chalk, installPlan, assumeYes);
  if (!approved) {
    return { attempted: false, status: 'not_approved', message: 'User did not approve Docker installation.' };
  }

  try {
    if (installPlan.method === 'homebrew-cask') {
      execFileSync('brew', ['install', '--cask', 'docker'], { stdio: 'inherit' });
    } else if (installPlan.method === 'winget') {
      execFileSync('winget', ['install', 'Docker.DockerDesktop'], { stdio: 'inherit' });
    }
    return {
      attempted: true,
      status: 'installer_completed',
      message: 'Installer command completed. Open Docker Desktop and wait for the engine to start, then rerun node .appgen/bin/appgen.js acceptance --prepare.',
    };
  } catch (error) {
    return {
      attempted: true,
      status: 'installer_failed',
      message: error.message,
    };
  }
}

function packageName(state) {
  return String(state.project || 'appgen-app')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'appgen-app';
}

function composeContent(state) {
  const name = packageName(state);
  return `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${name}
    ports:
      - "5432:5432"
    volumes:
      - appgen_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ${name}"]
      interval: 5s
      timeout: 5s
      retries: 20

  api:
    image: node:20-alpine
    working_dir: /workspace
    command: sh -lc "corepack enable && pnpm install && pnpm --filter @${name}/api prisma:generate && pnpm --filter @${name}/api dev"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/${name}?schema=public
      API_PORT: "3001"
      OIDC_ISSUER_URL: http://localhost:3001/mock-oidc
      OIDC_CLIENT_ID: ${name}
      OIDC_CLIENT_SECRET: local-preview-only
    ports:
      - "3001:3001"
    volumes:
      - .:/workspace
      - appgen_pnpm_store:/root/.local/share/pnpm/store
    depends_on:
      db:
        condition: service_healthy

  web:
    image: node:20-alpine
    working_dir: /workspace
    command: sh -lc "corepack enable && pnpm install && pnpm --filter @${name}/web dev -- --hostname 0.0.0.0"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3001
    ports:
      - "3000:3000"
    volumes:
      - .:/workspace
      - appgen_pnpm_store:/root/.local/share/pnpm/store
    depends_on:
      - api

  e2e:
    image: mcr.microsoft.com/playwright:v1.49.1-jammy
    working_dir: /workspace
    command: sh -lc "corepack enable && pnpm install && PLAYWRIGHT_BASE_URL=http://web:3000 pnpm test:e2e"
    environment:
      CI: "true"
      PLAYWRIGHT_BASE_URL: http://web:3000
    volumes:
      - .:/workspace
      - appgen_pnpm_store:/root/.local/share/pnpm/store
    depends_on:
      - web

volumes:
  appgen_postgres_data:
  appgen_pnpm_store:
`;
}

function writeFileSafe(path, content, force = false) {
  if (existsSync(path) && !force) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
  return true;
}

function appendMarkdown(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const prefix = existsSync(path) ? '\n\n---\n\n' : '';
  appendFileSync(path, `${prefix}${content.trim()}\n`, 'utf8');
}

function appendAcceptanceHistory(projectRoot, state, event) {
  const workDir = state.work_folder || '_appgen_work';
  const entry = {
    ts: new Date().toISOString(),
    ...event,
  };
  mkdirSync(join(projectRoot, workDir), { recursive: true });
  appendFileSync(join(projectRoot, workDir, 'acceptance-history.jsonl'), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

function reportMarkdown({ state, env, installPlan, composeRelPath, wroteCompose, status }) {
  return `# Preview Report

## Status

${status}

## Ambiente

| Item | Valor |
|---|---|
| OS | ${env.os.type} ${env.os.release} (${env.os.platform}/${env.os.arch}) |
| Docker | ${env.docker.installed ? env.docker.version : 'Nao instalado'} |
| Docker Compose | ${env.compose.installed ? env.compose.version : 'Nao instalado'} |

## Docker

${env.docker.installed && env.compose.installed
  ? 'Docker e Docker Compose estao disponiveis para preview.'
  : `Docker/Compose nao estao prontos. Instalacao sugerida: \`${installPlan.command}\`. Metodo: ${installPlan.method}. ${installPlan.note}`}

## Compose

| Campo | Valor |
|---|---|
| Arquivo | ${composeRelPath} |
| Criado nesta execucao? | ${wroteCompose ? 'Sim' : 'Nao'} |

## Como Subir Para Teste

\`\`\`bash
cd ${state.app_root || 'app'}
docker compose up
\`\`\`

URLs esperadas:

- Web: http://localhost:3000
- API health: http://localhost:3001/health

## Observacao

Se o problema for de ambiente, registre feedback como \`environment\`.
Se o problema for bug de implementacao, registre feedback como \`technical\`.
Se o problema for regra, escopo ou definicao do produto, registre feedback como \`business\`.
`;
}

function acceptanceMarkdown({ state, status, feedbackType = null, feedback = null }) {
  const now = new Date().toISOString();
  return `# User Acceptance

| Campo | Valor |
|---|---|
| Status | ${status} |
| Registrado em | ${now} |
| Projeto | ${state.project || ''} |
| Feedback type | ${feedbackType || 'n/a'} |

## Feedback

${feedback || 'Usuario aprovou o preview.'}
`;
}

function feedbackMarkdown({ state, feedbackType, feedback }) {
  const now = new Date().toISOString();
  const route = feedbackType === 'business'
    ? 'Voltar para appgen-product/appgen-specs para esclarecer regra ou escopo.'
    : feedbackType === 'environment'
      ? 'Registrar blocker de ambiente antes de nova tentativa de preview.'
      : 'Voltar para implementation-loop com appgen-coder/appgen-qa/appgen-quality.';

  return `# User Feedback

## Entrada

| Campo | Valor |
|---|---|
| Registrado em | ${now} |
| Projeto | ${state.project || ''} |
| Tipo | ${feedbackType} |
| Rota recomendada | ${route} |

## Feedback do Usuario

${feedback}
`;
}

function updateState(projectRoot, state, acceptance) {
  const next = {
    ...state,
    acceptance: {
      ...(state.acceptance ?? {}),
      ...acceptance,
    },
  };
  writeFileSync(join(projectRoot, '.appgen', 'state.json'), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

export default async function acceptance(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen-ai install') + ' before acceptance.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const appRoot = state.app_root || 'app';
  const workDir = state.work_folder || '_appgen_work';
  const appRootPath = join(projectRoot, appRoot);
  const force = hasArg(args, '--force');
  const installDocker = hasArg(args, '--install-docker');
  const assumeYes = hasArg(args, '--yes');
  const ok = hasArg(args, '--ok');
  const feedback = getArg(args, '--feedback=');
  const feedbackType = getArg(args, '--feedback-type=') || 'technical';

  mkdirSync(join(projectRoot, workDir), { recursive: true });

  if (ok) {
    const historyEntry = appendAcceptanceHistory(projectRoot, state, {
      event: 'accepted',
      agent: 'appgen-acceptance',
      status: 'approved',
    });
    const nextState = updateState(projectRoot, state, {
      status: 'approved',
      approved_at: historyEntry.ts,
      next_step: 'docs',
    });
    appendMarkdown(join(projectRoot, workDir, 'user-acceptance.md'), acceptanceMarkdown({ state, status: 'approved' }));
    appendProgressEvent(projectRoot, nextState, {
      agent: 'appgen-acceptance',
      event: 'user-accepted',
      status: 'approved',
      report: join(workDir, 'user-acceptance.md'),
    });
    console.log(chalk.hex('#ffa203')('\n  User acceptance recorded. Next step: appgen-docs.\n'));
    return;
  }

  const acceptanceGuide = writeAcceptanceGuide(projectRoot, state);

  if (feedback) {
    const normalizedType = ['technical', 'business', 'environment'].includes(feedbackType)
      ? feedbackType
      : 'technical';
    const nextStep = normalizedType === 'business'
      ? 'product/specs'
      : normalizedType === 'environment'
        ? 'acceptance'
        : 'implementation-loop';
    const historyEntry = appendAcceptanceHistory(projectRoot, state, {
      event: 'feedback',
      agent: 'appgen-acceptance',
      status: normalizedType === 'environment' ? 'blocked_environment' : 'changes_requested',
      feedback_type: normalizedType,
      feedback,
      next_step: nextStep,
    });
    let nextState = updateState(projectRoot, state, {
      status: normalizedType === 'environment' ? 'blocked_environment' : 'changes_requested',
      feedback_type: normalizedType,
      feedback,
      recorded_at: historyEntry.ts,
      next_step: nextStep,
      test_guide: acceptanceGuide.path,
    });
    appendMarkdown(join(projectRoot, workDir, 'user-feedback.md'), feedbackMarkdown({ state, feedbackType: normalizedType, feedback }));
    appendMarkdown(
      join(projectRoot, workDir, 'user-acceptance.md'),
      acceptanceMarkdown({ state, status: 'changes_requested', feedbackType: normalizedType, feedback })
    );
    if (normalizedType === 'technical') {
      const reopened = reopenImplementationSlice(projectRoot, {
        slice: 'S006',
        agent: 'appgen-acceptance',
        report: join(workDir, 'user-feedback.md'),
        reason: feedback,
      });
      nextState = reopened.state;
    }
    appendProgressEvent(projectRoot, nextState, {
      agent: 'appgen-acceptance',
      event: 'user-feedback',
      status: nextState.acceptance.status,
      feedback_type: normalizedType,
      report: join(workDir, 'user-feedback.md'),
    });
    console.log(chalk.yellow(`\n  Feedback registrado como ${normalizedType}. Rota recomendada: ${nextStep}.\n`));
    return;
  }

  const env = detectEnvironment();
  const installPlan = dockerInstallPlan(env);

  if (installDocker) {
    const installResult = await installDockerIfApproved({ chalk, env, installPlan, assumeYes });
    appendAcceptanceHistory(projectRoot, state, {
      event: 'docker-install-requested',
      agent: 'appgen-acceptance',
      status: installResult.status,
      install_plan: installPlan,
      attempted: installResult.attempted,
      message: installResult.message,
    });
    writeFileSafe(
      join(projectRoot, workDir, 'preview-report.md'),
      `# Preview Report

## Docker Installation

| Campo | Valor |
|---|---|
| Status | ${installResult.status} |
| Attempted | ${installResult.attempted ? 'Sim' : 'Nao'} |
| Method | ${installPlan.method} |
| Command | ${installPlan.command} |

## Mensagem

${installResult.message}
`,
      true
    );
    console.log(chalk.bold('\n  AppGen: Docker Install\n'));
    console.log(`  Status:   ${chalk.cyan(installResult.status)}`);
    console.log(`  Message:  ${installResult.message}`);
    console.log(`  Report:   ${chalk.cyan(join(workDir, 'preview-report.md'))}\n`);
    return;
  }

  const composeRelPath = join(appRoot, 'docker-compose.yml');
  const composePath = join(projectRoot, composeRelPath);
  const wroteCompose = writeFileSafe(composePath, composeContent(state), force);
  const ready = env.docker.installed && env.compose.installed;
  const status = ready ? 'Preview environment ready.' : 'Preview blocked until Docker/Compose is available.';
  const report = reportMarkdown({ state, env, installPlan, composeRelPath, wroteCompose, status });
  writeFileSafe(join(projectRoot, workDir, 'preview-report.md'), report, true);

  const historyEntry = appendAcceptanceHistory(projectRoot, state, {
    event: 'prepared',
    agent: 'appgen-acceptance',
    status: ready ? 'ready_for_user_test' : 'blocked_environment',
    docker: env.docker,
    compose: env.compose,
    os: env.os,
    compose_file: composeRelPath,
  });
  const nextState = updateState(projectRoot, state, {
    status: ready ? 'ready_for_user_test' : 'blocked_environment',
    prepared_at: historyEntry.ts,
    docker: env.docker,
    compose: env.compose,
    os: env.os,
    compose_file: composeRelPath,
    test_guide: acceptanceGuide.path,
    install_plan: ready ? null : installPlan,
    next_step: ready ? 'user-test' : 'install-docker-with-approval',
  });

  appendProgressEvent(projectRoot, nextState, {
    agent: 'appgen-acceptance',
    event: 'acceptance-prepared',
    status: nextState.acceptance.status,
    report: join(workDir, 'preview-report.md'),
  });

  console.log(chalk.bold('\n  AppGen: Acceptance\n'));
  console.log(`  OS:             ${chalk.cyan(`${env.os.type} ${env.os.release} (${env.os.platform}/${env.os.arch})`)}`);
  console.log(`  Docker:         ${env.docker.installed ? chalk.hex('#ffa203')(env.docker.version) : chalk.yellow('not found')}`);
  console.log(`  Compose:        ${env.compose.installed ? chalk.hex('#ffa203')(env.compose.version) : chalk.yellow('not found')}`);
  console.log(`  Compose file:   ${chalk.cyan(composeRelPath)}${wroteCompose ? '' : chalk.gray(' (kept existing)')}`);
  console.log(`  Report:         ${chalk.cyan(join(workDir, 'preview-report.md'))}`);
  console.log(`  Test guide:     ${chalk.cyan(acceptanceGuide.path)}`);
  if (ready) {
    console.log('');
    console.log(`  Run:            ${chalk.bold(`cd ${appRoot} && docker compose up`)}`);
    console.log('  Test web:       http://localhost:3000');
    console.log('  Test API:       http://localhost:3001/health');
    console.log('  Follow guide:   abra o roteiro e teste o fluxo principal antes de aprovar');
    console.log(`  Approve with:   ${chalk.bold('node .appgen/bin/appgen.js acceptance --ok')}`);
  } else {
    console.log('');
    console.log(chalk.yellow('  Preciso do Docker para testar a app em ambiente isolado antes do aceite.'));
    console.log('  Posso instalar somente com autorizacao explicita. Se preferir, instale manualmente e rode node .appgen/bin/appgen.js acceptance novamente.');
    console.log(`  Suggested:      ${installPlan.command}`);
    console.log(`  Note:           ${installPlan.note}`);
  }
  console.log('');
}
