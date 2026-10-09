import { mockFiles, mockNotif, mockNotifState, mockRouter, mockReview, mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Linking } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import { RULE_PRESETS } from '@/domain/defaults';
import { rememberPdf } from '@/export/pdfCache';
import { deleteAllData } from '@/features/settings/reset';
import { recordPositiveMoment } from '@/features/review/ask';
import { useChecklists } from '@/store/checklists';
import { useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useUnlocks } from '@/store/unlocks';
import { getThemePref } from '@/theme/mode';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import More from '../../app/(tabs)/more/index';
import Settings from '../../app/(tabs)/more/settings';
import AlertRule from '../../app/modals/alert-rule';
import Disclaimer from '../../app/(tabs)/more/disclaimer';
import Privacy from '../../app/(tabs)/more/privacy';
import About from '../../app/(tabs)/more/about';
import { seedSession } from '@/testing/stores';

const NOW = new Date(2026, 10, 4, 12, 0);
const wrap = (el: React.ReactElement) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
  sharedStore.remove('theme.mode');
});

describe('More (plan §5.5)', () => {
  it('lists settings, privacy and ads, the always-there "Not medical advice" link, rate, about and delete', async () => {
    const ui = await render(wrap(<More />));
    for (const label of ['Settings', 'Privacy and ads', 'Not medical advice', 'Rate this app', 'About', 'Delete all data']) expect(ui.byLabel(label)).toHaveLength(1);
    expect(ui.byLabel('Send feedback')).toHaveLength(0); // no contact email set
    await ui.press('Not medical advice');
    expect(mockRouter.push).toHaveBeenCalledWith('/more/disclaimer');
  });
  it('shows the feedback row only when a contact email is set, and fills in the version', async () => {
    process.env.EXPO_PUBLIC_CONTACT_EMAIL = 'help@example.com';
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    open.mockClear();
    try {
      const ui = await render(wrap(<More />));
      await ui.press('Send feedback');
      expect(String(open.mock.calls[0][0])).toMatch(/^mailto:help@example.com\?subject=Contraction%20Timer%20feedback&body=/);
      expect(decodeURIComponent(String(open.mock.calls[0][0]))).toContain('App version: 1.0.0');
    } finally {
      delete process.env.EXPO_PUBLIC_CONTACT_EMAIL;
    }
  });
  it('opens the Play Store page, and the web page if the Store app is missing', async () => {
    const open = jest.spyOn(Linking, 'openURL');
    open.mockClear();
    open.mockImplementationOnce(async () => { throw new Error('no store'); }).mockResolvedValue(undefined);
    const ui = await render(wrap(<More />));
    await ui.press('Rate this app');
    expect(open.mock.calls[0][0]).toBe('market://details?id=com.fiveapps.contractiontimer');
    expect(open.mock.calls[1][0]).toBe('https://play.google.com/store/apps/details?id=com.fiveapps.contractiontimer');
  });
  it('keeps the development-only ad rules row out of release builds, and shows it in development', async () => {
    const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    let ui = await render(wrap(<More />));
    expect(ui.byLabel('Ad rules (development builds only)')).toHaveLength(0);
    await cleanup();
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    ui = await render(wrap(<More />));
    expect(ui.byLabel('Ad rules (development builds only)')).toHaveLength(1);
    (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
  });
});

describe('Delete all data (double confirm)', () => {
  it('asks twice, naming what goes, and only deletes after the second yes', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ui = await render(wrap(<More />));
    await ui.press('Delete all data');
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Delete all data?');
    expect(useProfile.getState().profile.edd).toBe('2026-11-12');
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.text === 'Continue')!.onPress!());
    expect(alert).toHaveBeenCalledTimes(2);
    expect(alert.mock.calls[1][0]).toBe('Are you sure?');
    expect(useProfile.getState().profile.edd).toBe('2026-11-12');
    await act(async () => alert.mock.calls[1][2]!.find((b) => b.text === 'Delete everything')!.onPress!());
    expect(useProfile.getState().profile.edd).toBeUndefined();
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
  it('cancelling either step deletes nothing', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ui = await render(wrap(<More />));
    await ui.press('Delete all data');
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.text === 'Cancel')!.onPress?.());
    await ui.press('Delete all data');
    await act(async () => alert.mock.calls[1][2]!.find((b) => b.text === 'Continue')!.onPress!());
    await act(async () => alert.mock.calls[2][2]!.find((b) => b.text === 'Cancel')!.onPress?.());
    expect(useProfile.getState().profile.edd).toBe('2026-11-12');
  });
});

