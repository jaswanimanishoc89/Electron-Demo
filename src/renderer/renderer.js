function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function applyUpdateState(state) {
  if (!state) {
    return;
  }
  setText('update-status', state.status);
  setText('update-message', state.message || '');
}

async function boot() {
  if (!window.electronAPI) {
    setText('electron-version', 'unavailable');
    setText('update-status', 'unavailable');
    return;
  }

  const versions = await window.electronAPI.getVersions();
  setText('app-version', versions.app);
  setText('electron-version', versions.electron);
  setText('chrome-version', versions.chrome);
  setText('node-version', versions.node);
  setText('platform', versions.platform);

  applyUpdateState(await window.electronAPI.getUpdateState());

  document.getElementById('open-settings')?.addEventListener('click', () => {
    window.electronAPI.openSettings();
  });

  const checkBtn = document.getElementById('check-updates');
  checkBtn?.addEventListener('click', async () => {
    checkBtn.disabled = true;
    setText('update-status', 'checking');
    setText('update-message', 'Checking for updates…');
    try {
      const state = await window.electronAPI.checkForUpdates();
      applyUpdateState(state);
    } finally {
      checkBtn.disabled = false;
    }
  });
}

boot();
