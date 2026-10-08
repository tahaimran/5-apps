import type { DayKey } from '@/domain/types';
import type { HabitDraft } from '@/domain/validate';

const mockDisk = new Map<string, Map<string, string | number>>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: ({ id }: { id: string }) => {
    if (!mockDisk.has(id)) mockDisk.set(id, new Map());
    const m = mockDisk.get(id)!;
    return {
      getString: (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : undefined),
      getNumber: (k: string) => (typeof m.get(k) === 'number' ? (m.get(k) as number) : undefined),
      set: (k: string, v: string | number) => void m.set(k, v),
      remove: (k: string) => m.delete(k),
      getAllKeys: () => [...m.keys()],
      clearAll: () => m.clear(),
    };
  },
}));
const mockFiles = new Map<string, string>();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'file:///cache' },
  File: class {
    uri: string;
    constructor(dir: string, name?: string) {
      this.uri = name ? `${dir}/${name}` : dir;
    }
    create() {}
    write(text: string) {
      mockFiles.set(this.uri, text);
    }
    async text() {
      return mockFiles.get(this.uri) ?? '';
    }
    static async pickFileAsync() {
      return { canceled: false, result: new this('file:///cache/picked.json') };
    }
  },
}));
const mockShare = jest.fn(async () => undefined);
jest.mock('expo-sharing', () => ({ shareAsync: (...a: unknown[]) => mockShare(...(a as [])) }));

const TODAY = '2026-10-08' as DayKey;
const draft = (name: string, over: Partial<HabitDraft> = {}): HabitDraft => ({
  name,
  icon: 'star-outline',
  color: '#7C5CFF',
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'other',
  createdAt: '2026-09-01' as DayKey,
  reminderTime: null,
  ...over,
});

function boot() {
  let m!: { files: typeof import('../files'); habits: typeof import('@/store/habits'); notes: typeof import('@/store/notes'); settings: typeof import('@/store/settings') };
  jest.isolateModules(() => {
    require('@/bootstrap');
    m = { files: require('../files'), habits: require('@/store/habits'), notes: require('@/store/notes'), settings: require('@/store/settings') };
  });
  return m;
}

beforeEach(() => {
  mockDisk.clear();
  mockFiles.clear();
  mockShare.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 12, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

describe('backup export and restore', () => {
  it('exports to a dated file and shares it', async () => {
    const { files, habits } = boot();
    const { id } = habits.useHabits.getState().addHabit(draft('Read'));
    habits.useHabits.getState().setValue(id, TODAY, 1);
    await files.exportBackup();
    expect(mockShare).toHaveBeenCalledWith('file:///cache/habits-backup-2026-10-08.json', expect.objectContaining({ mimeType: 'application/json' }));
    const written = JSON.parse(mockFiles.get('file:///cache/habits-backup-2026-10-08.json')!);
    expect(written).toMatchObject({ app: 'habit-tracker', schemaVersion: 1 });
    expect(written.habits).toHaveLength(1);
  });

  it('restores an export onto a fresh device, replacing what was there', async () => {
    const a = boot();
    const { id } = a.habits.useHabits.getState().addHabit(draft('Read'));
    a.habits.useHabits.getState().setValue(id, TODAY, 1);
    a.notes.useNotes.getState().setNote(TODAY, 'Good day', 5);
    a.settings.useSettings.getState().update({ weekStartsOn: 0 });
    await a.files.exportBackup();
    const exported = mockFiles.get('file:///cache/habits-backup-2026-10-08.json')!;

    mockDisk.clear(); // a different phone, with its own data
    const b = boot();
    b.habits.useHabits.getState().addHabit(draft('Something else'));
    mockFiles.set('file:///cache/picked.json', exported);

    const picked = await b.files.pickBackup();
    expect(picked.kind).toBe('parsed');
    if (picked.kind !== 'parsed' || !picked.ok) throw new Error('expected a parsed backup');
    expect(picked.summary).toEqual({ habits: 1, checkIns: 1, notes: 1 });
    b.files.restoreBackup(picked.backup);

    const names = Object.values(b.habits.useHabits.getState().habits).map((h) => h.name);
    expect(names).toEqual(['Read']);
    expect(b.habits.useHabits.getState().entries[id][TODAY].value).toBe(1);
    expect(b.notes.useNotes.getState().notes[TODAY]).toMatchObject({ text: 'Good day', mood: 5 });
    expect(b.settings.useSettings.getState().settings.weekStartsOn).toBe(0);

    // ...and it is on disk, not just in memory.
    const c = boot();
    expect(Object.values(c.habits.useHabits.getState().habits).map((h) => h.name)).toEqual(['Read']);
    expect(c.habits.useHabits.getState().entries[id][TODAY].value).toBe(1);
  });

  it('leaves no entries of replaced habits behind', async () => {
    const a = boot();
    const old = a.habits.useHabits.getState().addHabit(draft('Old'));
    a.habits.useHabits.getState().setValue(old.id, TODAY, 1);
    mockFiles.set(
      'file:///cache/picked.json',
      JSON.stringify({ app: 'habit-tracker', schemaVersion: 1, habits: [], habitOrder: [] }),
    );
    const picked = await a.files.pickBackup();
    if (picked.kind !== 'parsed' || !picked.ok) throw new Error('expected a parsed backup');
    a.files.restoreBackup(picked.backup);
    expect(mockDisk.get('habit-tracker')!.has(`entries:${old.id}`)).toBe(false);
    expect(boot().habits.useHabits.getState().habitOrder).toEqual([]);
  });

  it('marks restored history as already celebrated', async () => {
    const a = boot();
    const { id } = a.habits.useHabits.getState().addHabit(draft('Read', { createdAt: '2026-10-01' as DayKey }));
    for (const d of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']) {
      a.habits.useHabits.getState().setValue(id, d as DayKey, 1);
    }
    await a.files.exportBackup();
    const exported = mockFiles.get('file:///cache/habits-backup-2026-10-08.json')!;
    mockDisk.clear();
    const b = boot();
    mockFiles.set('file:///cache/picked.json', exported);
    const picked = await b.files.pickBackup();
    if (picked.kind !== 'parsed' || !picked.ok) throw new Error('expected a parsed backup');
    b.files.restoreBackup(picked.backup);
    const celebrated = JSON.parse(String(mockDisk.get('habit-tracker')!.get('celebrated')));
    expect(celebrated.first).toBe(true);
    expect(celebrated.milestones[id]).toBe(7);
  });

  it('reports a bad file without changing anything', async () => {
    const a = boot();
    a.habits.useHabits.getState().addHabit(draft('Keep me'));
    mockFiles.set('file:///cache/picked.json', '{"hello": "world"}');
    const picked = await a.files.pickBackup();
    expect(picked).toMatchObject({ kind: 'parsed', ok: false, error: 'notBackup' });
    expect(Object.values(a.habits.useHabits.getState().habits).map((h) => h.name)).toEqual(['Keep me']);
  });
});
