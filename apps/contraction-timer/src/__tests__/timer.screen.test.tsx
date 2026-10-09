import { mockKeepAwake } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { IDLE_PROMPT_MS } from '@/domain/session';
import { reloadSessionsFromDisk, useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import TimerScreen from '../../app/(tabs)/timer/index';

const NOW = new Date(2026, 10, 4, 2, 58, 0).getTime();
const wrap = () => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    <TimerScreen />
  </ThemeProvider>
);
const advance = (ms: number) => act(async () => void jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp();
  (Haptics.impactAsync as jest.Mock).mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('the Timer screen', () => {
  it('opens on one obvious Start button and the calm instruction', async () => {
    const ui = await render(wrap());
    expect(ui.byLabel('Start contraction')).toHaveLength(1);
    expect(ui.texts()).toContain('Tap when a contraction begins');
    expect(ui.texts()).toContain('Start');
    expect(mockKeepAwake.active.size).toBe(0);
  });

  it('starts timing on tap: Stop button, running digits from the start time, heavy haptic, screen kept awake', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    expect(useSessions.getState().active!.contractions[0].startedAt).toBe(NOW);
    expect(ui.texts()).toContain('Contraction in progress');
    expect(ui.byLabel(/^Stop contraction, 0 seconds$/)).toHaveLength(1);
    expect(mockKeepAwake.active.has('timer')).toBe(true);
    await advance(42_000);
    expect(ui.byLabel('Stop contraction, 42 seconds')).toHaveLength(1);
    expect(ui.texts()).toContain('0:42');
  });

  it('stops on the second tap (after the double-tap guard), double haptic, and shows how long since it started', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(48_000);
    await ui.press(/^Stop contraction/);
    expect(useSessions.getState().active!.contractions[0].endedAt).toBe(NOW + 48_000);
    await advance(3 * 60_000 + 12_000 - 48_000 + 1000);
    expect(ui.texts().some((t) => t.startsWith('Resting · 3:1'))).toBe(true);
    await advance(1000);
    expect(ui.byLabel('Start contraction')).toHaveLength(1);
    expect(mockKeepAwake.active.has('timer')).toBe(true); // a session is still open
    await advance(200);
    expect((Haptics.impactAsync as jest.Mock).mock.calls.filter((c) => c[0] === 'medium').length).toBe(2);
  });

  it('ignores a double tap rather than stopping a contraction that just began', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(200);
    await ui.press(/^Stop contraction/);
    expect(useSessions.getState().active!.contractions[0].endedAt).toBeNull();
  });

  it('does not buzz when Vibration is off in Settings', async () => {
    useSettings.getState().update({ haptics: false });
    const ui = await render(wrap());
    await ui.press('Start contraction');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('resumes after the app was killed: the same running contraction, "Timing restored", and the right elapsed time', async () => {
    let ui = await render(wrap());
    await ui.press('Start contraction');
    await cleanup(); // the screen is gone ...
    useSessions.setState({ active: null, index: [], archived: {}, restored: false });
    await advance(3 * 60_000); // ... three minutes pass ...
    reloadSessionsFromDisk(); // ... and the process starts again from the disk
    ui = await render(wrap());
    await flush();
    expect(ui.texts()).toContain('Timing restored');
    expect(ui.texts()).toContain('3:00');
    expect(ui.byLabel('Stop contraction, 3 minutes')).toHaveLength(1);
    expect(mockKeepAwake.active.has('timer')).toBe(true);
  });

  it('says "Still going?" once a contraction passes 3 minutes, with the provider line word for word', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(3 * 60_000);
    expect(ui.texts()).not.toContain('Still going? Tap Stop when it eases. If something feels wrong, call your provider.');
    await advance(2000);
    expect(ui.texts()).toContain('Still going? Tap Stop when it eases. If something feels wrong, call your provider.');
  });

  it('asks whether to end a session that went quiet for 2 hours, and Keep dismisses it', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(40_000);
    await ui.press(/^Stop contraction/);
    await advance(IDLE_PROMPT_MS + 1000);
    expect(ui.texts()).toContain('Looks like things calmed down. End this session?');
    await ui.press('Keep');
    expect(ui.texts()).not.toContain('Looks like things calmed down. End this session?');
    expect(useSessions.getState().active).not.toBeNull();
  });

  it('End on the idle prompt files the session', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(40_000);
    await ui.press(/^Stop contraction/);
    await advance(IDLE_PROMPT_MS + 1000);
    await ui.press('End');
    expect(useSessions.getState().active).toBeNull();
    expect(useSessions.getState().index).toHaveLength(1);
    expect(mockKeepAwake.active.size).toBe(0);
  });

  it('warns when the phone clock was set back before a tap', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await advance(30_000);
    jest.setSystemTime(NOW - 60 * 60_000); // the clock jumps back an hour
    await ui.press(/^Stop contraction/);
    expect(ui.texts()).toContain('Phone clock changed — times may be off');
    expect(useSessions.getState().active!.contractions[0].endedAt).toBe(NOW); // zero length, never negative
  });

  it('a long press opens "Undo last tap?" and confirming takes the tap back', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    const button = ui.root.findAll((n) => typeof n.props.onLongPress === 'function' && n.props.accessibilityRole === 'button')[0];
    expect(button.props.delayLongPress).toBe(600);
    await act(async () => button.props.onLongPress());
    expect(ui.texts()).toContain('Undo last tap?');
    await ui.press('Undo last tap');
    expect(useSessions.getState().active).toBeNull();
  });

  it('stops the page scrolling while a finger is on the button, and lets it scroll again afterwards', async () => {
    const ui = await render(wrap());
    const scroller = () => ui.root.findAll((n) => typeof n.props.scrollEnabled === 'boolean' && typeof n.type === 'string')[0];
    const button = ui.root.findAll((n) => typeof n.props.onPressIn === 'function' && n.props.accessibilityRole === 'button')[0];
    expect(scroller().props.scrollEnabled).toBe(true);
    await act(async () => button.props.onPressIn());
    expect(scroller().props.scrollEnabled).toBe(false);
    await act(async () => button.props.onPressOut());
    expect(scroller().props.scrollEnabled).toBe(true);
  });

  it('keeps a 56dp or larger hit area on the big button (220dp by default, hit slop 24)', async () => {
    const ui = await render(wrap());
    const button = ui.root.findAll((n) => n.props.accessibilityLabel === 'Start contraction' && n.props.hitSlop === 24)[0];
    expect(button).toBeTruthy();
  });

  it('releases the screen lock when the session ends', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    expect(mockKeepAwake.active.has('timer')).toBe(true);
    await act(async () => void useSessions.getState().endActive());
    expect(mockKeepAwake.active.size).toBe(0);
  });
});
