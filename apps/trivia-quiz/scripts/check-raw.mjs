// Checks raw question files while they are being written (plan §10 step 3-4), before ids exist.
//   node scripts/check-raw.mjs content/raw/geography-1.json [more files...]
// Each file is a JSON array of { q, a: [correct, wrong, wrong, wrong], d: 1|2|3, x, tags? }.
import { readFileSync } from 'node:fs';
import { checkQuestion, fingerprint, isNearDuplicate, normalize } from '../src/content/validate.ts';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/check-raw.mjs <file.json> [...]');
  process.exit(2);
}

const all = [];
for (const file of files) {
  const rows = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(rows)) throw new Error(`${file}: expected an array`);
  rows.forEach((q, i) => all.push({ q, where: `${file}#${i + 1}` }));
}

let bad = 0;
const report = (where, problem) => {
  bad++;
  console.log(`${where}: ${problem}`);
};
const keys = new Map();
const prints = [];
for (const { q, where } of all) {
  for (const p of checkQuestion(q, where)) report(where, p.problem);
  const key = normalize(q.q ?? '');
  if (keys.has(key)) report(where, `same question as ${keys.get(key)}`);
  keys.set(key, where);
  if (Array.isArray(q.a) && typeof q.q === 'string') prints.push({ where, print: fingerprint(q) });
}
for (let i = 0; i < prints.length; i++) {
  for (let j = i + 1; j < prints.length; j++) {
    if (isNearDuplicate(prints[i].print, prints[j].print)) report(prints[j].where, `near duplicate of ${prints[i].where}`);
  }
}
const byD = { 1: 0, 2: 0, 3: 0 };
for (const { q } of all) if (q.d in byD) byD[q.d]++;
console.log(`${all.length} questions (easy ${byD[1]}, medium ${byD[2]}, hard ${byD[3]}), ${bad} problem(s)`);
process.exit(bad === 0 ? 0 : 1);
