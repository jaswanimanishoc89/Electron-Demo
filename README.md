# Electron-Demo

A small starter Electron desktop app with a secure main / preload / renderer split, plus:

- **System tray** — show/hide window, open settings, quit
- **Settings page** — launch at login toggle (stubbed), minimize-to-tray, check for updates
- **Auto-update stub** — simulated update check; ready to swap for `electron-updater` when you package the app

## Requirements

- Node.js 18+
- npm

## Setup

```bash
npm install
npm start
```

`npm run dev` does the same thing as `npm start` for this starter.

## Project structure

```
src/
  main.js           # App lifecycle, windows, tray
  preload.js        # contextBridge API for the renderer
  settings-store.js # Persist settings under userData
  updater.js        # Auto-update stub
  renderer/
    index.html      # Home UI
    styles.css
    renderer.js
    settings.html   # Settings UI
    settings.css
    settings.js
```

## Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer talks to privileged APIs only through the preload `contextBridge`

## Auto-update note

`src/updater.js` is a **stub**. In packaged builds, replace the simulated check with [`electron-updater`](https://www.electron.build/auto-update) (or your platform’s update channel) and keep the same preload/renderer surface.
