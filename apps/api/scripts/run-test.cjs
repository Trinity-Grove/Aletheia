const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);
const isIntegration = args.some(
  (arg) =>
    arg.includes('integration') ||
    arg.includes('test/') ||
    arg.includes('test\\') ||
    arg.includes('e2e'),
);

const jestArgs = isIntegration
  ? ['--config', './test/jest-integration.json', '--runInBand', ...args]
  : ['--runInBand', ...args];

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const res = spawnSync(cmd, ['jest', ...jestArgs], {
  stdio: 'inherit',
  shell: true,
});
process.exit(res.status ?? 0);
