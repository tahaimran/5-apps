import { mockNotif, mockRouter, resetNotifMock } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';
import Onboarding from '../../app/onboarding';
import { resetAdsStart } from '@/ads/start';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useWater } from '@/store/water';
import { palette } from '@/theme/tokens';

const themed = (el: ReactElement, scale = 1) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;
const progress = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => /^Step \d+ of \d+$/.test(String(n.props.accessibilityLabel)))[0]?.props.accessibilityLabel;

beforeEach(() => {
  resetApp();
  resetNotifMock();
  resetAdsStart();
  sharedStore.remove('onboarding.completedAt');
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('the full flow (plan §6)', () => {
  it('walks every step, saves the answers and logs the first glass', async () => {
    const ui = await render(themed(<Onboarding />));
    expect(ui.texts()).toContain('Meet your new plant.');
    expect(progress(ui)).toBe('Step 1 of 11'); // consent is not a screen
    await ui.press("Let's start");

    expect(ui.texts()).toContain('How should we calculate your goal?');
    await ui.press('Female');
    await ui.press('Next');

    expect(ui.texts()).toContain("What's your weight?");
    expect(ui.texts()).toContain('145 lb'); // US locale defaults to pounds
    await ui.press('Plus 5');
    await ui.press('kg'); // 150 lb is about 68 kg
    expect(ui.texts()).toContain('68 kg');
    await ui.press('Next');

    expect(ui.texts()).toContain('When does your day start and end?');
    await ui.press('Next');
    expect(ui.texts()).toContain('How active are you on a typical day?');
    await ui.press('Active (workouts 3–5×/week)');
    await ui.press('Next');
    expect(ui.texts()).toContain("What's the weather usually like where you are?");
    await ui.press('Warm');
    await ui.press('Next');

    // Goal reveal: 68 kg → 2,250 base rounded, +500 active, +250 warm.
    expect(ui.texts().some((t) => t.startsWith('Body weight 68 kg'))).toBe(true);
    expect(ui.texts()).toContain('Active → +500 ml');
    expect(ui.texts()).toContain('Warm climate → +250 ml');
    expect(ui.texts().join(' ')).toContain('3,000 ml');
    expect(ui.texts()).toContain('A general wellness estimate, not medical advice. Ask a professional if you have a health condition.');
    await ui.press('Adjust');
    await ui.press('Higher goal');
    expect(ui.texts().join(' ')).toContain('3,050');
    await ui.press('Sounds good');

    expect(ui.texts()).toContain('What do you usually drink from?');
    await ui.press('Mug, 350 ml');
    await ui.press('Next');
    expect(ui.texts()).toContain('How often should we nudge you?');
    await ui.press('Every hour');
    await ui.press('Gentle (silent banner)');
    await ui.press('Next');

    expect(ui.texts()).toContain("Want a gentle nudge when it's time?");
    expect(ui.texts()).toContain("We'll send about 16 reminders between 07:00 and 23:00. You can log right from the notification.");
    expect(ui.texts()).toContain('💧 Time for a sip!');
    await ui.press('Turn on reminders');

    expect(ui.texts()).toContain("Let's water your plant for the first time.");
    await ui.press('Pour 350 ml');
    expect(ui.texts().some((t) => t.startsWith('Your first sip! 350 ml down, 2,700 ml to go.'))).toBe(true);
    expect(useWater.getState().logsForDay('2026-10-08')).toHaveLength(1);
    await ui.press('Go to my plant');

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    const s = useSettings.getState();
    expect(s.goal).toMatchObject({ goalMl: 3050, source: 'manual' });
    expect(s.profile).toMatchObject({ sex: 'female', weightUnit: 'kg', activity: 'active', climate: 'warm' });
    expect(s.reminders).toMatchObject({ frequency: 'interval', intervalMin: 60, style: 'gentle' });
    expect(s.prefs.preferredCupId).toBe('cup-350');
    expect(sharedStore.get('onboarding.completedAt')).toBeGreaterThan(0);
    expect(db.get('onboarding:resume')).toBeUndefined();
  });

  it('lets the user go back without losing a selection', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    await ui.press('Male');
    await ui.press('Next');
    await ui.press('Back');
    expect(ui.byLabel('Male').some((n) => n.props.accessibilityState?.selected)).toBe(true);
  });
});

describe('Skip', () => {
  it('applies the defaults but still shows the notification step before Today', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press('Skip');
    expect(ui.texts()).toContain("Want a gentle nudge when it's time?");
    expect(progress(ui)).toBe('Step 1 of 1');
    expect(ui.byLabel('Skip')).toHaveLength(0);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await ui.press('Not now');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(useSettings.getState().goal).toMatchObject({ goalMl: 2400, source: 'calculated' });
    expect(useSettings.getState().reminders).toMatchObject({ wakeMin: 420, bedMin: 1380, frequency: 'smart', style: 'normal' });
    expect(useWater.getState().summaries).toEqual({}); // lands on the empty Today state
  });
  it('skips from the middle of the questions too', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    await ui.press('Male');
    await ui.press('Next');
    await ui.press('Skip');
    expect(ui.texts()).toContain("Want a gentle nudge when it's time?");
    await ui.press('Turn on reminders');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('consent timing (plan §6 step 10)', () => {
  it('asks only after the notification step and before the first glass', async () => {
    const consent = jest.spyOn(require('@shared/consent'), 'initConsent');
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    for (let i = 0; i < 5; i++) await ui.press('Next');
    await ui.press('Sounds good');
    await ui.press('Next');
    await ui.press('Next');
    expect(ui.texts()).toContain("Want a gentle nudge when it's time?");
    expect(consent).not.toHaveBeenCalled();
    await ui.press('Not now');
    expect(consent).toHaveBeenCalledTimes(1);
    expect(ui.texts()).toContain("Let's water your plant for the first time.");
    expect(useWater.getState().summaries).toEqual({});
    consent.mockRestore();
  });
});

describe('"I already know my goal"', () => {
  it('jumps to the cup step with a goal input and saves it as manual', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press('I already know my goal');
    expect(ui.texts()).toContain("What's your daily goal?");
    expect(progress(ui)).toBe('Step 2 of 5');
    await ui.press('Higher goal');
    await ui.press('Higher goal');
    await ui.press('Next'); // cup (default 250)
    await ui.press('Next'); // reminders
    await ui.press('Not now');
    await ui.press('Go to my plant');
    expect(useSettings.getState().goal).toEqual(expect.objectContaining({ goalMl: 2100, source: 'manual' }));
  });
});

describe('notification permission', () => {
  it('says it is fine after a denial and keeps going', async () => {
    mockNotif.answer = false;
    const ui = await render(themed(<Onboarding />));
    await ui.press('Skip'); // permission only
    await ui.press('Turn on reminders');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
  });
  it('shows the denial note on the first-glass step', async () => {
    mockNotif.answer = false;
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    for (let i = 0; i < 5; i++) await ui.press('Next'); // about, weight, schedule, activity, climate
    await ui.press('Sounds good');
    await ui.press('Next'); // cup
    await ui.press('Next'); // reminders
    await ui.press('Turn on reminders');
    expect(ui.texts()).toContain('No problem — you can turn them on anytime in Settings.');
  });
});

describe('resume after the app was killed', () => {
  it('opens on the saved step with the saved answers', async () => {
    db.set('onboarding:resume', { index: 2, answers: { about: 'male', weight: { unit: 'kg', value: 90 } } });
    const ui = await render(themed(<Onboarding />));
    expect(ui.texts()).toContain("What's your weight?");
    expect(ui.texts()).toContain('90 kg');
    await ui.press('Next');
    expect(db.get('onboarding:resume')?.index).toBe(3);
  });
});

describe('accessibility', () => {
  it.each([1, 1.6])('has labelled, 48dp targets on every step at font scale %s', async (scale) => {
    const ui = await render(themed(<Onboarding />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
    for (const [press, expectText] of [
      ["Let's start", 'How should we calculate your goal?'],
      ['Next', "What's your weight?"],
      ['Next', 'When does your day start and end?'],
      ['Next', 'How active are you on a typical day?'],
      ['Next', "What's the weather usually like where you are?"],
      ['Next', 'Your daily goal'],
      ['Sounds good', 'What do you usually drink from?'],
      ['Next', 'How often should we nudge you?'],
      ['Next', "Want a gentle nudge when it's time?"],
      ['Turn on reminders', "Let's water your plant for the first time."],
    ] as const) {
      await ui.press(press);
      expect(ui.texts().join('|')).toContain(expectText);
      expect(auditPressables(ui.root)).toEqual([]);
    }
  });
});
