import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { appendActivityLog } from '../runtime/activity-log.js';

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
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before logging activity.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const message = collectMessage(args);
  const summary = getArg(args, '--summary=');
  const event = getArg(args, '--event=') || 'agent-message';
  const agent = getArg(args, '--agent=') || 'appgen';
  const nextStep = getArg(args, '--next-step=');
  const report = getArg(args, '--report=');

  if (!message && !summary) {
    console.log(chalk.yellow('\n  Nothing to log. Use --message=\"...\" or --summary=\"...\".\n'));
    return;
  }

  const path = appendActivityLog(projectRoot, state, {
    agent,
    event,
    user_message: message || null,
    summary: summary || null,
    next_step: nextStep || null,
    report: report || null,
  });

  console.log(`\n  Logged activity: ${chalk.cyan(path)}\n`);
}
