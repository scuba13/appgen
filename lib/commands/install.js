import { join, resolve } from 'path';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { detectEngines, ENGINES } from '../installer/detector.js';
import { checkExistingInstallation } from '../installer/validator.js';
import { CORE_AGENT_IDS, FINAL_APP_AGENT_IDS, IMPLEMENTATION_AGENT_IDS } from '../installer/agent-ids.js';
import { Writer } from '../installer/writer.js';
import { buildManifest, saveManifest, loadManifest } from '../installer/manifest.js';
import { readJsonSafe } from '../utils/json-safe.js';
import { clearTerminalForLogo, renderAppGenLogo } from '../utils/banner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

function getVersion() {
  try {
    const pkg = readJsonSafe(join(REPO_ROOT, 'package.json'));
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function getArgValue(args, name) {
  const equals = args.find(arg => arg.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);

  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1] || null;

  return null;
}

function hasArg(args, name) {
  return args.includes(name);
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function getArgList(args, singularName, pluralName) {
  const values = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith(`${singularName}=`)) {
      values.push(...splitList(arg.slice(singularName.length + 1)));
    } else if (arg === singularName && args[index + 1]) {
      values.push(...splitList(args[index + 1]));
      index += 1;
    } else if (pluralName && arg.startsWith(`${pluralName}=`)) {
      values.push(...splitList(arg.slice(pluralName.length + 1)));
    } else if (pluralName && arg === pluralName && args[index + 1]) {
      values.push(...splitList(args[index + 1]));
      index += 1;
    }
  }

  return [...new Set(values)];
}

function validateEngines(engineIds) {
  const validIds = new Set(ENGINES.map(engine => engine.id));
  const invalid = engineIds.filter(id => !validIds.has(id));
  if (invalid.length > 0) {
    throw new Error(`Unknown engine(s): ${invalid.join(', ')}. Valid engines: ${ENGINES.map(engine => engine.id).join(', ')}`);
  }
}

function answersFromArgs(args, detectedEngines, companyProfile) {
  const requestedEngines = getArgList(args, '--engine', '--engines');
  const detected = detectedEngines.filter(engine => engine.detected).map(engine => engine.id);
  const engines = requestedEngines.length > 0
    ? requestedEngines
    : detected.length > 0
      ? detected
      : ['codex'];

  validateEngines(engines);

  return {
    engines,
    project_name: getArgValue(args, '--project-name') || process.cwd().split(/[\\/]/).pop(),
    user_name: getArgValue(args, '--user-name') || 'User',
    chat_language: getArgValue(args, '--chat-language') || 'pt-br',
    doc_language: getArgValue(args, '--doc-language') || 'Português',
    output_folder: getArgValue(args, '--output-folder') || '_appgen_specs',
    git_strategy: getArgValue(args, '--git-strategy') || 'commit',
    answer_mode: getArgValue(args, '--answer-mode') || 'chat',
    ...companyProfile,
    workflow_mode: 'final-app',
    agents: FINAL_APP_AGENT_IDS,
    teams: ['final-app'],
  };
}

function readTomlString(content, section, key, fallback) {
  const sectionMatch = content.match(new RegExp(`\\[${section}\\]([\\s\\S]*?)(?:\\n\\[|$)`));
  const body = sectionMatch?.[1] ?? content;
  const keyMatch = body.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm'));
  return keyMatch?.[1] || fallback;
}

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

function resolveCompanyProfile(projectRoot, args) {
  const selected = getArgValue(args, '--company') || 'default';
  if (selected === 'default') {
    return {
      company_profile: 'default',
      company_profile_version: '1.0.0',
      company_profile_source: 'preset',
      company_profile_source_path: null,
    };
  }

  const candidate = resolve(projectRoot, selected);
  const profileDir = existsSync(candidate) && statSync(candidate).isFile()
    ? dirname(candidate)
    : candidate;
  const profilePath = join(profileDir, 'profile.toml');

  if (!existsSync(profilePath)) {
    throw new Error(`Company profile not found. Expected ${profilePath}`);
  }

  const profileToml = readFileSync(profilePath, 'utf8');
  return {
    company_profile: readTomlString(profileToml, 'company', 'id', selected),
    company_profile_version: readTomlString(profileToml, 'company', 'version', 'unknown'),
    company_profile_source: 'local',
    company_profile_source_path: profileDir,
  };
}

