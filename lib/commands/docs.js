import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { readJsonSafe } from '../utils/json-safe.js';
import { appendProgressEvent } from '../runtime/implementation-loop.js';

async function loadChalk() {
  try {
    const mod = await import('chalk');
    return mod.default;
  } catch {
    const passthrough = text => text;
    return {
      bold: passthrough,
      cyan: passthrough,
      gray: passthrough,
      yellow: passthrough,
      red: passthrough,
      hex: () => passthrough,
    };
  }
}

function hasArg(args, name) {
  return args.includes(name);
}

function readText(projectRoot, relPath) {
  const absPath = join(projectRoot, relPath);
  if (!existsSync(absPath)) return '';
  return readFileSync(absPath, 'utf8');
}

function firstHeading(markdown, fallback) {
  const match = String(markdown || '').match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function section(markdown, title, fallback = 'Nao documentado ainda.') {
  const pattern = new RegExp(`^##\\s+${title}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`, 'im');
  const match = String(markdown || '').match(pattern);
  const value = match?.[1]?.trim();
  return value || fallback;
}

function stripMarkdown(markdown, limit = 900) {
  const text = String(markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Nao documentado ainda.';
  return text.length > limit ? `${text.slice(0, limit - 1).trim()}...` : text;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeFile(projectRoot, relPath, content, { force }) {
  const absPath = join(projectRoot, relPath);
  if (existsSync(absPath) && !force) return false;
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf8');
  return true;
}

function markdownDoc(title, intro, sections) {
  return [
    `# ${title}`,
    '',
    intro,
    '',
    ...sections.flatMap(([heading, body]) => [`## ${heading}`, '', body || 'Nao documentado ainda.', '']),
  ].join('\n').trimEnd() + '\n';
}

function renderProjectHtml(data) {
  const cards = data.cards.map(card => `
      <article class="card">
        <span class="eyebrow">${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <p>${escapeHtml(card.detail)}</p>
      </article>`).join('');

  const sections = data.sections.map(item => `
      <section id="${escapeHtml(item.id)}" class="panel">
        <div class="panel-heading">
          <span>${escapeHtml(item.kicker)}</span>
          <h2>${escapeHtml(item.title)}</h2>
        </div>
        <p>${escapeHtml(item.body)}</p>
      </section>`).join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="appgen-category" content="project-documentation">
  <meta name="appgen-producer-agent" content="appgen-docs">
  <meta name="appgen-generated-at" content="${escapeHtml(data.generatedAt)}">
  <title>${escapeHtml(data.project)} | Documentacao do Projeto</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17202a;
      --muted: #5d6b78;
      --line: #d9e0e7;
      --paper: #f8fafc;
      --panel: #ffffff;
      --accent: #0f766e;
      --accent-2: #b45309;
      --shadow: 0 18px 55px rgba(23, 32, 42, .10);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        linear-gradient(135deg, rgba(15, 118, 110, .10), transparent 36rem),
        linear-gradient(315deg, rgba(180, 83, 9, .10), transparent 30rem),
        var(--paper);
      line-height: 1.55;
    }
    header {
      padding: 32px clamp(20px, 5vw, 64px) 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(248, 250, 252, .88);
      position: sticky;
      top: 0;
      z-index: 5;
      backdrop-filter: blur(12px);
    }
    .topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      max-width: 1180px;
      margin: 0 auto;
    }
    .brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .brand span {
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      font-size: clamp(28px, 4vw, 56px);
      line-height: 1;
      letter-spacing: 0;
    }
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
    }
    nav a {
      color: var(--ink);
      text-decoration: none;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 8px 12px;
      background: var(--panel);
      font-size: 13px;
      font-weight: 700;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 34px clamp(20px, 5vw, 64px) 64px;
    }
    .summary {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(280px, .7fr);
      gap: 24px;
      align-items: stretch;
    }
    .hero, .card, .panel {
      background: rgba(255,255,255,.92);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .hero { padding: clamp(24px, 4vw, 44px); }
    .hero p {
      max-width: 68ch;
      color: var(--muted);
      font-size: 18px;
      margin: 18px 0 0;
    }
    .cards {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .card { padding: 18px; }
    .eyebrow {
      color: var(--accent-2);
      display: block;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .card strong {
      display: block;
      font-size: 22px;
      line-height: 1.1;
    }
    .card p {
      color: var(--muted);
      margin: 8px 0 0;
      font-size: 14px;
    }
    .content {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      margin-top: 24px;
    }
    .panel { padding: 22px; box-shadow: none; }
    .panel-heading span {
      color: var(--accent);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    h2 {
      margin: 4px 0 12px;
      font-size: 22px;
      letter-spacing: 0;
    }
    .panel p { color: var(--muted); margin: 0; }
    footer {
      color: var(--muted);
      border-top: 1px solid var(--line);
      padding: 18px clamp(20px, 5vw, 64px);
      font-size: 13px;
    }
    footer div { max-width: 1180px; margin: 0 auto; }
    @media (max-width: 820px) {
      header { position: static; }
      .topline, .summary { display: block; }
      nav { justify-content: flex-start; margin-top: 16px; }
      .cards { margin-top: 16px; }
      .content { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topline">
      <div class="brand">
        <span>AppGen project docs</span>
        <h1>${escapeHtml(data.project)}</h1>
      </div>
      <nav aria-label="Seções">
        <a href="#produto">Produto</a>
        <a href="#arquitetura">Arquitetura</a>
        <a href="#api">API</a>
        <a href="#aceite">Aceite</a>
        <a href="#operacao">Operação</a>
      </nav>
    </div>
  </header>
  <main>
    <div class="summary">
      <section class="hero">
        <span class="eyebrow">Visão executiva</span>
        <p>${escapeHtml(data.overview)}</p>
      </section>
      <div class="cards">${cards}
      </div>
    </div>
    <div class="content">${sections}
    </div>
  </main>
  <footer>
    <div>Gerado por AppGen em ${escapeHtml(data.generatedAt)}. Arquivo autocontido: pode abrir via duplo clique.</div>
  </footer>
</body>
</html>
`;
}

export default async function docs(args) {
  const chalk = await loadChalk();
  const projectRoot = resolve(process.cwd());
  const statePath = join(projectRoot, '.appgen', 'state.json');
  const force = hasArg(args, '--force');

  if (!existsSync(statePath)) {
    console.log(chalk.yellow('\n  AppGen is not installed in this directory.'));
    console.log('  Run ' + chalk.bold('npx appgen install') + ' before generating docs.\n');
    return;
  }

  const state = readJsonSafe(statePath);
  const appRoot = state.app_root || 'app';
  const specsDir = state.output_folder || '_appgen_specs';
  const workDir = state.work_folder || '_appgen_work';
  const docsDir = join(appRoot, 'docs');
  const project = state.project || 'AppGen App';
  const generatedAt = new Date().toISOString();

  const brief = readText(projectRoot, join(specsDir, 'brief.md'));
  const product = readText(projectRoot, join(specsDir, 'product.md'));
  const architecture = readText(projectRoot, join(specsDir, 'target-architecture.md'));
  const domain = readText(projectRoot, join(specsDir, 'domain-model.md'));
  const dataModel = readText(projectRoot, join(specsDir, 'data-model.md'));
  const api = readText(projectRoot, join(specsDir, 'api-contracts.md'));
  const ui = readText(projectRoot, join(specsDir, 'ui-spec.md'));
  const slices = readText(projectRoot, join(specsDir, 'feature-slices.md'));
  const implementation = readText(projectRoot, join(workDir, 'implementation-report.md'));
  const qa = readText(projectRoot, join(workDir, 'qa-report.md'));
  const quality = readText(projectRoot, join(workDir, 'quality-report.md'));
  const acceptance = readText(projectRoot, join(workDir, 'user-acceptance.md'));
  const feedback = readText(projectRoot, join(workDir, 'user-feedback.md'));
  const acceptanceHistory = readText(projectRoot, join(workDir, 'acceptance-history.jsonl'));
  const loopState = readText(projectRoot, join(workDir, 'loop-state.json'));

  const overview = stripMarkdown(brief || product, 520);
  const docs = {
    [join(docsDir, 'README.md')]: markdownDoc(
      `${project} - Documentacao`,
      'Documentacao gerada pelo AppGen para orientar usuarios, admins, devs e operacao.',
      [
        ['Visao Geral', overview],
        ['Mapa de Documentos', '- `user-guide.md`\n- `admin-guide.md`\n- `developer-guide.md`\n- `operations.md`\n- `api.md`\n- `testing.md`\n- `project.html`'],
        ['Feedback e Aceite do Usuario', stripMarkdown([feedback, acceptance, acceptanceHistory].filter(Boolean).join('\n'), 1400)],
        ['Status de Entrega', stripMarkdown(quality, 900)],
      ]
    ),
    [join(docsDir, 'user-guide.md')]: markdownDoc(
      'Guia do Usuario',
      'Guia funcional para pessoas que usam a app.',
      [
        ['Objetivo da App', stripMarkdown(product || brief, 900)],
        ['Telas e Fluxos', stripMarkdown(ui, 1200)],
        ['Regras de Negocio', stripMarkdown(domain, 1000)],
      ]
    ),
    [join(docsDir, 'admin-guide.md')]: markdownDoc(
      'Guia de Administracao',
      'Guia para configuracao, permissoes e operacao funcional.',
      [
        ['Perfis e Permissoes', section(product + '\n' + ui, 'Permissoes', stripMarkdown(ui, 700))],
        ['Dados Criticos', stripMarkdown(dataModel, 900)],
        ['Pendencias Operacionais', stripMarkdown(quality || qa, 900)],
      ]
    ),
    [join(docsDir, 'developer-guide.md')]: markdownDoc(
      'Guia de Desenvolvimento',
      'Guia tecnico para evoluir a app gerada.',
      [
        ['Arquitetura', stripMarkdown(architecture, 1200)],
        ['Dominio', stripMarkdown(domain, 900)],
        ['Slices Implementadas', stripMarkdown(slices || loopState, 1000)],
        ['Relatorio de Implementacao', stripMarkdown(implementation, 900)],
      ]
    ),
    [join(docsDir, 'operations.md')]: markdownDoc(
      'Operacao',
      'Guia operacional para rodar, validar e observar a app.',
      [
        ['Como Rodar', 'Use os comandos documentados no `README.md` do app e no `package.json` gerado. Quando dependencias ainda nao tiverem sido instaladas, rode `pnpm install` dentro do app_root.'],
        ['Preview, Feedback e Aceite', stripMarkdown([feedback, acceptance, acceptanceHistory].filter(Boolean).join('\n'), 1400)],
        ['Observabilidade e Health', stripMarkdown(architecture + '\n' + quality, 1000)],
        ['Riscos e Pendencias', stripMarkdown(quality || qa, 1000)],
      ]
    ),
    [join(docsDir, 'api.md')]: markdownDoc(
      'API',
      'Contratos e comportamento esperado da API.',
      [
        ['Contratos', stripMarkdown(api, 1600)],
        ['Modelo de Dados', stripMarkdown(dataModel, 1000)],
      ]
    ),
    [join(docsDir, 'testing.md')]: markdownDoc(
      'Testes e Validacao',
      'Evidencias, comandos e cobertura de validacao.',
      [
        ['Plano e Resultado de QA', stripMarkdown(qa, 1200)],
        ['Quality Gates', stripMarkdown(quality, 1200)],
        ['Slices', stripMarkdown(slices, 900)],
      ]
    ),
  };

  const htmlData = {
    project,
    generatedAt,
    overview,
    cards: [
      { label: 'Stack', value: `${state.stack?.frontend || 'Next.js'} + ${state.stack?.backend || 'NestJS'}`, detail: `${state.stack?.database || 'PostgreSQL'} / ${state.stack?.package_manager || 'pnpm'}` },
      { label: 'Fluxo', value: state.workflow_mode || 'final-app', detail: `Fase atual: ${state.phase || 'nao iniciada'}` },
      { label: 'Aceite', value: state.acceptance?.status || 'not_started', detail: state.acceptance?.approved_at ? `Aprovado em ${state.acceptance.approved_at}` : 'Feedback e aceite ficam registrados no historico' },
      { label: 'Slices', value: (() => {
        try {
          const parsed = loopState ? JSON.parse(loopState) : {};
          return `${parsed.done_slices?.length || 0}/${(parsed.done_slices?.length || 0) + (parsed.open_slices?.length || 0)}`;
        } catch {
          return '0/0';
        }
      })(), detail: 'Concluidas / planejadas no loop de implementacao' },
    ],
    sections: [
      { id: 'produto', kicker: 'Produto', title: firstHeading(product, 'Produto'), body: stripMarkdown(product || brief, 1000) },
      { id: 'arquitetura', kicker: 'Tecnico', title: firstHeading(architecture, 'Arquitetura'), body: stripMarkdown(architecture, 1000) },
      { id: 'api', kicker: 'Contratos', title: firstHeading(api, 'API'), body: stripMarkdown(api, 1000) },
      { id: 'ui', kicker: 'Experiencia', title: firstHeading(ui, 'UI'), body: stripMarkdown(ui, 900) },
      { id: 'dados', kicker: 'Dados', title: firstHeading(dataModel, 'Modelo de Dados'), body: stripMarkdown(dataModel, 900) },
      { id: 'aceite', kicker: 'Usuario', title: 'Feedback e Aceite', body: stripMarkdown([feedback, acceptance, acceptanceHistory].filter(Boolean).join('\n'), 1400) },
      { id: 'operacao', kicker: 'Entrega', title: 'QA, Quality, Aceite e Operacao', body: stripMarkdown([qa, quality, acceptance, feedback].filter(Boolean).join('\n'), 1000) },
    ],
  };
  docs[join(docsDir, 'project.html')] = renderProjectHtml(htmlData);

  const created = [];
  const skipped = [];
  for (const [relPath, content] of Object.entries(docs)) {
    const wrote = writeFile(projectRoot, relPath, content, { force });
    (wrote ? created : skipped).push(relPath);
  }

  appendProgressEvent(projectRoot, state, {
    agent: 'appgen-docs',
    event: 'docs-generated',
    status: 'done',
    files: [...created, ...skipped],
    report: join(docsDir, 'project.html'),
  });

  console.log(chalk.bold('\n  AppGen: Docs\n'));
  console.log(`  App root:        ${chalk.cyan(appRoot)}`);
  console.log(`  Docs folder:     ${chalk.cyan(docsDir)}`);
  console.log(`  Created files:   ${chalk.hex('#ffa203')(String(created.length))}`);
  console.log(`  Skipped files:   ${chalk.gray(String(skipped.length))}`);
  console.log(`  HTML:            ${chalk.cyan(join(docsDir, 'project.html'))}`);
  if (skipped.length > 0) {
    console.log(`  Rerun with:      ${chalk.bold('appgen docs --force')} to overwrite generated docs`);
  }
  console.log('');
}
