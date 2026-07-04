import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { copyPresetScaffold } from '../scaffold/copier.js';

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

function missingRequiredSpecs(projectRoot, specsDir) {
  const required = [
    join(specsDir, 'brief.md'),
    join(specsDir, 'standards-map.md'),
    join(specsDir, 'product.md'),
    join(specsDir, 'target-architecture.md'),
    join(specsDir, 'domain-model.md'),
    join(specsDir, 'data-model.md'),
    join(specsDir, 'api-contracts.md'),
    join(specsDir, 'ui-spec.md'),
    join(specsDir, 'quality', 'spec-score.md'),
  ];

  const missing = required.filter(relPath => !existsSync(join(projectRoot, relPath)));
  const featuresDir = join(projectRoot, specsDir, 'features');
  const hasFeatureSpec = existsSync(featuresDir)
    && readdirSync(featuresDir).some(file => file.endsWith('.md'));

  if (!hasFeatureSpec) {
    missing.push(join(specsDir, 'features', '<feature>.md'));
  }

  return missing;
}

function parseBooleanLike(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function readSpecScoreGate(projectRoot, specsDir) {
  const scorePath = join(projectRoot, specsDir, 'quality', 'spec-score.md');
  if (!existsSync(scorePath)) {
    return { blocked: false, issues: [] };
  }

  const content = readFileSync(scorePath, 'utf8');
  const summary = content.split(/^##\s+Rubrica\b/im)[0] || content;
  const rows = summary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'))
    .map(line => line.slice(1, -1).split('|').map(cell => cell.trim()))
    .filter(cells => cells.length >= 4)
    .filter(cells => {
      const first = parseBooleanLike(cells[0]);
      return first && first !== 'spec' && !/^[-:]+$/.test(cells.join(''));
    });

  const issues = [];
  const scoreRows = [];

  for (const cells of rows) {
    const spec = cells[0];
    const scoreText = cells[1];
    const score = Number.parseFloat(scoreText.replace(',', '.'));
    const blockedText = parseBooleanLike(cells[3]);

    if (Number.isNaN(score)) {
      issues.push(`${spec}: score ausente ou invalido`);
      continue;
    }

    scoreRows.push({ spec, score });

    if (score < 80) {
      issues.push(`${spec}: score ${score} abaixo do minimo 80`);
    }

    if (['sim', 'yes', 'true', 'bloqueada', 'bloqueado', 'blocked'].includes(blockedText)) {
      issues.push(`${spec}: marcada como bloqueada em spec-score.md`);
    }
  }

  if (scoreRows.length === 0) {
    issues.push('Nenhuma linha de feature com score foi encontrada em spec-score.md');
  }

  const pendingDecision = /^\s*-\s*\[[xX]\]\s+Existem pendencias que exigem revisao antes do scaffold\b/m
    .test(content);
  if (pendingDecision) {
    issues.push('Decisao do spec-score indica pendencias antes do scaffold');
  }

  return {
    blocked: issues.length > 0,
    issues,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function scaffoldTasks() {
  return [
    { id: 'validate-installation', label: 'Validar instalacao AppGen' },
    { id: 'validate-specs', label: 'Validar specs obrigatorias e score' },
    { id: 'generate-files', label: 'Gerar estrutura fisica do app' },
  ];
}

function writeState(statePath, state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

function initScaffoldState(state, tasks) {
  const previousById = new Map((state.scaffold?.tasks ?? []).map(task => [task.id, task]));
  return {
    ...state,
    scaffold: {
      status: 'running',
      started_at: state.scaffold?.started_at || nowIso(),
      completed_at: null,
      current_task: null,
      app_root: state.app_root || 'app',
      report: state.scaffold?.report || null,
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

function updateScaffoldTask({ statePath, state, taskId, status, message = null, extra = {} }) {
  const task = state.scaffold.tasks.find(item => item.id === taskId);
  if (task) {
    task.status = status;
    task.message = message;
    if (status === 'running' && !task.started_at) task.started_at = nowIso();
    if (['done', 'skipped', 'blocked', 'failed'].includes(status)) task.completed_at = nowIso();
  }

  state.scaffold.status = status === 'failed' ? 'failed' : status === 'blocked' ? 'blocked' : state.scaffold.status;
  state.scaffold.current_task = ['done', 'skipped', 'blocked', 'failed'].includes(status) ? null : taskId;
  Object.assign(state.scaffold, extra);
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

export default async function scaffold(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before scaffold.\n');
    return;
  }

  let state = readJsonSafe(statePath);
  const specsDir = state.output_folder || '_appgen_specs';
  const tasks = scaffoldTasks();

  state = initScaffoldState(state, tasks);
  writeState(statePath, state);

  console.log(chalk.bold('\n  AppGen: Scaffold\n'));

  printTask(chalk, 1, tasks.length, tasks[0].label);
  state = updateScaffoldTask({ statePath, state, taskId: 'validate-installation', status: 'done', message: 'AppGen instalado.' });

  printTask(chalk, 2, tasks.length, tasks[1].label);
  state = updateScaffoldTask({ statePath, state, taskId: 'validate-specs', status: 'running' });
  const missingSpecs = missingRequiredSpecs(projectRoot, specsDir);
  const scoreGate = readSpecScoreGate(projectRoot, specsDir);

  if (missingSpecs.length > 0 && !hasArg(args, '--allow-missing-specs')) {
    state = updateScaffoldTask({
      statePath,
      state,
      taskId: 'validate-specs',
      status: 'blocked',
      message: `Specs obrigatorias ausentes: ${missingSpecs.length}`,
    });
    console.log(chalk.yellow('\n  AppGen scaffold is blocked because required specs are missing.'));
    console.log('');
    console.log('  Missing:');
    for (const relPath of missingSpecs) {
      console.log(`    - ${relPath}`);
    }
    console.log('');
    console.log('  Run the AppGen flow first and generate product, architecture and feature specs before scaffold.');
    console.log('  For low-level template testing only, rerun with --allow-missing-specs.\n');
    return;
  }

  if (scoreGate.blocked && !hasArg(args, '--allow-low-score')) {
    state = updateScaffoldTask({
      statePath,
      state,
      taskId: 'validate-specs',
      status: 'blocked',
      message: `Score de specs bloqueou scaffold: ${scoreGate.issues.length} issue(s)`,
    });
    console.log(chalk.yellow('\n  AppGen scaffold is blocked because spec quality is not approved.'));
    console.log('');
    console.log('  Issues:');
    for (const issue of scoreGate.issues) {
      console.log(`    - ${issue}`);
    }
    console.log('');
    console.log('  Re-run appgen-specs to close the gaps before scaffold.');
    console.log('  For low-level template testing only, rerun with --allow-low-score.\n');
    return;
  }

  state = updateScaffoldTask({ statePath, state, taskId: 'validate-specs', status: 'done', message: 'Specs liberadas para scaffold.' });

  printTask(chalk, 3, tasks.length, tasks[2].label);
  state = updateScaffoldTask({ statePath, state, taskId: 'generate-files', status: 'running' });
  const result = copyPresetScaffold({
    projectRoot,
    presetName: state.stack?.preset || 'default-web-saas',
    projectName: state.project,
    appRoot: state.app_root || 'app',
    workDir: state.work_folder || '_appgen_work',
    overwrite: hasArg(args, '--force'),
    onProgress: event => {
      if (event.status === 'created') {
        console.log(`      + ${event.target}`);
      } else if (event.status === 'skipped') {
        console.log(chalk.gray(`      = ${event.target} (existing)`));
      }
    },
  });
  state = updateScaffoldTask({
    statePath,
    state,
    taskId: 'generate-files',
    status: 'done',
    message: `${result.created.length} arquivo(s) criado(s), ${result.skipped.length} preservado(s).`,
    extra: {
      report: result.report,
      app_root: result.appRoot,
      package_name: result.packageName,
    },
  });

  const failedOrBlocked = state.scaffold.tasks.some(task => ['blocked', 'failed'].includes(task.status));
  state.scaffold.status = failedOrBlocked ? 'needs_attention' : 'completed';
  state.scaffold.completed_at = nowIso();
  state.scaffold.current_task = null;
  writeState(statePath, state);

  console.log(`  Preset:          ${chalk.cyan(result.presetName)}`);
  console.log(`  App root:        ${chalk.cyan(result.appRoot)}`);
  console.log(`  Package:         ${chalk.cyan(result.packageName)}`);
  console.log(`  Created files:   ${chalk.hex('#ffa203')(String(result.created.length))}`);
  console.log(`  Skipped files:   ${chalk.gray(String(result.skipped.length))}`);
  console.log(`  Progress:        ${result.progress}`);
  console.log(`  Report:          ${result.report}\n`);
}
