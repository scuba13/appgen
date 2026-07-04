import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { checkExistingInstallation } from '../installer/validator.js';
import { loadManifest, saveManifest, buildManifest, fileStatus } from '../installer/manifest.js';
import { Writer } from '../installer/writer.js';
import { ENGINES } from '../installer/detector.js';
import { readJsonSafe } from '../utils/json-safe.js';

const PACKAGE_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));

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

async function loadOra() {
  try {
    const mod = await import('ora');
    return mod.default;
  } catch {
    return ({ text = '' } = {}) => ({
      text,
      start(nextText) {
        if (nextText) this.text = nextText;
        return this;
      },
      stop() {
        return this;
      },
      succeed(message) {
        if (message) console.log(message);
        return this;
      },
      fail(message) {
        if (message) console.error(message);
        return this;
      },
    });
  }
}

async function loadSemver() {
  try {
    const mod = await import('semver');
    return mod.default;
  } catch {
    const parse = version => {
      const match = String(version || '').match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
      return match ? match.slice(1, 4).map(Number) : null;
    };
    return {
      valid: version => parse(version) ? version : null,
      lt: (left, right) => {
        const a = parse(left);
        const b = parse(right);
        if (!a || !b) return false;
        for (let index = 0; index < 3; index += 1) {
          if (a[index] < b[index]) return true;
          if (a[index] > b[index]) return false;
        }
        return false;
      },
    };
  }
}

function hasArg(args, name) {
  return args.includes(name);
}

async function fetchLatestVersion(packageName) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

function getLocalPackageVersion() {
  try {
    return readJsonSafe(join(PACKAGE_ROOT, 'package.json')).version ?? null;
  } catch {
    return null;
  }
}

