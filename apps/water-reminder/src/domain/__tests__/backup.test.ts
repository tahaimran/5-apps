import { backupFileName, buildBackup, parseBackup, summarizeBackup, type BackupSource } from '../backup';
import { defaultBeverages } from '../hydration';
import { defaultCups, defaultGoal, defaultPrefs, defaultProfile, defaultProgress, defaultReminders } from '../defaults';
import type { LogEntry } from '../types';

const log = (id: string, dayKey: string, ml: number, over: Partial<LogEntry> = {}): LogEntry => ({ id, ts: Date.parse(`${dayKey}T09:00:00`), dayKey, beverage: 'water', volumeMl: ml, effectiveMl: ml, source: 'app', ...over });

const source = (): BackupSource => ({
  profile: { ...defaultProfile, weightKg: 70, sex: 'female' },
  goal: { ...defaultGoal(5), goalMl: 2300, source: 'manual', unit: 'floz' },
  reminders: { ...defaultReminders, style: 'gentle', quietBlocks: [{ startMin: 720, endMin: 780 }], activeWeekdays: [1, 2, 3] },
  cups: defaultCups,
  beverages: defaultBeverages.map((b) => (b.id === 'coffee' ? { ...b, factor: 0.7 } : b)),
  prefs: { ...defaultPrefs, largeText: true },
  logs: {
    '2026-10': [log('2026-10-07_a', '2026-10-07', 2400), log('2026-10-08_b', '2026-10-08', 250, { beverage: 'coffee', effectiveMl: 175 })],
    '2026-09': [log('2026-09-30_c', '2026-09-30', 500)],
  },
  daySummaries: {
    '2026-10-07': { dayKey: '2026-10-07', effectiveMl: 2400, goalMl: 2000, count: 1, reached: true },
    '2026-10-08': { dayKey: '2026-10-08', effectiveMl: 175, goalMl: 2300, count: 1, reached: false },
    '2026-09-30': { dayKey: '2026-09-30', effectiveMl: 500, goalMl: 2000, count: 1, reached: false },
  },
  progress: { ...defaultProgress('2026-10-07'), goalDays: 5, stage: 2, streak: 3, bestStreak: 4, streakFreezes: 1, activeSkin: 'sky', unlocked: ['classic', 'skin:berry'] },
});

const text = (b: unknown) => JSON.stringify(b);
const NOW = new Date('2026-10-08T12:00:00Z');

