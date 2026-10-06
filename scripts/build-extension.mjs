// Packages extension/ for Chrome and Firefox.
// Usage: node scripts/build-extension.mjs [version]
// Output: dist/extension/{chrome,firefox}/ + dist/extension/ano-{chrome,firefox}-<version>.zip
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const SRC = 'extension';
const OUT = 'dist/extension';
const FILES = ['background.js', 'ano.min.js', 'icons'];

// Firefox add-on ID — permanent once submitted to AMO
const GECKO_ID = 'ano@ai';

const base = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
const version = process.argv[2] || base.version;

// Keep the unpacked dev extension in sync with the library build
fs.copyFileSync('dist/ano.min.js', path.join(SRC, 'ano.min.js'));

const targets = {
  chrome: { ...base, version },
  firefox: (() => {
    const { background, ...rest } = base;
    return {
      ...rest,
      version,
      // Firefox MV3 has no background service workers — use an event page
      background: { scripts: [background.service_worker] },
      browser_specific_settings: {
        gecko: {
          id: GECKO_ID,
          // 128: scripting world MAIN; 140: data_collection_permissions
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    };
  })(),
};

fs.rmSync(OUT, { recursive: true, force: true });

for (const [name, manifest] of Object.entries(targets)) {
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FILES) fs.cpSync(path.join(SRC, f), path.join(dir, f), { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const zip = path.resolve(OUT, `ano-${name}-${version}.zip`);
  execFileSync('zip', ['-qr', zip, '.', '-x', '*.DS_Store'], { cwd: dir });
  console.log(`${path.relative('.', zip)} built`);
}
