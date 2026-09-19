#!/usr/bin/env node
/** Lightweight unit smoke — no BrowserWindow. */
const assert = require('assert');
const path = require('path');

const updater = require(path.join(__dirname, '..', 'src', 'updater.js'));

const initial = updater.getUpdateState();
assert.strictEqual(initial.status, 'idle');
assert.ok(initial.currentVersion);

updater.checkForUpdates().then((state) => {
  assert.ok(['not-available', 'available', 'error'].includes(state.status));
  assert.ok(state.message);
  assert.ok(state.lastCheckedAt);
  console.log('test passed:', state.status, state.message);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
