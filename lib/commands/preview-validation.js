import { existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { appendProgressEvent } from '../runtime/implementation-loop.js';
import { preparePreview } from '../runtime/preview.js';

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

function previewTasks(runPreview) {
  return [
    { id: 'validate-app-root', label: 'Validar app gerado' },
    { id: 'prepare-compose', label: 'Preparar preview isolado da app' },
    {
      id: 'run-smoke-test',
      label: runPreview
        ? 'Abrir a app e testar se responde'
        : 'Conferir configuracao sem abrir containers',
    },
  ];
}

function initPreviewState(state, tasks) {
  const previousById = new Map((state.preview_validation?.tasks ?? []).map(task => [task.id, task]));
  return {
    ...state,
    preview_validation: {
      status: 'running',
      started_at: state.preview_validation?.started_at || nowIso(),
      completed_at: null,
      current_task: null,
      app_root: state.app_root || 'app',
      compose_file: state.preview_validation?.compose_file || null,
      report: state.preview_validation?.report || null,
      checks: state.preview_validation?.checks || [],
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
  const task = state.preview_validation.tasks.find(item => item.id === taskId);
  if (task) {
    task.status = status;
    task.message = message;
    if (status === 'running' && !task.started_at) task.started_at = nowIso();
    if (['done', 'skipped', 'blocked', 'failed'].includes(status)) task.completed_at = nowIso();
  }

  state.preview_validation.status = status === 'failed'
    ? 'failed'
    : status === 'blocked'
      ? 'blocked'
      : state.preview_validation.status;
  state.preview_validation.current_task = ['done', 'skipped', 'blocked', 'failed'].includes(status) ? null : taskId;
  Object.assign(state.preview_validation, extra);
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

function smokeTaskStatus(result, runPreview) {
  if (!runPreview) return 'skipped';
  if (result.status === 'ready_for_user_test') return 'done';
  if (result.status === 'blocked_environment') return 'blocked';
  return 'failed';
}

export default async function previewValidation(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen-ai install') + ' before preview-validation.\n');
    return;
  }

  let state = readJsonSafe(statePath);
  const appRoot = state.app_root || 'app';
  const appRootPath = join(projectRoot, appRoot);
  const runPreview = !hasArg(args, '--prepare-only');
  const tasks = previewTasks(runPreview);

  state = initPreviewState(state, tasks);
  writeState(statePath, state);

  console.log(chalk.bold('\n  AppGen: Preview Validation\n'));

  printTask(chalk, 1, tasks.length, tasks[0].label);
  if (!existsSync(appRootPath)) {
    state = updateTask({
      statePath,
      state,
      taskId: 'validate-app-root',
      status: 'blocked',
      message: `${appRoot} nao existe. Rode node .appgen/bin/appgen.js scaffold antes.`,
    });
    console.log(chalk.yellow(`\n  App root not found: ${appRoot}`));
    console.log('  Run ' + chalk.bold('node .appgen/bin/appgen.js scaffold') + ' before preview-validation.\n');
    return;
  }
  state = updateTask({
    statePath,
    state,
    taskId: 'validate-app-root',
    status: 'done',
    message: `${appRoot} encontrado.`,
  });

  printTask(chalk, 2, tasks.length, tasks[1].label);
  state = updateTask({ statePath, state, taskId: 'prepare-compose', status: 'running' });

  const result = await preparePreview({
    projectRoot,
    state,
    force: hasArg(args, '--force'),
    runPreview,
  });

  state = updateTask({
    statePath,
    state,
    taskId: 'prepare-compose',
    status: result.status === 'blocked_environment' ? 'blocked' : 'done',
    message: result.status,
    extra: {
      compose_file: result.composeRelPath,
      report: result.report,
      checks: result.checks,
      docker: result.env.docker,
      compose: result.env.compose,
      updated_at: nowIso(),
    },
  });

  const smokeStatus = smokeTaskStatus(result, runPreview);
  printTask(chalk, 3, tasks.length, tasks[2].label, smokeStatus);
  state = updateTask({
    statePath,
    state,
    taskId: 'run-smoke-test',
    status: smokeStatus,
    message: runPreview ? result.status : 'Prepare-only: smoke test nao executado.',
  });

  const failedOrBlocked = state.preview_validation.tasks.some(task => ['blocked', 'failed'].includes(task.status));
  state.preview_validation.status = failedOrBlocked ? 'needs_attention' : 'ready_for_user_test';
  state.preview_validation.completed_at = nowIso();
  state.preview_validation.current_task = null;
  state.implementation_loop = {
    ...(state.implementation_loop || {}),
    preview_environment: {
      status: state.preview_validation.status,
      report: result.report,
      compose_file: result.composeRelPath,
      updated_at: state.preview_validation.completed_at,
    },
  };
  writeState(statePath, state);

  appendProgressEvent(projectRoot, state, {
    agent: 'appgen-preview-validation',
    event: 'preview-validation',
    status: state.preview_validation.status,
    report: result.report,
    checks: result.checks,
  });

  console.log(`  Status:          ${state.preview_validation.status}`);
  console.log(`  Compose file:    ${chalk.cyan(result.composeRelPath)}`);
  console.log(`  Report:          ${chalk.cyan(result.report)}`);

  if (state.preview_validation.status === 'ready_for_user_test') {
    console.log(`  Web:             ${chalk.cyan('http://localhost:3000')}`);
    console.log(`  API health:      ${chalk.cyan('http://localhost:3001/health')} ou ${chalk.cyan('http://localhost:3001/api/v1/health')}`);
    console.log('  Next step:       node .appgen/bin/appgen.js acceptance');
  } else if (result.status === 'blocked_environment') {
    console.log(chalk.yellow('  Preciso do Docker para testar a app em ambiente isolado antes do usuario.'));
    console.log('  Posso instalar somente com autorizacao explicita. Se preferir, instale manualmente e rode node .appgen/bin/appgen.js preview-validation novamente.');
    console.log(`  Suggested:       ${result.installPlan.command}`);
    console.log(`  Note:            ${result.installPlan.note}`);
  } else {
    console.log(chalk.yellow('  O preview tecnico falhou. Corrija antes de pedir teste para o usuario.'));
  }

  console.log('');
}
