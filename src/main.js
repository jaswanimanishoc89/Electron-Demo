const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { readSettings, writeSettings } = require('./settings-store');
const { getUpdateState, checkForUpdates } = require('./updater');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let settingsWindow = null;
/** @type {Tray | null} */
let tray = null;
let isQuitting = false;

// Tray icon: prefer assets/tray-icon.png; fall back to embedded PNG (Windows requires a real icon).
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAd0lEQVR42mNgGErAtv7BHWLwgFhKE8egGxY99/9/YjBVHEGOxfgcQnfLyXYEtSzG5RC6+ZzkkKCl5UQ5gtaWE4yKAXUAvSzH6YhRB4w6YNQBow4YcAeM1gWDojoe8AbJoGiSDYpG6aBolg+Kjsmg6JoNis4prQEACkw2+QyiBlcAAAAASUVORK5CYII=';

function windowOptions(extra = {}) {
  return {
    width: 960,
    height: 640,
    minWidth: 640,
    minHeight: 420,
    title: 'Electron Demo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    ...extra,
  };
}

function createMainWindow() {
  mainWindow = new BrowserWindow(windowOptions());
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    const { minimizeToTray } = readSettings();
    if (!isQuitting && minimizeToTray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow(
    windowOptions({
      width: 520,
      height: 560,
      minWidth: 420,
      minHeight: 480,
      title: 'Settings — Electron Demo',
      parent: mainWindow || undefined,
      modal: false,
    }),
  );

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Show Electron Demo',
      click: () => showMainWindow(),
    },
    {
      label: 'Settings…',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function loadTrayIcon() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL);
  }
  if (!icon.isEmpty() && process.platform === 'win32') {
    // Windows tray looks sharper with a modest size.
    icon = icon.resize({ width: 16, height: 16 });
  }
  return icon;
}

function createTray() {
  try {
    const icon = loadTrayIcon();
    if (icon.isEmpty()) {
      console.warn('Tray icon is empty; skipping tray on this platform.');
      return;
    }
    tray = new Tray(icon);
    tray.setToolTip('Electron Demo');
    tray.setContextMenu(buildTrayMenu());
    tray.on('double-click', () => showMainWindow());
  } catch (err) {
    console.warn('Failed to create system tray:', err);
  }
}

function registerIpc() {
  ipcMain.handle('app:getVersions', () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    app: app.getVersion(),
  }));

  ipcMain.handle('settings:get', () => readSettings());
  ipcMain.handle('settings:set', (_event, partial) => {
    const next = writeSettings(partial || {});

    // Stub: real apps call app.setLoginItemSettings({ openAtLogin: next.launchAtLogin })
    if (Object.prototype.hasOwnProperty.call(partial || {}, 'launchAtLogin')) {
      try {
        app.setLoginItemSettings({
          openAtLogin: Boolean(next.launchAtLogin),
          openAsHidden: false,
        });
      } catch {
        // Some platforms / unpackaged runs ignore this; settings still persist.
      }
    }

    return next;
  });

  ipcMain.handle('settings:open', () => {
    createSettingsWindow();
    return true;
  });

  ipcMain.handle('updater:getState', () => getUpdateState());
  ipcMain.handle('updater:check', async () => checkForUpdates());
}

app.whenReady().then(() => {
  registerIpc();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      showMainWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Keep running in the tray on all platforms unless quitting.
  if (isQuitting && process.platform !== 'darwin') {
    app.quit();
  }
});
