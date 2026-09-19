function setStatus(text) {
  const el = document.getElementById('save-status');
  if (el) {
    el.textContent = text;
  }
}

function applyUpdateSummary(state) {
  const el = document.getElementById('update-summary');
  if (!el || !state) {
    return;
  }
  const checked = state.lastCheckedAt
    ? ` Last checked: ${new Date(state.lastCheckedAt).toLocaleString()}.`
    : '';
  el.textContent = `${state.message}${checked}`;
}

async function persistFromControls() {
  const launchAtLogin = document.getElementById('launch-at-login').checked;
  const minimizeToTray = document.getElementById('minimize-to-tray').checked;
  await window.electronAPI.setSettings({ launchAtLogin, minimizeToTray });
  setStatus('Saved.');
}

async function boot() {
  if (!window.electronAPI) {
    setStatus('electronAPI unavailable');
    return;
  }

  const settings = await window.electronAPI.getSettings();
  document.getElementById('launch-at-login').checked = Boolean(settings.launchAtLogin);
  document.getElementById('minimize-to-tray').checked = Boolean(settings.minimizeToTray);

  applyUpdateSummary(await window.electronAPI.getUpdateState());

  document.getElementById('launch-at-login').addEventListener('change', persistFromControls);
  document.getElementById('minimize-to-tray').addEventListener('change', persistFromControls);

  const checkBtn = document.getElementById('check-updates');
  checkBtn.addEventListener('click', async () => {
    checkBtn.disabled = true;
    setStatus('Checking for updates…');
    try {
      const state = await window.electronAPI.checkForUpdates();
      applyUpdateSummary(state);
      setStatus('Update check finished.');
    } finally {
      checkBtn.disabled = false;
    }
  });
}

boot();
