import { existsSync, readFileSync, readdirSync } from 'fs';
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

export default async function scaffold(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before scaffold.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const specsDir = state.output_folder || '_appgen_specs';
  const missingSpecs = missingRequiredSpecs(projectRoot, specsDir);
  const scoreGate = readSpecScoreGate(projectRoot, specsDir);

  if (missingSpecs.length > 0 && !hasArg(args, '--allow-missing-specs')) {
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

  const result = copyPresetScaffold({
    projectRoot,
    presetName: state.stack?.preset || 'default-web-saas',
    projectName: state.project,
    appRoot: state.app_root || 'app',
    workDir: state.work_folder || '_appgen_work',
    overwrite: hasArg(args, '--force'),
  });

  console.log(chalk.bold('\n  AppGen: Scaffold\n'));
  console.log(`  Preset:          ${chalk.cyan(result.presetName)}`);
  console.log(`  App root:        ${chalk.cyan(result.appRoot)}`);
  console.log(`  Package:         ${chalk.cyan(result.packageName)}`);
  console.log(`  Created files:   ${chalk.hex('#ffa203')(String(result.created.length))}`);
  console.log(`  Skipped files:   ${chalk.gray(String(result.skipped.length))}`);
  console.log(`  Progress:        ${result.progress}`);
  console.log(`  Report:          ${result.report}\n`);
}
