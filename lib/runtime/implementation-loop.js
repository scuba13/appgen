import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { buildInitialImplementationLoop } from './flow.js';
import { appendActivityLog } from './activity-log.js';

function statePath(projectRoot) {
  return join(projectRoot, '.appgen', 'state.json');
}

function loopStatePath(projectRoot, workDir) {
  return join(projectRoot, workDir, 'loop-state.json');
}

function progressPath(projectRoot, workDir) {
  return join(projectRoot, workDir, 'progress.jsonl');
}

function writeFileAtomic(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tempPath, content, 'utf8');
  renameSync(tempPath, path);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function without(values, value) {
  return (values ?? []).filter(item => item !== value);
}

export function parseSliceIds(markdown) {
  return unique([...String(markdown || '').matchAll(/\bS\d{3,}\b/g)].map(match => match[0]));
}

export function readAppGenState(projectRoot) {
  return readJsonSafe(statePath(projectRoot));
}

export function readLoopState(projectRoot, state = readAppGenState(projectRoot)) {
  const workDir = state.work_folder || '_appgen_work';
  const path = loopStatePath(projectRoot, workDir);
  if (existsSync(path)) return readJsonSafe(path);
  return buildInitialImplementationLoop(state);
}

export function writeLoopState(projectRoot, state, loop) {
  const workDir = state.work_folder || '_appgen_work';
  writeFileAtomic(loopStatePath(projectRoot, workDir), JSON.stringify(loop, null, 2));
  const fullFlowPhase = ['complete', 'slicer', 'implementation-loop', 'handoff'].includes(state.phase);

  const nextState = {
    ...state,
    phase: fullFlowPhase ? 'implementation-loop' : state.phase,
    implementation_loop: loop,
  };
  writeFileAtomic(statePath(projectRoot), JSON.stringify(nextState, null, 2));
  return nextState;
}

export function appendProgressEvent(projectRoot, state, event) {
  const workDir = state.work_folder || '_appgen_work';
  const entry = {
    ts: new Date().toISOString(),
    ...event,
  };
  mkdirSync(join(projectRoot, workDir), { recursive: true });
  appendFileSync(progressPath(projectRoot, workDir), `${JSON.stringify(entry)}\n`, 'utf8');
  appendActivityLog(projectRoot, state, entry);
  return entry;
}

export function initImplementationLoop(projectRoot) {
  const state = readAppGenState(projectRoot);
  const specsDir = state.output_folder || '_appgen_specs';
  const workDir = state.work_folder || '_appgen_work';
  const slicesPath = join(projectRoot, specsDir, 'feature-slices.md');
  const sliceIds = existsSync(slicesPath)
    ? parseSliceIds(readFileSync(slicesPath, 'utf8'))
    : [];

  const existing = readLoopState(projectRoot, state);
  const done = existing.done_slices ?? [];
  const blocked = existing.blocked_slices ?? [];
  const open = unique([
    ...(existing.open_slices ?? []),
    ...sliceIds,
  ]).filter(id => !done.includes(id) && !blocked.includes(id));

  const loop = {
    ...buildInitialImplementationLoop({ ...state, implementation_loop: existing }),
    status: open.length > 0 ? 'ready' : 'not_started',
    open_slices: open,
    done_slices: done,
    blocked_slices: blocked,
    last_agent: 'appgen-slicer',
    last_report: join(workDir, 'loop-state.json'),
    preview_environment: existing.preview_environment || {
      status: 'not_started',
      recommendation: 'Run node .appgen/bin/appgen.js preview-validation before the first coding slice.',
      report: null,
    },
  };

  const nextState = writeLoopState(projectRoot, state, loop);
  appendProgressEvent(projectRoot, nextState, {
    agent: 'appgen-slicer',
    event: 'loop-initialized',
    status: loop.status,
    open_slices: loop.open_slices,
    done_slices: loop.done_slices,
    blocked_slices: loop.blocked_slices,
    report: join(workDir, 'loop-state.json'),
  });

  return { state: nextState, loop, path: join(workDir, 'loop-state.json') };
}

export function updateImplementationLoop(projectRoot, update) {
  const state = readAppGenState(projectRoot);
  const loop = readLoopState(projectRoot, state);
  const event = update.event || 'progress';
  const slice = update.slice || loop.current_slice || null;
  const agent = update.agent || 'appgen';
  const report = update.report || null;

  let nextLoop = {
    ...loop,
    last_agent: agent,
    last_report: report || loop.last_report || null,
  };

  if (update.startSlice) {
    const id = update.startSlice;
    nextLoop = {
      ...nextLoop,
      status: 'running',
      current_slice: id,
      iteration: (nextLoop.iteration ?? 0) + 1,
      open_slices: unique([...(nextLoop.open_slices ?? []), id]).filter(
        openId => !(nextLoop.done_slices ?? []).includes(openId)
      ),
    };
  } else if (update.completeSlice) {
    const id = update.completeSlice;
    const open = without(nextLoop.open_slices, id);
    const done = unique([...(nextLoop.done_slices ?? []), id]);
    nextLoop = {
      ...nextLoop,
      status: open.length > 0 ? 'ready' : 'complete',
      current_slice: nextLoop.current_slice === id ? null : nextLoop.current_slice,
      open_slices: open,
      done_slices: done,
      blocked_slices: without(nextLoop.blocked_slices, id),
    };
  } else if (update.blockSlice) {
    const id = update.blockSlice;
    const open = without(nextLoop.open_slices, id);
    nextLoop = {
      ...nextLoop,
      status: open.length > 0 ? 'ready' : 'blocked',
      current_slice: nextLoop.current_slice === id ? null : nextLoop.current_slice,
      open_slices: open,
      blocked_slices: unique([...(nextLoop.blocked_slices ?? []), id]),
    };
  } else if (event.includes('failed')) {
    nextLoop = {
      ...nextLoop,
      status: 'running',
    };
  }

  const nextState = writeLoopState(projectRoot, state, nextLoop);
  const progress = appendProgressEvent(projectRoot, nextState, {
    agent,
    event,
    status: nextLoop.status,
    slice,
    report,
    current_slice: nextLoop.current_slice,
    open_slices: nextLoop.open_slices,
    done_slices: nextLoop.done_slices,
    blocked_slices: nextLoop.blocked_slices,
  });

  return { state: nextState, loop: nextLoop, progress };
}
