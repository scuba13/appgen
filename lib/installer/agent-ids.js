export const CORE_AGENT_IDS = [
  'appgen',
  'appgen-brief',
  'appgen-standards',
  'appgen-product',
  'appgen-architect',
  'appgen-specs',
  'appgen-scaffold',
];

export const IMPLEMENTATION_AGENT_IDS = [
  'appgen-slicer',
  'appgen-coder',
  'appgen-qa',
  'appgen-quality',
  'appgen-acceptance',
  'appgen-docs',
  'appgen-handoff',
];

export const FINAL_APP_AGENT_IDS = [
  ...CORE_AGENT_IDS,
  ...IMPLEMENTATION_AGENT_IDS,
];
