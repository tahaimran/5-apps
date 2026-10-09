import '@/testing/stores';
import React from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { sharedStore } from '@shared/storage';
import { mockAds, mockNotif, mockNotifState, mockRouter } from '@/testing/mocks';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { confirmReset, resetProgress } from '@/features/settings/reset';
import { useAds } from '@/store/ads';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useAdCounters, useClassic, useDaily, useProfile, useSeen, useStats, useStreak } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import Settings from '../../app/(tabs)/settings';
import Privacy from '../../app/privacy';

beforeEach(() => {
  resetApp();
  jest.restoreAllMocks();
});
afterEach(cleanup);

describe('Settings screen (plan F11)', () => {
  it('toggles sound and vibration, and says On or Off in words', async () => {
    const r = await render(<Settings />);
    expect(useSettings.getState().settings).toMatchObject({ sound: true, haptics: true });
    const toggle = async (label: string) => {
      const sw = r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onValueChange === 'function')[0];
      const { act } = require('react');
      await act(async () => sw.props.onValueChange(false));
    };
    await toggle('Sound effects');
    await toggle('Vibration feedback');
    expect(useSettings.getState().settings).toMatchObject({ sound: false, haptics: false });
    expect(r.texts().filter((x) => x === 'Off').length).toBeGreaterThanOrEqual(2);
  });

  it('changes the text size in four steps and the text really grows', async () => {
    const r = await render(<Settings />);
    for (const [label, scale] of [['Small', 0.9], ['Large', 1.15], ['Extra large', 1.3], ['Medium', 1]] as const) {
      await r.press(label);
      expect(useSettings.getState().settings.textScale).toBe(scale);
    }
    useSettings.getState().update({ textScale: 1.3 });
    const probe = await render(<AppText variant="body">hello</AppText>);
    const style = StyleSheet.flatten(probe.root.findAll((n) => (n.type as unknown) === 'Text')[0].props.style);
    expect(style.fontSize).toBe(Math.round(16 * 1.3));
    expect(style.lineHeight).toBe(Math.round(24 * 1.3));
    expect(Text).toBeDefined();
  });

  it('switches the theme between system, light and dark, and keeps the choice', async () => {
    const r = await render(<Settings />);
    await r.press('Dark');
    expect(sharedStore.get('theme.mode')).toBe('dark');
    expect(useSettings.getState().settings.theme).toBe('dark');
    await r.press('Same as phone');
    expect(sharedStore.get('theme.mode')).toBe('system');
  });

  it('turns relaxed mode on and off', async () => {
    const r = await render(<Settings />);
    const sw = r.root.findAll((n) => n.props.accessibilityLabel === 'Relaxed mode' && typeof n.props.onValueChange === 'function')[0];
    const { act } = require('react');
    await act(async () => sw.props.onValueChange(true));
    expect(useSettings.getState().settings.relaxedMode).toBe(true);
  });

  it('turns the reminder on with a system permission, shows its time, changes it, and turns it off', async () => {
    const { act } = require('react');
    const r = await render(<Settings />);
    expect(r.texts().join(' ')).not.toContain('Reminder time');
    const sw = () => r.root.findAll((n) => n.props.accessibilityLabel === 'Remind me every day' && typeof n.props.onValueChange === 'function')[0];
    await act(async () => sw().props.onValueChange(true));
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 19, minute: 0 });
    expect(r.texts().join(' ')).toMatch(/Reminder time: 7:00\s?PM/);
    expect(mockNotifState.pending.size).toBeGreaterThan(0);
    await r.press('One hour later');
    expect(useSettings.getState().settings.reminder.hour).toBe(20);
    await act(async () => sw().props.onValueChange(false));
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(mockNotifState.pending.size).toBe(0);
  });

  it('explains a refused notification permission and offers the phone settings when it is blocked', async () => {
    const { act } = require('react');
    mockNotif.answer = false;
    const r = await render(<Settings />);
    const sw = r.root.findAll((n) => n.props.accessibilityLabel === 'Remind me every day' && typeof n.props.onValueChange === 'function')[0];
    await act(async () => sw.props.onValueChange(true));
    expect(r.texts().join(' ')).toContain('Notifications are blocked for Quizora');
    expect(r.byLabel('Open phone settings')).toHaveLength(1);
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
  });

  it('shows "Privacy choices" only where Google requires it, and opens the form', async () => {
    const { act } = require('react');
    let r = await render(<Settings />);
    await act(async () => {});
    expect(r.byLabel('Privacy choices (ads)')).toHaveLength(0);
    await cleanup();
    jest.spyOn(require('@shared/consent'), 'isPrivacyOptionsRequired').mockResolvedValue(true);
    const open = jest.spyOn(require('@shared/consent'), 'openPrivacyOptions').mockResolvedValue(undefined);
    r = await render(<Settings />);
    await act(async () => {});
    await r.press('Privacy choices (ads)');
    expect(open).toHaveBeenCalled();
    void mockAds;
  });

  it('opens the privacy summary, which says progress stays on the phone and names AdMob', async () => {
    const r = await render(<Settings />);
    await r.press('How Quizora uses data');
    expect(mockRouter.push).toHaveBeenCalledWith('/privacy');
    await cleanup();
    const p = await render(<Privacy />);
    expect(p.texts().join(' ')).toContain('only on this phone');
    expect(p.texts().join(' ')).toContain('Google AdMob');
    expect(p.texts().join(' ')).toContain('13 and up');
  });

  it('shows the app version and the question bank version', async () => {
    const r = await render(<Settings />);
    expect(r.texts().join(' ')).toContain('Version 1.0.0');
    expect(r.texts().join(' ')).toContain('Questions: bank v1.0.0');
  });

  it('keeps every control 48dp and labelled at the largest text size', async () => {
    useSettings.getState().update({ textScale: 1.3 });
    const r = await render(<Settings />, { fontScale: 1.3 });
    expect(auditPressables(r.root)).toEqual([]);
  });
});

