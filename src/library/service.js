const { discoverEpicGames, buildEpicLaunchUri } = require('./epic-discovery');

/** @type {import('./types').LibrarySnapshot} */
let snapshot = {
  scanState: 'idle',
  scanMessage: null,
  games: [],
  lastScannedAt: null,
  epicDetected: false,
};

function getSnapshot() {
  return {
    ...snapshot,
    games: snapshot.games.map((g) => ({ ...g })),
  };
}

function scan() {
  snapshot = {
    ...snapshot,
    scanState: 'scanning',
    scanMessage: 'Scanning Epic library…',
  };

  try {
    const result = discoverEpicGames();
    if (result.error) {
      snapshot = {
        scanState: 'error',
        scanMessage: result.error,
        games: [],
        lastScannedAt: new Date().toISOString(),
        epicDetected: Boolean(result.epicDetected),
      };
      return getSnapshot();
    }

    snapshot = {
      scanState: 'ready',
      scanMessage: result.epicDetected
        ? `Found ${result.games.length} Epic title(s).`
        : 'Epic Games Launcher not found.',
      games: result.games,
      lastScannedAt: new Date().toISOString(),
      epicDetected: Boolean(result.epicDetected),
    };
  } catch (err) {
    snapshot = {
      scanState: 'error',
      scanMessage: String(err.message || err),
      games: [],
      lastScannedAt: new Date().toISOString(),
      epicDetected: false,
    };
  }

  return getSnapshot();
}

function getGame(gameId) {
  const game = snapshot.games.find((g) => g.id === gameId);
  return game ? { ...game } : null;
}

function setGameUpdateStatus(gameId, updateStatus, updateMessage = null) {
  const idx = snapshot.games.findIndex((g) => g.id === gameId);
  if (idx === -1) return null;
  snapshot.games[idx] = {
    ...snapshot.games[idx],
    updateStatus,
    updateMessage,
  };
  return { ...snapshot.games[idx] };
}

async function checkGameUpdate(gameId) {
  const game = getGame(gameId);
  if (!game) return null;
  setGameUpdateStatus(gameId, 'checking', 'Checking for updates…');
  await new Promise((r) => setTimeout(r, 900));
  // MVP stub — Epic does not expose a simple local update API
  return setGameUpdateStatus(
    gameId,
    'up_to_date',
    'No update info from Epic locally (stub).',
  );
}

module.exports = {
  getSnapshot,
  scan,
  getGame,
  buildEpicLaunchUri,
  checkGameUpdate,
  setGameUpdateStatus,
};
