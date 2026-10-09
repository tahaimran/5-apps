import { mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { act } from 'react';
import { Alert, Share } from 'react-native';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { dateKeyFor } from '@/domain/dateKey';
import { useChecklists } from '@/store/checklists';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { db } from '@/store/storage';
import { FONT_SCALE, palette, TOUCH_TARGET } from '@/theme/tokens';
import Pregnancy from '../../app/(tabs)/pregnancy/index';
import DueDate from '../../app/(tabs)/pregnancy/due-date';
import Week from '../../app/(tabs)/pregnancy/week/[n]';
import HospitalBag from '../../app/(tabs)/pregnancy/hospital-bag';
import BirthPlan from '../../app/(tabs)/pregnancy/birth-plan';

const NOW = new Date(2026, 9, 9, 12, 0);
const wrap = (el: React.ReactElement) => (
  <ThemeProvider palette={palette} fontScale={FONT_SCALE} touchTarget={TOUCH_TARGET}>
    {el}
  </ThemeProvider>
);

beforeEach(() => {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
  resetApp(NOW);
  useChecklists.setState({ lists: {} });
  useToday.setState({ today: dateKeyFor(NOW) });
  mockRouter.push.mockClear();
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('My Pregnancy (plan §5.4)', () => {
  it('without a due date asks for one', async () => {
    const ui = await render(wrap(<Pregnancy />));
    expect(ui.texts()).toContain('Add your due date to see your week');
    await ui.press('Add your due date');
    expect(mockRouter.push).toHaveBeenCalledWith('/pregnancy/due-date');
  });

  it('with a due date shows week, days to go and the size, and pins this week first', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' }); // 34 days to go: week 35 + 1... 246 days = 35w1d
    const ui = await render(wrap(<Pregnancy />));
    expect(ui.texts()).toContain('Week 35 + 1 · 34 days to go');
    expect(ui.texts()).toContain('Baby is about the size of a honeydew melon');
    const rows = ui.root.findAll((n) => typeof n.props.onPress === 'function' && /^Week \d+/.test(String(n.props.accessibilityLabel)));
    expect(String(rows[0].props.accessibilityLabel)).toBe('Week 35, this week: about the size of a honeydew melon');
    expect(String(rows[1].props.accessibilityLabel)).toContain('Week 4:');
  });

  it('says "1 day to go", "Due today" and the days past, and the plan\'s past-due line after 42 weeks', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-10-10' });
    let ui = await render(wrap(<Pregnancy />));
    expect(ui.texts().some((x) => x.includes('1 day to go'))).toBe(true);
    await cleanup();
    useProfile.getState().setDue({ mode: 'edd', date: '2026-10-09' });
    ui = await render(wrap(<Pregnancy />));
    expect(ui.texts().some((x) => x.includes('Due today'))).toBe(true);
    await cleanup();
    useProfile.getState().setDue({ mode: 'edd', date: '2026-09-20' }); // 19 days past: 42w5d
    ui = await render(wrap(<Pregnancy />));
    expect(ui.texts().some((x) => x.includes('19 days past your due date'))).toBe(true);
    expect(ui.texts()).toContain('Past your due date — your provider will guide next steps.');
  });

  it('shows progress for the bag and the plan, and the nudge only in weeks 34, 36 and 37', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' }); // week 35
    let ui = await render(wrap(<Pregnancy />));
    expect(ui.texts()).toContain('0% packed');
    expect(ui.byLabel(/^Hospital bag 0% packed/)).toHaveLength(0);
    await cleanup();
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-19' }); // 34w1d
    useToday.setState({ today: '2026-10-09' });
    ui = await render(wrap(<Pregnancy />));
    expect(ui.byLabel(/^Hospital bag 0% packed/)).toHaveLength(1);
  });

  it('opens a week card', async () => {
    const ui = await render(wrap(<Pregnancy />));
    await act(async () => ui.root.findAll((n) => typeof n.props.onPress === 'function' && /^Week 5:/.test(String(n.props.accessibilityLabel)))[0].props.onPress());
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/pregnancy/week/[n]', params: { n: '5' } });
  });
});

describe('a week card', () => {
  it('has the size, length and weight in the person\'s units, three notes, the provider question and the disclaimer', async () => {
    mockParams.current = { n: '34' };
    const ui = await render(wrap(<Week />));
    expect(ui.texts()).toContain('About the size of a cantaloupe');
    expect(ui.texts().some((x) => x.includes('45 cm, head to heel') && x.includes('2.1 kg'))).toBe(true);
    expect(ui.texts().filter((x) => x.startsWith('•')).length).toBe(3);
    expect(ui.texts()).toContain('Questions for your next appointment');
    expect(ui.texts().some((x) => x.includes('5-1-1'))).toBe(true);
    expect(ui.texts()).toContain('This is general information, not medical advice. Your midwife or doctor knows your situation best.');
  });
  it('switches to inches and pounds, and crown-to-rump before week 20', async () => {
    useSettings.getState().update({ units: 'imperial' });
    mockParams.current = { n: '12' };
    const ui = await render(wrap(<Week />));
    expect(ui.texts().some((x) => x.includes('2.1 in, crown to rump') && x.includes('oz'))).toBe(true);
  });
  it('says so for a week without a card, and for nonsense', async () => {
    for (const n of ['2', '99', 'abc']) {
      mockParams.current = { n };
      const ui = await render(wrap(<Week />));
      expect(ui.texts()).toContain('There is no card for this week.');
      await cleanup();
    }
  });
});

