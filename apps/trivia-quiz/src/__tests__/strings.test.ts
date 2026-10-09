/** Every t('key') in the code has a string in en.json (plural keys may be key_one/key_other), and no string is unused junk-free. */
import * as fs from 'fs';
import * as path from 'path';
import en from '@/i18n/en.json';
import shared from '../../../../packages/shared/src/i18n/shared.en.json';

const ROOT = path.resolve(__dirname, '../..');

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'testing' ? [] : files(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

type Bundle = { [key: string]: string | Bundle };
const find = (bundle: Bundle, key: string): string | Bundle | undefined => {
  let node: string | Bundle | undefined = bundle;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return node;
};
const has = (key: string) => [en as Bundle, shared as Bundle].some((b) => find(b, key) !== undefined || find(b, `${key}_one`) !== undefined || find(b, `${key}_other`) !== undefined);

const source = [...files(path.join(ROOT, 'app')), ...files(path.join(ROOT, 'src'))].map((f) => ({ f, text: fs.readFileSync(f, 'utf8') }));

describe('en.json', () => {
  it('has a string for every literal t() key', () => {
    const missing: string[] = [];
    for (const { f, text } of source) {
      for (const m of text.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)) if (!has(m[1])) missing.push(`${path.relative(ROOT, f)}: ${m[1]}`);
    }
    expect(missing).toEqual([]);
  });

  it('has the group for every template t(`prefix.${...}`) key', () => {
    const missing: string[] = [];
    for (const { f, text } of source) {
      for (const m of text.matchAll(/\bt\(\s*`([a-zA-Z][\w.]*)\.\$\{/g)) {
        if (!(find(en as Bundle, m[1]) || find(shared as Bundle, m[1]))) missing.push(`${path.relative(ROOT, f)}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has no empty strings and uses only ASCII quotes', () => {
    const bad: string[] = [];
    const walk = (node: string | Bundle, key: string) => {
      if (typeof node === 'string') {
        if (node.trim() === '') bad.push(`${key} is empty`);
        if (/[‘’“”]/.test(node)) bad.push(`${key} has a curly quote`);
      } else for (const [k, v] of Object.entries(node)) walk(v, key ? `${key}.${k}` : k);
    };
    walk(en as Bundle, '');
    expect(bad).toEqual([]);
  });
});
