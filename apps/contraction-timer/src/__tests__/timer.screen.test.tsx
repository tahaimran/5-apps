import { mockKeepAwake } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import * as Haptics from 'expo-haptics';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { IDLE_PROMPT_MS } from '@/domain/session';
import { reloadSessionsFromDisk, useSessions } from '@/store/sessions';
import { series, sessionOf, MINUTE, SECOND } from '@/testing/fixtures';
import { RULE_PRESETS } from '@/domain/defaults';
import { sharedStore } from '@shared/storage';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { resetDisclaimerSheetForTests } from '../../app/(tabs)/timer/index';
import TabsLayout from '../../app/(tabs)/_layout';
import { toggleNight, getThemePref } from '@/theme/mode';
import { useProfile } from '@/store/profile';
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
  // an onboarded, acknowledged person by default; the first-run cases below undo this
  sharedStore.set('onboarding.completedAt', 1);
  useMeta.getState().update({ disclaimerAckAt: 1, coachMarkShownAt: 1 });
  resetDisclaimerSheetForTests();
  (Haptics.impactAsync as jest.Mock).mockClear();
  (Haptics.notificationAsync as jest.Mock).mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  sharedStore.remove('onboarding.completedAt');
  sharedStore.remove('theme.mode');
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

describe('live stats, last contraction and strength chips (plan F2, F4)', () => {
  const rest = async (ui: Awaited<ReturnType<typeof render>>, ms: number) => advance(ms);

  it('shows the last hour once a contraction is timed: count, average length and how often', async () => {
    const ui = await render(wrap());
    for (let i = 0; i < 3; i++) {
      await ui.press('Start contraction');
      await rest(ui, 60_000);
      await ui.press(/^Stop contraction/);
      await rest(ui, 4 * 60_000);
    }
    expect(ui.texts()).toContain('3 timed');
    expect(ui.texts()).toContain('1m');
    expect(ui.texts()).toContain('every 5m');
    expect(ui.byLabel('Average length: 1m')).toHaveLength(1);
  });

  it('shows no numbers it does not have: dashes before a second contraction', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await rest(ui, 50_000);
    await ui.press(/^Stop contraction/);
    expect(ui.byLabel('How often: —')).toHaveLength(1);
  });

  it('offers Mild, Moderate and Strong for 8 seconds after a stop, and the next Start works while they show', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await rest(ui, 40_000);
    await ui.press(/^Stop contraction/);
    expect(ui.byLabel('Strong')).toHaveLength(1);
    await ui.press('Strong');
    expect(useSessions.getState().active!.contractions[0].intensity).toBe('strong');
    await rest(ui, 1000);
    await ui.press('Start contraction'); // not blocked by the chips
    expect(useSessions.getState().active!.contractions).toHaveLength(2);
    await ui.press(/^Stop contraction/).catch(() => undefined);
    await rest(ui, 9000);
    expect(ui.byLabel('Strong')).toHaveLength(0);
  });

  it('a second tap on the chosen chip clears the tag', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await rest(ui, 40_000);
    await ui.press(/^Stop contraction/);
    await ui.press('Mild');
    await ui.press('Mild');
    expect(useSessions.getState().active!.contractions[0].intensity).toBeUndefined();
  });

  it('opens an explanation for a stat tile', async () => {
    const ui = await render(wrap());
    await ui.press('Start contraction');
    await rest(ui, 40_000);
    await ui.press(/^Stop contraction/);
    await ui.press(/^Average length/);
    expect(ui.texts().some((x) => x.startsWith('The average time from the start to the end'))).toBe(true);
  });
});

