import { existsSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

export const ENGINES = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    star: true,
    entryFile: 'CLAUDE.md',
    entryTemplate: 'CLAUDE.md',
    skillsDir: '.claude/skills',
    universalSkillsDir: '.agents/skills',
    commandTemplates: [
      {
        template: 'appgen.md',
        target: '.claude/commands/appgen.md',
      },
    ],
  },
  {
    id: 'codex',
    name: 'Codex',
    star: true,
    entryFile: 'AGENTS.md',
    entryTemplate: 'AGENTS.md',
    skillsDir: '.agents/skills',
    universalSkillsDir: '.agents/skills',
  },
];

function commandExists(cmd) {
  if (!/^[a-zA-Z0-9_-]+$/.test(cmd)) return false;
  try {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    execFileSync(finder, [cmd], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function detectEngines(projectRoot) {
  const detectors = {
    'claude-code': (r) => existsSync(join(r, '.claude')) || commandExists('claude'),
    'codex':       (r) => existsSync(join(r, 'AGENTS.md')) || commandExists('codex'),
  };

  return ENGINES.map(engine => ({
    ...engine,
    detected: detectors[engine.id]?.(projectRoot) ?? false,
  }));
}
