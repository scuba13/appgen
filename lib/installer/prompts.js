import inquirer from 'inquirer';
import { applyOrangeTheme, ORANGE_PREFIX } from './orange-prompts.js';
import { FINAL_APP_AGENT_IDS } from './agent-ids.js';

applyOrangeTheme();

const P = { prefix: ORANGE_PREFIX };
const promptTitle = (number, message, suffix = 'none') => {
  const tail = suffix === 'checkbox' ? '\n\n' : suffix === 'list' ? '\n' : '';
  return `\n${number}. ${message}${tail}`;
};

export async function runInstallPrompts(detectedEngines) {
  const engineChoices = detectedEngines.map(e => ({
    name: `${e.name}${e.star ? ' (recommended)' : ''}`,
    value: e.id,
    checked: e.detected,
  }));

  const answers = await inquirer.prompt([
    {
      ...P,
      type: 'checkbox',
      name: 'engines',
      message: promptTitle(1, 'Engines Harness to support', 'checkbox'),
      choices: engineChoices,
      loop: false,
      pageSize: 12,
      validate: (selected) => selected.length > 0 || 'Select at least one engine.',
    },
    {
      ...P,
      type: 'input',
      name: 'project_name',
      message: promptTitle(2, 'Project name:'),
      default: process.cwd().split(/[\\/]/).pop(),
      validate: (v) => v.trim().length > 0 || 'Name cannot be empty.',
    },
    {
      ...P,
      type: 'input',
      name: 'user_name',
      message: promptTitle(3, 'What should the agents call you?'),
      validate: (v) => v.trim().length > 0 || 'Name cannot be empty.',
    },
    {
      ...P,
      type: 'input',
      name: 'chat_language',
      message: promptTitle(4, 'Language for agent interactions:'),
      default: 'pt-br',
    },
    {
      ...P,
      type: 'input',
      name: 'doc_language',
      message: promptTitle(5, 'Language for generated documents and specs:'),
      default: 'Português',
    },
    {
      ...P,
      type: 'input',
      name: 'output_folder',
      message: promptTitle(6, 'Output folder for specs:'),
      default: '_appgen_specs',
    },
    {
      ...P,
      type: 'list',
      name: 'git_strategy',
      message: promptTitle(7, 'How to handle artifacts in git?', 'list'),
      loop: false,
      choices: [
        { name: 'Commit with the project (recommended for teams)', value: 'commit' },
        { name: 'Add to .gitignore (personal use)', value: 'gitignore' },
      ],
    },
    {
      ...P,
      type: 'list',
      name: 'answer_mode',
      message: promptTitle(8, 'How do you prefer to answer agent questions?', 'list'),
      loop: false,
      choices: [
        { name: 'In the chat (faster)', value: 'chat' },
        { name: 'In the questions.md file (more organized)', value: 'file' },
      ],
    },
  ]);

  return {
    ...answers,
    company_profile: 'default',
    workflow_mode: 'final-app',
    teams: ['final-app'],
    agents: FINAL_APP_AGENT_IDS,
  };
}

export async function askMergeStrategy(filePath) {
  const { strategy } = await inquirer.prompt([
    {
      ...P,
      type: 'list',
      name: 'strategy',
      message: `\nThe file "${filePath}" already exists. What to do?\n\n`,
      loop: false,
      choices: [
        { name: 'Merge: add AppGen content at the end', value: 'merge' },
        { name: 'Skip: keep the file as is', value: 'skip' },
      ],
    },
  ]);
  return strategy;
}
