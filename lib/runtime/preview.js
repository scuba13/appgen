import { execFileSync } from 'child_process';
import { arch, platform, release, type } from 'os';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

export function commandVersion(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function detectPreviewEnvironment() {
  const dockerVersion = commandVersion('docker', ['--version']);
  const composeVersion = dockerVersion ? commandVersion('docker', ['compose', 'version']) : null;
  return {
    os: {
      platform: platform(),
      type: type(),
      release: release(),
      arch: arch(),
    },
    docker: {
      installed: Boolean(dockerVersion),
      version: dockerVersion,
    },
    compose: {
      installed: Boolean(composeVersion),
      version: composeVersion,
    },
  };
}

export function dockerInstallPlan(env) {
  if (env.os.platform === 'darwin') {
    const hasBrew = Boolean(commandVersion('brew', ['--version']));
    return hasBrew
      ? {
          method: 'homebrew-cask',
          command: 'brew install --cask docker',
          note: 'Depois de instalar, abra o Docker Desktop e aguarde o engine iniciar.',
        }
      : {
          method: 'manual-docker-desktop',
          command: 'Instalar Docker Desktop para macOS manualmente e abrir o app.',
          note: 'Homebrew nao foi detectado.',
        };
  }

  if (env.os.platform === 'win32') {
    const hasWinget = Boolean(commandVersion('winget', ['--version']));
    return hasWinget
      ? {
          method: 'winget',
          command: 'winget install Docker.DockerDesktop',
          note: 'Depois de instalar, abra o Docker Desktop. Pode exigir reinicio ou WSL2.',
        }
      : {
          method: 'manual-docker-desktop',
          command: 'Instalar Docker Desktop para Windows manualmente.',
          note: 'winget nao foi detectado.',
        };
  }

  if (env.os.platform === 'linux') {
    return {
      method: 'linux-package-manager',
      command: 'Instalar Docker Engine e docker compose plugin pelo gerenciador da distro.',
      note: 'O comando exato depende da distribuicao. Exige sudo e autorizacao explicita.',
    };
  }

  return {
    method: 'unsupported-os',
    command: 'Instalacao automatizada nao definida para este OS.',
    note: 'Instale Docker e Docker Compose manualmente.',
  };
}

export function packageName(state) {
  return String(state.project || 'appgen-app')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'appgen-app';
}

export function composeContent(state) {
  const name = packageName(state);
  return `services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${name}
    ports:
      - "5432:5432"
    volumes:
      - appgen_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ${name}"]
      interval: 5s
      timeout: 5s
      retries: 20

  api:
    image: node:20-alpine
    working_dir: /workspace
    command: sh -lc "corepack enable && pnpm install && pnpm --filter @${name}/api prisma:generate && pnpm --filter @${name}/api dev"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/${name}?schema=public
      API_PORT: "3001"
      OIDC_ISSUER_URL: http://localhost:3001/mock-oidc
      OIDC_CLIENT_ID: ${name}
      OIDC_CLIENT_SECRET: local-preview-only
    ports:
      - "3001:3001"
    volumes:
      - .:/workspace
      - appgen_pnpm_store:/root/.local/share/pnpm/store
    depends_on:
      db:
        condition: service_healthy

  web:
    image: node:20-alpine
    working_dir: /workspace
    command: sh -lc "corepack enable && pnpm install && pnpm --filter @${name}/web dev -- --hostname 0.0.0.0"
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:3001
    ports:
      - "3000:3000"
    volumes:
      - .:/workspace
      - appgen_pnpm_store:/root/.local/share/pnpm/store
    depends_on:
      - api

volumes:
  appgen_postgres_data:
  appgen_pnpm_store:
`;
}

export function writeFileSafe(path, content, force = false) {
  if (existsSync(path) && !force) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
  return true;
}

function runCommand(command, args, options = {}) {
  const startedAt = new Date().toISOString();
  try {
    const stdout = execFileSync(command, args, {
      cwd: options.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeoutMs || 120000,
    });
    return {
      command: [command, ...args].join(' '),
      status: 'passed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      stdout: stdout.trim(),
      stderr: '',
    };
  } catch (error) {
    return {
      command: [command, ...args].join(' '),
      status: 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || '').trim(),
    };
  }
}

async function waitForUrl(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  let lastError = '';

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return { status: 'passed', url, status_code: response.status };
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { status: 'failed', url, error: lastError || 'timeout' };
}

