const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
  }),
});
