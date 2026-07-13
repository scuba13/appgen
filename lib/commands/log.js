import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { appendProgressEvent } from '../runtime/implementation-loop.js';

async function loadChalk() {
  try {
    const mod = await import('chalk');
    return mod.default;
  } catch {
    const passthrough = text => text;
    return {
      bold: passthrough,
      cyan: passthrough,
      yellow: passthrough,
    };
  }
}

function getArg(args, prefix) {
  const found = args.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function getArgs(args, prefix) {
  return args
    .filter(arg => arg.startsWith(prefix))
    .map(arg => arg.slice(prefix.length))
    .filter(Boolean);
}

function collectMessage(args) {
  const fromArg = getArg(args, '--message=');
  if (fromArg) return fromArg;

  const separatorIndex = args.indexOf('--');
  if (separatorIndex >= 0) return args.slice(separatorIndex + 1).join(' ');

  return args.filter(arg => !arg.startsWith('--')).join(' ');
}

export default async function log(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen-ai install') + ' before logging activity.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const message = collectMessage(args);
  const summary = getArg(args, '--summary=');
  const event = getArg(args, '--event=') || 'agent-message';
  const agent = getArg(args, '--agent=') || 'appgen';
  const nextStep = getArg(args, '--next-step=');
  const report = getArg(args, '--report=');
  const slice = getArg(args, '--slice=');
  const status = getArg(args, '--status=');
  const files = getArgs(args, '--file=');
  const commands = getArgs(args, '--command=');
  const decisions = getArgs(args, '--decision=');

  if (!message && !summary) {
    console.log(chalk.yellow('\n  Nothing to log. Use --message=\"...\" or --summary=\"...\".\n'));
    return;
  }

  appendProgressEvent(projectRoot, state, {
    agent,
    event,
    user_message: message || null,
    summary: summary || null,
    status: status || null,
    slice: slice || null,
    files: files.length ? files : null,
    commands: commands.length ? commands : null,
    decisions: decisions.length ? decisions : null,
    next_step: nextStep || null,
    report: report || null,
  });

  const path = join(state.work_folder || '_appgen_work', 'activity-log.md');
  console.log(`\n  Logged activity: ${chalk.cyan(path)}\n`);
}