export default async function update(args) {
  const chalk = await loadChalk();
  const ora = await loadOra();
  const semver = await loadSemver();

  const projectRoot = resolve(process.cwd());
  const assumeYes = hasArg(args, '--yes') || hasArg(args, '-y');
  const offline = hasArg(args, '--offline');

  console.log(chalk.bold('\n  AppGen: Update\n'));

  const existing = checkExistingInstallation(projectRoot);
  if (!existing.installed) {
    console.log(chalk.yellow('  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' to install.\n');
    return;
  }

  const installedVersion = existing.version;

  // Validate installed version before comparing
  if (!semver.valid(installedVersion)) {
    console.log(chalk.yellow(`  Invalid installed version: "${installedVersion}". Run npx appgen install to fix it.\n`));
    return;
  }

  // Check version on npm
  let latestVersion = null;
  if (offline) {
    latestVersion = getLocalPackageVersion();
    console.log(chalk.gray('  Offline mode: using local AppGen package version.\n'));
  } else {
    const spinner = ora({ text: 'Checking for latest version...', color: 'cyan' }).start();
    latestVersion = await fetchLatestVersion('appgen');
    spinner.stop();
  }

  if (latestVersion && semver.valid(latestVersion)) {
    if (!semver.lt(installedVersion, latestVersion)) {
      console.log(chalk.hex('#ffa203')(`  You are already on the latest version (v${installedVersion}).\n`));
      return;
    }
    console.log(`  Installed version:  ${chalk.yellow('v' + installedVersion)}`);
    console.log(`  Available version:  ${chalk.hex('#ffa203')('v' + latestVersion)}\n`);
  } else {
    console.log(chalk.gray(`  Installed version: v${installedVersion}`));
    console.log(chalk.gray('  Could not check version on npm. Continuing offline.\n'));
  }

  // Carregar manifest e classificar arquivos
  const manifest = loadManifest(projectRoot);
  const state = existing.state;
  const installedAgents = state.agents ?? [];
  const installedEngineIds = state.engines ?? [];
  const installedEngines = ENGINES.filter(e => installedEngineIds.includes(e.id));

  const modified = [];
  const intact = [];
  const missing = [];

  for (const [relPath, hash] of Object.entries(manifest)) {
    const status = fileStatus(projectRoot, relPath, hash);
    if (status === 'modified') modified.push(relPath);
    else if (status === 'missing') missing.push(relPath);
    else intact.push(relPath);
  }

  if (modified.length > 0) {
    console.log(chalk.yellow(`  ${modified.length} file(s) modified by you, will be kept:`));
    modified.forEach(f => console.log(chalk.gray(`    ✎  ${f}`)));
    console.log('');
  }
  if (missing.length > 0) {
    console.log(chalk.cyan(`  ${missing.length} missing file(s), will be restored:`));
    missing.forEach(f => console.log(chalk.gray(`    +  ${f}`)));
    console.log('');
  }

  const toUpdate = intact.length + missing.length;
  console.log(`  ${toUpdate} file(s) will be updated.`);
  if (toUpdate === 0 && !latestVersion) {
    console.log(chalk.gray('  No files to update.\n'));
    return;
  }

  let confirm = assumeYes;
  if (!assumeYes) {
    const { default: inquirer } = await import('inquirer');
    const { applyOrangeTheme, ORANGE_PREFIX } = await import('../installer/orange-prompts.js');
    applyOrangeTheme();
    ({ confirm } = await inquirer.prompt([{
      prefix: ORANGE_PREFIX,
      type: 'confirm',
      name: 'confirm',
      message: '\nConfirm update?',
      default: true,
    }]));
  }
  if (!confirm) {
    console.log(chalk.gray('\n  Update cancelled.\n'));
    return;
  }

  const writer = new Writer(projectRoot);
  const updateSpinner = ora({ text: 'Updating agents...', color: 'cyan' }).start();

  try {
    // Reinstalar skills (intactos + ausentes; pular modificados)
    for (const agent of installedAgents) {
      for (const engine of installedEngines) {
        const relDir = join(engine.skillsDir, agent).replace(/\\/g, '/');
        const isModified = modified.some(f => f.replace(/\\/g, '/').startsWith(relDir));
        if (!isModified) {
          const { rmSync } = await import('fs');
          const dest = join(projectRoot, engine.skillsDir, agent);
          if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
          await writer.installSkill(agent, engine.skillsDir);
        }

        if (engine.universalSkillsDir && engine.universalSkillsDir !== engine.skillsDir) {
          const uRelDir = join(engine.universalSkillsDir, agent).replace(/\\/g, '/');
          const uIsModified = modified.some(f => f.replace(/\\/g, '/').startsWith(uRelDir));
          if (!uIsModified) {
            const { rmSync } = await import('fs');
            const uDest = join(projectRoot, engine.universalSkillsDir, agent);
            if (existsSync(uDest)) rmSync(uDest, { recursive: true, force: true });
            await writer.installSkill(agent, engine.universalSkillsDir);
          }
        }
      }
    }

    updateSpinner.text = 'Refreshing AppGen assets...';

    // Refrescar artifact templates e hooks.yml respeitando modificações do usuário
    const modifiedSet = new Set(modified.map(f => f.replace(/\\/g, '/')));
    writer.refreshAppGenAssets(modifiedSet);
    writer.installCliRunner({ force: true });

    updateSpinner.text = 'Updating entry files...';

    // Atualizar entry files intactos ou ausentes
    for (const engine of installedEngines) {
      const relEntry = engine.entryFile;
      const hash = manifest[relEntry];
      if (!hash) continue; // não foi instalado pelo AppGen — não tocar
      const status = fileStatus(projectRoot, relEntry, hash);
      if (status === 'intact' || status === 'missing') {
        await writer.installEntryFile(engine, { force: true });
      }
    }

    updateSpinner.text = 'Updating slash commands...';

    for (const engine of installedEngines) {
      for (const command of engine.commandTemplates ?? []) {
        const relCommand = command.target;
        const hash = manifest[relCommand];
        if (!hash) {
          await writer.installCommandFiles(engine);
          continue;
        }

        const status = fileStatus(projectRoot, relCommand, hash);
        if (status === 'intact' || status === 'missing') {
          await writer.installCommandFiles(engine, { force: true });
        }
      }
    }

    updateSpinner.text = 'Updating version...';

    if (latestVersion && semver.valid(latestVersion)) {
      writeFileSync(join(projectRoot, '.appgen', 'version'), latestVersion, 'utf8');
      const statePath = join(projectRoot, '.appgen', 'state.json');
      const s = readJsonSafe(statePath);
      s.version = latestVersion;
      writeFileSync(statePath, JSON.stringify(s, null, 2), 'utf8');
    }

    updateSpinner.text = 'Updating manifest...';

    writer.saveCreatedFiles();
    const newManifest = buildManifest(projectRoot, writer.manifestPaths);
    // Mesclar com manifest existente (preservar entradas de arquivos não tocados)
    const intactEntries = Object.fromEntries(
      intact.map(r => [r, manifest[r]])
    );
    saveManifest(projectRoot, { ...intactEntries, ...newManifest });

    updateSpinner.succeed(chalk.hex('#ffa203')('Update complete!'));
  } catch (err) {
    updateSpinner.fail(chalk.red('Error during update.'));
    throw err;
  }

  if (modified.length > 0) {
    console.log(chalk.yellow(`\n  ${modified.length} file(s) kept (modified by you).`));
  }
  console.log('');
}
