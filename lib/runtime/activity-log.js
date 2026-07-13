import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const PROGRESS_ONLY_EVENTS = new Set([
  'scaffold-file-created',
  'scaffold-file-skipped',
]);

const ORDERED_DETAIL_KEYS = [
  'status',
  'phase',
  'slice',
  'target',
  'preset',
  'report',
  'next_step',
  'next_recommended_action',
  'commands',
  'files',
  'decisions',
  'checks',
  'open_slices',
  'done_slices',
  'blocked_slices',
  'current_slice',
  'awaiting_user_decision',
];

function valueForMarkdown(value) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    if (!value.length) return null;
    if (value.every(item => item == null || ['string', 'number', 'boolean'].includes(typeof item))) {
      if (value.length <= 3) return value.join(', ');
      return `\n${value.map(item => `  - ${item}`).join('\n')}`;
    }
    return `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  }
  if (typeof value === 'object') {
    return `\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
  }
  return String(value);
}

function appendField(lines, key, rawValue) {
  const value = valueForMarkdown(rawValue);
  if (value == null) return false;
  if (value.startsWith('\n')) {
    lines.push(`- ${key}:`);
    lines.push(value.replace(/^\n/, '').trimEnd());
  } else {
    lines.push(`- ${key}: ${value}`);
  }
  return true;
}

function appendMultiline(lines, label, value) {
  if (value == null || value === '') return;
  lines.push(`### ${label}`);
  lines.push('');
  lines.push(String(value).trim());
  lines.push('');
}

function appendStateSnapshot(lines, state) {
  const loop = state.implementation_loop || {};
  const acceptance = state.acceptance || {};
  const snapshot = {
    phase: state.phase,
    app_root: state.app_root,
    loop_status: loop.status,
    current_slice: loop.current_slice,
    open_slices: loop.open_slices,
    done_slices: loop.done_slices,
    blocked_slices: loop.blocked_slices,
    awaiting_user_decision: loop.awaiting_user_decision,
    acceptance_status: acceptance.status,
    next_action: loop.next_recommended_action || acceptance.next_step,
  };

  const entries = Object.entries(snapshot).filter(([, value]) => valueForMarkdown(value) != null);
  if (!entries.length) return;

  lines.push('### Estado Do Fluxo');
  lines.push('');
  for (const [key, value] of entries) {
    appendField(lines, key, value);
  }
  lines.push('');
}

export function appendActivityLog(projectRoot, state, event) {
  const workDir = state.work_folder || '_appgen_work';
  const logPath = join(projectRoot, workDir, 'activity-log.md');
  mkdirSync(join(projectRoot, workDir), { recursive: true });

  if (!existsSync(logPath)) {
    writeFileSync(
      logPath,
      [
        '# AppGen Activity Log',
        '',
        'Registro em Markdown do progresso do fluxo AppGen nesta pasta.',
        'Use este arquivo para revisar decisoes, mensagens ao usuario, reports gerados e bloqueios.',
        'Eventos mecanicos detalhados ficam em `_appgen_work/progress.jsonl`.',
        '',
        '## Como Revisar',
        '',
        '- Leia as entradas de baixo para cima para ver o estado mais recente primeiro.',
        '- Use `progress.jsonl` quando precisar filtrar eventos por agente, slice, comando ou status.',
        '- Eventos de arquivo criado pelo scaffold ficam somente no JSONL para evitar ruido neste Markdown.',
        '',
        '',
      ].join('\n'),
      'utf8'
    );
  }

  if (PROGRESS_ONLY_EVENTS.has(event.event)) {
    return join(workDir, 'activity-log.md');
  }

  const ts = event.ts || new Date().toISOString();
  const agent = event.agent || 'appgen';
  const title = event.event || event.status || 'activity';
  const lines = [
    `## ${ts} - ${agent} - ${title}`,
    '',
  ];

  appendMultiline(lines, 'Mensagem Ao Usuario', event.user_message);
  appendMultiline(lines, 'Resumo', event.summary);
  appendStateSnapshot(lines, state);

  const ignoredKeys = new Set(['ts', 'agent', 'event', 'user_message', 'summary']);
  const writtenKeys = new Set();
  for (const key of ORDERED_DETAIL_KEYS) {
    if (ignoredKeys.has(key)) continue;
    if (appendField(lines, key, event[key])) writtenKeys.add(key);
  }
  for (const [key, rawValue] of Object.entries(event)) {
    if (ignoredKeys.has(key) || writtenKeys.has(key)) continue;
    appendField(lines, key, rawValue);
  }

  lines.push('');
  appendFileSync(logPath, `${lines.join('\n')}\n`, 'utf8');
  return join(workDir, 'activity-log.md');
}
