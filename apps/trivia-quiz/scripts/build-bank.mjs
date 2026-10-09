// Builds the bundled question bank (plan §10 step 7).
//   node scripts/build-bank.mjs [--version 1.0.0]
// Reads content/raw/<category>-<n>.json (arrays of { q, a, d, x, tags? }), assigns stable ids
// ("geo-000412", append-only: a question already in assets/questions/en keeps its id), validates the
// whole bank, and writes assets/questions/en/<category>.json plus manifest.json. Exits 1 on any problem.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_IDS, ID_PREFIX, checkBank, normalize } from '../src/content/validate.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = resolve(root, 'content/raw');
const outDir = resolve(root, 'assets/questions/en');
const versionArg = process.argv.indexOf('--version');
const version = versionArg > 0 ? process.argv[versionArg + 1] : '1.0.0';
mkdirSync(outDir, { recursive: true });

const bank = {};
const files = {};
for (const cat of CATEGORY_IDS) {
  const previousFile = resolve(outDir, `${cat}.json`);
  const previous = existsSync(previousFile) ? JSON.parse(readFileSync(previousFile, 'utf8')).questions : [];
  const known = new Map(previous.map((q) => [normalize(q.q), q]));
  let next = previous.reduce((m, q) => Math.max(m, Number(q.id.slice(4))), 0) + 1;

  const parts = readdirSync(rawDir)
    .filter((f) => f.startsWith(`${cat}-`) && f.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const raw = parts.flatMap((f) => JSON.parse(readFileSync(resolve(rawDir, f), 'utf8')));

  bank[cat] = raw.map((r) => {
    const q = { ...r };
    const old = known.get(normalize(q.q));
    if (old) {
      const changed = JSON.stringify([old.a, old.x, old.d]) !== JSON.stringify([q.a, q.x, q.d]);
      return { id: old.id, ...q, rev: changed ? old.rev + 1 : old.rev };
    }
    return { id: `${ID_PREFIX[cat]}-${String(next++).padStart(6, '0')}`, ...q, rev: 1 };
  });
}

const { problems, counts } = checkBank(bank);
if (problems.length) {
  for (const p of problems.slice(0, 80)) console.log(`${p.id}: ${p.problem}`);
  console.log(`${problems.length} problem(s); nothing written`);
  process.exit(1);
}

const manifest = { version, locale: 'en', total: 0, categories: {} };
for (const cat of CATEGORY_IDS) {
  const body = JSON.stringify({ category: cat, locale: 'en', version, questions: bank[cat] });
  writeFileSync(resolve(outDir, `${cat}.json`), `${body}\n`);
  manifest.categories[cat] = { count: bank[cat].length, byDifficulty: counts[cat], sha256: createHash('sha256').update(body).digest('hex') };
  manifest.total += bank[cat].length;
}
writeFileSync(resolve(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${manifest.total} questions in ${CATEGORY_IDS.length} categories (version ${version})`);
