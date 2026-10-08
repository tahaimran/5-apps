import { mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { defaultCups } from '@/domain/defaults';
import { preferredCup, useSettings } from '../settings';
import { db } from '../storage';

beforeEach(() => resetApp());

describe('settings store', () => {
  it('persists each part to its key', () => {
    const s = useSettings.getState();
    s.setGoal({ goalMl: 2600, source: 'manual' });
    s.setReminders({ style: 'gentle' });
    s.setProfile({ weightKg: 70 });
    s.setPrefs({ largeText: true });
    s.setCups([defaultCups[1]]);
    s.setBeverages([{ id: 'tea', factor: 0.8 }]);
    expect(db.get('goal')).toMatchObject({ goalMl: 2600, source: 'manual' });
    expect(db.get('reminders')?.style).toBe('gentle');
    expect(db.get('profile')?.weightKg).toBe(70);
    expect(db.get('prefs')?.largeText).toBe(true);
    expect(db.get('cups')).toHaveLength(1);
    expect(db.get('beverages')).toEqual([{ id: 'tea', factor: 0.8 }]);
  });
  it('stamps the goal update time', () => {
    useSettings.getState().setGoal({ goalMl: 2200 });
    expect(useSettings.getState().goal.updatedAt).toBeGreaterThan(0);
  });
  it('fills in defaults for keys a stored value lacks (an older version)', () => {
    mockDisk.set('water', new Map<string, string | number>([['__version', 1], ['reminders', JSON.stringify({ wakeMin: 360 })], ['beverages', JSON.stringify([{ id: 'tea', factor: 0.7 }])]]));
    jest.isolateModules(() => {
      const fresh = (require('../settings') as typeof import('../settings')).useSettings.getState();
      expect(fresh.reminders).toMatchObject({ wakeMin: 360, bedMin: 1380, frequency: 'smart', enabled: true });
      expect(fresh.beverages.find((b) => b.id === 'tea')?.factor).toBe(0.7);
      expect(fresh.beverages.find((b) => b.id === 'coffee')?.factor).toBe(0.8);
    });
  });
  it('replaces everything at once (restore)', () => {
    const s = useSettings.getState();
    useSettings.getState().replaceAll({ ...s, goal: { ...s.goal, goalMl: 3000 }, prefs: { ...s.prefs, haptics: false } });
    expect(db.get('goal')?.goalMl).toBe(3000);
    expect(useSettings.getState().prefs.haptics).toBe(false);
  });
  it('finds the preferred cup, falling back to the first', () => {
    const s = useSettings.getState();
    expect(preferredCup(s).ml).toBe(250);
    expect(preferredCup({ cups: s.cups, prefs: { ...s.prefs, preferredCupId: 'cup-500' } }).ml).toBe(500);
    expect(preferredCup({ cups: s.cups, prefs: { ...s.prefs, preferredCupId: 'gone' } }).ml).toBe(150);
    expect(preferredCup({ cups: [], prefs: s.prefs }).ml).toBe(250);
  });
});
