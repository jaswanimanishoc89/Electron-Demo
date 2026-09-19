/**
 * Auto-update stub.
 * Swap checkForUpdates() for electron-updater (or similar) when packaging.
 */

const APP_VERSION = '1.0.0';

/** @type {'idle' | 'checking' | 'available' | 'not-available' | 'error'} */
let status = 'idle';
let lastMessage = 'No update check yet.';
let lastCheckedAt = null;

function getUpdateState() {
  return {
    status,
    message: lastMessage,
    currentVersion: APP_VERSION,
    lastCheckedAt,
  };
}

function checkForUpdates() {
  status = 'checking';
  lastMessage = 'Checking for updates…';

  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulated result for the demo shell.
      status = 'not-available';
      lastMessage = `You're on v${APP_VERSION}. No updates found (stub).`;
      lastCheckedAt = new Date().toISOString();
      resolve(getUpdateState());
    }, 1200);
  });
}

module.exports = {
  getUpdateState,
  checkForUpdates,
};
