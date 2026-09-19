# Game Hub (Electron-Demo)

Windows-first **Game Hub** for your **Epic Games** library — browse installed titles, see update badges (stub for MVP), and launch games.

## Requirements

- Node.js 18+ (Node 20 LTS recommended)
- Windows for Epic discovery (other platforms show empty / not-detected)
- npm

## Setup

```bash
npm install
npm start
```

### Windows: `Electron failed to install correctly`

```bash
npm run repair:electron
npm start
```

## Features (MVP)

- Epic Games library scan (manifests under ProgramData)
- Library grid / list + game detail drawer
- Launch via Epic protocol (exe fallback)
- Settings: launch at login, minimize to tray, app update stub
- Cover art: placeholders (monograms)

## CI & contributing

PRs and `main` run GitHub Actions (`check`, `test`, `smoke`). See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm run check
npm test
npm run smoke
```

## Project structure

```
src/
  main.js
  preload.js
  library/          # Epic discovery + library service
  renderer/         # Game Hub UI shell
  settings-store.js
  updater.js
scripts/
  check.js
  test-updater.js
  smoke.js
  ensure-electron.js
```
