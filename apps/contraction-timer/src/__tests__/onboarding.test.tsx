import { mockNotif, mockNotifState, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { act } from 'react';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';

const mockStartAds = jest.fn(async () => undefined);
jest.mock('@/ads/start', () => ({ startAds: () => mockStartAds() }));

import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import Onboarding from '../../app/onboarding';

const NOW = new Date(2026, 10, 4, 12, 0);
const wrap = () => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    <Onboarding />
  </ThemeProvider>
);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  mockStartAds.mockClear();
  mockRouter.replace.mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

/** Opens screen 2 (the disclaimer) and ticks the box. */
async function toDisclaimer(ui: Awaited<ReturnType<typeof render>>) {
  await ui.press('Get started');
}

describe('the five screens, with the plan\'s words (§6)', () => {
  it('Screen 1: welcome', async () => {
    const ui = await render(wrap());
    expect(ui.texts()).toContain("Hi there. Let's keep this simple.");
    expect(ui.texts()).toContain("Time contractions with one big button, count your baby's kicks, and keep a clear summary ready for your midwife or doctor. Everything stays on this phone.");
    expect(ui.byLabel('Get started')).toHaveLength(1);
    expect(ui.byLabel('Skip')).toHaveLength(1); // top right
  });

  it('Screen 2: the disclaimer, word for word, and the button waits for "I understand"', async () => {
    const ui = await render(wrap());
    await toDisclaimer(ui);
    expect(ui.texts()).toContain('A quick, important note');
    expect(ui.texts()).toContain("This app helps you keep track. It isn't a medical device and doesn't give medical advice. Your midwife, doctor or hospital always knows best. If you're worried — about pain, bleeding, your waters, or your baby moving less — call them or emergency services right away.");
    const next = () => ui.root.findAll((n) => n.props.accessibilityLabel === 'Continue' && typeof n.props.onPress === 'function')[0];
    expect(next().props.disabled).toBe(true);
    await ui.press('I understand');
    expect(next().props.disabled).toBe(false);
    expect(ui.byLabel('Skip')).toHaveLength(1);
  });

  it('Screen 3: "How far along are you?" with the three ways and "I\'ll add this later"', async () => {
    const ui = await render(wrap());
    await toDisclaimer(ui);
    await ui.press('I understand');
    await ui.press('Continue');
    expect(ui.texts()).toContain('How far along are you?');
    expect(ui.byLabel('I know my due date')).toHaveLength(1);
    expect(ui.byLabel('First day of my last period')).toHaveLength(1);
    expect(ui.byLabel('Conception or IVF date')).toHaveLength(1);
    expect(ui.byLabel("I'll add this later")).toHaveLength(1);
    const next = () => ui.root.findAll((n) => n.props.accessibilityLabel === 'Continue' && typeof n.props.onPress === 'function')[0];
    expect(next().props.disabled).toBe(true);
    await ui.press('First day of my last period');
    expect(next().props.disabled).toBe(true); // choosing how it is known is not choosing a date
    await ui.press('First day of your last period: one day earlier');
    expect(next().props.disabled).toBe(false);
    expect(ui.texts().some((x) => /^You're about \d+ weeks? and \d+ days?\. Due around/.test(x))).toBe(true);
  });

  it('Screen 4: "Is this your first baby?" with its footer', async () => {
    const ui = await render(wrap());
    await toDisclaimer(ui);
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press("I'll add this later");
    expect(ui.texts()).toContain('Is this your first baby?');
    for (const label of ['Yes, my first', "I've done this before", "I'm the partner"]) expect(ui.byLabel(label)).toHaveLength(1);
    expect(ui.texts()).toContain('This only changes tips. You can change it anytime.');
  });

  it('Screen 5: "What would help most right now?" and the kick reminder switch only after "Counting kicks"', async () => {
    const ui = await render(wrap());
    await toDisclaimer(ui);
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press("I'll add this later");
    await ui.press('Continue');
    expect(ui.texts()).toContain('What would help most right now?');
    for (const label of ['Timing contractions', 'Counting kicks', 'Following my pregnancy week by week']) expect(ui.byLabel(label)).toHaveLength(1);
    expect(ui.byLabel(/^Remind me to count kicks/)).toHaveLength(0);
    await ui.press('Counting kicks');
    expect(ui.byLabel('Remind me to count kicks every day at 8:00 PM')).toHaveLength(1);
    expect(ui.byLabel('All set')).toHaveLength(1);
    expect(mockNotif.granted).toBe(false); // showing the switch asks for nothing
  });

  it.each([1.3, 2])('every screen has labelled controls of 56dp or more at a %sx font scale', async (scale) => {
    const big = (el: React.ReactElement) => <ThemeProvider palette={palette} fontScale={FONT_SCALE * scale} touchTarget={TOUCH_TARGET}>{el}</ThemeProvider>;
    const ui = await render(big(<Onboarding />));
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('Get started');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('I understand');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('Continue');
    await ui.press('First day of my last period');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('First day of your last period: one day earlier');
    await ui.press('Continue');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('Continue');
    await ui.press('Counting kicks');
    expect(auditPressables(ui.root)).toEqual([]);
  });
});

describe('the kick reminder in onboarding', () => {
  async function toNeeds(ui: Awaited<ReturnType<typeof render>>) {
    await ui.press('Get started');
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press("I'll add this later");
    await ui.press('Continue');
    await ui.press('Counting kicks');
  }
  const toggle = (ui: Awaited<ReturnType<typeof render>>) => ui.root.findAll((n) => typeof n.props.onValueChange === 'function' && /Remind me/.test(String(n.props.accessibilityLabel)))[0];

  it('asks the phone for permission only when the switch is turned on, then schedules the daily reminder', async () => {
    const ui = await render(wrap());
    await toNeeds(ui);
    await act(async () => toggle(ui).props.onValueChange(true));
    expect(mockNotif.granted).toBe(true);
    expect(useSettings.getState().settings.kickReminder).toEqual({ enabled: true, hour: 20, minute: 0 });
    expect(mockNotifState.pending.get('kick-reminder')!.trigger).toMatchObject({ hour: 20, minute: 0 });
  });

  it('says "No problem. You can turn reminders on later in More." when it is refused', async () => {
    mockNotif.answer = false;
    mockNotif.keepAsking = true;
    const ui = await render(wrap());
    await toNeeds(ui);
    await act(async () => toggle(ui).props.onValueChange(true));
    expect(ui.texts()).toContain('No problem. You can turn reminders on later in More.');
    expect(useSettings.getState().settings.kickReminder.enabled).toBe(false);
  });

  it('lets the time be changed after it is on', async () => {
    const ui = await render(wrap());
    await toNeeds(ui);
    await act(async () => toggle(ui).props.onValueChange(true));
    await ui.press('One hour later');
    expect(useSettings.getState().settings.kickReminder.hour).toBe(21);
  });
});

describe('finishing', () => {
  async function through(ui: Awaited<ReturnType<typeof render>>, first: string, needs: string[]) {
    await ui.press('Get started');
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press('First day of my last period');
    await ui.press('First day of your last period: one day earlier');
    await ui.press('Continue');
    if (first) await ui.press(first);
    await ui.press('Continue');
    for (const n of needs) await ui.press(n);
    await ui.press('All set');
  }

  it('saves the answers, asks for consent before the Timer, and lands on the Timer', async () => {
    const ui = await render(wrap());
    await through(ui, "I've done this before", ['Timing contractions']);
    const meta = useMeta.getState().meta;
    expect(meta.disclaimerAckAt).toBe(NOW.getTime());
    expect(meta.onboardingDay).toBe('2026-11-04');
    const profile = useProfile.getState().profile;
    expect(profile).toMatchObject({ dateMode: 'lmp', firstBaby: 'no', needs: ['timer'] });
    expect(profile.edd).toBeDefined();
    expect(mockStartAds).toHaveBeenCalledTimes(1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/timer');
    expect(sharedStore.get('onboarding.completedAt')).toBeGreaterThan(0);
    expect(db.get('onboarding.resume')).toBeUndefined();
  });

  it('"I\'m the partner" turns Partner mode on', async () => {
    const ui = await render(wrap());
    await through(ui, "I'm the partner", ['Timing contractions']);
    expect(useSettings.getState().settings.partnerMode).toBe(true);
  });

  it('lands on Kicks when counting kicks was the only need', async () => {
    const ui = await render(wrap());
    await through(ui, '', ['Counting kicks']);
    expect(mockRouter.replace).toHaveBeenCalledWith('/kicks');
  });

  it('Skip on the first screen goes to the Timer with safe defaults and does not run consent now', async () => {
    const ui = await render(wrap());
    await ui.press('Skip');
    expect(mockStartAds).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/timer');
    expect(useMeta.getState().meta.disclaimerAckAt).toBeUndefined(); // the sheet on the Timer will ask
    expect(useProfile.getState().profile.edd).toBeUndefined();
    expect(useProfile.getState().profile.needs).toEqual([]);
    expect(useSettings.getState().settings.partnerMode).toBe(false);
    expect(sharedStore.get('onboarding.completedAt')).toBeGreaterThan(0);
  });

  it('Skip in the middle keeps what was already set but never a starting date that was not touched', async () => {
    const ui = await render(wrap());
    await ui.press('Get started');
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press('I know my due date'); // chosen how, but the date never touched
    await ui.press('Skip');
    expect(useMeta.getState().meta.disclaimerAckAt).toBe(NOW.getTime());
    expect(useProfile.getState().profile.edd).toBeUndefined();
    expect(mockStartAds).not.toHaveBeenCalled();
  });

  it('the last screen has its own Skip under the button', async () => {
    const ui = await render(wrap());
    await ui.press('Get started');
    await ui.press('I understand');
    await ui.press('Continue');
    await ui.press("I'll add this later");
    await ui.press('Continue');
    await ui.press('Skip');
    expect(mockRouter.replace).toHaveBeenCalledWith('/timer');
    expect(mockStartAds).not.toHaveBeenCalled();
  });
});

describe('resuming after a kill', () => {
  it('opens at the same screen with the answers so far', async () => {
    let ui = await render(wrap());
    await ui.press('Get started');
    await ui.press('I understand');
    await ui.press('Continue');
    expect(ui.texts()).toContain('How far along are you?');
    await cleanup(); // killed
    ui = await render(wrap());
    expect(ui.texts()).toContain('How far along are you?');
    await ui.press('Back');
    const box = ui.root.findAll((n) => n.props.accessibilityLabel === 'I understand' && n.props.accessibilityRole === 'checkbox')[0];
    expect(box.props.accessibilityState.checked).toBe(true);
  });
});
