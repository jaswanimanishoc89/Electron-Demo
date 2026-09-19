const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => ipcRenderer.invoke('app:getVersions'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial) => ipcRenderer.invoke('settings:set', partial),
  getUpdateState: () => ipcRenderer.invoke('updater:getState'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  library: {
    get: () => ipcRenderer.invoke('library:get'),
    scan: () => ipcRenderer.invoke('library:scan'),
    getGame: (gameId) => ipcRenderer.invoke('library:getGame', gameId),
    launch: (gameId) => ipcRenderer.invoke('library:launch', gameId),
    checkUpdate: (gameId) => ipcRenderer.invoke('library:checkUpdate', gameId),
  },
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
});
