const LOGO_LINES = [
  '   _                  ____            ',
  '  / \\   _ __  _ __   / ___| ___ _ __  ',
  " / _ \\ | '_ \\| '_ \\ | |  _ / _ \\ '_ \\ ",
  '/ ___ \\| |_) | |_) || |_| |  __/ | | |',
  '/_/   \\_\\ .__/| .__/  \\____|\\___|_| |_|',
  '        |_|   |_|                       ',
];

const LOGO_COLOR = '#ffa203';

export function clearTerminalForLogo() {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[2J\x1b[H');
  }
}

export function renderAppGenLogo(chalk) {
  const logo = chalk.hex(LOGO_COLOR);
  const maxWidth = Math.max(...LOGO_LINES.map(line => line.length));

  return LOGO_LINES
    .map(line => logo(line.padEnd(maxWidth)))
    .join('\n');
}