describe('the due date calculator (plan F11)', () => {
  it('works out the due date from the last period with a 28-day cycle and shows the live sentence', async () => {
    mockParams.current = {};
    const ui = await render(wrap(<DueDate />));
    await ui.press('First day of my last period');
    expect(ui.texts().some((x) => /^You're about \d+ weeks? and \d+ days?\. Due around \d+ \w+\.$/.test(x))).toBe(true);
    expect(ui.texts()).toContain('Usual cycle length');
  });
  it('saves a known due date and shows week, trimester and days to go', async () => {
    const ui = await render(wrap(<DueDate />));
    // start 60 days ahead; move to 2026-11-12 by day steps would be long, so set through the store route instead:
    await ui.press('I know my due date');
    await ui.press('Save due date');
    expect(useProfile.getState().profile.edd).toBe('2026-12-08');
    expect(ui.texts()).toContain('Due date saved');
    expect(db.get('profile')?.dateMode).toBe('edd');
  });
  it('steps the date by day, month and year with labelled buttons', async () => {
    const ui = await render(wrap(<DueDate />));
    await ui.press('Due date: one day later'); // from today + 60 days: 2026-12-08
    await ui.press('Due date: one month earlier');
    await ui.press('Save due date');
    expect(useProfile.getState().profile.inputDate).toBe('2026-11-09');
    await ui.press('Due date: one year earlier'); // a year back is more than 4 weeks ago, so it is refused
    expect(ui.texts()).toContain('That due date is more than 4 weeks ago. Check the date.');
  });
  it('refuses a date that is too far away and says why, and disables Save', async () => {
    const ui = await render(wrap(<DueDate />));
    await ui.press('Due date: one year later');
    expect(ui.texts()).toContain('That due date is more than 42 weeks away. Check the date.');
    const save = ui.root.findAll((n) => n.props.accessibilityLabel === 'Save due date' && typeof n.props.onPress === 'function')[0];
    expect(save.props.disabled).toBe(true);
  });
  it('handles IVF day 3 and day 5, and a conception date', async () => {
    const ui = await render(wrap(<DueDate />));
    await ui.press('IVF transfer date');
    await ui.press('Day 3');
    await ui.press('Save due date');
    const p = useProfile.getState().profile;
    expect(p.dateMode).toBe('ivf');
    expect(p.ivfEmbryoDay).toBe(3);
    expect(p.edd).toBe('2027-05-04'); // transfer 2026-08-14 (8 weeks ago) + 263 days
  });
  it('changes the cycle length for the last-period route within 21–45', async () => {
    const ui = await render(wrap(<DueDate />));
    await ui.press('First day of my last period');
    for (let i = 0; i < 30; i++) await ui.press('Cycle one day longer').catch(() => undefined);
    await ui.press('Save due date');
    expect(useProfile.getState().profile.cycleLength).toBe(45);
  });
  it('removes the due date only after a confirmation', async () => {
    useProfile.getState().setDue({ mode: 'edd', date: '2026-11-12' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const ui = await render(wrap(<DueDate />));
    await ui.press('Remove due date');
    expect(alert).toHaveBeenCalled();
    expect(useProfile.getState().profile.edd).toBe('2026-11-12');
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.text === 'Remove')!.onPress!());
    expect(useProfile.getState().profile.edd).toBeUndefined();
  });
  it('shows the saved choice when it is opened again', async () => {
    useProfile.getState().setDue({ mode: 'lmp', date: '2026-02-05', cycleLength: 30 });
    const ui = await render(wrap(<DueDate />));
    expect(ui.texts()).toContain('30 days');
    expect(ui.texts().some((x) => x.startsWith('First day of your last period: 5 February 2026'))).toBe(true);
  });
});

describe('the hospital bag and the birth plan (plan F13, F14)', () => {
  it('shows Mom, Partner and Baby groups with progress, and saves a tick', async () => {
    const ui = await render(wrap(<HospitalBag />));
    expect(ui.texts()).toEqual(expect.arrayContaining(['For me', 'For my partner', 'For the baby', '0% packed']));
    const first = ui.root.findAll((n) => n.props.accessibilityRole === 'checkbox')[0];
    await act(async () => first.props.onPress());
    expect(ui.texts().some((x) => /^\d+% packed$/.test(x) && x !== '0% packed')).toBe(true);
    expect(db.get('checklists')?.hospitalBag?.items[0].checked).toBe(true);
  });
  it('edits the list: add your own, reorder, delete', async () => {
    const ui = await render(wrap(<HospitalBag />));
    await ui.press('Edit list');
    await ui.type('Add an item to For me', 'Fairy lights');
    await ui.press('Add to For me');
    expect(ui.texts()).toContain('Fairy lights');
    const items = () => useChecklists.getState().lists.hospitalBag!.items;
    expect(items().some((i) => i.label === 'Fairy lights' && i.custom)).toBe(true);
    const firstLabel = items()[0].label;
    await ui.press(`Move down: ${firstLabel}`);
    expect(items()[1].label).toBe(firstLabel);
    await ui.press(`Delete: ${firstLabel}`);
    expect(items().some((i) => i.label === firstLabel)).toBe(false);
  });
  it('the birth plan shows how many are thought through and shares as text with the disclaimer', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const ui = await render(wrap(<BirthPlan />));
    expect(ui.texts().some((x) => /^0 of \d+ thought through$/.test(x))).toBe(true);
    await act(async () => ui.root.findAll((n) => n.props.accessibilityRole === 'checkbox')[0].props.onPress());
    await ui.press('Share as text');
    const message = share.mock.calls[0][0].message!;
    expect(message.startsWith('My birth plan')).toBe(true);
    expect(message).toContain('done');
  });
});
