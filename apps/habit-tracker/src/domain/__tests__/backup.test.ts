import { backupFileName, buildBackup, parseBackup, summarizeBackup, type BackupSource } from '../backup';
import { defaultSettings } from '../defaults';
import type { Migration } from '@shared/storage';
import { d, done, habit } from '../testHelpers';

const source = (): BackupSource => {
  const a = habit({ id: 'a', name: 'Read' });
  const b = habit({ id: 'b', name: 'Old', archivedAt: '2026-10-01' });
  return {
    habits: { a, b },
    habitOrder: ['a'],
    entries: { a: done('2026-10-06', '2026-10-07'), b: done('2026-09-20') },
    notes: { [d('2026-10-07')]: { text: 'Good day', mood: 4, updatedAt: 1 } },
    freezes: { count: 1, log: [{ day: d('2026-10-05'), source: 'ad' }] },
    settings: { ...defaultSettings, weekStartsOn: 0 },
  };
};

const NOW = new Date('2026-10-08T12:00:00Z');
const roundTrip = (src = source()) => JSON.stringify(buildBackup(src, NOW, 1));

describe('buildBackup', () => {
  it('includes archived habits, order, entries, notes, freezes and settings', () => {
    const b = buildBackup(source(), NOW, 1);
    expect(b).toMatchObject({ app: 'habit-tracker', schemaVersion: 1, exportedAt: '2026-10-08T12:00:00.000Z', habitOrder: ['a'] });
    expect(b.habits.map((h) => h.id).sort()).toEqual(['a', 'b']);
    expect(Object.keys(b.entries).sort()).toEqual(['a', 'b']);
  });
  it('leaves out habits with no entries and entries of unknown habits', () => {
    const src = source();
    src.entries = { a: {}, ghost: done('2026-10-06') };
    expect(buildBackup(src, NOW, 1).entries).toEqual({});
  });
  it('names the file by date', () => {
    expect(backupFileName('2026-10-08')).toBe('habits-backup-2026-10-08.json');
  });
});

