import { mockMotion } from '@/testing/mocks';
import { act } from 'react';
import { AccessibilityInfo } from 'react-native';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { useCelebration } from '@/store/celebrations';
import { palette } from '@/theme/tokens';
import { CelebrationHost } from '../CelebrationHost';

const host = (
  <ThemeProvider palette={palette}>
    <CelebrationHost />
  </ThemeProvider>
);
const confettiPieces = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => typeof n.props.style !== 'undefined' && JSON.stringify(n.props.style).includes('"borderRadius":2'));

beforeEach(() => {
  jest.useFakeTimers();
  useCelebration.setState({ current: null });
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
});
afterEach(async () => {
  await cleanup();
  mockMotion.reduced = true;
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('celebration overlay (plan §7.4)', () => {
  it('renders nothing when idle', async () => {
    const ui = await render(host);
    expect(ui.texts()).toEqual([]);
  });
  it('shows confetti and the toast for a reached goal, announces it, and goes away after 3.2 s', async () => {
    mockMotion.reduced = false;
    const ui = await render(host);
    await act(async () => useCelebration.getState().show({ kind: 'goal' }));
    expect(ui.texts()).toContain('Goal reached! 🎉');
    expect(confettiPieces(ui).length).toBeGreaterThanOrEqual(30);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Goal reached! 🎉');
    await act(async () => void jest.advanceTimersByTime(3300));
    expect(ui.texts()).toEqual([]);
  });
  it('skips the confetti with reduced motion but still shows and announces the toast', async () => {
    const ui = await render(host);
    await act(async () => useCelebration.getState().show({ kind: 'goal' }));
    expect(confettiPieces(ui)).toHaveLength(0);
    expect(ui.texts()).toContain('Goal reached! 🎉');
  });
  it('tells the user a streak freeze was used, without confetti', async () => {
    mockMotion.reduced = false;
    const ui = await render(host);
    await act(async () => useCelebration.getState().show({ kind: 'freezeUsed', count: 1 }));
    expect(ui.texts()).toContain('A streak freeze kept your streak alive.');
    expect(confettiPieces(ui)).toHaveLength(0);
  });
  it('never takes touches away from the screen below', async () => {
    const ui = await render(host);
    await act(async () => useCelebration.getState().show({ kind: 'goal' }));
    expect(ui.root.findAll((n) => n.props.pointerEvents === 'none').length).toBeGreaterThan(0);
  });
});