describe('the pattern banner (plan §5.1, F5)', () => {
  const now = () => Date.now();
  const load = async (ui: Awaited<ReturnType<typeof render>> | null = null) => {
    const cs = series(now(), 11, 5 * MINUTE, 60 * SECOND, 5 * MINUTE);
    await act(async () => void useSessions.setState({ active: sessionOf(cs, { ruleAtStart: RULE_PRESETS['511'] }) }));
    void ui;
  };

  it('appears once, softly, with the plan wording, and vibrates once', async () => {
    const ui = await render(wrap());
    await load();
    await advance(1100);
    expect(ui.texts()).toContain('Your last hour matches the 5-1-1 pattern your provider mentioned. It may be time to call them.');
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    await advance(5000);
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);
    expect(ui.byLabel('Dismiss')).toHaveLength(1);
  });

  it('stays dismissed within the episode', async () => {
    const ui = await render(wrap());
    await load();
    await advance(1100);
    await ui.press('Dismiss');
    await advance(5000);
    expect(ui.texts().some((x) => x.startsWith('Your last hour matches'))).toBe(false);
  });

  it('is off when pattern alerts are switched off, and says nothing then', async () => {
    useSettings.getState().update({ patternAlerts: false });
    const ui = await render(wrap());
    await load();
    await advance(2000);
    expect(ui.texts().some((x) => x.startsWith('Your last hour matches'))).toBe(false);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('names a different preset, and uses its own words for a custom rule', async () => {
    useSettings.getState().update({ rule: { preset: 'custom', intervalMaxMin: 5, durationMinSec: 60, sustainMin: 60 } });
    const ui = await render(wrap());
    await load();
    await advance(1100);
    expect(ui.texts()).toContain('Your recent contractions match the pattern you set in the app. It may be time to call your provider.');
  });

  it('never sits above the button: it renders after it, so it cannot move the button under a thumb', async () => {
    const ui = await render(wrap());
    await load();
    await advance(1100);
    const labels = ui.root.findAll((n) => typeof n.props.accessibilityLabel === 'string' && typeof n.type === 'string').map((n) => n.props.accessibilityLabel as string);
    expect(labels.findIndex((l) => l.startsWith('Stop contraction') || l === 'Start contraction')).toBeLessThan(labels.indexOf('Dismiss'));
  });
});

describe('Partner mode (plan §4, §7, F15)', () => {
  it('shows "Tell me when it starts", the partner instruction, bigger digits, and none of the secondary strip', async () => {
    useSettings.getState().update({ partnerMode: true });
    const ui = await render(wrap());
    expect(ui.texts()).toContain('Tell me when it starts');
    expect(ui.texts()).toContain('Tap when the contraction begins.');
    await ui.press('Start contraction');
    await advance(1000);
    await ui.press(/^Stop contraction/).catch(() => undefined);
    await advance(60_000);
    expect(ui.byLabel(/^Last hour/)).toHaveLength(0);
    expect(ui.texts()).not.toContain('Last contraction');
  });

  it('scales the Timer\'s type by 1.4 and the digits to 100sp', async () => {
    useSettings.getState().update({ partnerMode: true });
    const ui = await render(wrap());
    await ui.press('Start contraction');
    const digits = ui.root.findAll((n) => (n.type as unknown) === 'Text' && n.props.adjustsFontSizeToFit === true)[0];
    const flat = (require('react-native') as typeof import('react-native')).StyleSheet.flatten(digits.props.style);
    expect(flat.fontSize).toBeCloseTo(72 * 1.4, 5);
  });

  it('while a contraction runs only an "Exit partner mode" chip is left of the header, and it leaves partner mode', async () => {
    useSettings.getState().update({ partnerMode: true });
    const ui = await render(wrap());
    expect(ui.byLabel('Night mode')).toHaveLength(1);
    await ui.press('Start contraction');
    expect(ui.byLabel('Exit partner mode')).toHaveLength(1);
    expect(ui.byLabel('Night mode')).toHaveLength(0);
    expect(ui.byLabel('History')).toHaveLength(0);
    await ui.press('Exit partner mode');
    expect(useSettings.getState().settings.partnerMode).toBe(false);
    expect(ui.byLabel('History')).toHaveLength(1);
  });

  it('hides the tab bar while a contraction runs in Partner mode, and only then', async () => {
    const tabs = async () => {
      const ui = await render(<ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}><TabsLayout /></ThemeProvider>);
      return ui;
    };
    const barHidden = (ui: Awaited<ReturnType<typeof render>>) => {
      const el = ui.root.findAll((n) => n.props.screenOptions)[0];
      return el.props.screenOptions.tabBarStyle.display === 'none';
    };
    useSettings.getState().update({ partnerMode: true });
    let ui = await tabs();
    expect(barHidden(ui)).toBe(false);
    await cleanup();
    useSessions.getState().tap(NOW);
    ui = await tabs();
    expect(barHidden(ui)).toBe(true);
    await cleanup();
    useSettings.getState().update({ partnerMode: false });
    ui = await tabs();
    expect(barHidden(ui)).toBe(false);
  });
});

describe('Night mode, one tap from the Timer (plan F16)', () => {
  it('switches to Night and back to what it was', async () => {
    const ui = await render(wrap());
    await act(async () => void sharedStore.set('theme.mode', 'dark'));
    await ui.press('Night mode');
    expect(getThemePref()).toBe('night');
    expect(ui.byLabel('Night mode, on')).toHaveLength(1);
    await ui.press('Night mode, on');
    expect(getThemePref()).toBe('dark');
    void toggleNight;
  });
});

describe('first run after Skip (plan §6)', () => {
  it('offers the disclaimer as a sheet, once, with "I understand" saving the acknowledgement', async () => {
    useMeta.getState().update({ disclaimerAckAt: undefined });
    let ui = await render(wrap());
    expect(ui.texts()).toContain('A quick, important note');
    expect(ui.texts().some((x) => x.startsWith("This app helps you keep track."))).toBe(true);
    await ui.press('Remind me later');
    await cleanup();
    ui = await render(wrap()); // the same launch: not again
    expect(ui.texts()).not.toContain('A quick, important note');
    resetDisclaimerSheetForTests(); // the next launch
    await cleanup();
    ui = await render(wrap());
    await ui.press('I understand');
    expect(useMeta.getState().meta.disclaimerAckAt).toBe(NOW);
  });

  it('never covers a session that is running', async () => {
    useMeta.getState().update({ disclaimerAckAt: undefined });
    useSessions.getState().tap(NOW - 60_000);
    const ui = await render(wrap());
    expect(ui.texts()).not.toContain('A quick, important note');
  });

  it('shows the one-time hint around the button, in the space of the running time, and a tap on the button dismisses it', async () => {
    useMeta.getState().update({ coachMarkShownAt: undefined });
    const ui = await render(wrap());
    expect(ui.texts()).toContain("When a contraction starts, tap here. That's it.");
    await ui.press('Start contraction');
    expect(useMeta.getState().meta.coachMarkShownAt).toBe(NOW);
    await cleanup();
    useSessions.getState().reset();
    const again = await render(wrap());
    expect(again.texts()).not.toContain("When a contraction starts, tap here. That's it.");
  });

  it('shows the "How this works" link for a first baby and when nothing was answered, and hides it for "I\'ve done this before"', async () => {
    let ui = await render(wrap());
    expect(ui.byLabel('How this works')).toHaveLength(1);
    await cleanup();
    useProfile.getState().update({ firstBaby: 'no' });
    ui = await render(wrap());
    expect(ui.byLabel('How this works')).toHaveLength(0);
  });
});
