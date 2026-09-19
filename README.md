# Electron-Demo

A small starter Electron desktop app with a secure main / preload / renderer split.

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
  main.js      # Electron main process (window + app lifecycle)
  preload.js   # contextBridge API exposed to the renderer
  renderer/
    index.html
    styles.css
    renderer.js
```

## Security defaults

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer talks to privileged APIs only through the preload `contextBridge`
