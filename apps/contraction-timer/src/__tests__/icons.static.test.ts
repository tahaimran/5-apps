/**
 * Lucide ships type declarations for renamed icons (e.g. `history`) without the matching runtime
 * file, so a per-icon import can typecheck and still crash Metro. Every import must resolve to a file.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const ICONS = path.resolve(ROOT, '../../node_modules/lucide-react-native/dist/esm/icons');

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : sources(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

it('imports only Lucide icons that exist at runtime', () => {
  const missing: string[] = [];
  for (const file of [...sources(path.join(ROOT, 'app')), ...sources(path.join(ROOT, 'src')), ...sources(path.resolve(ROOT, '../../packages/shared/src'))]) {
    for (const [, name] of fs.readFileSync(file, 'utf8').matchAll(/lucide-react-native\/icons\/([a-z0-9-]+)/g)) {
      if (!fs.existsSync(path.join(ICONS, `${name}.mjs`))) missing.push(`${path.relative(ROOT, file)}: ${name}`);
    }
  }
  expect(missing).toEqual([]);
});