describe('round trip', () => {
  it('restores every setting, drink and the plant exactly', () => {
    const file = buildBackup(source(), NOW, 1);
    expect(file).toMatchObject({ app: 'water-reminder', schemaVersion: 1, exportedAt: '2026-10-08T12:00:00.000Z' });
    const r = parseBackup(text(file), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = r.backup;
    expect(b.profile).toMatchObject({ weightKg: 70, sex: 'female' });
    expect(b.goal).toMatchObject({ goalMl: 2300, source: 'manual', unit: 'floz' });
    expect(b.reminders).toMatchObject({ style: 'gentle', quietBlocks: [{ startMin: 720, endMin: 780 }], activeWeekdays: [1, 2, 3] });
    expect(b.beverages.find((x) => x.id === 'coffee')?.factor).toBe(0.7);
    expect(b.prefs.largeText).toBe(true);
    expect(b.logs['2026-10']).toHaveLength(2);
    expect(b.logs['2026-09']).toHaveLength(1);
    expect(b.progress).toMatchObject({ goalDays: 5, stage: 2, streak: 3, bestStreak: 4, streakFreezes: 1, activeSkin: 'sky', unlocked: ['classic', 'skin:berry'] });
    expect(b.daySummaries['2026-10-07']).toMatchObject({ effectiveMl: 2400, goalMl: 2000, reached: true });
    expect(b.daySummaries['2026-10-08']).toMatchObject({ effectiveMl: 175, goalMl: 2300, reached: false });
    expect(r.summary).toEqual({ drinks: 3, days: 3, goalDays: 5 });
  });
  it('leaves empty months out', () => {
    expect(Object.keys(buildBackup({ ...source(), logs: { '2026-08': [], '2026-10': source().logs['2026-10'] } }, NOW, 1).logs)).toEqual(['2026-10']);
  });
  it('names the file by day', () => {
    expect(backupFileName('2026-10-08')).toBe('sipling-backup-2026-10-08.json');
  });
});

describe('rejecting files', () => {
  it.each([
    ['not json', 'nope', 'invalid'],
    ['another app', text({ app: 'habit-tracker', schemaVersion: 1 }), 'notBackup'],
    ['an array', '[]', 'notBackup'],
    ['no schema version', text({ app: 'water-reminder' }), 'invalid'],
    ['a newer schema', text({ app: 'water-reminder', schemaVersion: 9 }), 'newer'],
    ['missing parts', text({ app: 'water-reminder', schemaVersion: 1, logs: {} }), 'invalid'],
    ['logs that are not lists', text({ app: 'water-reminder', schemaVersion: 1, logs: { '2026-10': 5 }, daySummaries: {}, progress: {} }), 'invalid'],
  ])('%s', (_name, input, error) => {
    expect(parseBackup(input, 1)).toEqual({ ok: false, error });
  });
});

describe('cleaning', () => {
  const withLogs = (logs: unknown) => text({ ...buildBackup(source(), NOW, 1), logs });
  it('drops unusable drinks but keeps the rest', () => {
    const r = parseBackup(
      withLogs({
        '2026-10': [
          log('2026-10-08_ok', '2026-10-08', 300),
          { id: 'x', ts: 1 },
          log('2026-10-08_neg', '2026-10-08', -5),
          log('2026-10-08_big', '2026-10-08', 99_999),
          log('2026-10-08_bev', '2026-10-08', 100, { beverage: 'beer' as never }),
          log('2026-10-08_ok', '2026-10-08', 300), // duplicate id
        ],
      }),
      1,
    );
    expect(r.ok && r.backup.logs['2026-10'].map((l) => l.id)).toEqual(['2026-10-08_ok']);
  });
  it('re-shards a drink that sits in the wrong month and rebuilds ids that do not match their day', () => {
    const r = parseBackup(withLogs({ '2026-01': [log('whatever', '2026-10-08', 300)] }), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.backup.logs)).toEqual(['2026-10']);
    expect(r.backup.logs['2026-10'][0].id.startsWith('2026-10-08_')).toBe(true);
  });
  it('rebuilds day summaries from the drinks, so a doctored total cannot survive', () => {
    const file = buildBackup(source(), NOW, 1);
    file.daySummaries['2026-10-08'] = { dayKey: '2026-10-08', effectiveMl: 99_999, goalMl: 2300, count: 9, reached: true };
    const r = parseBackup(text(file), 1);
    expect(r.ok && r.backup.daySummaries['2026-10-08']).toMatchObject({ effectiveMl: 175, count: 1, reached: false, goalMl: 2300 });
  });
  it('uses the current goal for a day whose summary is missing', () => {
    const file = buildBackup(source(), NOW, 1);
    delete (file.daySummaries as Record<string, unknown>)['2026-10-08'];
    const r = parseBackup(text(file), 1);
    expect(r.ok && r.backup.daySummaries['2026-10-08'].goalMl).toBe(2300);
  });
  it('falls back to defaults for settings that are out of range or the wrong type', () => {
    const r = parseBackup(
      text({
        ...buildBackup(source(), NOW, 1),
        profile: { weightKg: 'heavy', activity: 'extreme', climate: 7 },
        goal: { goalMl: 12, source: 'who-knows', unit: 'gallons' },
        reminders: { wakeMin: 99_999, bedMin: -5, frequency: 'often', intervalMin: 7, style: 'loud', snoozeMin: 3, skipWindowMin: 'x', quietBlocks: [{ startMin: 1 }, { startMin: 60, endMin: 120 }], activeWeekdays: [9, -1, 'x'] },
        cups: [{ id: 'a', ml: 99_999, label: 'Big' }, { nope: true }],
        beverages: [{ id: 'tea', factor: 4 }, { id: 'coffee', factor: 'x' }],
        prefs: { preferredCupId: 'gone', largeText: 'yes', haptics: false, freezeEarnedDay: 'yesterday' },
      }),
      1,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.profile).toMatchObject({ weightKg: 65, activity: 'light', climate: 'mild' });
    expect(r.backup.goal).toMatchObject({ goalMl: 500, source: 'calculated', unit: 'ml' });
    expect(r.backup.reminders).toMatchObject({ wakeMin: 420, bedMin: 1380, frequency: 'smart', intervalMin: 120, style: 'normal', snoozeMin: 15, skipWindowMin: 30, quietBlocks: [{ startMin: 60, endMin: 120 }], activeWeekdays: [0, 1, 2, 3, 4, 5, 6] });
    expect(r.backup.cups).toEqual([{ id: 'a', ml: 1000, label: 'Big', icon: 'cup-water' }]);
    expect(r.backup.beverages.find((b) => b.id === 'tea')?.factor).toBe(1);
    expect(r.backup.beverages.find((b) => b.id === 'coffee')?.factor).toBe(0.8);
    expect(r.backup.prefs).toMatchObject({ preferredCupId: 'a', largeText: false, haptics: false });
    expect(r.backup.prefs.freezeEarnedDay).toBeUndefined();
  });
  it('clamps plant numbers and keeps a valid day', () => {
    const file = buildBackup(source(), NOW, 1);
    (file.progress as unknown as Record<string, unknown>).stage = 99;
    (file.progress as unknown as Record<string, unknown>).streakFreezes = 50;
    (file.progress as unknown as Record<string, unknown>).lastEvaluatedDay = 'soon';
    const r = parseBackup(text(file), 1);
    expect(r.ok && r.backup.progress).toMatchObject({ stage: 4, streakFreezes: 2, lastEvaluatedDay: '2026-10-08' });
  });
  it('defaults when the plant is not an object', () => {
    const file = { ...buildBackup(source(), NOW, 1), progress: [] };
    expect(parseBackup(text(file), 1)).toEqual({ ok: false, error: 'invalid' });
  });
  it('summarizes an empty backup', () => {
    const empty = buildBackup({ ...source(), logs: {}, daySummaries: {} }, NOW, 1);
    expect(summarizeBackup(empty)).toEqual({ drinks: 0, days: 0, goalDays: 5 });
    const r = parseBackup(text(empty), 1);
    expect(r.ok && r.backup.progress.lastEvaluatedDay).toBe('2026-10-07');
  });
});

describe('older schema', () => {
  it('runs migrations from the file version up to the current one', () => {
    const file = { ...buildBackup(source(), NOW, 1), schemaVersion: 1 };
    const migrate = jest.fn((old: Record<string, unknown>) => ({ ...old, goal: { ...(old.goal as object), goalMl: 3000 } }));
    const r = parseBackup(text(file), 2, { 2: migrate });
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(r.ok && r.backup.goal.goalMl).toBe(3000);
    expect(r.ok && r.backup.schemaVersion).toBe(2);
  });
});
