const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { readSettings, writeSettings } = require('./settings-store');
const { getUpdateState, checkForUpdates } = require('./updater');
const library = require('./library/service');

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {Tray | null} */
let tray = null;
let isQuitting = false;

const TRAY_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAd0lEQVR42mNgGErAtv7BHWLwgFhKE8egGxY99/9/YjBVHEGOxfgcQnfLyXYEtSzG5RC6+ZzkkKCl5UQ5gtaWE4yKAXUAvSzH6YhRB4w6YNQBow4YcAeM1gWDojoe8AbJoGiSDYpG6aBolg+Kjsmg6JoNis4prQEACkw2+QyiBlcAAAAASUVORK5CYII=';

function windowOptions(extra = {}) {
  return {
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 520,
    title: 'Game Hub',
    backgroundColor: '#0f1419',
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

function showMainWindow(hash) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
  if (hash && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.executeJavaScript(
        `window.location.hash = ${JSON.stringify(hash)}`,
      ).catch(() => {});
    });
    if (!mainWindow.webContents.isLoading()) {
      mainWindow.webContents.executeJavaScript(
        `window.location.hash = ${JSON.stringify(hash)}`,
      ).catch(() => {});
    }
  }
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Open Game Hub',
      click: () => showMainWindow('#library'),
    },
    {
      label: 'Settings',
      click: () => showMainWindow('#settings'),
    },
    { type: 'separator' },
    {
      label: 'Quit Game Hub',
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
    icon = icon.resize({ width: 16, height: 16 });
  }
  return icon;
}

function createTray() {
  try {
    const icon = loadTrayIcon();
    if (icon.isEmpty()) {
      console.warn('Tray icon is empty; skipping tray.');
      return;
    }
    tray = new Tray(icon);
    tray.setToolTip('Game Hub');
    tray.setContextMenu(buildTrayMenu());
    tray.on('double-click', () => showMainWindow('#library'));
  } catch (err) {
    console.warn('Failed to create system tray:', err);
  }
}

async function launchGame(gameId) {
  const game = library.getGame(gameId);
  if (!game) {
    return { ok: false, message: 'Game not found.' };
  }

  if (game.installState !== 'installed') {
    const uri = library.buildEpicLaunchUri(game);
    if (uri) {
      try {
        await shell.openExternal(uri);
        return { ok: true, message: 'Opened in Epic Games Launcher.' };
      } catch (err) {
        return { ok: false, message: String(err.message || err) };
      }
    }
    return {
      ok: false,
      message: 'Not installed. Install it in Epic Games Launcher, then scan again.',
    };
  }

  const uri = library.buildEpicLaunchUri(game);
  if (uri) {
    try {
      await shell.openExternal(uri);
      return { ok: true, message: 'Launching via Epic…' };
    } catch {
      // fall through to exe
    }
  }

  if (game.executable) {
    try {
      spawn(game.executable, [], {
        cwd: game.installPath || undefined,
        detached: true,
        stdio: 'ignore',
      }).unref();
      return { ok: true, message: 'Launched executable.' };
    } catch (err) {
      return { ok: false, message: String(err.message || err) };
    }
  }

  return { ok: false, message: 'No launch path available.' };
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
    if (Object.prototype.hasOwnProperty.call(partial || {}, 'launchAtLogin')) {
      try {
        app.setLoginItemSettings({
          openAtLogin: Boolean(next.launchAtLogin),
          openAsHidden: false,
        });
      } catch {
        // ignore
      }
    }
    return next;
  });

  ipcMain.handle('updater:getState', () => getUpdateState());
  ipcMain.handle('updater:check', async () => checkForUpdates());

  ipcMain.handle('library:get', () => library.getSnapshot());
  ipcMain.handle('library:scan', () => library.scan());
  ipcMain.handle('library:getGame', (_e, gameId) => library.getGame(gameId));
  ipcMain.handle('library:launch', async (_e, gameId) => launchGame(gameId));
  ipcMain.handle('library:checkUpdate', async (_e, gameId) => library.checkGameUpdate(gameId));
  ipcMain.handle('shell:openExternal', async (_e, url) => {
    await shell.openExternal(url);
    return true;
  });
}

app.whenReady().then(() => {
  registerIpc();
  library.scan();
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
  if (isQuitting && process.platform !== 'darwin') {
    app.quit();
  }
});
