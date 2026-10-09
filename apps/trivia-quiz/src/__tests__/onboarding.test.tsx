import '@/testing/stores';
import React from 'react';
import { act } from 'react';
import { mockAds, mockLastNotificationResponse, mockNotif, mockNotifState, mockRouter } from '@/testing/mocks';
import { auditPressables, cleanup, render } from '@/testing/ui';
import { resetApp } from '@/testing/stores';
import { CATEGORY_LIST } from '@/domain/categories';
import { sharedStore } from '@shared/storage';
import { resetAdsStart } from '@/ads/start';
import { useRound } from '@/store/round';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useProfile } from '@/store/stores';
import Welcome from '../../app/(onboarding)/welcome';
import WarmupResult from '../../app/(onboarding)/warmup-result';
import Index from '../../app/index';
import Home from '../../app/(tabs)/index';

beforeEach(() => {
  resetApp();
  resetAdsStart();
  sharedStore.remove('onboarding.completedAt');
});
afterEach(cleanup);

const pick = async (r: Awaited<ReturnType<typeof render>>, ...ids: string[]) => {
  for (const id of ids) await r.press(id);
};

describe('setup screens (O1-O3)', () => {
  it('shows the welcome copy and a Let\'s play button; the first screen has no Skip', async () => {
    const r = await render(<Welcome />);
    expect(r.texts().join(' ')).toContain("Test what you know. Learn what you don't.");
    expect(r.texts().join(' ')).toContain('3,000+ trivia questions. Works offline. No sign-up.');
    expect(r.byLabel('Skip')).toHaveLength(0);
    expect(r.byLabel(/skip intro/)).toHaveLength(1);
    expect(auditPressables(r.root)).toEqual([]);
  });

  it('needs 3 categories, counts them, then asks for a difficulty and starts the warm-up', async () => {
    const r = await render(<Welcome />);
    await r.press("Let's play");
    expect(r.texts().join(' ')).toContain('1 of 3 picked');
    expect(r.byLabel('Continue')[0].props.accessibilityState.disabled).toBe(true);
    await pick(r, 'Music', 'Food');
    expect(r.byLabel('Continue')[0].props.accessibilityState.disabled).toBe(false);
    await r.press('Continue');
    expect(r.texts().join(' ')).toContain('How tough should we go?');
    await r.press(/^Hard\./);
    await r.press('Start warm-up');
    expect(useProfile.getState().value).toMatchObject({ preferredDifficulty: 3 });
    expect(useProfile.getState().value.favoriteCategories.sort()).toEqual(['food', 'general', 'music']);
    const round = useRound.getState().state!;
    expect(round.config.mode).toBe('warmup');
    expect(round.config.questions).toHaveLength(3);
    expect(round.config.questions.every((q) => q.d === 1)).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/quiz/[sessionId]' }));
    expect(db.get('funnel')).toMatchObject({ onb_start: 1, onb_cat_done: 1, onb_diff_done: 1 });
  });

  it('Skip on the categories screen means all categories and Medium', async () => {
    const r = await render(<Welcome />);
    await r.press("Let's play");
    await r.press('Skip');
    expect(useProfile.getState().value).toMatchObject({ favoriteCategories: CATEGORY_LIST, preferredDifficulty: 2 });
    expect(useRound.getState().state?.config.mode).toBe('warmup');
  });

  it('"skip intro" applies the defaults and goes straight to the closing screens, with no warm-up', async () => {
    const r = await render(<Welcome />);
    await r.press(/skip intro/);
    expect(useProfile.getState().value).toMatchObject({ favoriteCategories: CATEGORY_LIST, preferredDifficulty: 2 });
    expect(useRound.getState().state).toBeNull();
    expect(db.get('onboarding.warmupDone')).toBe(true);
    expect(db.get('onboarding.warmupScore')).toBe(-1);
    expect(mockRouter.replace).toHaveBeenCalledWith('/warmup-result');
  });

  it('resumes at the same screen with the same answers after a kill', async () => {
    let r = await render(<Welcome />);
    await r.press("Let's play");
    await pick(r, 'Music', 'Food');
    await cleanup();
    r = await render(<Welcome />);
    expect(r.texts().join(' ')).toContain('What are you into?');
    expect(r.texts().join(' ')).toContain('3 picked');
  });

  it('keeps every control at 48dp and labelled on all three screens', async () => {
    const r = await render(<Welcome />, { fontScale: 1.3 });
    await r.press("Let's play");
    expect(auditPressables(r.root)).toEqual([]);
    await pick(r, 'Music', 'Food');
    await r.press('Continue');
    expect(auditPressables(r.root)).toEqual([]);
  });
});