describe('deleteAllData', () => {
  it('erases every kind of data, the scheduled notifications, the cached PDFs and the onboarding flag, and keeps only the install date and ad counters', async () => {
    seedSession('s1', 3_600_000, 4, {}, NOW.getTime());
    useSessions.getState().tap(NOW.getTime());
    useKicks.getState().start(NOW.getTime());
    useKicks.getState().tap(NOW.getTime() + 5000);
    useKicks.getState().finish(NOW.getTime() + 10_000);
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
    useSettings.getState().update({ haptics: false, partnerMode: true });
    useChecklists.getState().toggle('hospitalBag', useChecklists.getState().ensure('hospitalBag').items[0].id);
    useUnlocks.getState().unlockPdfTheme('floral');
    useMeta.getState().acknowledgeDisclaimer(1);
    useMeta.getState().update({ onboardingCompletedAt: 1, lastSessionEndedAt: 5 });
    db.set('adState', { interstitialsToday: 2, day: '2026-11-04' });
    db.set('onboarding.resume', { index: 2, answers: {} });
    sharedStore.set('onboarding.completedAt', 5);
    sharedStore.set('theme.mode', 'high-contrast');
    rememberPdf('file:///cache/x.pdf', NOW.getTime());
    mockNotif.granted = true;
    mockNotifState.pending.set('kick-reminder', { identifier: 'kick-reminder', content: {}, trigger: {} });
    mockNotifState.pending.set('weekly-card:0', { identifier: 'weekly-card:0', content: {}, trigger: {} });
    mockNotifState.pending.set('session-open:0', { identifier: 'session-open:0', content: {}, trigger: {} });
    const installAt = useMeta.getState().meta.installAt;

    await deleteAllData();

    const left = [...mockDisk.get('ct')!.entries()].filter(([k]) => !k.startsWith('__')).map(([k]) => k).sort();
    expect(left).toEqual(['adState', 'meta', 'schemaVersion', 'settings'].sort().filter((k) => left.includes(k)));
    expect(left).not.toEqual(expect.arrayContaining(['profile', 'activeSession', 'kicks', 'checklists', 'unlocks']));
    for (const k of ['profile', 'activeSession', 'activeKick', 'kicks', 'checklists', 'unlocks', 'sessions.index', 'session.s1', 'pdfCache', 'onboarding.resume']) expect(db.get(k as never)).toBeUndefined();
    expect(useSessions.getState().active).toBeNull();
    expect(useSessions.getState().index).toEqual([]);
    expect(useKicks.getState().history).toEqual([]);
    expect(useProfile.getState().profile.edd).toBeUndefined();
    expect(useSettings.getState().settings.partnerMode).toBe(false);
    expect(useSettings.getState().settings.haptics).toBe(true);
    expect(useUnlocks.getState().unlocks.pdfThemes).toEqual([]);
    expect(useMeta.getState().meta).toMatchObject({ installAt, positiveMoments: 0, ratingPromptCount: 0 });
    expect(useMeta.getState().meta.disclaimerAckAt).toBeUndefined();
    expect(useMeta.getState().meta.lastSessionEndedAt).toBeUndefined();
    expect(sharedStore.get('onboarding.completedAt')).toBeUndefined();
    expect(getThemePref()).toBe('system');
    expect(mockNotifState.pending.size).toBe(0);
    expect(mockFiles.deleted).toEqual(['file:///cache/x.pdf']);
    expect(db.get('adState')).toEqual({ interstitialsToday: 2, day: '2026-11-04' }); // frequency caps survive
  });
});

describe('Settings (plan §5.5)', () => {
  it('turns pattern alerts, vibration, the 24-hour clock and Partner mode on and off, and saves each', async () => {
    const ui = await render(wrap(<Settings />));
    const sw = (label: string) => ui.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onValueChange === 'function')[0];
    await act(async () => sw('Pattern alerts').props.onValueChange(false));
    await act(async () => sw('Vibration').props.onValueChange(false));
    await act(async () => sw('24-hour clock').props.onValueChange(true));
    await act(async () => sw('Partner mode').props.onValueChange(true));
    expect(useSettings.getState().settings).toMatchObject({ patternAlerts: false, haptics: false, clock24h: true, partnerMode: true });
    expect(db.get('settings')).toMatchObject({ patternAlerts: false, haptics: false, clock24h: true, partnerMode: true });
  });
  it('chooses the colors, including Night, and remembers it for the Timer\'s one-tap switch', async () => {
    const ui = await render(wrap(<Settings />));
    await ui.press('Night (red, for the dark)');
    expect(getThemePref()).toBe('night');
    expect(sharedStore.get('theme.mode')).toBe('high-contrast');
    await ui.press('Dark');
    expect(getThemePref()).toBe('dark');
  });
  it('shows the rule and opens the editor', async () => {
    const ui = await render(wrap(<Settings />));
    await ui.press('Pattern rule: 5-1-1');
    expect(mockRouter.push).toHaveBeenCalledWith('/modals/alert-rule');
  });
  it('changes the kick target within 5 to 20', async () => {
    const ui = await render(wrap(<Settings />));
    for (let i = 0; i < 8; i++) await ui.press('Target one movement lower').catch(() => undefined);
    expect(useSettings.getState().settings.kickTarget).toBe(5);
    for (let i = 0; i < 20; i++) await ui.press('Target one movement higher').catch(() => undefined);
    expect(useSettings.getState().settings.kickTarget).toBe(20);
  });
  it('switches the sizes to inches and pounds', async () => {
    const ui = await render(wrap(<Settings />));
    await ui.press('Inches and pounds');
    expect(useSettings.getState().settings.units).toBe('imperial');
  });
  it('turning the weekly card on asks for notification permission', async () => {
    useSettings.getState().update({ weeklyCardNotif: false });
    const ui = await render(wrap(<Settings />));
    const sw = ui.root.findAll((n) => n.props.accessibilityLabel === 'Weekly size card' && typeof n.props.onValueChange === 'function')[0];
    await act(async () => sw.props.onValueChange(true));
    expect(mockNotif.granted).toBe(true);
    expect(useSettings.getState().settings.weeklyCardNotif).toBe(true);
  });
  it('opens the daily kick reminder sheet', async () => {
    const ui = await render(wrap(<Settings />));
    await ui.press('Daily kick reminder');
    expect(ui.texts()).toContain('We can send one quiet reminder a day at the time you choose. You can turn it off whenever you like.');
  });
});