describe('parseBackup', () => {
  it('round-trips what buildBackup writes', () => {
    const r = parseBackup(roundTrip(), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.habits).toHaveLength(2);
    expect(r.backup.entries.a['2026-10-07' as never].value).toBe(1);
    expect(r.backup.settings.weekStartsOn).toBe(0);
    expect(r.backup.freezes.count).toBe(1);
    expect(r.backup.notes['2026-10-07' as never]).toMatchObject({ text: 'Good day', mood: 4 });
    expect(r.summary).toEqual({ habits: 2, checkIns: 3, notes: 1 });
  });
  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json', 1)).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup('', 1)).toEqual({ ok: false, error: 'invalid' });
  });
  it('rejects files from other apps', () => {
    expect(parseBackup('{"hello":1}', 1)).toEqual({ ok: false, error: 'notBackup' });
    expect(parseBackup('[]', 1)).toEqual({ ok: false, error: 'notBackup' });
    expect(parseBackup('{"app":"water-reminder","schemaVersion":1}', 1)).toEqual({ ok: false, error: 'notBackup' });
  });
  it('rejects a newer schema with its own error', () => {
    const newer = JSON.stringify({ ...buildBackup(source(), NOW, 1), schemaVersion: 2 });
    expect(parseBackup(newer, 1)).toEqual({ ok: false, error: 'newer' });
  });
  it('rejects a bad schema version', () => {
    const raw = { ...buildBackup(source(), NOW, 1), schemaVersion: 'x' };
    expect(parseBackup(JSON.stringify(raw), 1)).toEqual({ ok: false, error: 'invalid' });
    expect(parseBackup(JSON.stringify({ ...raw, schemaVersion: 0 }), 1)).toEqual({ ok: false, error: 'invalid' });
  });
  it('rejects a malformed habit', () => {
    const raw = buildBackup(source(), NOW, 1);
    expect(parseBackup(JSON.stringify({ ...raw, habits: [{ id: 'x' }] }), 1).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...raw, habits: [{ ...raw.habits[0], type: 'weird' }] }), 1).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...raw, habits: [{ ...raw.habits[0], createdAt: 'yesterday' }] }), 1).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...raw, habits: [{ ...raw.habits[0], schedule: { kind: 'monthly' } }] }), 1).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...raw, habits: 'nope' }), 1).ok).toBe(false);
  });
  it('rejects duplicate habit ids', () => {
    const raw = buildBackup(source(), NOW, 1);
    expect(parseBackup(JSON.stringify({ ...raw, habits: [raw.habits[0], raw.habits[0]] }), 1).ok).toBe(false);
  });
  it('drops entries of unknown habits and bad day keys or values instead of failing', () => {
    const raw = buildBackup(source(), NOW, 1) as unknown as Record<string, unknown>;
    raw.entries = {
      a: { '2026-10-06': { value: 1, updatedAt: 0 }, 'bad-day': { value: 1 }, '2026-10-05': { value: -4 }, '2026-10-04': { value: 'x' } },
      ghost: { '2026-10-06': { value: 1 } },
    };
    const r = parseBackup(JSON.stringify(raw), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.keys(r.backup.entries)).toEqual(['a']);
    expect(Object.keys(r.backup.entries.a)).toEqual(['2026-10-06']);
  });
  it('rebuilds the habit order from the active habits', () => {
    const raw = buildBackup(source(), NOW, 1) as unknown as Record<string, unknown>;
    raw.habitOrder = ['ghost', 'b'];
    const r = parseBackup(JSON.stringify(raw), 1);
    expect(r.ok && r.backup.habitOrder).toEqual(['a']);
  });
  it('fills in defaults for missing or bad settings and clamps freezes', () => {
    const raw = buildBackup(source(), NOW, 1) as unknown as Record<string, unknown>;
    raw.settings = { theme: 'neon', weekStartsOn: 5, dailySummary: { enabled: true, time: '25:99' } };
    raw.freezes = { count: 99, log: [{ day: 'bad', source: 'ad' }] };
    const r = parseBackup(JSON.stringify(raw), 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.settings).toEqual(defaultSettings);
    expect(r.backup.freezes).toMatchObject({ count: 2, log: [] });
  });
  it('accepts a backup with no entries, notes or settings', () => {
    const raw = { app: 'habit-tracker', schemaVersion: 1, habits: [] };
    const r = parseBackup(JSON.stringify(raw), 1);
    expect(r.ok && r.summary).toEqual({ habits: 0, checkIns: 0, notes: 0 });
  });
  it('strips stored notification ids (they belong to the old device)', () => {
    const raw = buildBackup(source(), NOW, 1);
    raw.habits[0].reminders = [{ time: '08:00', notifIds: ['abc'] }];
    const r = parseBackup(JSON.stringify(raw), 1);
    expect(r.ok && r.backup.habits[0].reminders).toEqual([{ time: '08:00', notifIds: [] }]);
  });
  it('runs migrations for older schemas', () => {
    const raw = JSON.stringify({ ...buildBackup(source(), NOW, 1), schemaVersion: 1 });
    const migrations: Record<number, Migration> = {
      2: (snap) => {
        const habits = snap.habits as Record<string, { name: string }>;
        return { ...snap, habits: Object.fromEntries(Object.entries(habits).map(([k, h]) => [k, { ...h, name: `${h.name}!` }])) };
      },
    };
    const r = parseBackup(raw, 2, migrations);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.schemaVersion).toBe(2);
    expect(r.backup.habits.map((h) => h.name).sort()).toEqual(['Old!', 'Read!']);
  });
});

describe('summarizeBackup', () => {
  it('counts habits, logged days and notes', () => {
    const b = buildBackup(source(), NOW, 1);
    expect(summarizeBackup(b)).toEqual({ habits: 2, checkIns: 3, notes: 1 });
  });
});