describe('closing screens (O5-O7)', () => {
  const run = async (score: number) => {
    db.set('onboarding.warmupScore', score);
    return render(<WarmupResult />);
  };

  it('titles the result by the warm-up score and promises 30 XP', async () => {
    for (const [score, title] of [[3, 'Perfect start! 🧠'], [2, "Nice! You're a natural."], [1, 'Everyone starts somewhere.'], [0, 'Everyone starts somewhere.']] as const) {
      const r = await run(score);
      expect(r.texts().join(' ')).toContain(title);
      expect(r.texts().join(' ')).toContain('+30 XP');
      await cleanup();
    }
  });

  it('where no consent form is needed, goes result -> reminder, with no consent screen', async () => {
    const r = await run(2);
    await r.press('Continue');
    expect(r.texts().join(' ')).toContain('Keep your streak alive');
    expect(r.texts().join(' ')).not.toContain('Ads keep Quizora free');
    expect(mockAds.gathered).toBe(0);
  });

  it('where a form is required, shows the pre-screen, runs the form on OK, and cannot be skipped past it', async () => {
    mockAds.consentStatus = 'REQUIRED';
    mockAds.consent = { canRequestAds: true };
    const r = await run(3);
    await r.press('Skip'); // Skip on the result jumps to consent, not past it
    expect(r.texts().join(' ')).toContain('Quizora is free thanks to a few ads. Next, choose how ads can use your data.');
    expect(r.byLabel('Skip')).toHaveLength(0);
    expect(mockAds.gathered).toBe(0);
    await r.press('OK');
    expect(mockAds.gathered).toBe(1);
    expect(mockAds.initialized).toBe(1);
    expect(db.get('funnel')).toMatchObject({ onb_consent_shown: 1 });
    expect(r.texts().join(' ')).toContain('Keep your streak alive');
  });

  it('"Remind me" asks the system, saves the time and plans notifications; the default time is 19:00', async () => {
    mockNotif.granted = false;
    const r = await run(3);
    await r.press('Continue');
    expect(r.texts().join(' ')).toMatch(/7:00\s?PM/);
    await r.press('Remind me');
    expect(useSettings.getState().settings.reminder).toEqual({ enabled: true, hour: 19, minute: 0 });
    expect(mockNotifState.pending.size).toBeGreaterThan(0);
    expect(db.get('onboarding.done')).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(db.get('funnel')).toMatchObject({ onb_notif_accept: 1, onb_done: 1 });
  });

  it('a refused system dialog still finishes onboarding, with reminders off', async () => {
    mockNotif.answer = false;
    const r = await run(3);
    await r.press('Continue');
    await r.press('Remind me');
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(db.get('onboarding.done')).toBe(true);
    expect(db.get('reminderAsk')?.declinedAt).toBeGreaterThan(0);
    expect(mockNotifState.pending.size).toBe(0);
  });

  it('"Not now" is honoured: no system dialog, no reminder, and it is remembered for the one re-ask', async () => {
    const r = await run(3);
    await r.press('Continue');
    await r.press('Not now');
    expect(mockNotif.granted).toBe(false);
    expect(useSettings.getState().settings.reminder.enabled).toBe(false);
    expect(db.get('reminderAsk')).toMatchObject({ reaskedAt: 0 });
    expect(db.get('onboarding.done')).toBe(true);
  });

  it('starts ads only after onboarding ends, and not at all without consent', async () => {
    mockAds.consent = { canRequestAds: false };
    const r = await run(3);
    await r.press('Continue');
    expect(mockAds.initialized).toBe(0);
    await r.press('Not now');
    await act(async () => {});
    expect(mockAds.initialized).toBe(0); // consent says no ads
  });

  it('with the warm-up skipped, leaves the result out', async () => {
    const r = await run(-1);
    expect(r.texts().join(' ')).toContain('Keep your streak alive');
  });
});

describe('routing at launch', () => {
  const hrefs = (r: Awaited<ReturnType<typeof render>>) => r.root.findAll((n) => (n.type as unknown) === 'Redirect').map((n) => n.props.href);

  it('walks setup -> warm-up -> closing screens -> Home, remembering each step', async () => {
    expect(hrefs(await render(<Index />))).toEqual(['/welcome']);
    await cleanup();
    sharedStore.set('onboarding.completedAt', Date.now());
    await render(<Index />);
    expect(useRound.getState().state?.config.mode).toBe('warmup'); // warm-up not done: it starts again
    await cleanup();
    db.set('onboarding.warmupDone', true);
    expect(hrefs(await render(<Index />))).toEqual(['/warmup-result']);
    await cleanup();
    db.set('onboarding.done', true);
    expect(hrefs(await render(<Index />))).toEqual(['/(tabs)']);
  });
});

describe('after onboarding', () => {
  it('shows the Daily coach mark once on Home, then never again', async () => {
    db.set('coachDone', false);
    let r = await render(<Home />);
    expect(r.texts().join(' ')).toContain('Your first Daily Challenge is ready');
    await r.press('Got it');
    expect(r.texts().join(' ')).not.toContain('Your first Daily Challenge is ready');
    await cleanup();
    r = await render(<Home />);
    expect(r.texts().join(' ')).not.toContain('Your first Daily Challenge is ready');
  });
});

void mockLastNotificationResponse;