describe('the pattern rule editor (plan F5, §8.2)', () => {
  it('chooses 4-1-1 and saves it', async () => {
    const ui = await render(wrap(<AlertRule />));
    expect(ui.texts()).toContain('Contractions 4 minutes apart or less, 60 seconds long or more, for 60 minutes.');
    await ui.press(/^4-1-1/);
    await ui.press('Use this rule');
    expect(useSettings.getState().settings.rule).toEqual(RULE_PRESETS['411']);
    expect(mockRouter.back).toHaveBeenCalled();
  });
  it('builds a custom rule inside the plan\'s ranges (2–10 min, 30–90 s, 30–120 min)', async () => {
    const ui = await render(wrap(<AlertRule />));
    await ui.press('My own rule');
    for (let i = 0; i < 12; i++) await ui.press('One minute less apart').catch(() => undefined);
    for (let i = 0; i < 20; i++) await ui.press('Five seconds longer').catch(() => undefined);
    for (let i = 0; i < 12; i++) await ui.press('Ten minutes shorter').catch(() => undefined);
    await ui.press('Use this rule');
    expect(useSettings.getState().settings.rule).toEqual({ preset: 'custom', intervalMaxMin: 2, durationMinSec: 90, sustainMin: 30 });
  });
  it('says to follow the provider, whatever the app shows', async () => {
    const ui = await render(wrap(<AlertRule />));
    expect(ui.texts()).toContain('Always follow what your provider told you, and call them whenever you are worried, whatever the app shows.');
  });
});

describe('the info screens', () => {
  it('the disclaimer repeats the plan\'s words', async () => {
    const ui = await render(wrap(<Disclaimer />));
    expect(ui.texts().some((x) => x.startsWith("This app helps you keep track. It isn't a medical device"))).toBe(true);
  });
  it('privacy and ads say plainly that health entries stay on the phone and ads never cover the timer', async () => {
    const ui = await render(wrap(<Privacy />));
    const text = ui.texts().join(' ');
    expect(text).toContain('nothing is sent to us');
    expect(text).toContain('There are no ads on the Timer or Kicks screens');
    expect(text).toContain('None of your health entries are sent.');
  });
  it('About shows the name and version and claims no review or approval', async () => {
    const ui = await render(wrap(<About />));
    expect(ui.texts()).toContain('Version 1.0.0');
    expect(ui.texts().join(' ').toLowerCase()).not.toMatch(/reviewed|approved|certified|clinically|midwife-approved/);
  });
});

describe('rating prompt (ASO.md §7)', () => {
  const old = () => useMeta.getState().update({ installAt: NOW.getTime() - 10 * 86_400_000 });
  it('asks on the second good moment, and never in an open session', async () => {
    old();
    mockReview.available = true;
    expect(await recordPositiveMoment('kickTarget', { now: NOW.getTime() })).toBe(false);
    useSessions.getState().tap(NOW.getTime());
    expect(await recordPositiveMoment('kickTarget', { now: NOW.getTime() })).toBe(false);
    expect(mockReview.request).not.toHaveBeenCalled();
    useSessions.getState().reset();
    expect(await recordPositiveMoment('kickTarget', { now: NOW.getTime() })).toBe(true);
    expect(mockReview.request).toHaveBeenCalledTimes(1);
    expect(useMeta.getState().meta).toMatchObject({ ratingPromptCount: 1, positiveMoments: 0 });
  });
  it('does not ask again for 90 days', async () => {
    old();
    mockReview.available = true;
    useMeta.getState().update({ positiveMoments: 5, ratingPromptedAt: NOW.getTime() - 10 * 86_400_000, ratingPromptCount: 1 });
    expect(await recordPositiveMoment('checklistComplete', { now: NOW.getTime() })).toBe(false);
  });
});
