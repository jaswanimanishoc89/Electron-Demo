const fs = require('fs');
const path = require('path');
const os = require('os');

function programDataRoot() {
  return process.env.PROGRAMDATA || 'C:\\ProgramData';
}

function epicManifestsDir() {
  return path.join(
    programDataRoot(),
    'Epic',
    'EpicGamesLauncher',
    'Data',
    'Manifests',
  );
}

function epicLauncherDetected() {
  const manifests = epicManifestsDir();
  if (fs.existsSync(manifests)) return true;
  const localApp = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const launcherExe = path.join(
    localApp,
    'EpicGamesLauncher',
    'Portal',
    'Binaries',
    'Win32',
    'EpicGamesLauncher.exe',
  );
  const launcherExe64 = path.join(
    localApp,
    'EpicGamesLauncher',
    'Portal',
    'Binaries',
    'Win64',
    'EpicGamesLauncher.exe',
  );
  return fs.existsSync(launcherExe) || fs.existsSync(launcherExe64);
}

function safeStat(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function mapManifest(raw, filePath) {
  const catalogNamespace = raw.CatalogNamespace || raw.catalogNamespace || '';
  const catalogItemId = raw.CatalogItemId || raw.catalogItemId || '';
  const appName = raw.AppName || raw.appName || raw.AppName_s || '';
  const displayName = raw.DisplayName || raw.displayName || appName || path.basename(filePath, '.item');
  const installLocation = raw.InstallLocation || raw.installLocation || null;
  const launchExecutable = raw.LaunchExecutable || raw.launchExecutable || null;
  const incomplete = Boolean(raw.bIsIncompleteInstall || raw.bIsApplication);

  let installState = 'unknown';
  let executable = null;
  if (installLocation && launchExecutable) {
    const exePath = path.isAbsolute(launchExecutable)
      ? launchExecutable
      : path.join(installLocation, launchExecutable);
    executable = exePath;
    const st = safeStat(exePath);
    installState = st && st.isFile() ? 'installed' : 'not_installed';
  } else if (installLocation) {
    installState = safeStat(installLocation) ? 'installed' : 'not_installed';
  } else if (incomplete) {
    installState = 'not_installed';
  }

  const idParts = [catalogNamespace, catalogItemId, appName].filter(Boolean);
  const id = idParts.length ? idParts.join(':') : `epic:${path.basename(filePath, '.item')}`;

  return {
    id,
    title: String(displayName),
    coverUrl: null,
    installPath: installLocation,
    executable,
    lastPlayedAt: null,
    playtimeMinutes: 0,
    updateStatus: 'unknown',
    updateMessage: null,
    installState,
    epicAppName: appName || null,
    catalogNamespace: catalogNamespace || null,
    catalogItemId: catalogItemId || null,
  };
}

function discoverEpicGames() {
  const epicDetected = epicLauncherDetected();
  const dir = epicManifestsDir();
  const games = [];

  if (!fs.existsSync(dir)) {
    return { epicDetected, games, manifestsDir: dir };
  }

  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.item'));
  } catch (err) {
    return { epicDetected, games, manifestsDir: dir, error: String(err.message || err) };
  }

  for (const file of files) {
    const full = path.join(dir, file);
    try {
      const raw = JSON.parse(fs.readFileSync(full, 'utf8'));
      // Skip launcher / helper manifests without a real display game feel
      if (raw.bIsApplication === false && !raw.LaunchExecutable && !raw.InstallLocation) {
        continue;
      }
      games.push(mapManifest(raw, full));
    } catch {
      // ignore bad manifest
    }
  }

  games.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  return { epicDetected, games, manifestsDir: dir };
}

function buildEpicLaunchUri(game) {
  if (game.catalogNamespace && game.catalogItemId && game.epicAppName) {
    const app = [game.catalogNamespace, game.catalogItemId, game.epicAppName]
      .map((part) => encodeURIComponent(part))
      .join('%3A');
    return `com.epicgames.launcher://apps/${app}?action=launch&silent=true`;
  }
  if (game.epicAppName) {
    return `com.epicgames.launcher://apps/${encodeURIComponent(game.epicAppName)}?action=launch&silent=true`;
  }
  return null;
}

module.exports = {
  epicManifestsDir,
  epicLauncherDetected,
  discoverEpicGames,
  buildEpicLaunchUri,
};
