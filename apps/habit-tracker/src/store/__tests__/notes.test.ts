import type { DayKey } from '@/domain/types';

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
jest.mock('expo-file-system', () => ({ File: class {}, Paths: {} }));

const DAY = '2026-10-08' as DayKey;

function boot() {
  let mod!: typeof import('../notes');
  jest.isolateModules(() => {
    mod = require('../notes');
  });
  return mod;
}

beforeEach(() => mockDisk.clear());

describe('day notes', () => {
  it('saves a note with a mood and keeps it across a restart', () => {
    boot().useNotes.getState().setNote(DAY, '  Good day  ', 4);
    expect(boot().useNotes.getState().notes[DAY]).toMatchObject({ text: 'Good day', mood: 4 });
  });
  it('keeps a mood-only note', () => {
    boot().useNotes.getState().setNote(DAY, '', 2);
    expect(boot().useNotes.getState().notes[DAY]).toMatchObject({ text: '', mood: 2 });
  });
  it('removes the note when both text and mood are empty', () => {
    const { useNotes } = boot();
    useNotes.getState().setNote(DAY, 'hello');
    useNotes.getState().setNote(DAY, '   ');
    expect(useNotes.getState().notes[DAY]).toBeUndefined();
    expect(boot().useNotes.getState().notes[DAY]).toBeUndefined();
  });
  it('caps a note at 1000 characters', () => {
    const { useNotes, NOTE_MAX } = boot();
    useNotes.getState().setNote(DAY, 'x'.repeat(NOTE_MAX + 50));
    expect(useNotes.getState().notes[DAY].text).toHaveLength(NOTE_MAX);
  });
});
