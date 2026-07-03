import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';

export const APPGEN_STEPS = [
  { id: 'brief', agent: 'appgen-brief', files: ['_appgen_specs/brief.md'] },
  { id: 'standards', agent: 'appgen-standards', files: ['_appgen_specs/standards-map.md'] },
  { id: 'product', agent: 'appgen-product', files: ['_appgen_specs/product.md'] },
  {
    id: 'architecture',
    agent: 'appgen-architect',
    files: [
      '_appgen_specs/target-architecture.md',
      '_appgen_specs/domain-model.md',
      '_appgen_specs/data-model.md',
      '_appgen_specs/api-contracts.md',
      '_appgen_specs/ui-spec.md',
    ],
  },
  {
    id: 'specs',
    agent: 'appgen-specs',
    files: [
      '_appgen_specs/features/',
      '_appgen_specs/quality/spec-score.md',
    ],
  },
  { id: 'scaffold', agent: 'appgen-scaffold', files: ['_appgen_work/scaffold-report.md'] },
  { id: 'slicer', agent: 'appgen-slicer', files: ['_appgen_specs/feature-slices.md'] },
  {
    id: 'implementation-loop',
    agent: 'implementation-loop',
    files: ['_appgen_work/loop-state.json'],
  },
  { id: 'acceptance', agent: 'appgen-acceptance', files: ['_appgen_work/user-acceptance.md'] },
  { id: 'docs', agent: 'appgen-docs', files: ['app/docs/README.md', 'app/docs/project.html'] },
  { id: 'handoff', agent: 'appgen-handoff', files: ['_appgen_work/handoff.md'] },
];

export function buildInitialImplementationLoop(state = {}) {
  const existing = state.implementation_loop ?? {};
  return {
    status: existing.status ?? 'not_started',
    current_slice: existing.current_slice ?? null,
    iteration: existing.iteration ?? 0,
    max_app_loops: existing.max_app_loops ?? state.runtime?.max_app_loops ?? 5,
    max_slice_attempts: existing.max_slice_attempts ?? state.runtime?.max_slice_attempts ?? 3,
    max_parallel_slices: existing.max_parallel_slices ?? state.runtime?.max_parallel_slices ?? 1,
    open_slices: existing.open_slices ?? [],
    done_slices: existing.done_slices ?? [],
    blocked_slices: existing.blocked_slices ?? [],
    last_agent: existing.last_agent ?? null,
    last_report: existing.last_report ?? null,
  };
}

function statePath(projectRoot) {
  return join(projectRoot, '.appgen', 'state.json');
}

function planPath(projectRoot) {
  return join(projectRoot, '.appgen', 'plan.md');
}

function stateLockPath(projectRoot) {
  return join(projectRoot, '.appgen', 'state.lock');
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireStateLock(projectRoot) {
  const path = stateLockPath(projectRoot);
  const startedAt = Date.now();
  const timeoutMs = 5000;
  const staleMs = 30000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      mkdirSync(path);
      return () => rmSync(path, { recursive: true, force: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      try {
        const stat = statSync(path);
        if (Date.now() - stat.mtimeMs > staleMs) {
          rmSync(path, { recursive: true, force: true });
          continue;
        }
      } catch (statError) {
        if (statError.code !== 'ENOENT') throw statError;
      }

      sleep(50);
    }
  }

  throw new Error('Could not acquire AppGen state lock. Try again in a few seconds.');
}

function writeFileAtomic(path, content) {
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, content, 'utf8');
  renameSync(tempPath, path);
}

function readImplementationLoopForCompletion(projectRoot, state) {
  const workDir = state.work_folder || '_appgen_work';
  const path = join(projectRoot, workDir, 'loop-state.json');
  const fallback = buildInitialImplementationLoop(state);
  if (!existsSync(path)) return fallback;

  try {
    return {
      ...fallback,
      ...readJsonSafe(path),
    };
  } catch {
    return fallback;
  }
}

export function normalizeStep(stepOrAgent) {
  const value = String(stepOrAgent || '').trim();
  return APPGEN_STEPS.find(step => step.id === value || step.agent === value);
}

export function readFlowState(projectRoot) {
  const path = statePath(projectRoot);
  if (!existsSync(path)) return null;
  return readJsonSafe(path);
}

export function getNextStep(state) {
  const completed = new Set(state.completed ?? []);
  const pending = state.pending?.length
    ? state.pending
    : APPGEN_STEPS.map(step => step.id).filter(id => !completed.has(id));

  const nextId = pending.find(id => !completed.has(id));
  return normalizeStep(nextId) ?? null;
}

export function completeStep(projectRoot, stepOrAgent, files = []) {
  const step = normalizeStep(stepOrAgent);
  if (!step) {
    throw new Error(`Unknown AppGen step: ${stepOrAgent}`);
  }

  const releaseLock = acquireStateLock(projectRoot);
  try {
    const path = statePath(projectRoot);
    const state = readJsonSafe(path);
    const completed = new Set(state.completed ?? []);
    const alreadyCompleted = completed.has(step.id);
    const currentStep = getNextStep(state);

    if (alreadyCompleted) {
      return { state, completed: step, next: currentStep, alreadyCompleted: true };
    }

    if (currentStep && currentStep.id !== step.id) {
      throw new Error(
        `Cannot complete "${step.id}" while current phase is "${currentStep.id}".`
      );
    }

    if (!currentStep) {
      throw new Error('The AppGen flow is already complete.');
    }

    completed.add(step.id);

    const pendingSource = state.pending?.length
      ? state.pending
      : APPGEN_STEPS.map(s => s.id);
    const pending = pendingSource.filter(id => id !== step.id && !completed.has(id));
    const checkpointFiles = files.length ? files : step.files;
    const next = getNextStep({ ...state, completed: [...completed], pending });

    const implementationLoop = step.id === 'implementation-loop'
      ? readImplementationLoopForCompletion(projectRoot, state)
      : buildInitialImplementationLoop(state);

    const nextState = {
      ...state,
      phase: next?.id ?? 'complete',
      completed: [...completed],
      pending,
      implementation_loop: implementationLoop,
      checkpoints: {
        ...(state.checkpoints ?? {}),
        [step.agent]: {
          completed_at: new Date().toISOString(),
          files: checkpointFiles,
        },
      },
    };

    writeFileAtomic(path, JSON.stringify(nextState, null, 2));
    markPlanStep(projectRoot, step.agent, step.id);
    return { state: nextState, completed: step, next };
  } finally {
    releaseLock();
  }
}

export function markPlanStep(projectRoot, agentId, stepId = agentId) {
  const path = planPath(projectRoot);
  if (!existsSync(path)) return false;

  const content = readFileSync(path, 'utf8');
  let updated = content.replace(`- [ ] ${agentId}`, `- [x] ${agentId}`);
  if (updated === content) {
    updated = content.replace(`- [ ] ${stepId}`, `- [x] ${stepId}`);
  }
  if (updated === content) return false;

  writeFileAtomic(path, updated);
  return true;
}
