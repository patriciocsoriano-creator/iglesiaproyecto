const { spawnSync } = require('node:child_process');

if (process.platform !== 'win32') {
  console.log('iOS/macOS: se omite electron-rebuild.');
  process.exit(0);
}

const result = spawnSync(
  'npx.cmd',
  ['electron-rebuild', '-f', '-w', 'better-sqlite3'],
  { stdio: 'inherit', shell: true }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
