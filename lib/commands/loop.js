import { existsSync } from 'fs';
import { join, resolve } from 'path';
import {
  initImplementationLoop,
  readAppGenState,
  readLoopState,
  updateImplementationLoop,
} from '../runtime/implementation-loop.js';

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

function printLoop(chalk, loop, path) {
  console.log(chalk.bold('\n  AppGen: Implementation Loop\n'));
  console.log(`  Status:        ${chalk.cyan(loop.status || 'not_started')}`);
  console.log(`  Current slice: ${chalk.cyan(loop.current_slice || '(none)')}`);
  console.log(`  Iteration:     ${chalk.cyan(String(loop.iteration ?? 0))}/${chalk.cyan(String(loop.max_app_loops ?? 5))}`);
  console.log(`  Open slices:   ${(loop.open_slices ?? []).join(', ') || chalk.gray('(none)')}`);
  console.log(`  Done slices:   ${(loop.done_slices ?? []).join(', ') || chalk.gray('(none)')}`);
  console.log(`  Blocked:       ${(loop.blocked_slices ?? []).join(', ') || chalk.gray('(none)')}`);
  console.log(`  Last agent:    ${chalk.cyan(loop.last_agent || '(none)')}`);
  console.log(`  Last report:   ${chalk.cyan(loop.last_report || '(none)')}`);
  if (loop.awaiting_user_decision) {
    console.log(`  Pause:         ${chalk.yellow('aguardando confirmacao do usuario')}`);
    console.log(`  Suggested:     ${chalk.cyan(loop.next_recommended_action || 'Aguarde o usuario pedir para seguir.')}`);
  }
  if (loop.preview_environment?.status === 'not_started') {
    console.log(`  Preview:       ${chalk.yellow('not_started')}`);
    console.log(`  Suggested:     ${chalk.cyan('node .appgen/bin/appgen.js preview-validation')}`);
  }
  console.log(`  State file:    ${chalk.cyan(path)}\n`);
}

export default async function loop(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before using the loop.\n');
    return;
  }

  try {
    if (hasArg(args, '--init')) {
      const result = initImplementationLoop(projectRoot);
      printLoop(chalk, result.loop, result.path);
      return;
    }

    const startSlice = getArg(args, '--start-slice=');
    const completeSlice = getArg(args, '--complete-slice=');
    const blockSlice = getArg(args, '--block-slice=');
    const event = getArg(args, '--event=');

    if (startSlice || completeSlice || blockSlice || event) {
      const result = updateImplementationLoop(projectRoot, {
        startSlice,
        completeSlice,
        blockSlice,
        event: event || (startSlice ? 'slice-started' : completeSlice ? 'slice-completed' : 'slice-blocked'),
        slice: getArg(args, '--slice=') || startSlice || completeSlice || blockSlice,
        agent: getArg(args, '--agent=') || undefined,
        report: getArg(args, '--report=') || undefined,
      });
      const workDir = result.state.work_folder || '_appgen_work';
      printLoop(chalk, result.loop, join(workDir, 'loop-state.json'));
      return;
    }

    const state = readAppGenState(projectRoot);
    const loopState = readLoopState(projectRoot, state);
    printLoop(chalk, loopState, join(state.work_folder || '_appgen_work', 'loop-state.json'));
  } catch (error) {
    console.log(chalk.red(`\n  ${error.message}\n`));
    process.exitCode = 1;
  }
}
