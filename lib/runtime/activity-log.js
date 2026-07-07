import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

function valueForMarkdown(value) {
  if (value == null || value === '') return null;
  if (Array.isArray(value)) return value.length ? value.join(', ') : null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
        'Use este arquivo para revisar o que os agentes fizeram, quais comandos rodaram, quais reports foram gerados e onde houve bloqueio.',
        '',
      ].join('\n'),
      'utf8'
    );
  }

  const ts = event.ts || new Date().toISOString();
  const agent = event.agent || 'appgen';
  const title = event.event || event.status || 'activity';
  const lines = [
    `## ${ts} - ${agent} - ${title}`,
    '',
  ];

  for (const [key, rawValue] of Object.entries(event)) {
    if (['ts', 'agent', 'event'].includes(key)) continue;
    const value = valueForMarkdown(rawValue);
    if (value == null) continue;
    lines.push(`- ${key}: ${value}`);
  }

  lines.push('');
  appendFileSync(logPath, `${lines.join('\n')}\n`, 'utf8');
  return join(workDir, 'activity-log.md');
}
