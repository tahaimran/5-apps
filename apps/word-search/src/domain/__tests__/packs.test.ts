import { BLOCKED_WORDS } from '../blocklist';
import { normalizeWord } from '../generator';
import { DAILY_ROTATION, PACKS, getPack } from '../packs';

describe('word packs (plan F5)', () => {
  it('bundles at least 12 packs', () => {
    expect(PACKS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
  });
  it.each(PACKS.map((p) => [p.id, p] as const))('%s has at least 120 usable words', (_id, pack) => {
    expect(pack.name).toBeTruthy();
    expect(pack.icon).toBeTruthy();
    const usable = pack.words.filter((w) => /^[A-Z]{3,12}$/.test(w));
    expect(usable.length).toBeGreaterThanOrEqual(120);
    expect(usable.length).toBe(pack.words.length); // nothing in the file is unusable
    expect(new Set(pack.words).size).toBe(pack.words.length);
    for (const w of pack.words) expect(normalizeWord(w)).toBe(w);
  });
  it.each(PACKS.map((p) => [p.id, p] as const))('%s has words for every grid size', (_id, pack) => {
    // Easy grids can be as small as 6, so there must be plenty of 3–6 letter words, and a few long ones for hard.
    expect(pack.words.filter((w) => w.length <= 6).length).toBeGreaterThanOrEqual(40);
    expect(pack.words.filter((w) => w.length >= 8).length).toBeGreaterThanOrEqual(5);
  });
  it('contains no blocked word (profanity filter on lists)', () => {
    const blocked = new Set(BLOCKED_WORDS);
    for (const pack of PACKS) for (const w of pack.words) expect(blocked.has(w)).toBe(false);
    for (const pack of PACKS) for (const w of pack.words) for (const b of BLOCKED_WORDS) if (b.length >= 5) expect(w.includes(b)).toBe(false);
  });
  it('has no religious-specific pack', () => {
    const ids = PACKS.map((p) => p.id.toLowerCase() + p.name.toLowerCase()).join(' ');
    for (const bad of ['religio', 'bible', 'church', 'prayer', 'faith']) expect(ids).not.toContain(bad);
  });
  it('rotates the daily theme through real packs', () => {
    expect(DAILY_ROTATION.length).toBeGreaterThanOrEqual(12);
    for (const id of DAILY_ROTATION) expect(getPack(id)).toBeDefined();
  });
});
