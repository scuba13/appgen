import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { commandVersion, detectPreviewEnvironment, dockerInstallPlan } from '../runtime/preview.js';

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

function hasArg(args, name) {
  return args.includes(name);
}

function nowIso() {
  return new Date().toISOString();
}

function writeState(statePath, state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

function commandOk(command, args) {
  try {
    execFileSync(command, args, { stdio: ['ignore', 'ignore', 'ignore'], timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

function environmentTasks() {
  return [
    { id: 'detect-tools', label: 'Conferir ferramentas locais minimas' },
    { id: 'validate-docker', label: 'Conferir Docker para testes isolados' },
    { id: 'plan-containers', label: 'Planejar onde a app vai rodar para teste' },
  ];
}

function initEnvironmentState(state, tasks) {
  const previousById = new Map((state.environment?.tasks ?? []).map(task => [task.id, task]));
  return {
    ...state,
    environment: {
      status: 'running',
      started_at: state.environment?.started_at || nowIso(),
      completed_at: null,
      current_task: null,
      report: state.environment?.report || null,
      tools: state.environment?.tools || {},
      containers: state.environment?.containers || [],
      tasks: tasks.map(task => ({
        ...task,
        status: previousById.get(task.id)?.status || 'pending',
        started_at: previousById.get(task.id)?.started_at || null,
        completed_at: previousById.get(task.id)?.completed_at || null,
        message: previousById.get(task.id)?.message || null,
      })),
    },
  };
}

function updateTask({ statePath, state, taskId, status, message = null, extra = {} }) {
  const task = state.environment.tasks.find(item => item.id === taskId);
  if (task) {
    task.status = status;
    task.message = message;
    if (status === 'running' && !task.started_at) task.started_at = nowIso();
    if (['done', 'skipped', 'blocked', 'failed'].includes(status)) task.completed_at = nowIso();
  }

  state.environment.status = status === 'failed'
    ? 'failed'
    : status === 'blocked'
      ? 'blocked'
      : state.environment.status;
  state.environment.current_task = ['done', 'skipped', 'blocked', 'failed'].includes(status) ? null : taskId;
  Object.assign(state.environment, extra);
  writeState(statePath, state);
  return state;
}

function printTask(chalk, index, total, label, status = 'running') {
  const icon = status === 'done'
    ? chalk.hex('#ffa203')('[ok]')
    : status === 'skipped'
      ? chalk.gray('[skip]')
      : status === 'blocked' || status === 'failed'
        ? chalk.yellow('[!]')
        : chalk.cyan('[..]');
  console.log(`  ${icon} ${index}/${total} ${label}`);
}

function plannedContainers(state) {
  const stack = state.stack || {};
  const containers = [];

  if (stack.database) {
    containers.push({ name: 'db', role: 'database', image: 'postgres:16-alpine' });
  }
  if (stack.backend) {
    containers.push({ name: 'api', role: 'backend', image: 'node:20-alpine' });
  }
  if (stack.frontend) {
    containers.push({ name: 'web', role: 'frontend', image: 'node:20-alpine' });
  }

  return containers;
}

function reportMarkdown({ state, env, installPlan, dockerDaemonReady, tools, containers, status }) {
  return `# Environment Report

## Status

${status}

## Ferramentas Locais

| Ferramenta | Status |
|---|---|
| Node | ${tools.node || 'Nao detectado'} |
| Git | ${tools.git || 'Nao detectado'} |
| Docker | ${env.docker.installed ? env.docker.version : 'Nao instalado'} |
| Docker Compose | ${env.compose.installed ? env.compose.version : 'Nao instalado'} |
| Docker daemon | ${dockerDaemonReady ? 'Disponivel' : 'Indisponivel'} |

## Politica De Ambiente

- Nao instalar Node, pnpm, banco ou dependencias globais na maquina do usuario.
- Usar containers para preview, testes e smoke checks.
- Docker/Docker Desktop e o prerequisito local principal.
- Instalar Docker somente com autorizacao explicita.

## Plano De Containers

${containers.map(container => `- ${container.name}: ${container.role} (${container.image})`).join('\n') || '- Nenhum container planejado ainda.'}

## Instalacao Docker

${env.docker.installed
  ? 'Docker foi detectado na maquina.'
  : `Docker nao foi detectado. Sugestao: \`${installPlan.command}\`. ${installPlan.note}`}

## Projeto

| Campo | Valor |
|---|---|
| Nome | ${state.project || ''} |
| App root | ${state.app_root || 'app'} |
| Preset | ${state.stack?.preset || 'default-web-saas'} |
`;
}

async function confirmInstall(command) {
  const { default: inquirer } = await import('inquirer');
  const { proceed } = await inquirer.prompt([{
    type: 'confirm',
    name: 'proceed',
    message: `Install Docker using "${command}"?`,
    default: false,
  }]);
  return proceed;
}

async function installDockerIfApproved({ chalk, installPlan, assumeYes }) {
  const supported = installPlan.method === 'homebrew-cask' || installPlan.method === 'winget';
  if (!supported) {
    return { status: 'manual_required', message: installPlan.note };
  }

  const approved = assumeYes || await confirmInstall(installPlan.command);
  if (!approved) {
    return { status: 'not_approved', message: 'User did not approve Docker installation.' };
  }

  try {
    if (installPlan.method === 'homebrew-cask') {
      execFileSync('brew', ['install', '--cask', 'docker'], { stdio: 'inherit' });
    } else if (installPlan.method === 'winget') {
      execFileSync('winget', ['install', 'Docker.DockerDesktop'], { stdio: 'inherit' });
    }
    return { status: 'installer_completed', message: 'Docker installer completed. Open Docker Desktop and rerun appgen environment.' };
  } catch (error) {
    return { status: 'installer_failed', message: error.message };
  }
}

export default async function environment(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before environment.\n');
    return;
  }

  let state = readJsonSafe(statePath);
  const workDir = state.work_folder || '_appgen_work';
  const reportRelPath = join(workDir, 'environment-report.md');
  const reportPath = join(projectRoot, reportRelPath);
  const tasks = environmentTasks();

  state = initEnvironmentState(state, tasks);
  writeState(statePath, state);

  console.log(chalk.bold('\n  AppGen: Environment\n'));

  printTask(chalk, 1, tasks.length, tasks[0].label);
  const tools = {
    node: commandVersion('node', ['--version']),
    git: commandVersion('git', ['--version']),
    docker: commandVersion('docker', ['--version']),
  };
  state = updateTask({
    statePath,
    state,
    taskId: 'detect-tools',
    status: 'done',
    message: 'Ferramentas locais detectadas.',
    extra: { tools },
  });

  printTask(chalk, 2, tasks.length, tasks[1].label);
  state = updateTask({ statePath, state, taskId: 'validate-docker', status: 'running' });
  let env = detectPreviewEnvironment();
  const installPlan = dockerInstallPlan(env);

  if (!env.docker.installed && hasArg(args, '--install-docker')) {
    const installResult = await installDockerIfApproved({
      chalk,
      installPlan,
      assumeYes: hasArg(args, '--yes'),
    });
    mkdirSync(dirname(reportPath), { recursive: true });
    appendFileSync(reportPath, `\nDocker install attempt: ${installResult.status} - ${installResult.message}\n`, 'utf8');
    env = detectPreviewEnvironment();
  }

  const dockerDaemonReady = env.docker.installed ? commandOk('docker', ['info']) : false;
  const dockerStatus = env.docker.installed && env.compose.installed && dockerDaemonReady ? 'done' : 'blocked';
  state = updateTask({
    statePath,
    state,
    taskId: 'validate-docker',
    status: dockerStatus,
    message: dockerStatus === 'done' ? 'Docker e Compose prontos.' : 'Docker/Compose ainda nao estao prontos.',
    extra: {
      docker: env.docker,
      compose: env.compose,
      docker_daemon_ready: dockerDaemonReady,
      install_plan: dockerStatus === 'done' ? null : installPlan,
    },
  });

  printTask(chalk, 3, tasks.length, tasks[2].label);
  const containers = plannedContainers(state);
  state = updateTask({
    statePath,
    state,
    taskId: 'plan-containers',
    status: 'done',
    message: `${containers.length} container(s) planejados.`,
    extra: { containers },
  });

  const blocked = state.environment.tasks.some(task => task.status === 'blocked' || task.status === 'failed');
  state.environment.status = blocked ? 'needs_attention' : 'ready';
  state.environment.completed_at = nowIso();
  state.environment.current_task = null;
  state.environment.report = reportRelPath;
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    reportMarkdown({
      state,
      env,
      installPlan,
      dockerDaemonReady,
      tools,
      containers,
      status: state.environment.status,
    }),
    'utf8'
  );
  writeState(statePath, state);

  console.log(`  Status:          ${state.environment.status}`);
  console.log(`  Report:          ${chalk.cyan(reportRelPath)}`);
  console.log(`  Docker:          ${env.docker.installed ? chalk.hex('#ffa203')(env.docker.version) : chalk.yellow('not found')}`);
  console.log(`  Compose:         ${env.compose.installed ? chalk.hex('#ffa203')(env.compose.version) : chalk.yellow('not found')}`);
  console.log(`  Docker daemon:   ${dockerDaemonReady ? chalk.hex('#ffa203')('ready') : chalk.yellow('not ready')}`);

  if (state.environment.status !== 'ready') {
    console.log('');
    console.log(chalk.yellow('  Preciso do Docker para testar a app em ambiente isolado.'));
    console.log('  Posso instalar somente com autorizacao explicita. Se preferir, instale manualmente e rode appgen novamente.');
    console.log(`  Suggested:       ${installPlan.command}`);
    console.log(`  Note:            ${installPlan.note}`);
  }
  console.log('');
}