function previewReport({ env, installPlan, composeRelPath, wroteCompose, checks, status }) {
  return `# Preview Report

## Status

${status}

## Ambiente

| Item | Valor |
|---|---|
| OS | ${env.os.type} ${env.os.release} (${env.os.platform}/${env.os.arch}) |
| Docker | ${env.docker.installed ? env.docker.version : 'Nao instalado'} |
| Docker Compose | ${env.compose.installed ? env.compose.version : 'Nao instalado'} |

## Docker

${env.docker.installed && env.compose.installed
  ? 'Docker e Docker Compose estao disponiveis.'
  : `Docker/Compose nao estao prontos. Instalacao sugerida: \`${installPlan.command}\`. Metodo: ${installPlan.method}. ${installPlan.note}`}

## Compose

| Campo | Valor |
|---|---|
| Arquivo | ${composeRelPath} |
| Criado nesta execucao? | ${wroteCompose ? 'Sim' : 'Nao'} |

## Validacoes Tecnicas

${checks.length ? checks.map(check => `- ${check.status === 'passed' ? '[ok]' : '[falhou]'} ${check.name}: ${check.detail}`).join('\n') : '- Nenhuma validacao executada.'}

## URLs

- Web: http://localhost:3000
- API health: http://localhost:3001/health

## Como Parar O Preview

\`\`\`bash
cd ${(composeRelPath.split('/')[0]) || 'app'}
docker compose down
\`\`\`
`;
}

export async function preparePreview({ projectRoot, state, force = false, runPreview = false }) {
  const appRoot = state.app_root || 'app';
  const workDir = state.work_folder || '_appgen_work';
  const composeRelPath = join(appRoot, 'docker-compose.yml');
  const composePath = join(projectRoot, composeRelPath);
  const reportPath = join(projectRoot, workDir, 'preview-report.md');
  const appRootPath = join(projectRoot, appRoot);
  const env = detectPreviewEnvironment();
  const installPlan = dockerInstallPlan(env);
  const wroteCompose = writeFileSafe(composePath, composeContent(state), force);
  const checks = [];

  if (!env.docker.installed || !env.compose.installed) {
    const status = 'Preview bloqueado ate Docker/Compose estar disponivel.';
    writeFileSafe(reportPath, previewReport({ env, installPlan, composeRelPath, wroteCompose, checks, status }), true);
    return {
      status: 'blocked_environment',
      env,
      installPlan,
      composeRelPath,
      wroteCompose,
      checks,
      report: join(workDir, 'preview-report.md'),
    };
  }

  const configCheck = runCommand('docker', ['compose', 'config'], { cwd: appRootPath });
  checks.push({
    name: 'docker compose config',
    status: configCheck.status,
    detail: configCheck.status === 'passed' ? 'compose valido' : configCheck.stderr || 'falha ao validar compose',
    command: configCheck.command,
  });

  if (configCheck.status !== 'passed' || !runPreview) {
    const status = configCheck.status === 'passed'
      ? 'Compose validado. Preview ainda nao foi iniciado automaticamente.'
      : 'Compose invalido. Nao liberar teste para o usuario.';
    writeFileSafe(reportPath, previewReport({ env, installPlan, composeRelPath, wroteCompose, checks, status }), true);
    return {
      status: configCheck.status === 'passed' ? 'compose_validated' : 'failed',
      env,
      installPlan,
      composeRelPath,
      wroteCompose,
      checks,
      report: join(workDir, 'preview-report.md'),
    };
  }

  const upCheck = runCommand('docker', ['compose', 'up', '-d', '--build'], { cwd: appRootPath, timeoutMs: 180000 });
  checks.push({
    name: 'docker compose up',
    status: upCheck.status,
    detail: upCheck.status === 'passed' ? 'preview iniciado em background' : upCheck.stderr || 'falha ao subir preview',
    command: upCheck.command,
  });

  if (upCheck.status === 'passed') {
    const apiCheck = await waitForUrl('http://localhost:3001/health');
    checks.push({
      name: 'API health',
      status: apiCheck.status,
      detail: apiCheck.status === 'passed' ? `HTTP ${apiCheck.status_code}` : apiCheck.error,
      url: apiCheck.url,
    });

    const webCheck = await waitForUrl('http://localhost:3000');
    checks.push({
      name: 'Web preview',
      status: webCheck.status,
      detail: webCheck.status === 'passed' ? `HTTP ${webCheck.status_code}` : webCheck.error,
      url: webCheck.url,
    });
  }

  const failed = checks.some(check => check.status !== 'passed');
  const status = failed
    ? 'Preview iniciado com falhas. Nao liberar teste para o usuario antes de corrigir.'
    : 'Preview validado tecnicamente. Pode liberar teste para o usuario.';
  writeFileSafe(reportPath, previewReport({ env, installPlan, composeRelPath, wroteCompose, checks, status }), true);

  return {
    status: failed ? 'failed' : 'ready_for_user_test',
    env,
    installPlan,
    composeRelPath,
    wroteCompose,
    checks,
    report: join(workDir, 'preview-report.md'),
  };
}
