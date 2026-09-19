#!/usr/bin/env node
/**
 * Headless Electron smoke: boot the app briefly, then exit.
 * On CI Linux, run under xvfb-run.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const electronPkg = path.dirname(require.resolve('electron/package.json'));
const platformPath = fs.readFileSync(path.join(electronPkg, 'path.txt'), 'utf8').trim();
const electronBin = path.join(electronPkg, 'dist', platformPath);

if (!fs.existsSync(electronBin)) {
  console.error('Electron binary missing. Run: npm run repair:electron');
  process.exit(1);
}

const args = ['.'];
if (process.env.CI) {
  args.push('--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage');
}

const child = spawn(electronBin, args, {
  cwd: root,
  env: {
    ...process.env,
    ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

const killTimer = setTimeout(() => {
  child.kill('SIGTERM');
}, 8000);

child.on('error', (err) => {
  clearTimeout(killTimer);
  console.error(err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  clearTimeout(killTimer);
  if (signal === 'SIGTERM' || code === 0) {
    console.log('smoke passed (Electron stayed up)');
    process.exit(0);
  }
  console.error('Electron exited unexpectedly', { code, signal });
  if (stderr) console.error(stderr.slice(-4000));
  process.exit(1);
});
