import { mockPath } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { act } from 'react';
import { sharedStore } from '@shared/storage';

const mockStart = jest.fn(async () => undefined);
jest.mock('@/ads/start', () => ({ startAds: () => mockStart() }));

import { isTimerButtonScreen, useStartAdsWhenSafe } from '@/ads/useStartAds';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSessions } from '@/store/sessions';

function Probe() {
  useStartAdsWhenSafe();
  return null;
}

beforeEach(() => {
  resetApp();
  mockStart.mockClear();
  sharedStore.set('onboarding.completedAt', 1);
  useMeta.getState().update({ disclaimerAckAt: 1 });
  mockPath.current = '/more';
});
afterEach(async () => {
  await cleanup();
  sharedStore.remove('onboarding.completedAt');
  mockPath.current = '/timer';
});

describe('when consent and the ads SDK may start (plan §6)', () => {
  it('on any screen but the Timer button\'s, once onboarding and the disclaimer are done', async () => {
    await render(<Probe />);
    expect(mockStart).toHaveBeenCalled();
  });
  it.each(['/', '/timer', '/timer/', '/onboarding'])('never on %s: the form must not cover the button', async (path) => {
    mockPath.current = path;
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
  });
  it('but on the history, a session detail, and every other tab', async () => {
    for (const path of ['/timer/history', '/timer/session/abc', '/kicks', '/pregnancy', '/more/settings']) {
      mockPath.current = path;
      await render(<Probe />);
      await cleanup();
    }
    expect(mockStart).toHaveBeenCalledTimes(5);
  });
  it('never mid-session: not with a contraction session open, nor a kick count', async () => {
    useSessions.getState().tap(Date.now());
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
    await cleanup();
    useSessions.getState().reset();
    useKicks.getState().start(Date.now());
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
  });
  it('and then as soon as the session is over', async () => {
    useSessions.getState().tap(Date.now());
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
    await act(async () => void useSessions.getState().endActive());
    expect(mockStart).toHaveBeenCalled();
  });
  it('never before onboarding is complete or the disclaimer acknowledged', async () => {
    useMeta.getState().update({ disclaimerAckAt: undefined });
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
    await cleanup();
    useMeta.getState().update({ disclaimerAckAt: 1 });
    sharedStore.remove('onboarding.completedAt');
    await render(<Probe />);
    expect(mockStart).not.toHaveBeenCalled();
  });
});

describe('isTimerButtonScreen', () => {
  it('is only the Timer tab\'s own screen, the root and onboarding', () => {
    expect(isTimerButtonScreen('/timer')).toBe(true);
    expect(isTimerButtonScreen('/timer/history')).toBe(false);
    expect(isTimerButtonScreen('/kicks')).toBe(false);
  });
});
