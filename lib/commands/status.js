import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { getNextStep } from '../runtime/flow.js';
import { environmentBlocker, resumeMessage } from '../runtime/business-experience.js';

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

function readConfig(projectRoot) {
  const configPath = join(projectRoot, '.appgen', 'config.toml');
  if (!existsSync(configPath)) return {};

  const content = readFileSync(configPath, 'utf8');
  const value = (key, fallback) => {
    const match = content.match(new RegExp(`^${key}\\s*=\\s*\"([^\"]*)\"`, 'm'));
    return match?.[1] || fallback;
  };

  return {
    preset: value('source', value('preset', undefined)),
    companyProfile: value('profile', undefined),
    companyProfilePath: value('profile_path', undefined),
    appRoot: value('app_root', undefined),
    specs: value('specs', undefined),
    work: value('work', undefined),
  };
}

function formatList(chalk, items, marker) {
  if (!items?.length) return chalk.gray('(none)');
  return items.map(item => `${marker} ${item}`).join(', ');
}

export default async function status(args) {
  const chalk = await loadChalk();
  const projectRoot = process.cwd();
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen-ai install') + ' to install.\n');
    return;
  }

  let state;
  try {
    state = readJsonSafe(statePath);
  } catch {
    console.log(chalk.yellow('\n  AppGen state.json exists, but could not be read.'));
    console.log('  Check .appgen/state.json before continuing.\n');
    return;
  }

  const config = readConfig(projectRoot);
  const specsDir = config.specs || state.output_folder || '_appgen_specs';
  const workDir = config.work || state.work_folder || '_appgen_work';
  const appRoot = config.appRoot || state.app_root || 'app';
  const preset = config.preset || state.stack?.preset || 'default-web-saas';
  const companyProfile = config.companyProfile || state.company_profile || 'default';
  const companyProfilePath = config.companyProfilePath || state.company_profile_path || '.appgen/company/profile.toml';

  const artifacts = [
    ['brief', join(specsDir, 'brief.md')],
    ['standards', join(specsDir, 'standards-map.md')],
    ['product', join(specsDir, 'product.md')],
    ['architecture', join(specsDir, 'target-architecture.md')],
    ['domain model', join(specsDir, 'domain-model.md')],
    ['data model', join(specsDir, 'data-model.md')],
    ['api contracts', join(specsDir, 'api-contracts.md')],
    ['ui spec', join(specsDir, 'ui-spec.md')],
    ['feature specs', join(specsDir, 'features')],
    ['spec score', join(specsDir, 'quality', 'spec-score.md')],
    ['company profile', companyProfilePath],
    ['build summary', join(workDir, 'build-summary.md')],
    ['scaffold report', join(workDir, 'scaffold-report.md')],
    ['preview report', join(workDir, 'preview-report.md')],
    ['test guide', join(workDir, 'acceptance-test-guide.md')],
    ['user acceptance', join(workDir, 'user-acceptance.md')],
    ['acceptance history', join(workDir, 'acceptance-history.jsonl')],
    ['app docs', join(appRoot, 'docs', 'README.md')],
    ['project html', join(appRoot, 'docs', 'project.html')],
    ['app root', appRoot],
  ];

  console.log(chalk.bold('\n  AppGen: Status\n'));
  console.log(`  Project:         ${chalk.cyan(state.project || '(not set)')}`);
  console.log(`  User:            ${chalk.cyan(state.user_name || '(not set)')}`);
  console.log(`  Version:         ${chalk.cyan(state.version || '?')}`);
  console.log(`  Current phase:   ${chalk.cyan(state.phase || 'not started')}`);
  console.log(`  Preset:          ${chalk.cyan(preset)}`);
  console.log(`  Company profile: ${chalk.cyan(companyProfile)}`);
  console.log(`  App root:        ${chalk.cyan(appRoot)}`);
  console.log(`  Specs folder:    ${chalk.cyan(specsDir)}`);
  console.log(`  Work folder:     ${chalk.cyan(workDir)}`);
  console.log(`  Chat language:   ${chalk.cyan(state.chat_language || 'pt-br')}`);
  console.log(`  Docs language:   ${chalk.cyan(state.doc_language || 'pt-br')}`);

  const nextStep = getNextStep(state);
  const resume = resumeMessage(state, nextStep);
  console.log(chalk.bold('\n  Retomada:'));
  console.log(`  Ultima etapa:    ${chalk.cyan(resume.last)}`);
  console.log(`  Proximo passo:   ${chalk.cyan(resume.nextTitle)}`);
  console.log(`  O que fazer:     ${resume.nextAction}`);

  const blocker = environmentBlocker(state);
  if (blocker) {
    console.log(chalk.bold('\n  Atencao:'));
    console.log(`  Status:          ${chalk.yellow(blocker.title)}`);
    console.log(`  Acao:            ${blocker.action}`);
    console.log(`  Comando:         ${chalk.bold(blocker.command)}`);
    console.log(`  Relatorio:       ${chalk.cyan(state.environment?.report || '_appgen_work/environment-report.md')}`);
  }

  console.log(chalk.bold('\n  Agents:'));
  console.log(`  Installed:       ${formatList(chalk, state.agents, '-')}`);

  console.log(chalk.bold('\n  Flow:'));
  console.log(`  Completed:       ${formatList(chalk, state.completed, chalk.hex('#ffa203')('✓'))}`);
  console.log(`  Pending:         ${formatList(chalk, state.pending, chalk.gray('○'))}`);

  const loop = state.implementation_loop;
  if (loop) {
    console.log(chalk.bold('\n  Implementation Loop:'));
    console.log(`  Status:          ${chalk.cyan(loop.status || 'not_started')}`);
    console.log(`  Current slice:   ${chalk.cyan(loop.current_slice || '(none)')}`);
    console.log(`  Work rounds:     ${chalk.cyan(String(loop.iteration ?? 0))}/${chalk.cyan(String(loop.max_app_loops ?? 5))}`);
    console.log(`  Slice runs:      ${chalk.cyan(String(loop.slice_iteration ?? loop.iteration ?? 0))}`);
    console.log(`  Slice attempts:  ${chalk.cyan(String(loop.max_slice_attempts ?? 3))}`);
  }

  console.log(chalk.bold('\n  Checkpoints:'));
  const checkpoints = Object.entries(state.checkpoints ?? {});
  if (checkpoints.length === 0) {
    console.log(`  ${chalk.gray('(none)')}`);
  } else {
    for (const [name, checkpoint] of checkpoints) {
      const status = checkpoint?.status || checkpoint?.phase || 'recorded';
      const files = checkpoint?.files?.length ? ` (${checkpoint.files.join(', ')})` : '';
      console.log(`  ${chalk.cyan(name)}: ${status}${files}`);
    }
  }

  console.log(chalk.bold('\n  Artifacts:'));
  for (const [label, relPath] of artifacts) {
    const found = existsSync(join(projectRoot, relPath));
    const mark = found ? chalk.hex('#ffa203')('✓') : chalk.gray('○');
    console.log(`  ${mark} ${label.padEnd(16)} ${relPath}`);
  }

  console.log();
}
