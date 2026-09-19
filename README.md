# Electron-Demo

A small starter Electron desktop app with a secure main / preload / renderer split, plus:

- **System tray** — show/hide window, open settings, quit
- **Settings page** — launch at login toggle (stubbed), minimize-to-tray, check for updates
- **Auto-update stub** — simulated update check; ready to swap for `electron-updater` when you package the app

## Requirements

- Node.js 18+ (Node 20 LTS recommended; Node 24 works once the Electron binary is present)
- npm

## Setup

```bash
npm install
npm start
```

`npm run dev` does the same thing as `npm start` for this starter.

### Windows: `Electron failed to install correctly`

Sometimes npm finishes before the Electron binary is extracted. Fix with:

```bash
npm run repair:electron
npm start
```

Or delete `node_modules/electron` and run `npm install` again (needs network).

## CI & contributing

Pull requests and pushes to `main` run GitHub Actions CI (`npm install`, `npm run check`, `npm test`, headless Electron smoke).

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, the PR checklist, and branch-protection setup.

```bash
npm run check
npm test
npm run smoke
```

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
scripts/
  ensure-electron.js  # Repairs a missing Electron binary after install
  check.js            # Syntax + structure checks
  test-updater.js     # Updater unit smoke
  smoke.js            # Headless Electron boot smoke
```

## Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer talks to privileged APIs only through the preload `contextBridge`

## Auto-update note

`src/updater.js` is a **stub**. In packaged builds, replace the simulated check with [`electron-updater`](https://www.electron.build/auto-update) (or your platform’s update channel) and keep the same preload/renderer surface.
