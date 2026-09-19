/** @typedef {import('../library/types').Game} Game */
/** @typedef {import('../library/types').LibrarySnapshot} LibrarySnapshot */

const state = {
  view: 'library',
  mode: 'grid',
  snapshot: /** @type {LibrarySnapshot|null} */ (null),
  selectedId: /** @type {string|null} */ (null),
};

const UPDATE_LABELS = {
  unknown: { text: 'Unknown', cls: '' },
  checking: { text: 'Checking…', cls: 'accent' },
  up_to_date: { text: 'Up to date', cls: 'ok' },
  update_available: { text: 'Update available', cls: 'warn' },
  error: { text: 'Update error', cls: 'danger' },
};

function monogram(title) {
  const parts = String(title || '?').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function badgeHtml(status) {
  const meta = UPDATE_LABELS[status] || UPDATE_LABELS.unknown;
  return `<span class="badge ${meta.cls}">${meta.text}</span>`;
}

function $(id) {
  return document.getElementById(id);
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  $('view-library').classList.toggle('hidden', view !== 'library');
  $('view-settings').classList.toggle('hidden', view !== 'settings');
  if (view !== 'library') closeDrawer();
  window.location.hash = view;
}

function closeDrawer() {
  state.selectedId = null;
  $('drawer').classList.add('hidden');
  document.querySelector('.app').classList.remove('drawer-open');
}

function openDrawer(gameId) {
  state.selectedId = gameId;
  const game = (state.snapshot?.games || []).find((g) => g.id === gameId);
  if (!game) return;
  document.querySelector('.app').classList.add('drawer-open');
  $('drawer').classList.remove('hidden');
  $('drawer-cover').textContent = monogram(game.title);
  $('drawer-title').textContent = game.title;
  const badgeMeta = UPDATE_LABELS[game.updateStatus] || UPDATE_LABELS.unknown;
  $('drawer-badge').className = `badge ${badgeMeta.cls}`.trim();
  $('drawer-badge').textContent = badgeMeta.text;
  const play = $('drawer-play');
  if (game.installState === 'installed') {
    play.textContent = 'Play';
    play.disabled = false;
  } else {
    play.textContent = 'Install in Epic';
    play.disabled = false;
  }
  $('drawer-last-played').textContent = game.lastPlayedAt
    ? new Date(game.lastPlayedAt).toLocaleString()
    : '—';
  $('drawer-path').textContent = game.installPath || '—';
  $('drawer-update-msg').textContent = game.updateMessage || '—';
  $('drawer-status').textContent = '';
}

function renderEmpty(snapshot) {
  if (!snapshot.epicDetected) {
    return `
      <div class="empty">
        <h2>Epic Games Launcher not found</h2>
        <p>Install or open Epic Games Launcher, then scan again.</p>
        <button type="button" class="primary-btn" data-action="scan">Scan again</button>
      </div>`;
  }
  if (!snapshot.games.length) {
    return `
      <div class="empty">
        <h2>No Epic games yet</h2>
        <p>We couldn’t find games in your Epic library.</p>
        <button type="button" class="primary-btn" data-action="scan">Scan library</button>
      </div>`;
  }
  return '';
}

function renderGrid(games) {
  return `<div class="grid">${games
    .map((g) => {
      const canPlay = g.installState === 'installed';
      return `
      <button type="button" class="card-game" data-open="${g.id}">
        <div class="cover">
          <div class="cover-badges">
            ${badgeHtml(g.updateStatus)}
            ${g.installState !== 'installed' ? '<span class="badge">Not installed</span>' : ''}
          </div>
          <span class="monogram">${monogram(g.title)}</span>
        </div>
        <div class="card-footer">
          <strong>${escapeHtml(g.title)}</strong>
          <button type="button" class="play-mini" data-launch="${g.id}" ${canPlay ? '' : 'disabled'}>Play</button>
        </div>
      </button>`;
    })
    .join('')}</div>`;
}

function renderList(games) {
  return `<div class="list">${games
    .map((g) => {
      const canPlay = g.installState === 'installed';
      return `
      <button type="button" class="list-row" data-open="${g.id}">
        <div class="thumb">${monogram(g.title)}</div>
        <div>
          <strong>${escapeHtml(g.title)}</strong>
          <div class="muted">${g.installState === 'installed' ? 'Installed' : 'Not installed'}</div>
        </div>
        ${badgeHtml(g.updateStatus)}
        <button type="button" class="play-mini" data-launch="${g.id}" ${canPlay ? '' : 'disabled'}>Play</button>
      </button>`;
    })
    .join('')}</div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLibrary() {
  const snapshot = state.snapshot;
  const body = $('library-body');
  const banner = $('scan-banner');
  const sub = $('library-sub');

  if (!snapshot) {
    body.innerHTML = '<div class="empty"><p class="muted">Loading library…</p></div>';
    return;
  }

  sub.textContent = snapshot.epicDetected
    ? `${snapshot.games.length} Epic title(s)`
    : 'Epic not detected';

  if (snapshot.scanState === 'scanning') {
    banner.classList.remove('hidden', 'error');
    banner.textContent = snapshot.scanMessage || 'Scanning Epic library…';
  } else if (snapshot.scanState === 'error') {
    banner.classList.remove('hidden');
    banner.classList.add('error');
    banner.textContent = snapshot.scanMessage || 'Scan failed.';
  } else {
    banner.classList.add('hidden');
  }

  const empty = renderEmpty(snapshot);
  if (empty && snapshot.scanState !== 'scanning') {
    body.innerHTML = empty;
    return;
  }

  if (snapshot.scanState === 'scanning' && !snapshot.games.length) {
    body.innerHTML = '<div class="empty"><p class="muted">Scanning Epic library…</p></div>';
    return;
  }

  body.innerHTML = state.mode === 'list' ? renderList(snapshot.games) : renderGrid(snapshot.games);

  if (state.selectedId) {
    openDrawer(state.selectedId);
  }
}

async function refreshLibrary(scan) {
  if (!window.electronAPI?.library) return;
  if (scan) {
    state.snapshot = {
      ...(state.snapshot || { games: [], epicDetected: false }),
      scanState: 'scanning',
      scanMessage: 'Scanning Epic library…',
    };
    renderLibrary();
    state.snapshot = await window.electronAPI.library.scan();
  } else {
    state.snapshot = await window.electronAPI.library.get();
  }
  renderLibrary();
  updateSettingsLibrarySummary();
}

function updateSettingsLibrarySummary() {
  const el = $('settings-library-summary');
  if (!el || !state.snapshot) return;
  const s = state.snapshot;
  const when = s.lastScannedAt ? new Date(s.lastScannedAt).toLocaleString() : 'never';
  el.textContent = `Epic detected: ${s.epicDetected ? 'yes' : 'no'}. Games: ${s.games.length}. Last scanned: ${when}.`;
}

async function loadSettings() {
  if (!window.electronAPI) return;
  const settings = await window.electronAPI.getSettings();
  $('launch-at-login').checked = Boolean(settings.launchAtLogin);
  $('minimize-to-tray').checked = Boolean(settings.minimizeToTray);
  const update = await window.electronAPI.getUpdateState();
  $('settings-update-summary').textContent = update.message || 'No update check yet.';
}

async function launch(gameId) {
  const result = await window.electronAPI.library.launch(gameId);
  if (state.selectedId === gameId) {
    $('drawer-status').textContent = result.message || (result.ok ? 'Launched.' : 'Launch failed.');
  }
  return result;
}

function wireEvents() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  document.querySelectorAll('.segment-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode;
      document.querySelectorAll('.segment-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === state.mode);
      });
      renderLibrary();
    });
  });

  $('btn-scan').addEventListener('click', () => refreshLibrary(true));
  $('settings-scan').addEventListener('click', () => refreshLibrary(true));
  $('drawer-close').addEventListener('click', closeDrawer);

  $('library-body').addEventListener('click', async (e) => {
    const scanBtn = e.target.closest('[data-action="scan"]');
    if (scanBtn) {
      refreshLibrary(true);
      return;
    }
    const launchBtn = e.target.closest('[data-launch]');
    if (launchBtn) {
      e.stopPropagation();
      await launch(launchBtn.dataset.launch);
      return;
    }
    const openBtn = e.target.closest('[data-open]');
    if (openBtn) openDrawer(openBtn.dataset.open);
  });

  $('drawer-play').addEventListener('click', async () => {
    if (state.selectedId) await launch(state.selectedId);
  });

  $('drawer-update').addEventListener('click', async () => {
    if (!state.selectedId) return;
    $('drawer-status').textContent = 'Checking for updates…';
    const game = await window.electronAPI.library.checkUpdate(state.selectedId);
    if (game) {
      const idx = state.snapshot.games.findIndex((g) => g.id === game.id);
      if (idx >= 0) state.snapshot.games[idx] = game;
      openDrawer(game.id);
      renderLibrary();
    }
  });

  $('drawer-epic').addEventListener('click', async () => {
    if (!state.selectedId) return;
    await window.electronAPI.library.launch(state.selectedId);
  });

  async function persistSettings() {
    await window.electronAPI.setSettings({
      launchAtLogin: $('launch-at-login').checked,
      minimizeToTray: $('minimize-to-tray').checked,
    });
  }

  $('launch-at-login').addEventListener('change', persistSettings);
  $('minimize-to-tray').addEventListener('change', persistSettings);

  $('settings-check-updates').addEventListener('click', async () => {
    $('settings-update-summary').textContent = 'Checking for updates…';
    const stateUpdate = await window.electronAPI.checkForUpdates();
    $('settings-update-summary').textContent = stateUpdate.message || 'Done.';
  });

  window.addEventListener('hashchange', () => {
    const hash = (window.location.hash || '#library').replace('#', '');
    if (hash === 'settings' || hash === 'library') setView(hash);
  });
}

async function boot() {
  wireEvents();
  const hash = (window.location.hash || '#library').replace('#', '');
  setView(hash === 'settings' ? 'settings' : 'library');
  await loadSettings();
  await refreshLibrary(false);
  if (!state.snapshot || state.snapshot.scanState === 'idle') {
    await refreshLibrary(true);
  }
}

boot();