export default async function install(args) {
  const chalk = await loadChalk();
  const ora = await loadOra();

  const projectRoot = resolve(process.cwd());
  const version = getVersion();
  const companyProfile = resolveCompanyProfile(projectRoot, args);
  const assumeYes = hasArg(args, '--yes') || hasArg(args, '-y');

  clearTerminalForLogo();
  console.log(renderAppGenLogo(chalk));
  console.log('');
  console.log(chalk.gray('AI-Powered Corporate App Generation Framework'));
  console.log('');
  console.log(chalk.bold('Installation'));
  console.log('');

  // Check existing installation
  const existing = checkExistingInstallation(projectRoot);
  if (existing.installed) {
    console.log(chalk.yellow(`  AppGen is already installed (v${existing.version}) in this project.\n`));
    let proceed = assumeYes;
    if (!assumeYes) {
      const { default: inquirer } = await import('inquirer');
      ({ proceed } = await inquirer.prompt([{
        prefix: '',
        type: 'confirm',
        name: 'proceed',
        message: '\nDo you want to reinstall / update the configuration?',
        default: false,
      }]));
    }
    if (!proceed) {
      console.log(chalk.gray('\n  Installation cancelled.\n'));
      return;
    }
  }

  // Detect engines
  const detectedEngines = detectEngines(projectRoot);
  const detected = detectedEngines.filter(e => e.detected).map(e => e.name).join(', ');
  if (detected) {
    console.log(chalk.gray(`Detected: ${detected}`));
    console.log('');
  }

  // Collect answers
  let answers;
  try {
    answers = assumeYes
      ? answersFromArgs(args, detectedEngines, companyProfile)
      : await (async () => {
          const { runInstallPrompts } = await import('../installer/prompts.js');
          return runInstallPrompts(detectedEngines);
        })();
    if (!assumeYes) {
      answers = {
        ...answers,
        ...companyProfile,
        workflow_mode: 'final-app',
        agents: FINAL_APP_AGENT_IDS,
      };
    }
  } catch (err) {
    if (err.isTtyError || err.message?.includes('cancel')) {
      console.log(chalk.gray('\n  Installation cancelled.\n'));
      return;
    }
    throw err;
  }

  const selectedEngines = ENGINES.filter(e => answers.engines.includes(e.id));
  const writer = new Writer(projectRoot);

  const spinner = ora({ text: 'Installing agents...', color: 'cyan' }).start();

  try {
    // Install skills for each agent x engine
    for (const agent of answers.agents) {
      for (const engine of selectedEngines) {
        await writer.installSkill(agent, engine.skillsDir);
        if (engine.universalSkillsDir && engine.universalSkillsDir !== engine.skillsDir) {
          await writer.installSkill(agent, engine.universalSkillsDir);
        }
      }
    }

    // Stop spinner before possible interactive conflict prompts
    spinner.stop();

    // Instalar entry file de cada engine (deduplica arquivos compartilhados)
    const seenEntryFiles = new Set();
    for (const engine of selectedEngines) {
      if (!engine.entryFile) continue;
      if (seenEntryFiles.has(engine.entryFile)) continue;
      seenEntryFiles.add(engine.entryFile);
      await writer.installEntryFile(engine, { conflictStrategy: assumeYes ? 'skip' : null });
    }

    for (const engine of selectedEngines) {
      await writer.installCommandFiles(engine);
    }

    spinner.start('Creating .appgen/ structure...');

    // Criar estrutura .appgen/
    writer.createAppGenDir(answers, version);

    // Se reinstall: atualizar engines/agents/config no state.json existente
    if (existing.installed) {
      const statePath = join(projectRoot, '.appgen', 'state.json');
      if (existsSync(statePath)) {
        const s = readJsonSafe(statePath);
        s.engines = answers.engines;
        s.agents = answers.agents;
        s.answer_mode = answers.answer_mode;
        s.output_folder = answers.output_folder;
        s.workflow_mode = answers.workflow_mode || s.workflow_mode || 'final-app';
        s.company_profile = answers.company_profile || s.company_profile || 'default';
        s.company_profile_version = answers.company_profile_version || s.company_profile_version || '1.0.0';
        s.company_profile_source = answers.company_profile_source || s.company_profile_source || 'preset';
        s.company_profile_path = s.company_profile_path || '.appgen/company/profile.toml';
        writeFileSync(statePath, JSON.stringify(s, null, 2), 'utf8');
      }
    }

    // .gitignore
    if (answers.git_strategy === 'gitignore') {
      writer.updateGitignore(answers.output_folder);
    }

    writer.saveCreatedFiles();

    spinner.text = 'Generating manifest...';

    // Manifest com caminhos relativos, apenas arquivos (não diretórios)
    const existingManifest = existing.installed ? loadManifest(projectRoot) : {};
    const newManifest = buildManifest(projectRoot, writer.manifestPaths);
    saveManifest(projectRoot, { ...existingManifest, ...newManifest });

    spinner.succeed(chalk.hex('#ffa203')('Installation complete!'));
  } catch (err) {
    spinner.fail(chalk.red('Error during installation.'));
    throw err;
  }

  // Resumo
  const engineNames = selectedEngines.map(e => e.name).join(', ');
  const coreInstalled = answers.agents.filter(a => CORE_AGENT_IDS.includes(a));
  const implementationInstalled = answers.agents.filter(a => IMPLEMENTATION_AGENT_IDS.includes(a));

  console.log('');
  console.log(chalk.bold('  Summary:'));
  console.log(`  ${chalk.cyan('Project:')}   ${answers.project_name}`);
  console.log(`  ${chalk.cyan('Company:')}   ${answers.company_profile}`);
  console.log(`  ${chalk.cyan('Workflow:')}  ${answers.workflow_mode}`);
  console.log(`  ${chalk.cyan('Engines:')}   ${engineNames}`);
  console.log(`  ${chalk.cyan('Version:')}   ${version}`);
  console.log('');
  console.log(chalk.bold('  Agents installed:'));
  console.log(`  ${chalk.cyan('Specification Flow:')}  ${coreInstalled.length} agent(s)`);
  for (const agent of coreInstalled) {
    console.log(`    - ${agent}`);
  }
  console.log(`  ${chalk.cyan('Implementation Flow:')}  ${implementationInstalled.length} agent(s)`);
  for (const agent of implementationInstalled) {
    console.log(`    - ${agent}`);
  }
  console.log('');

  if (selectedEngines.length > 0) {
    const names = selectedEngines.map(e => e.name);
    const namesStr = names.length > 1
      ? names.slice(0, -1).join(', ') + ' or ' + names.slice(-1)[0]
      : names[0];
    console.log(chalk.cyan(`  → Open ${namesStr} and type: appgen in the chat to start app generation`));
  }
  console.log('');
}
