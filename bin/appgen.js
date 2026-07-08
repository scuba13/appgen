#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { clearTerminalForLogo, renderAppGenLogo } from '../lib/utils/banner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const [,, command, ...args] = process.argv;

const commands = {
  install:            () => import('../lib/commands/install.js'),
  update:             () => import('../lib/commands/update.js'),
  status:             () => import('../lib/commands/status.js'),
  next:               () => import('../lib/commands/next.js'),
  log:                () => import('../lib/commands/log.js'),
  environment:        () => import('../lib/commands/environment.js'),
  loop:               () => import('../lib/commands/loop.js'),
  'preview-validation': () => import('../lib/commands/preview-validation.js'),
  acceptance:         () => import('../lib/commands/acceptance.js'),
  docs:               () => import('../lib/commands/docs.js'),
  scaffold:           () => import('../lib/commands/scaffold.js'),
  uninstall:          () => import('../lib/commands/uninstall.js'),
  'add-agent':        () => import('../lib/commands/add-agent.js'),
  'add-engine':       () => import('../lib/commands/add-engine.js'),
};

async function loadChalk() {
  try {
    const mod = await import('chalk');
    return mod.default;
  } catch {
    return {
      hex: () => text => text,
    };
  }
}

if (!command || command === '--help' || command === '-h') {
  const chalk = await loadChalk();
  clearTerminalForLogo();
  console.log(renderAppGenLogo(chalk) + `

  appgen v${pkg.version}

  Uso: npx appgen-ai <comando>

  Comandos:
    install            Instala o AppGen no projeto atual
    update             Atualiza os agentes para a última versão
    status             Mostra o estado atual da geração do app
    next               Mostra ou atualiza o próximo passo do fluxo AppGen
    log                Registra mensagem/resumo do agente no activity-log.md
    environment        Verifica Docker/Compose e planeja ambiente containerizado
    loop               Mostra ou atualiza o loop de implementação por slices
    preview-validation Sobe preview local e roda smoke test antes do aceite
    acceptance         Prepara preview e registra aceite ou feedback do usuário
    docs               Gera documentação Markdown e HTML da app criada
    scaffold           Gera o app base no app_root configurado
    uninstall          Remove o AppGen do projeto
    add-agent          Adiciona um agente ao projeto
    add-engine         Adiciona suporte a uma engine

  Fluxos principais no chat (após a instalação):
    appgen           Conduz a criação de um app conforme padrões da empresa

  Opções úteis:
    install --company <default|caminho>  Usa um company profile do preset ou local
  Stack padrão: Next.js, NestJS, TypeScript e PostgreSQL
  `);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(pkg.version);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`\n  Comando desconhecido: "${command}"`);
  console.error('  Execute "npx appgen-ai --help" para ver os comandos disponíveis.\n');
  process.exit(1);
}

const mod = await commands[command]();
await mod.default(args);
