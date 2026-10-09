import { mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { db } from '@/store/storage';
import { SCHEMA_VERSION } from '@/store/migrations';
import { useSettings } from '@/store/settings';
import { useProfile } from '@/store/profile';
import { useMeta } from '@/store/meta';
import { defaultSettings } from '@/domain/defaults';

describe('the ct store', () => {
  it('is its own MMKV store with a schema version', () => {
    expect(mockDisk.has('ct')).toBe(true);
    expect(SCHEMA_VERSION).toBe(1);
    expect(db.get('schemaVersion')).toBe(SCHEMA_VERSION);
  });
  it('round-trips typed keys, including the archived-session pattern', () => {
    db.set('sessions.index', ['a']);
    expect(db.get('sessions.index')).toEqual(['a']);
    expect(db.get('session.zzz')).toBeUndefined();
  });
});

describe('settings', () => {
  beforeEach(() => resetApp());
  it('start with the plan defaults: 5-1-1, alerts on, 10 kicks, reminder off at 8 PM', () => {
    expect(useSettings.getState().settings).toEqual(defaultSettings);
    expect(defaultSettings.rule).toEqual({ preset: '511', intervalMaxMin: 5, durationMinSec: 60, sustainMin: 60 });
    expect(defaultSettings.patternAlerts).toBe(true);
    expect(defaultSettings.kickTarget).toBe(10);
    expect(defaultSettings.kickReminder).toEqual({ enabled: false, hour: 20, minute: 0 });
    expect(defaultSettings.ongoingNotif).toBe(false);
  });
  it('save every change to disk', () => {
    useSettings.getState().update({ haptics: false, kickTarget: 12 });
    expect(db.get('settings')).toMatchObject({ haptics: false, kickTarget: 12 });
  });
});

describe('profile and meta', () => {
  beforeEach(() => resetApp());
  it('works out and saves the due date', () => {
    useProfile.getState().setDue({ mode: 'lmp', date: '2026-01-01', cycleLength: 28 });
    expect(useProfile.getState().profile).toMatchObject({ dateMode: 'lmp', inputDate: '2026-01-01', edd: '2026-10-08' });
    expect(db.get('profile')?.edd).toBe('2026-10-08');
    useProfile.getState().clearDue();
    expect(useProfile.getState().profile.edd).toBeUndefined();
  });
  it('records the disclaimer acknowledgement and launches', () => {
    useMeta.getState().acknowledgeDisclaimer(123);
    useMeta.getState().recordLaunch();
    expect(db.get('meta')).toMatchObject({ disclaimerAckAt: 123, launches: 1 });
  });
});