describe('Reset progress', () => {
  const dirty = () => {
    useClassic.getState().set({ music: { stars: { 1: 3 }, unlocked: 2, bestScores: { 1: 900 } } });
    useSeen.getState().set({ 'mus-000001': { d: 1, n: 1, c: 1 } });
    useDaily.getState().update({ lastPlayedDate: '2026-10-08', lastScore: 9 });
    useStreak.getState().update({ current: 5, best: 9, lastDate: '2026-10-08' });
    useStats.getState().update({ answered: 50, correct: 40, roundsPlayed: 9, blitzBest: 12, sessions: 4 });
    useProfile.getState().update({ xp: 900, level: 5, favoriteCategories: ['music', 'food', 'logic'], preferredDifficulty: 3 });
    useAdCounters.getState().update({ roundsSinceInterstitial: 1 });
    useSettings.getState().update({ relaxedMode: true });
    db.set('classic.last', { category: 'music', level: 1 });
    db.set('onboarding.done', true);
  };

  it('erases progress but keeps settings, favourites, onboarding and the ad counters', () => {
    dirty();
    const firstOpenAt = useStats.getState().value.firstOpenAt;
    resetProgress();
    expect(useClassic.getState().value).toEqual({});
    expect(useSeen.getState().value).toEqual({});
    expect(useDaily.getState().value).toMatchObject({ lastPlayedDate: null, history: [] });
    expect(useStreak.getState().value).toMatchObject({ current: 0, best: 0, lastDate: null });
    expect(useStats.getState().value).toMatchObject({ answered: 0, correct: 0, roundsPlayed: 0, blitzBest: 0, sessions: 4, firstOpenAt });
    expect(useProfile.getState().value).toMatchObject({ xp: 0, level: 1, favoriteCategories: ['music', 'food', 'logic'], preferredDifficulty: 3 });
    expect(db.get('classic.last')).toBeUndefined();
    expect(useSettings.getState().settings.relaxedMode).toBe(true);
    expect(db.get('onboarding.done')).toBe(true);
    expect(useAdCounters.getState().value.roundsSinceInterstitial).toBe(1);
    void useAds;
  });

  it('asks twice and only erases on the second confirmation', () => {
    dirty();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    confirmReset();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(useStats.getState().value.answered).toBe(50);
    const first = alert.mock.calls[0][2]!;
    first[0].onPress?.(); // Cancel
    expect(alert).toHaveBeenCalledTimes(1);
    first[1].onPress?.(); // Continue
    expect(alert).toHaveBeenCalledTimes(2);
    expect(useStats.getState().value.answered).toBe(50);
    const second = alert.mock.calls[1][2]!;
    second[0].onPress?.(); // Cancel
    expect(useStats.getState().value.answered).toBe(50);
    second[1].onPress?.(); // Erase everything
    expect(useStats.getState().value.answered).toBe(0);
  });
});
