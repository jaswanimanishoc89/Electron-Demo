function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function boot() {
  if (!window.electronAPI || typeof window.electronAPI.getVersions !== 'function') {
    setText('electron-version', 'unavailable');
    setText('chrome-version', 'unavailable');
    setText('node-version', 'unavailable');
    setText('platform', 'unavailable');
    return;
  }

  const versions = window.electronAPI.getVersions();
  setText('electron-version', versions.electron);
  setText('chrome-version', versions.chrome);
  setText('node-version', versions.node);
  setText('platform', versions.platform);
}

boot();
