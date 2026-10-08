import '@/testing/mocks';
import { act } from 'react';
import { AppState } from 'react-native';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { DayKey } from '@/domain/types';
import { useHabits } from '@/store/habits';
import { useProfile } from '@/store/profile';

const mockInitAds = jest.fn(async () => undefined);
const mockSetGuard = jest.fn();
jest.mock('@shared/ads', () => ({
  initAds: (...a: unknown[]) => mockInitAds(...(a as [])),
  setAdGuard: (...a: unknown[]) => mockSetGuard(...(a as [])),
}));

import { adContext, hasCheckInIn, installAdGuard, markExternalOpen, markRewardedShown, resetAdGuardState, useAdsStart } from '../guard';

const TODAY = '2026-10-08' as DayKey;
const draft = {
  name: 'Read', icon: 'star-outline', color: '#7C5CFF', type: 'boolean' as const, target: 1,
  schedule: { kind: 'daily' as const }, category: 'other', createdAt: TODAY, reminderTime: null,
};

function Probe({ checkedIn, done }: { checkedIn: boolean; done: boolean }) {
  useAdsStart(checkedIn, done);
  return null;
}

beforeEach(() => {
  resetApp();
  resetAdGuardState();
  sharedStore.remove('onboarding.completedAt');
  mockInitAds.mockClear();
  mockSetGuard.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('hasCheckInIn', () => {
  it('ignores empty, zero and frozen entries', () => {
    expect(hasCheckInIn({})).toBe(false);
    expect(hasCheckInIn({ a: { [TODAY]: { value: 0, updatedAt: 0 } } })).toBe(false);
    expect(hasCheckInIn({ a: { [TODAY]: { value: 0, frozen: true, updatedAt: 0 } } })).toBe(false);
    expect(hasCheckInIn({ a: { [TODAY]: { value: 1, updatedAt: 0 } } })).toBe(true);
  });
});

describe('consent and ads start', () => {
  it('waits for onboarding and the first check-in', async () => {
    await render(<Probe checkedIn={false} done={false} />);
    await render(<Probe checkedIn done={false} />);
    await render(<Probe checkedIn={false} done />);
    await act(async () => jest.advanceTimersByTime(20_000));
    expect(mockInitAds).not.toHaveBeenCalled();
  });

  it('starts a few seconds after a first check-in made in this session, so the form never covers the celebration', async () => {
    const ui = await render(<Probe checkedIn={false} done />);
    await act(async () => jest.advanceTimersByTime(10_000));
    expect(mockInitAds).not.toHaveBeenCalled();
    await ui.update(<Probe checkedIn done />); // the first check-in
    await act(async () => jest.advanceTimersByTime(4_000));
    expect(mockInitAds).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTime(2_000));
    expect(mockInitAds).toHaveBeenCalledTimes(1);
  });

  it('starts at once in a later session when a check-in already exists', async () => {
    await render(<Probe checkedIn done />);
    await act(async () => jest.advanceTimersByTime(1));
    expect(mockInitAds).toHaveBeenCalledTimes(1);
  });
});

describe('ad guard', () => {
  it('installs a veto that follows the placement rules and removes it on cleanup', () => {
    const remove = installAdGuard();
    const guard = mockSetGuard.mock.calls[0][0] as (p: string) => boolean;
    expect(guard('today_bottom')).toBe(false); // nothing done yet
    remove();
    expect(mockSetGuard).toHaveBeenLastCalledWith(null);
  });

  it('reports the live state to the rules', () => {
    useProfile.setState({ profile: { ...useProfile.getState().profile, openDays: ['2026-10-07' as DayKey, TODAY] } });
    const { id } = useHabits.getState().addHabit(draft);
    useHabits.getState().setValue(id, TODAY, 1);
    const ctx = adContext();
    expect(ctx).toMatchObject({ habitCount: 1, hasCheckedIn: true, openDays: 2, lastRewardedAt: null, lastExternalOpenAt: null });
    markRewardedShown();
    markExternalOpen();
    expect(adContext().lastRewardedAt).not.toBeNull();
    expect(adContext().lastExternalOpenAt).not.toBeNull();
  });

  it('holds back app-open right after a notification or widget launch', () => {
    sharedStore.set('onboarding.completedAt', Date.now());
    useProfile.setState({ profile: { ...useProfile.getState().profile, openDays: ['2026-10-07' as DayKey, TODAY] } });
    const { id } = useHabits.getState().addHabit(draft);
    useHabits.getState().setValue(id, TODAY, 1);
    const remove = installAdGuard();
    const guard = mockSetGuard.mock.calls[0][0] as (p: string) => boolean;
    expect(guard('app_open')).toBe(true);
    markExternalOpen();
    expect(guard('app_open')).toBe(false);
    jest.setSystemTime(Date.now() + 11_000);
    expect(guard('app_open')).toBe(true);
    remove();
    void AppState;
  });
});
