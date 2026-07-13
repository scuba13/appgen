import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { completeStep } from '../lib/runtime/flow.js';
import { initImplementationLoop, updateImplementationLoop } from '../lib/runtime/implementation-loop.js';
import { appendActivityLog } from '../lib/runtime/activity-log.js';
import { writeAcceptanceGuide } from '../lib/runtime/business-experience.js';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const cli = join(repoRoot, 'bin', 'appgen.js');

function makeProject() {
  return mkdtempSync(join(tmpdir(), 'appgen-fixture-'));
}

function cleanup(path) {
  rmSync(path, { recursive: true, force: true });
}

function runAppgen(cwd, args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      CI: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });

  assert.equal(
    result.status,
    0,
    [
      `appgen ${args.join(' ')} failed`,
      `stdout:\n${result.stdout}`,
      `stderr:\n${result.stderr}`,
    ].join('\n\n')
  );

  return result;
}

function runInstalledAppgen(cwd, args) {
  const localCli = join(cwd, '.appgen', 'bin', 'appgen.js');
  const result = spawnSync(process.execPath, [localCli, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 30000,
    env: {
      ...process.env,
      CI: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  });

  assert.equal(
    result.status,
    0,
    [
      `local appgen ${args.join(' ')} failed`,
      `stdout:\n${result.stdout}`,
      `stderr:\n${result.stderr}`,
    ].join('\n\n')
  );

  return result;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertFinishedTaskTimestamps(tasks) {
  for (const task of tasks) {
    if (['done', 'skipped', 'blocked', 'failed'].includes(task.status)) {
      assert.ok(task.started_at, `${task.id} should have started_at`);
      assert.ok(task.completed_at, `${task.id} should have completed_at`);
    }
  }
}

test('install --yes creates a Codex-ready AppGen project without prompts', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Sales Portal',
      '--user-name',
      'Eduardo',
      '--output-folder',
      '_specs',
      '--git-strategy',
      'commit',
      '--answer-mode',
      'chat',
    ]);

    const state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.equal(state.project, 'Sales Portal');
    assert.equal(state.user_name, 'Eduardo');
    assert.deepEqual(state.engines, ['codex']);
    assert.equal(state.output_folder, '_specs');
    assert.equal(state.activity_log, '_appgen_work/activity-log.md');
    assert.equal(state.workflow_mode, 'final-app');
    assert.equal(state.company_profile, 'default');

    assert.ok(existsSync(join(projectRoot, 'AGENTS.md')));
    assert.ok(existsSync(join(projectRoot, '.agents', 'skills', 'appgen', 'SKILL.md')));
    const appgenSkill = readFileSync(join(projectRoot, '.agents', 'skills', 'appgen', 'SKILL.md'), 'utf8');
    assert.match(appgenSkill, /name: appgen/);
    assert.match(appgenSkill, /Fluxo principal do AppGen/);
    assert.match(appgenSkill, /\$appgen/);
    assert.match(appgenSkill, /role: orchestrator/);
    assert.match(appgenSkill, /reports gerais .*append-only/);
    assert.match(appgenSkill, /_appgen_work\/slices\/<SLICE_ID>/);
    const appgenOpenAi = readFileSync(join(projectRoot, '.agents', 'skills', 'appgen', 'agents', 'openai.yaml'), 'utf8');
    assert.match(appgenOpenAi, /display_name: "appgen"/);
    assert.match(appgenOpenAi, /short_description: "\$appgen inicia/);
    assert.match(appgenOpenAi, /allow_implicit_invocation: true/);
    const qualityOpenAi = readFileSync(join(projectRoot, '.agents', 'skills', 'appgen-quality', 'agents', 'openai.yaml'), 'utf8');
    assert.match(qualityOpenAi, /display_name: "appgen-quality"/);
    assert.doesNotMatch(qualityOpenAi, /display_name: "AppGen Quality"/);
    const qaSkill = readFileSync(join(projectRoot, '.agents', 'skills', 'appgen-qa', 'SKILL.md'), 'utf8');
    assert.match(qaSkill, /_appgen_work\/slices\/<SLICE_ID>\/test-plan\.md/);
    assert.match(qaSkill, /_appgen_work\/slices\/<SLICE_ID>\/qa-report\.md/);
    assert.match(qaSkill, /append-only/);
    assert.match(qaSkill, /Nunca sobrescreva conteudo de slices anteriores/);
    const qualitySkill = readFileSync(join(projectRoot, '.agents', 'skills', 'appgen-quality', 'SKILL.md'), 'utf8');
    assert.match(qualitySkill, /_appgen_work\/slices\/<SLICE_ID>\/quality-report\.md/);
    assert.match(qualitySkill, /append-only/);
    assert.match(qualitySkill, /Nunca sobrescreva conteudo de slices anteriores/);
    assert.ok(existsSync(join(projectRoot, '.appgen', 'bin', 'appgen.js')));
    assert.ok(existsSync(join(projectRoot, '.appgen', 'company', 'profile.toml')));
    assert.ok(existsSync(join(projectRoot, '.appgen', 'artifacts', 'brief-questionnaire.md')));
    assert.ok(existsSync(join(projectRoot, '_specs')));
    assert.ok(existsSync(join(projectRoot, '_appgen_work')));
    assert.ok(existsSync(join(projectRoot, '.appgen', '_config', 'files-manifest.json')));
    assert.match(
      readFileSync(join(projectRoot, '.appgen', 'artifacts', 'brief-questionnaire.md'), 'utf8'),
      /Nao Perguntar Ao Usuario De Negocio/
    );
    assert.match(runInstalledAppgen(projectRoot, ['--help']).stdout, /environment\s+Verifica Docker/);

    const status = runAppgen(projectRoot, ['status']);
    assert.match(status.stdout, /Retomada/);
    assert.match(status.stdout, /Proximo passo/);

    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Sales Portal',
      '--user-name',
      'Eduardo',
      '--output-folder',
      '_specs',
    ]);
  } finally {
    cleanup(projectRoot);
  }
});

