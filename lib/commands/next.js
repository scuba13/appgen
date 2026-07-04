import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { completeStep, getNextStep, readFlowState } from '../runtime/flow.js';
import { describeStep, environmentBlocker, resumeMessage, writeBuildSummary } from '../runtime/business-experience.js';

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

function getAllArgs(args, prefix) {
  return args
    .filter(arg => arg.startsWith(prefix))
    .map(arg => arg.slice(prefix.length))
    .filter(Boolean);
}

export default async function next(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before checking the flow.\n');
    return;
  }

  const completed = getArg(args, '--complete=');
  let state = readFlowState(projectRoot);

  if (completed) {
    const files = getAllArgs(args, '--file=');
    let result;
    try {
      result = completeStep(projectRoot, completed, files);
    } catch (error) {
      console.log(chalk.red(`\n  ${error.message}`));
      console.log('  Run ' + chalk.bold('appgen next') + ' to see the current expected step.\n');
      process.exitCode = 1;
      return;
    }

    state = result.state;
    const label = result.alreadyCompleted ? 'Already completed' : 'Completed';
    console.log(chalk.hex('#ffa203')(`\n  ${label}: ${result.completed.agent}`));
  }

  const nextStep = getNextStep(state);
  console.log(chalk.bold('\n  AppGen: Next Step\n'));

  const blocker = environmentBlocker(state);
  if (blocker) {
    const resume = resumeMessage(state, nextStep);
    console.log(`  Retomada:    ultima etapa: ${chalk.cyan(resume.last)}`);
    console.log(`  Agora:       ${chalk.yellow(blocker.title)}`);
    console.log(`  Para fazer:  ${blocker.action}`);
    console.log(`  Command:     ${chalk.bold(blocker.command)}`);
    console.log('');
    console.log(`  Report:      ${chalk.cyan(state.environment?.report || '_appgen_work/environment-report.md')}\n`);
    return;
  }

  if (!nextStep) {
    console.log(chalk.hex('#ffa203')('  AppGen flow is complete.\n'));
    return;
  }

  const resume = resumeMessage(state, nextStep);
  const nextCopy = describeStep(nextStep.id);

  console.log(`  Retomada:    ultima etapa: ${chalk.cyan(resume.last)}`);
  console.log(`  Agora:       ${chalk.cyan(nextCopy.title)}`);
  console.log(`  Para fazer:  ${nextCopy.action}`);
  console.log('');

  if (nextStep.id === 'scaffold') {
    const summary = writeBuildSummary(projectRoot, state);
    console.log(chalk.bold('  Resumo antes de construir'));
    console.log(`  Objetivo:    ${summary.purpose}`);
    console.log(`  Arquivo:     ${chalk.cyan(summary.path)}`);
    console.log('  Se esse resumo estiver correto, pode seguir para criar a base da app.');
    console.log('  Se algo estiver errado, volte para product/specs antes de construir.');
    console.log('');
  }

  console.log(`  Phase:       ${chalk.cyan(nextStep.id)}`);
  console.log(`  Agent:       ${chalk.cyan(nextStep.agent)}`);
  console.log(`  Expected:    ${nextStep.files.join(', ')}`);
  console.log(`  Resume with: ${chalk.bold(nextStep.agent)}\n`);
}
