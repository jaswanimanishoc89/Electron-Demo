const { downloadArtifact } = require('@electron/get');
const extract = require('extract-zip');
const fs = require('fs');
const path = require('path');

async function main() {
  const electronRoot = path.dirname(require.resolve('electron/package.json'));
  const { version } = require(path.join(electronRoot, 'package.json'));
  const dist = path.join(electronRoot, 'dist');

  const platformPath =
    process.platform === 'win32'
      ? 'electron.exe'
      : process.platform === 'darwin'
        ? 'Electron.app/Contents/MacOS/Electron'
        : 'electron';
  const exePath = path.join(dist, platformPath);

  if (fs.existsSync(exePath)) {
    console.log('Electron binary OK:', exePath);
    return;
  }

  console.log('Electron binary missing — downloading v' + version + '…');
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    force: true,
    platform: process.platform,
    arch: process.arch,
  });

  fs.mkdirSync(dist, { recursive: true });
  await extract(zipPath, { dir: dist });

  if (!fs.existsSync(exePath)) {
    throw new Error('Download finished but ' + platformPath + ' still missing under ' + dist);
  }

  fs.writeFileSync(path.join(electronRoot, 'path.txt'), platformPath);
  fs.writeFileSync(path.join(dist, 'version'), version);
  console.log('Electron binary repaired:', exePath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
