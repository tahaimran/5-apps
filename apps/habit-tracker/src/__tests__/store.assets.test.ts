/** The store listing assets and demo data stay valid. */
import * as fs from 'fs';
import * as path from 'path';
import { parseBackup } from '@/domain/backup';
import { computeStreaks } from '@/domain/streaks';
import type { DayKey } from '@/domain/types';
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

describe('listing text (ASO.md)', () => {
  const aso = read('ASO.md');
  const row = (label: string) => aso.match(new RegExp(`\\*\\*${label}\\*\\* \\| \`([^\`]+)\``))?.[1] ?? '';
  it('fits the Play limits', () => {
    expect(row('Title').length).toBeLessThanOrEqual(30);
    expect(row('Short description').length).toBeLessThanOrEqual(80);
    expect(row('Title')).toBe('Habit Tracker: Streak & Widget');
  });
  it('keeps "free" out of the title and short description (Play rejects it)', () => {
    expect(row('Title').toLowerCase()).not.toContain('free');
    expect(row('Short description').toLowerCase()).not.toContain('free');
  });
  it('has a full description under 4000 characters', () => {
    const block = aso.match(/### 1\.1 Full description\s+```\n([\s\S]*?)\n```/)?.[1] ?? '';
    expect(block.length).toBeGreaterThan(500);
    expect(block.length).toBeLessThanOrEqual(4000);
  });
});

describe('demo backup for screenshots', () => {
  const text = read('store/demo-backup.json');
  const result = parseBackup(text, SCHEMA_VERSION);
  it('imports cleanly through the real parser', () => {
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.summary.habits).toBe(5);
  });
  it('shows a 12-day streak on the first habit (storyboard slide 1)', () => {
    if (!result.ok) throw new Error('did not parse');
    const bed = result.backup.habits.find((h) => h.id === 'demo-bed')!;
    expect(computeStreaks(bed, result.backup.entries['demo-bed'], '2026-10-08' as DayKey, 1)).toMatchObject({ current: 12 });
  });
  it('has a partly done timer and a per-week habit', () => {
    if (!result.ok) throw new Error('did not parse');
    expect(result.backup.entries['demo-study']['2026-10-08' as DayKey].value).toBe(18 * 60);
    expect(result.backup.habits.some((h) => h.schedule.kind === 'perWeek')).toBe(true);
  });
});
