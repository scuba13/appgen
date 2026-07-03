import {
  existsSync, mkdirSync, writeFileSync,
  readFileSync, cpSync, appendFileSync,
  readdirSync, statSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { readJsonSafe } from '../utils/json-safe.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const TEMPLATES_DIR = join(REPO_ROOT, 'templates');
const PRESETS_DIR = join(REPO_ROOT, 'presets');
const DEFAULT_PRESET = 'default-web-saas';

export class Writer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.createdFiles = [];   // dirs + files — used by uninstall via state.json
    this.manifestPaths = [];  // files only — used to build SHA-256 manifest
  }

  // Normalises an absolute path to project-relative
  _rel(absPath) {
    return absPath
      .replace(this.projectRoot + '\\', '')
      .replace(this.projectRoot + '/', '');
  }

  // Registers a path for uninstall tracking (dirs or files)
  _register(absPath) {
    const rel = this._rel(absPath);
    if (!this.createdFiles.includes(rel)) this.createdFiles.push(rel);
    // If it is a regular file, also track for manifest
    try {
      if (!statSync(absPath).isDirectory()) {
        if (!this.manifestPaths.includes(rel)) this.manifestPaths.push(rel);
      }
    } catch { /* ignore */ }
  }

  // Recursively registers individual files inside a directory for manifest
  _registerFilesInDir(dirPath) {
    try {
      const entries = readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(dirPath, entry.name);
        if (entry.isDirectory()) {
          this._registerFilesInDir(full);
        } else {
          const rel = this._rel(full);
          if (!this.manifestPaths.includes(rel)) this.manifestPaths.push(rel);
        }
      }
    } catch { /* ignore */ }
  }

  // Cria diretório de forma segura
  _mkdir(dir) {
    mkdirSync(dir, { recursive: true });
  }

  _copyNewFilesFromDir(srcDir, destDir) {
    if (!existsSync(srcDir)) return;

    this._mkdir(destDir);
    for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
      const srcPath = join(srcDir, entry.name);
      const destPath = join(destDir, entry.name);

      if (entry.isDirectory()) {
        this._copyNewFilesFromDir(srcPath, destPath);
        continue;
      }

      if (!entry.isFile() || existsSync(destPath)) continue;
      this._mkdir(dirname(destPath));
      writeFileSync(destPath, readFileSync(srcPath, 'utf8'), 'utf8');
      this._register(destPath);
    }
  }

  // Escreve arquivo apenas se não existir
  _writeNew(filePath, content) {
    if (existsSync(filePath)) return false;
    this._mkdir(dirname(filePath));
    writeFileSync(filePath, content, 'utf8');
    this._register(filePath);
    return true;
  }

  // Instala os skills de um agente para uma engine
  async installSkill(agentId, skillsDir) {
    const src = join(AGENTS_DIR, agentId);
    const dest = join(this.projectRoot, skillsDir, agentId);

    if (!existsSync(src)) {
      console.warn(`  Agente não encontrado: ${agentId}`);
      return;
    }

    if (existsSync(dest)) return; // já instalado

    this._mkdir(dirname(dest));
    cpSync(src, dest, { recursive: true });
    this._register(dest);              // directory → uninstall tracking
    this._registerFilesInDir(dest);    // individual files → manifest tracking
  }

  // Instala o arquivo de entrada de uma engine (CLAUDE.md, AGENTS.md, etc.)
  // force=true: sobrescreve silenciosamente (usado pelo update em arquivos intactos)
  async installEntryFile(engine, { force = false } = {}) {
    if (!engine.entryFile || !engine.entryTemplate) return;

    const templatePath = join(TEMPLATES_DIR, 'engines', engine.entryTemplate);
    const destPath = join(this.projectRoot, engine.entryFile);

    if (!existsSync(templatePath)) return;

    const content = readFileSync(templatePath, 'utf8');

    if (!existsSync(destPath)) {
      this._mkdir(dirname(destPath));
      writeFileSync(destPath, content, 'utf8');
      this._register(destPath);
      return;
    }

    if (force) {
      this._mkdir(dirname(destPath));
      writeFileSync(destPath, content, 'utf8');
      this._register(destPath);
      return;
    }

    // Arquivo já existe — perguntar ao usuário (apenas merge ou skip)
    const { askMergeStrategy } = await import('./prompts.js');
    const strategy = await askMergeStrategy(engine.entryFile);

    if (strategy === 'merge') {
      appendFileSync(destPath, '\n\n---\n\n' + content, 'utf8');
      // Não registra em createdFiles — arquivo pré-existente
    }
    // 'skip' → não faz nada
  }

  // Cria a estrutura interna .appgen/
  createAppGenDir(answers, version) {
    const appgenDir = join(this.projectRoot, '.appgen');
    const configDir = join(appgenDir, '_config');
    const specsDir = join(this.projectRoot, answers.output_folder || '_appgen_specs');
    const workDir = join(this.projectRoot, '_appgen_work');

    this._mkdir(appgenDir);
    this._mkdir(configDir);
    this._mkdir(join(appgenDir, 'context'));
    this._mkdir(specsDir);
    this._mkdir(workDir);
    this._register(specsDir);
    this._register(workDir);

    // Estrutura base do AppGen (preset, artefatos, hooks, setup)
    this._installPresetAssets(appgenDir, DEFAULT_PRESET, answers.company_profile_source_path);
    this._installAppGenAssets(appgenDir, answers, version);

    // state.json
    const stateTemplate = readFileSync(join(TEMPLATES_DIR, 'state.json'), 'utf8');
    const state = JSON.parse(stateTemplate.replace('{{VERSION}}', version));
    state.project = answers.project_name;
    state.user_name = answers.user_name;
    state.chat_language = answers.chat_language;
    state.doc_language = answers.doc_language;
    state.answer_mode = answers.answer_mode;
    state.output_folder = answers.output_folder;
    state.work_folder = '_appgen_work';
    state.workflow_mode = answers.workflow_mode || 'final-app';
    state.company_profile = answers.company_profile || 'default';
    state.company_profile_version = answers.company_profile_version || '1.0.0';
    state.company_profile_source = answers.company_profile_source || 'preset';
    state.company_profile_path = '.appgen/company/profile.toml';
    state.stack = {
      ...(state.stack ?? {}),
      preset: DEFAULT_PRESET,
    };
    state.engines = answers.engines;
    state.agents = answers.agents;

    const statePath = join(appgenDir, 'state.json');
    this._writeNew(statePath, JSON.stringify(state, null, 2));

    // config.toml — rendered with actual selections
    const configTemplate = readFileSync(join(TEMPLATES_DIR, 'config.toml'), 'utf8');
    const agentsList = answers.agents.map(a => `  "${a}"`).join(',\n');
    const enginesList = answers.engines.map(e => `  "${e}"`).join(',\n');
    const config = configTemplate
      .replace('name = ""', `name = "${answers.project_name}"`)
      .replace('name = ""', `name = "${answers.user_name}"`)
      .replace('chat_language = "pt-br"', `chat_language = "${answers.chat_language}"`)
      .replace('doc_language = "pt-br"', `doc_language = "${answers.doc_language}"`)
      .replace('profile = "default"', `profile = "${answers.company_profile || 'default'}"`)
      .replace('standards_version = "1.0.0"', `standards_version = "${answers.company_profile_version || '1.0.0'}"`)
      .replace('profile_source = "preset"', `profile_source = "${answers.company_profile_source || 'preset'}"`)
      .replace('specs = "_appgen_specs"', `specs = "${answers.output_folder}"`)
      .replace('work = "_appgen_work"', 'work = "_appgen_work"')
      .replace('source = "default-web-saas"', `source = "${DEFAULT_PRESET}"`)
      .replace(
        /\[agents\]\r?\ninstalled = \[[\s\S]*?\]/,
        `[agents]\ninstalled = [\n${agentsList}\n]`
      )
      .replace('installed = []', `installed = [\n${enginesList}\n]`)
      .replace('answer_mode = "chat"', `answer_mode = "${answers.answer_mode}"`)
      .replace('mode = "final-app"', `mode = "${answers.workflow_mode || 'final-app'}"`);

    this._writeNew(join(appgenDir, 'config.toml'), config);
    this._writeNew(join(appgenDir, 'config.user.toml'),
      readFileSync(join(TEMPLATES_DIR, 'config.user.toml'), 'utf8'));

    // plan.md
    const planTemplate = readFileSync(join(TEMPLATES_DIR, 'plan.md'), 'utf8');
    const plan = planTemplate
      .replace('{{PROJECT}}', answers.project_name)
      .replace('{{DATE}}', new Date().toISOString().split('T')[0]);

    this._writeNew(join(appgenDir, 'plan.md'), plan);

    // version
    this._writeNew(join(appgenDir, 'version'), version);

    // manifest.yaml
    this._writeNew(join(configDir, 'manifest.yaml'),
      `installation:\n  version: ${version}\n  installDate: ${new Date().toISOString()}\n  lastUpdated: ${new Date().toISOString()}\n\nengines:\n${answers.engines.map(e => `  - ${e}`).join('\n')}\n\nagents:\n${answers.agents.map(a => `  - ${a}`).join('\n')}\n`
    );
  }

  _installPresetAssets(appgenDir, presetName, companyProfileSourcePath = null) {
    const presetDir = join(PRESETS_DIR, presetName);
    if (!existsSync(presetDir)) return;

    this._copyNewFilesFromDir(
      companyProfileSourcePath || join(presetDir, 'company'),
      join(appgenDir, 'company')
    );

    this._copyNewFilesFromDir(
      join(presetDir, 'standards'),
      join(appgenDir, 'standards')
    );

    this._copyNewFilesFromDir(
      join(presetDir, 'templates'),
      join(appgenDir, 'presets', presetName, 'templates')
    );

    const presetConfig = join(presetDir, 'config.toml');
    const presetConfigDest = join(appgenDir, 'presets', presetName, 'config.toml');
    if (existsSync(presetConfig) && !existsSync(presetConfigDest)) {
      this._mkdir(dirname(presetConfigDest));
      writeFileSync(presetConfigDest, readFileSync(presetConfig, 'utf8'), 'utf8');
      this._register(presetConfigDest);
    }

    const hooksSrc = join(presetDir, 'hooks.yml');
    const hooksDest = join(appgenDir, 'hooks.yml');
    if (existsSync(hooksSrc) && !existsSync(hooksDest)) {
      writeFileSync(hooksDest, readFileSync(hooksSrc, 'utf8'), 'utf8');
      this._register(hooksDest);
    }
  }

  // Copia artefatos, hooks.yml e setup.json para .appgen/
  // Não sobrescreve arquivos pré-existentes (preserva edits do usuário em refresh)
  _installAppGenAssets(appgenDir, answers, version) {
    this._copyNewFilesFromDir(
      join(TEMPLATES_DIR, 'artifacts'),
      join(appgenDir, 'artifacts')
    );

    // hooks.yml → .appgen/hooks.yml
    const hooksSrc = join(TEMPLATES_DIR, 'hooks.yml');
    const hooksDest = join(appgenDir, 'hooks.yml');
    if (existsSync(hooksSrc) && !existsSync(hooksDest)) {
      writeFileSync(hooksDest, readFileSync(hooksSrc, 'utf8'), 'utf8');
      this._register(hooksDest);
    }

    // setup.json → .appgen/setup.json (com placeholders)
    const setupSrc = join(TEMPLATES_DIR, 'setup.json');
    const setupDest = join(appgenDir, 'setup.json');
    if (existsSync(setupSrc) && !existsSync(setupDest)) {
      const rendered = readFileSync(setupSrc, 'utf8')
        .replace('{{VERSION}}', version)
        .replace('{{INSTALLED_AT}}', new Date().toISOString())
        .replace('{{PROJECT_NAME}}', answers.project_name ?? '')
        .replace('{{WORKFLOW_MODE}}', answers.workflow_mode || 'final-app')
        .replace('{{COMPANY_PROFILE}}', answers.company_profile || 'default')
        .replace('{{COMPANY_PROFILE_VERSION}}', answers.company_profile_version || '1.0.0')
        .replace('{{COMPANY_PROFILE_SOURCE}}', answers.company_profile_source || 'preset');
      writeFileSync(setupDest, rendered, 'utf8');
      this._register(setupDest);
    }
  }

  // Refresca artefatos e hooks.yml em .appgen/ a partir do pacote npm,
  // pulando arquivos que o usuário modificou. setup.json é sempre preservado por carregar
  // dados específicos do projeto (project-name, installed-at, prefix-format do usuário).
  //
  // modifiedSet: Set<string> com paths relativos ao projectRoot que NÃO devem ser sobrescritos.
  refreshAppGenAssets(modifiedSet) {
    const appgenDir = join(this.projectRoot, '.appgen');

    // Artifact templates → .appgen/artifacts/
    const artifactsSrc = join(TEMPLATES_DIR, 'artifacts');
    const artifactsDest = join(appgenDir, 'artifacts');
    if (existsSync(artifactsSrc)) {
      this._mkdir(artifactsDest);
      for (const file of readdirSync(artifactsSrc)) {
        const srcFile = join(artifactsSrc, file);
        if (!statSync(srcFile).isFile()) continue;
        const destFile = join(artifactsDest, file);
        const rel = this._rel(destFile).replace(/\\/g, '/');
        if (modifiedSet.has(rel)) continue;
        writeFileSync(destFile, readFileSync(srcFile, 'utf8'), 'utf8');
        this._register(destFile);
      }
    }

    // hooks.yml → .appgen/hooks.yml
    const hooksSrc = join(TEMPLATES_DIR, 'hooks.yml');
    const hooksDest = join(appgenDir, 'hooks.yml');
    const hooksRel = this._rel(hooksDest).replace(/\\/g, '/');
    if (existsSync(hooksSrc) && !modifiedSet.has(hooksRel)) {
      writeFileSync(hooksDest, readFileSync(hooksSrc, 'utf8'), 'utf8');
      this._register(hooksDest);
    }
    // setup.json é proposital sem refresh: carrega dados do projeto.
  }

  // Adiciona _appgen_specs/ e .appgen/config.user.toml ao .gitignore
  updateGitignore(outputFolder) {
    const gitignorePath = join(this.projectRoot, '.gitignore');
    const lines = [
      '',
      '# AppGen',
      '.appgen/config.user.toml',
      `${outputFolder}/`,
    ].join('\n');

    if (existsSync(gitignorePath)) {
      const existing = readFileSync(gitignorePath, 'utf8');
      if (!existing.includes('# AppGen')) {
        appendFileSync(gitignorePath, lines, 'utf8');
      }
    } else {
      writeFileSync(gitignorePath, lines.trimStart(), 'utf8');
      this._register(gitignorePath);
    }
  }

  // Salva a lista de arquivos criados em state.json
  saveCreatedFiles() {
    const statePath = join(this.projectRoot, '.appgen', 'state.json');
    if (!existsSync(statePath)) return;
    const state = readJsonSafe(statePath);
    state.created_files = [...new Set([...(state.created_files ?? []), ...this.createdFiles])];
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  }
}
