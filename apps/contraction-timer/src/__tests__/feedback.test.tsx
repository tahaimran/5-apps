/**
 * Plan §7 feedback and format: haptics lead, sounds are opt-in (someone may be asleep nearby), the clock
 * follows the phone until a choice is made, and Partner mode never pushes text past 2× the base size.
 */
import { mockAudio, soundPlays } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { act } from 'react';
import * as Haptics from 'expo-haptics';
import { soundsEnabled } from '@shared/sound';
import { currentTimeFormat } from '@shared/time';
import '@/bootstrap';
import { timerHaptics } from '@/features/timer/haptics';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { partnerFactor, PARTNER_SCALE } from '@/theme/tokens';

beforeEach(() => {
  resetApp();
  (Haptics.impactAsync as jest.Mock).mockClear();
  for (const p of mockAudio.players) p.play.mockClear();
});

describe('sounds', () => {
  it('are off on a fresh install, so a Start makes no sound but still buzzes', async () => {
    expect(useSettings.getState().settings.sounds).toBe(false);
    expect(soundsEnabled()).toBe(false);
    await act(async () => timerHaptics.start());
    expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    expect(soundPlays()).toBe(0);
  });
  it('play once turned on: one sound for each start, stop and kick target', async () => {
    useSettings.getState().update({ sounds: true });
    expect(soundsEnabled()).toBe(true);
    timerHaptics.start();
    timerHaptics.stop();
    timerHaptics.kickTarget();
    // One sound each: start, stop (one sound for the double buzz) and the kick target.
    expect(soundPlays()).toBe(3);
  });
  it('leave haptics alone when vibration is off', async () => {
    useSettings.getState().update({ haptics: false });
    await act(async () => timerHaptics.start());
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('the 12/24-hour clock', () => {
  it('follows the phone by default', () => {
    expect(useSettings.getState().settings.timeFormat).toBeUndefined();
    expect(currentTimeFormat()).toBe('12h');
  });
  it('keeps a 24-hour choice saved before the redesign (clock24h: true) and drops the old 12-hour default', () => {
    jest.isolateModules(() => {
      db.set('settings', { ...useSettings.getState().settings, clock24h: true } as never);
      const fresh = require('@/store/settings').useSettings as typeof useSettings;
      expect(fresh.getState().settings.timeFormat).toBe('24h');
      expect('clock24h' in fresh.getState().settings).toBe(false);
    });
    jest.isolateModules(() => {
      db.set('settings', { ...useSettings.getState().settings, timeFormat: undefined, clock24h: false } as never);
      const fresh = require('@/store/settings').useSettings as typeof useSettings;
      expect(fresh.getState().settings.timeFormat).toBeUndefined();
    });
  });
});

describe('Partner mode type scale', () => {
  it('is 1.4× at normal text size and never takes Partner × the phone\'s scale past 2×', () => {
    expect(partnerFactor(1)).toBe(PARTNER_SCALE);
    expect(partnerFactor(1.3) * 1.3).toBeCloseTo(1.82, 5);
    expect(partnerFactor(1.6) * 1.6).toBeCloseTo(2, 5);
    expect(partnerFactor(2)).toBe(1);
    expect(partnerFactor(2.5)).toBe(1);
  });
});