test('install --yes creates Claude Code slash command when requested', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=claude-code',
      '--project-name',
      'Support Desk',
      '--user-name',
      'Eduardo',
    ]);

    const state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.deepEqual(state.engines, ['claude-code']);

    assert.ok(existsSync(join(projectRoot, 'CLAUDE.md')));
    assert.ok(existsSync(join(projectRoot, '.claude', 'commands', 'appgen.md')));
    assert.ok(existsSync(join(projectRoot, '.claude', 'skills', 'appgen', 'SKILL.md')));
    assert.ok(existsSync(join(projectRoot, '.agents', 'skills', 'appgen', 'SKILL.md')));
    assert.match(
      readFileSync(join(projectRoot, '.claude', 'commands', 'appgen.md'), 'utf8'),
      /Inicie ou retome o fluxo AppGen/
    );
  } finally {
    cleanup(projectRoot);
  }
});

test('log command records user-facing agent message in activity log', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Log Fixture',
      '--user-name',
      'Eduardo',
    ]);

    runInstalledAppgen(projectRoot, [
      'log',
      '--agent=appgen-quality',
      '--event=agent-message',
      '--message=Slice S001 concluida. Vou parar aqui para voce decidir se seguimos.',
      '--summary=Quality aprovou S001 e pausou antes da proxima slice.',
      '--slice=S001',
      '--file=app/apps/web/src/app/page.tsx',
      '--command=pnpm test',
      '--decision=pausar antes da proxima slice',
      '--next-step=aguardar confirmacao',
    ]);

    const activityLog = readFileSync(join(projectRoot, '_appgen_work', 'activity-log.md'), 'utf8');
    assert.match(activityLog, /Mensagem Ao Usuario/);
    assert.match(activityLog, /Slice S001 concluida/);
    assert.match(activityLog, /Quality aprovou S001/);
    assert.match(activityLog, /slice: S001/);
    assert.match(activityLog, /files: app\/apps\/web\/src\/app\/page\.tsx/);
    assert.match(activityLog, /commands: pnpm test/);
    assert.match(activityLog, /decisions: pausar antes da proxima slice/);
    assert.match(activityLog, /next_step: aguardar confirmacao/);

    appendActivityObjectFixture(projectRoot);
    const updatedActivityLog = readFileSync(join(projectRoot, '_appgen_work', 'activity-log.md'), 'utf8');
    assert.match(updatedActivityLog, /```json/);
    assert.match(updatedActivityLog, /"name": "docker compose config"/);
    assert.doesNotMatch(updatedActivityLog, /\[object Object\]/);
  } finally {
    cleanup(projectRoot);
  }
});

function appendActivityObjectFixture(projectRoot) {
  const state = readJson(join(projectRoot, '.appgen', 'state.json'));
  appendActivityLog(projectRoot, state, {
    agent: 'appgen-preview-validation',
    event: 'preview-validation',
    checks: [
      {
        name: 'docker compose config',
        status: 'passed',
      },
    ],
  });
}

test('acceptance guide focuses on business-visible flows and filters technical slices', () => {
  const projectRoot = makeProject();

  try {
    mkdirSync(join(projectRoot, '_appgen_specs'), { recursive: true });
    mkdirSync(join(projectRoot, '.appgen'), { recursive: true });
    writeFileSync(
      join(projectRoot, '.appgen', 'state.json'),
      JSON.stringify({
        project: 'Acceptance Fixture',
        work_folder: '_appgen_work',
        output_folder: '_appgen_specs',
        app_root: 'app',
      }, null, 2),
      'utf8'
    );
    writeFileSync(
      join(projectRoot, '_appgen_specs', 'product.md'),
      [
        '# Produto',
        '',
        '## Perfis',
        '',
        '- Gestor financeiro que aprova solicitacoes.',
        '',
        '## Regras',
        '',
        '- Solicitacoes acima do limite exigem justificativa.',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(projectRoot, '_appgen_specs', 'feature-slices.md'),
      [
        '# Feature Slices',
        '',
        '| ID | Nome | Objetivo | Dependencias | Paralelo | Status |',
        '|---|---|---|---|---|---|',
        '| S001 | Fundacao tecnica | Criar base, config e scaffold | - | Nao | done |',
        '| S002 | Aprovacao de solicitacao | Permitir aprovar ou reprovar solicitacoes pendentes | S001 | Nao | done |',
        '| S003 | Polimento final | Validacao final e ajustes tecnicos | S002 | Nao | todo |',
        '',
      ].join('\n'),
      'utf8'
    );

    const guide = writeAcceptanceGuide(projectRoot, readJson(join(projectRoot, '.appgen', 'state.json')));
    const content = readFileSync(join(projectRoot, guide.path), 'utf8');
    assert.match(content, /Perfis Para Testar/);
    assert.match(content, /Gestor financeiro/);
    assert.match(content, /Fluxos Por Persona/);
    assert.match(content, /Aprovacao de solicitacao/);
    assert.doesNotMatch(content, /Fundacao tecnica/);
    assert.doesNotMatch(content, /Polimento final/);
    assert.match(content, /Sinais De Problema Para Reportar/);
  } finally {
    cleanup(projectRoot);
  }
});

test('technical acceptance feedback reopens final slice for rework', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Feedback Fixture',
      '--user-name',
      'Eduardo',
    ]);

    mkdirSync(join(projectRoot, '_appgen_specs'), { recursive: true });
    mkdirSync(join(projectRoot, '_appgen_work'), { recursive: true });
    writeFileSync(
      join(projectRoot, '_appgen_specs', 'feature-slices.md'),
      [
        '# Feature Slices',
        '',
        '| ID | Nome | Objetivo | Dependencias | Paralelo | Status |',
        '|---|---|---|---|---|---|',
        '| S006 | Polimento operacional | Ajustar UX e gates finais | S005 | Nao | done |',
        '',
      ].join('\n'),
      'utf8'
    );

    const statePath = join(projectRoot, '.appgen', 'state.json');
    const state = readJson(statePath);
    state.phase = 'acceptance';
    state.output_folder = '_appgen_specs';
    state.work_folder = '_appgen_work';
    state.app_root = 'app';
    state.implementation_loop = {
      status: 'complete',
      current_slice: null,
      open_slices: [],
      done_slices: ['S006'],
      blocked_slices: [],
    };
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    writeFileSync(
      join(projectRoot, '_appgen_work', 'loop-state.json'),
      JSON.stringify(state.implementation_loop, null, 2),
      'utf8'
    );

    runInstalledAppgen(projectRoot, [
      'acceptance',
      '--feedback-type=technical',
      '--feedback=UX ainda precisa de ajuste visual.',
    ]);

    const updatedState = readJson(statePath);
    const loop = readJson(join(projectRoot, '_appgen_work', 'loop-state.json'));
    assert.equal(updatedState.phase, 'implementation-loop');
    assert.equal(updatedState.acceptance.status, 'changes_requested');
    assert.equal(updatedState.acceptance.next_step, 'implementation-loop');
    assert.equal(loop.status, 'ready');
    assert.deepEqual(loop.open_slices, ['S006']);
    assert.deepEqual(loop.done_slices, []);
    assert.match(loop.next_recommended_action, /Retome S006/);
    assert.match(
      readFileSync(join(projectRoot, '_appgen_specs', 'feature-slices.md'), 'utf8'),
      /\| S006 \| Polimento operacional \| Ajustar UX e gates finais \| S005 \| Nao \| rework \|/
    );
    assert.match(
      readFileSync(join(projectRoot, '_appgen_work', 'progress.jsonl'), 'utf8'),
      /slice-reopened/
    );
  } finally {
    cleanup(projectRoot);
  }
});

test('scaffold can generate the default app from an installed fixture project', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Finance Ops',
      '--user-name',
      'Eduardo',
    ]);

    const scaffold = runAppgen(projectRoot, [
      'scaffold',
      '--allow-missing-specs',
      '--allow-low-score',
    ]);
    assert.match(scaffold.stdout, /Resumo antes de construir/);

    const packageJson = readJson(join(projectRoot, 'app', 'package.json'));
    assert.equal(packageJson.name, 'finance-ops');
    assert.equal(packageJson.scripts['test:e2e'], 'playwright test');
    assert.equal(packageJson.scripts['test:e2e:install'], 'playwright install chromium');
    assert.equal(packageJson.devDependencies['@playwright/test'], '^1.49.1');
    assert.ok(existsSync(join(projectRoot, 'app', 'apps', 'web', 'package.json')));
    assert.ok(existsSync(join(projectRoot, 'app', 'apps', 'api', 'src', 'main.ts')));
    assert.ok(existsSync(join(projectRoot, 'app', 'apps', 'api', 'vitest.config.ts')));
    assert.ok(existsSync(join(projectRoot, 'app', 'packages', 'shared', 'src', 'index.ts')));
    assert.ok(existsSync(join(projectRoot, 'app', 'playwright.config.ts')));
    assert.ok(existsSync(join(projectRoot, 'app', 'tests', 'e2e', 'preview-smoke.spec.ts')));
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'build-summary.md')));
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'activity-log.md')));
    assert.match(
      readFileSync(join(projectRoot, '_appgen_work', 'scaffold-report.md'), 'utf8'),
      /Created files: [1-9]\d*/
    );
    assert.match(
      readFileSync(join(projectRoot, 'app', '.gitignore'), 'utf8'),
      /playwright-report/
    );
    assert.doesNotMatch(
      readFileSync(join(projectRoot, 'app', '.gitignore'), 'utf8'),
      /pnpm-lock\.yaml/
    );
    assert.doesNotMatch(
      readFileSync(join(projectRoot, '_appgen_work', 'activity-log.md'), 'utf8'),
      /scaffold-file-created/
    );
    assert.match(
      readFileSync(join(projectRoot, '_appgen_work', 'progress.jsonl'), 'utf8'),
      /scaffold-file-created/
    );

    const state = readJson(join(projectRoot, '.appgen', 'state.json'));
    const apiPackageJson = readJson(join(projectRoot, 'app', 'apps', 'api', 'package.json'));
    assert.equal(apiPackageJson.dependencies['@finance-ops/shared'], 'workspace:*');
    assert.equal(apiPackageJson.dependencies['class-validator'], undefined);
    assert.equal(apiPackageJson.dependencies['class-transformer'], undefined);

    const apiMain = readFileSync(join(projectRoot, 'app', 'apps', 'api', 'src', 'main.ts'), 'utf8');
    assert.doesNotMatch(apiMain, /ValidationPipe/);

    const apiVitestConfig = readFileSync(join(projectRoot, 'app', 'apps', 'api', 'vitest.config.ts'), 'utf8');
    assert.match(apiVitestConfig, /"@finance-ops\/shared"/);
    assert.match(apiVitestConfig, /\.\.\/\.\.\/packages\/shared\/src\/index\.ts/);

    const sharedPackageJson = readJson(join(projectRoot, 'app', 'packages', 'shared', 'package.json'));
    assert.equal(sharedPackageJson.main, 'dist/index.js');
    assert.equal(sharedPackageJson.types, 'dist/index.d.ts');
    assert.equal(sharedPackageJson.scripts.build, 'tsc --project tsconfig.json');

    const sharedTsconfig = readJson(join(projectRoot, 'app', 'packages', 'shared', 'tsconfig.json'));
    assert.equal(sharedTsconfig.compilerOptions.module, 'CommonJS');
    assert.equal(sharedTsconfig.compilerOptions.moduleResolution, 'Node');
    assert.equal(sharedTsconfig.compilerOptions.outDir, 'dist');
    assert.equal(sharedTsconfig.compilerOptions.noEmit, false);
    assert.equal(sharedTsconfig.compilerOptions.declaration, true);

    assert.equal(state.scaffold.status, 'completed');
    assert.equal(state.scaffold.current_task, null);
    assert.equal(state.scaffold.report, '_appgen_work/scaffold-report.md');
    assert.equal(state.scaffold.summary, '_appgen_work/build-summary.md');
    assert.deepEqual(
      state.scaffold.tasks.map(task => task.id),
      ['validate-installation', 'validate-specs', 'generate-files']
    );
    assert.ok(state.scaffold.tasks.every(task => task.status === 'done'));
  } finally {
    cleanup(projectRoot);
  }
});

test('environment and preview-validation record container readiness reports', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engine=codex',
      '--project-name',
      'Preview Ops',
      '--user-name',
      'Eduardo',
    ]);

    runAppgen(projectRoot, ['environment']);
    let state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'environment-report.md')));
    assert.match(state.environment.status, /^(ready|needs_attention)$/);
    assert.equal(state.environment.report, '_appgen_work/environment-report.md');
    assert.deepEqual(
      state.environment.tasks.map(task => task.id),
      ['detect-tools', 'validate-docker', 'plan-containers']
    );
    assertFinishedTaskTimestamps(state.environment.tasks);

    runAppgen(projectRoot, [
      'scaffold',
      '--allow-missing-specs',
      '--allow-low-score',
    ]);
    runAppgen(projectRoot, ['preview-validation', '--prepare-only']);

    state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.ok(existsSync(join(projectRoot, 'app', 'docker-compose.yml')));
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'preview-report.md')));
    assert.match(state.preview_validation.status, /^(ready_for_user_test|needs_attention)$/);
    assert.equal(state.preview_validation.report, '_appgen_work/preview-report.md');
    assert.deepEqual(
      state.preview_validation.tasks.map(task => task.id),
      ['validate-app-root', 'prepare-compose', 'run-smoke-test']
    );

    runAppgen(projectRoot, ['acceptance']);
    state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'acceptance-test-guide.md')));
    assert.equal(state.acceptance.test_guide, '_appgen_work/acceptance-test-guide.md');
  } finally {
    cleanup(projectRoot);
  }
});

test('update --yes --offline upgrades an old install to the local package version', () => {
  const projectRoot = makeProject();

  try {
    runAppgen(projectRoot, [
      'install',
      '--yes',
      '--engines=codex,claude-code',
      '--project-name',
      'Legacy Portal',
      '--user-name',
      'Eduardo',
    ]);

    const statePath = join(projectRoot, '.appgen', 'state.json');
    const state = readJson(statePath);
    state.version = '0.0.1';
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
    writeFileSync(join(projectRoot, '.appgen', 'version'), '0.0.1', 'utf8');
    rmSync(join(projectRoot, '.agents', 'skills', 'appgen-docs', 'SKILL.md'), { force: true });
    rmSync(join(projectRoot, '.claude', 'commands', 'appgen.md'), { force: true });

    runAppgen(projectRoot, ['update', '--yes', '--offline']);

    const packageJson = readJson(join(repoRoot, 'package.json'));
    const updatedState = readJson(statePath);
    assert.equal(updatedState.version, packageJson.version);
    assert.equal(readFileSync(join(projectRoot, '.appgen', 'version'), 'utf8'), packageJson.version);
    assert.ok(existsSync(join(projectRoot, '.agents', 'skills', 'appgen-docs', 'SKILL.md')));
    assert.ok(existsSync(join(projectRoot, '.claude', 'commands', 'appgen.md')));
    assert.ok(existsSync(join(projectRoot, '.appgen', 'bin', 'appgen.js')));
    assert.match(runInstalledAppgen(projectRoot, ['--help']).stdout, /environment\s+Verifica Docker/);
  } finally {
    cleanup(projectRoot);
  }
});

test('completeStep preserves loop-state when implementation-loop completes', () => {
  const projectRoot = makeProject();

  try {
    mkdirSync(join(projectRoot, '.appgen'), { recursive: true });
    mkdirSync(join(projectRoot, '_appgen_work'), { recursive: true });
    writeFileSync(join(projectRoot, '.appgen', 'plan.md'), '- [ ] implementation-loop\n', 'utf8');
    writeFileSync(
      join(projectRoot, '.appgen', 'state.json'),
      JSON.stringify({
        project: 'Loop Fixture',
        work_folder: '_appgen_work',
        completed: ['brief', 'standards', 'product', 'architecture', 'specs', 'scaffold', 'slicer'],
        pending: ['implementation-loop', 'acceptance'],
        implementation_loop: {
          status: 'running',
          current_slice: 'S001',
          iteration: 1,
          max_app_loops: 5,
          max_slice_attempts: 3,
          max_parallel_slices: 1,
          open_slices: ['S001'],
          done_slices: [],
          blocked_slices: [],
        },
      }, null, 2),
      'utf8'
    );
    writeFileSync(
      join(projectRoot, '_appgen_work', 'loop-state.json'),
      JSON.stringify({
        status: 'completed',
        current_slice: null,
        iteration: 1,
        open_slices: [],
        done_slices: ['S001'],
        blocked_slices: [],
        last_agent: 'appgen-quality',
      }, null, 2),
      'utf8'
    );

    const result = completeStep(projectRoot, 'implementation-loop');

    assert.equal(result.state.phase, 'acceptance');
    assert.equal(result.state.implementation_loop.status, 'completed');
    assert.deepEqual(result.state.implementation_loop.done_slices, ['S001']);
    assert.deepEqual(result.state.implementation_loop.open_slices, []);
  } finally {
    cleanup(projectRoot);
  }
});

test('implementation loop init records preview preflight recommendation', () => {
  const projectRoot = makeProject();

  try {
    mkdirSync(join(projectRoot, '.appgen'), { recursive: true });
    mkdirSync(join(projectRoot, '_appgen_specs'), { recursive: true });
    writeFileSync(
      join(projectRoot, '.appgen', 'state.json'),
      JSON.stringify({
        project: 'Loop Preview Fixture',
        work_folder: '_appgen_work',
        output_folder: '_appgen_specs',
        app_root: 'app',
        phase: 'slicer',
        implementation_loop: {
          status: 'not_started',
          open_slices: [],
          done_slices: [],
          blocked_slices: [],
        },
      }, null, 2),
      'utf8'
    );
    writeFileSync(join(projectRoot, '_appgen_specs', 'feature-slices.md'), '- S001 - First slice\n', 'utf8');

    const result = initImplementationLoop(projectRoot);

    assert.equal(result.loop.preview_environment.status, 'not_started');
    assert.match(result.loop.preview_environment.recommendation, /preview-validation/);
    assert.ok(existsSync(join(projectRoot, '_appgen_work', 'activity-log.md')));
  } finally {
    cleanup(projectRoot);
  }
});

test('implementation loop pauses for user confirmation between slices', () => {
  const projectRoot = makeProject();

  try {
    mkdirSync(join(projectRoot, '.appgen'), { recursive: true });
    mkdirSync(join(projectRoot, '_appgen_specs'), { recursive: true });
    writeFileSync(
      join(projectRoot, '.appgen', 'state.json'),
      JSON.stringify({
        project: 'Pause Fixture',
        work_folder: '_appgen_work',
        output_folder: '_appgen_specs',
        phase: 'implementation-loop',
        runtime: {
          pause_between_slices: true,
        },
        implementation_loop: {
          status: 'running',
          current_slice: 'S001',
          pause_between_slices: true,
          open_slices: ['S001', 'S002'],
          done_slices: [],
          blocked_slices: [],
        },
      }, null, 2),
      'utf8'
    );
    writeFileSync(
      join(projectRoot, '_appgen_specs', 'feature-slices.md'),
      [
        '# Feature Slices',
        '',
        '| ID | Nome | Objetivo | Dependencias | Paralelo | Status |',
        '|---|---|---|---|---|---|',
        '| S001 | First | First slice | Scaffold | Nao | todo |',
        '| S002 | Second | Second slice | S001 | Nao | todo |',
        '',
      ].join('\n'),
      'utf8'
    );

    updateImplementationLoop(projectRoot, {
      startSlice: 'S001',
      agent: 'appgen-coder',
    });
    assert.match(
      readFileSync(join(projectRoot, '_appgen_specs', 'feature-slices.md'), 'utf8'),
      /\| S001 \| First \| First slice \| Scaffold \| Nao \| in_progress \|/
    );

    const result = updateImplementationLoop(projectRoot, {
      completeSlice: 'S001',
      agent: 'appgen-quality',
      report: '_appgen_work/quality-report.md',
    });

    assert.equal(result.loop.status, 'waiting_user_decision');
    assert.equal(result.loop.awaiting_user_decision, true);
    assert.deepEqual(result.loop.done_slices, ['S001']);
    assert.deepEqual(result.loop.open_slices, ['S002']);
    assert.match(result.loop.next_recommended_action, /Pause aqui/);
    assert.match(
      readFileSync(join(projectRoot, '_appgen_specs', 'feature-slices.md'), 'utf8'),
      /\| S001 \| First \| First slice \| Scaffold \| Nao \| done \|/
    );
  } finally {
    cleanup(projectRoot);
  }
});

test('completeStep blocks environment completion while Docker needs attention', () => {
  const projectRoot = makeProject();

  try {
    mkdirSync(join(projectRoot, '.appgen'), { recursive: true });
    writeFileSync(join(projectRoot, '.appgen', 'plan.md'), '- [ ] appgen-environment\n', 'utf8');
    writeFileSync(
      join(projectRoot, '.appgen', 'state.json'),
      JSON.stringify({
        project: 'Environment Fixture',
        completed: ['brief', 'standards', 'product', 'architecture'],
        pending: ['environment', 'specs'],
        phase: 'environment',
        environment: {
          status: 'needs_attention',
          report: '_appgen_work/environment-report.md',
          docker: { installed: true },
          compose: { installed: true },
          docker_daemon_ready: false,
        },
      }, null, 2),
      'utf8'
    );

    assert.throws(
      () => completeStep(projectRoot, 'environment'),
      /Cannot complete "environment"/
    );

    const state = readJson(join(projectRoot, '.appgen', 'state.json'));
    assert.deepEqual(state.completed, ['brief', 'standards', 'product', 'architecture']);
    assert.deepEqual(state.pending, ['environment', 'specs']);
  } finally {
    cleanup(projectRoot);
  }
});
