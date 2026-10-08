import { mockDisk, resetDisk } from '@/testing/mocks';
import { createStore } from '@shared/storage';
import { SCHEMA_VERSION, migrations } from '../migrations';
import type { WaterKeys } from '../storage';

beforeEach(() => resetDisk());

describe('water store', () => {
  it('stamps the schema version and keeps typed keys', () => {
    const { db } = require('../storage') as typeof import('../storage');
    expect(db.get('schemaVersion')).toBe(SCHEMA_VERSION);
    db.set('lastOpenAt', 123);
    expect(db.get('lastOpenAt')).toBe(123);
    db.set('logs:2026-10', []);
    expect(db.get('logs:2026-10')).toEqual([]);
    expect(mockDisk.get('water')?.has('logs:2026-10')).toBe(true);
  });
  it('runs a future migration on open (the framework from @shared/storage is wired)', () => {
    mockDisk.set('water', new Map<string, string | number>([['__version', 1], ['goal', JSON.stringify({ goalMl: 2000 })]]));
    const migrate = jest.fn((old: Record<string, unknown>) => ({ ...old, goal: { goalMl: 2500 } }));
    const store = createStore<WaterKeys>('water', 2, { ...migrations, 2: migrate });
    expect(migrate).toHaveBeenCalledTimes(1);
    expect(store.get('goal')).toEqual({ goalMl: 2500 });
  });
  it('starts at schema version 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(Object.keys(migrations)).toEqual([]);
  });
});
