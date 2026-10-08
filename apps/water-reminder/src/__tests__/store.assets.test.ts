/** The store listing assets stay valid. */
import * as fs from 'fs';
import * as path from 'path';
import { parseBackup } from '@/domain/backup';
import { stageForGoalDays } from '@/domain/plant';
import { SCHEMA_VERSION } from '@/store/migrations';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({}) }));

const ROOT = path.resolve(__dirname, '../..');
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** Width and height from a PNG header. */
function pngSize(file: string) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe('store graphics', () => {
  it.each([
    ['store/icon-512.png', 512, 512],
    ['store/feature-graphic-1024x500.png', 1024, 500],
    ['assets/icon.png', 1024, 1024],
    ['assets/adaptive-icon-foreground.png', 1024, 1024],
    ['assets/adaptive-icon-monochrome.png', 1024, 1024],
    ['assets/splash-icon.png', 1024, 1024],
  ])('%s is %ix%i', (file, w, h) => {
    expect(pngSize(file)).toEqual({ w, h });
  });
  it('keeps the Play icon under the 1 MB limit', () => {
    expect(fs.statSync(path.join(ROOT, 'store/icon-512.png')).size).toBeLessThan(1_000_000);
  });
});

describe('reminder sound', () => {
  it('is a short PCM wav', () => {
    const buf = fs.readFileSync(path.join(ROOT, 'assets/sounds/drop.wav'));
    expect(buf.subarray(0, 4).toString()).toBe('RIFF');
    expect(buf.subarray(8, 12).toString()).toBe('WAVE');
    expect(buf.length).toBeLessThan(100_000);
  });
});

describe('listing text (ASO.md)', () => {
  const aso = read('ASO.md');
  const row = (label: string) => aso.match(new RegExp(`\\*\\*${label}\\*\\* \\| \`([^\`]+)\``))?.[1] ?? '';
  it('fits the Play limits', () => {
    expect(row('Title')).toBe('Sipling: Drink Water Reminder');
    expect(row('Title').length).toBeLessThanOrEqual(30);
    expect(row('Short description').length).toBeLessThanOrEqual(80);
  });
  it('keeps "free" out of the title and short description (Play rejects it)', () => {
    expect(row('Title').toLowerCase()).not.toContain('free');
    expect(row('Short description').toLowerCase()).not.toContain('free');
  });
});

describe('full description draft (replaces the misfiled one in ASO.md)', () => {
  const draft = read('store/FULL_DESCRIPTION_DRAFT.md');
  const block = draft.match(/```\n([\s\S]*?)\n```/)?.[1] ?? '';
  it('fits the Play limit and names the right app', () => {
    expect(block.length).toBeGreaterThan(500);
    expect(block.length).toBeLessThanOrEqual(4000);
    expect(block).toContain('Sipling');
    expect(block).not.toMatch(/Quizora|trivia/i);
  });
  it('makes no medical claims and promises no v1.1 feature', () => {
    expect(block).not.toMatch(/\b(cure|treat|prevent|diagnos|dehydration)/i);
    expect(block).not.toMatch(/widget|pregnan|breastfeed|fasting/i);
    expect(block).toMatch(/not medical advice/i);
  });
});

describe('Play Console drafts', () => {
  it('keeps health data out of the data safety answers, and says why', () => {
    const doc = read('store/DATA_SAFETY.md');
    expect(doc).toMatch(/health and fitness data/);
    expect(doc).toMatch(/\*\*not\*\* declared/);
    expect(doc).toContain('AD_ID');
  });
  it('declares no medical device and no Health Connect', () => {
    const doc = read('store/HEALTH_DECLARATION.md');
    expect(doc).toMatch(/\*\*No\*\*/);
    expect(doc).toMatch(/Health Connect/);
  });
  it('has an app-ads.txt line in the AdMob format', () => {
    expect(read('store/app-ads.txt')).toMatch(/^google\.com, pub-\d+, DIRECT, f08c47fec0942fa0$/m);
  });
  it('has a privacy policy that matches what the app does', () => {
    const doc = read('store/privacy-policy.md');
    for (const phrase of ['no account', 'AdMob', 'on your device', 'Privacy choices', 'not directed to children']) expect(doc).toContain(phrase);
  });
});

describe('demo backup for screenshots', () => {
  const text = read('store/demo-backup.json');
  const result = parseBackup(text, SCHEMA_VERSION);
  it('imports cleanly through the real parser', () => {
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.drinks).toBeGreaterThan(250);
  });
  it('shows a 6 day streak, a blooming plant and a day at 53% (storyboard slide 1)', () => {
    if (!result.ok) throw new Error('did not parse');
    const b = result.backup;
    expect(b.progress).toMatchObject({ streak: 6, bestStreak: 9, streakFreezes: 1 });
    expect(stageForGoalDays(b.progress.goalDays)).toBe(4);
    expect(b.progress.stage).toBe(4);
    expect(b.daySummaries['2026-10-08']).toMatchObject({ effectiveMl: 1225, goalMl: 2300, reached: false });
    for (let d = 2; d <= 7; d++) expect(b.daySummaries[`2026-10-0${d}`].reached).toBe(true);
    expect(b.daySummaries['2026-10-01'].reached).toBe(false);
  });
  it('ends yesterday in the plant, so Today is the day being filled in', () => {
    if (!result.ok) throw new Error('did not parse');
    expect(result.backup.progress.lastEvaluatedDay).toBe('2026-10-07');
  });
});

describe('Maestro flows', () => {
  const dir = path.join(ROOT, '.maestro');
  const flows = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml'));
  const shared = JSON.parse(fs.readFileSync(path.resolve(ROOT, '../../packages/shared/src/i18n/shared.en.json'), 'utf8'));
  const strings = ([...Object.values(JSON.parse(read('src/i18n/en.json'))), ...Object.values(shared)] as unknown[]).flatMap(function walk(v: unknown): string[] {
    return typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(walk) : [];
  });
  const templates = strings.filter((v: string) => v.replace(/\{\w+\}/g, '').trim().length >= 3).map((v: string) => new RegExp('^' + v.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{\w+\}/g, '.+') + '$'));

  it.each(flows)('%s targets the Sipling package', (file) => {
    expect(read(`.maestro/${file}`)).toContain('appId: com.fiveapps.sipling');
  });
  it.each(flows)('%s only taps and asserts text the app really shows', (file) => {
    const literals = [...read(`.maestro/${file}`).matchAll(/(?:tapOn|assertVisible|text|visible):\s*"([^"]+)"/g)].map((m) => m[1]).filter((l) => !/[.*%]/.test(l.replace(/\.$/, '')) || /^[^*%]*$/.test(l));
    for (const literal of literals) {
      const known = strings.some((s) => s === literal || s.includes(literal)) || templates.some((r) => r.test(literal)) || literal === 'Test Ad';
      expect({ file, literal, known }).toEqual({ file, literal, known: true });
    }
  });
});
