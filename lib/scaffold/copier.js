import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  appendFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { appendActivityLog } from '../runtime/activity-log.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const PRESETS_DIR = join(REPO_ROOT, 'presets');

function kebabCase(value) {
  return String(value || 'appgen-app')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'appgen-app';
}

function renderTemplate(content, placeholders) {
  return content
    .replaceAll('{{PROJECT_NAME}}', placeholders.projectName)
    .replaceAll('{{PACKAGE_NAME}}', placeholders.packageName)
    .replaceAll('{{APP_ROOT}}', placeholders.appRoot);
}

function appendProgress(workDir, event) {
  mkdirSync(workDir, { recursive: true });
  const entry = { ts: new Date().toISOString(), ...event };
  appendFileSync(join(workDir, 'progress.jsonl'), JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

function collectTemplateFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTemplateFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.tpl')) {
      files.push(full);
    }
  }
  return files;
}

export function copyPresetScaffold({
  projectRoot,
  presetName = 'default-web-saas',
  projectName,
  packageName,
  appRoot = 'app',
  workDir = '_appgen_work',
  state = null,
  overwrite = false,
  onProgress = null,
}) {
  const presetDir = join(PRESETS_DIR, presetName);
  const scaffoldDir = join(presetDir, 'scaffold');

  if (!existsSync(scaffoldDir)) {
    throw new Error(`Scaffold preset not found: ${presetName}`);
  }

  const targetRoot = join(projectRoot, appRoot);
  const resolvedWorkDir = join(projectRoot, workDir);
  const placeholders = {
    projectName: projectName || 'AppGen App',
    packageName: packageName || kebabCase(projectName),
    appRoot,
  };
  const activityState = {
    ...(state || {}),
    work_folder: workDir,
    app_root: state?.app_root || appRoot,
  };

  const created = [];
  const skipped = [];
  const files = collectTemplateFiles(scaffoldDir);

  const startEvent = appendProgress(resolvedWorkDir, {
    agent: 'appgen-scaffold',
    status: 'started',
    event: 'scaffold-started',
    target: appRoot,
    preset: presetName,
    files: [],
  });
  appendActivityLog(projectRoot, activityState, startEvent);
  onProgress?.({ status: 'started', target: appRoot, preset: presetName, files: [] });

  for (const src of files) {
    const relTemplate = relative(scaffoldDir, src);
    const relTarget = relTemplate.replace(/\.tpl$/, '');
    const dest = join(targetRoot, relTarget);

    if (existsSync(dest) && !overwrite) {
      skipped.push(join(appRoot, relTarget));
      const skippedEvent = appendProgress(resolvedWorkDir, {
        agent: 'appgen-scaffold',
        status: 'skipped',
        event: 'scaffold-file-skipped',
        target: join(appRoot, relTarget),
        reason: 'exists',
        files: [],
      });
      appendActivityLog(projectRoot, activityState, skippedEvent);
      onProgress?.({
        status: 'skipped',
        target: join(appRoot, relTarget),
        reason: 'exists',
        files: [],
      });
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    const rendered = renderTemplate(readFileSync(src, 'utf8'), placeholders);
    writeFileSync(dest, rendered, 'utf8');
    created.push(join(appRoot, relTarget));
    const createdEvent = appendProgress(resolvedWorkDir, {
      agent: 'appgen-scaffold',
      status: 'created',
      event: 'scaffold-file-created',
      target: join(appRoot, relTarget),
      files: [join(appRoot, relTarget)],
    });
    appendActivityLog(projectRoot, activityState, createdEvent);
    onProgress?.({
      status: 'created',
      target: join(appRoot, relTarget),
      files: [join(appRoot, relTarget)],
    });
  }

  const reportPath = join(resolvedWorkDir, 'scaffold-report.md');
  const report = [
    '# Scaffold Report',
    '',
    `Preset: ${presetName}`,
    `App root: ${appRoot}`,
    `Project: ${placeholders.projectName}`,
    `Package: ${placeholders.packageName}`,
    '',
    `Created files: ${created.length}`,
    `Skipped files: ${skipped.length}`,
    '',
    '## Created',
    ...created.map(file => `- ${file}`),
    '',
    '## Skipped',
    ...(skipped.length ? skipped.map(file => `- ${file}`) : ['- none']),
    '',
  ].join('\n');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, 'utf8');

  const doneEvent = appendProgress(resolvedWorkDir, {
    agent: 'appgen-scaffold',
    status: 'done',
    event: 'scaffold-completed',
    target: appRoot,
    files: created,
    skipped,
  });
  appendActivityLog(projectRoot, activityState, doneEvent);
  onProgress?.({ status: 'done', target: appRoot, files: created, skipped });

  return {
    presetName,
    appRoot,
    packageName: placeholders.packageName,
    created,
    skipped,
    report: relative(projectRoot, reportPath),
    progress: join(workDir, 'progress.jsonl'),
  };
}
