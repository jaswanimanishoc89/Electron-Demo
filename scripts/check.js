#!/usr/bin/env node
/** Syntax + structure checks (no Electron window required). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
if (pkg.main !== 'src/main.js') {
  console.error('package.json main must be src/main.js');
  process.exit(1);
}
for (const script of ['start', 'check', 'test', 'smoke']) {
  if (!pkg.scripts || !pkg.scripts[script]) {
    console.error('Missing npm script: ' + script);
    process.exit(1);
  }
}

const required = [
  'src/main.js',
  'src/preload.js',
  'src/updater.js',
  'src/settings-store.js',
  'src/library/epic-discovery.js',
  'src/library/service.js',
  'src/renderer/index.html',
  'src/renderer/app.js',
  'scripts/ensure-electron.js',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error('Missing required file:', rel);
    process.exit(1);
  }
}

const files = walk(path.join(root, 'src')).concat(walk(path.join(root, 'scripts')));
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || result.stdout || ('check failed: ' + file));
  } else {
    console.log('OK', path.relative(root, file));
  }
}

if (failed) process.exit(1);
console.log('check passed (' + files.length + ' files)');
