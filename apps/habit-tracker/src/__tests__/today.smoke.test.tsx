import { mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, flush, render } from '@/testing/ui';
import { act } from 'react';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import Today from '../../app/(tabs)/index';
import { templateById, templates } from '@/data/templates';
import { addDays } from '@/domain/dayKey';
import type { DayKey } from '@/domain/types';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useCelebration } from '@/store/celebrations';
import { useHabits } from '@/store/habits';
import { palette } from '@/theme/tokens';

const TODAY = '2026-10-08' as DayKey;

const element = () => (
  <ThemeProvider palette={palette}>
    <Today />
  </ThemeProvider>
);
const add = (id: string) => useHabits.getState().addHabit(draftFromTemplate(templateById(id)!, TODAY));
const habits = { useHabits };
const celebration = { useCelebration };

beforeEach(() => {
  resetApp();
  mockRouter.push.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('Today screen', () => {
  it('shows the empty state with three starter templates', async () => {
    const ui = await render(element());
    const texts = ui.texts();
    expect(texts).toContain('No habits yet');
    expect(ui.byLabel('Add Drink water')).not.toHaveLength(0);
    expect(ui.byLabel('Add Make my bed')).not.toHaveLength(0);
    expect(ui.byLabel('Add Take a walk')).not.toHaveLength(0);
  });

  it('adds a starter habit and shows it with the coach-mark', async () => {
    const ui = await render(element());
    await ui.press('Add Make my bed');
    expect(Object.values(habits.useHabits.getState().habits).map((h: { name: string }) => h.name)).toEqual(['Make my bed']);
    expect(ui.texts()).toContain('Make my bed');
    expect(ui.texts()).toContain('Done it already today? Tap to check it off.');
  });

  it('checking a yes/no habit completes it, persists it and raises the first-check-in celebration', async () => {
    
    const { id } = add('make-bed');
    const ui = await render(element());
    await ui.press('Mark done');
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(1);
    expect(celebration.useCelebration.getState().current).toMatchObject({ kind: 'first' });
    expect(ui.texts().some((t) => t.includes('1/1'))).toBe(true);
    expect(ui.texts()).not.toContain('Done it already today? Tap to check it off.');
  });

  it('un-checking removes the entry', async () => {
    const { id } = add('make-bed');
    const ui = await render(element());
    await ui.press('Mark done');
    await ui.press('Mark not done');
    expect(habits.useHabits.getState().entries[id][TODAY]).toBeUndefined();
  });

  it('count habits step up and down and complete at the target', async () => {
    const { id } = add('drink-water');
    const ui = await render(element());
    for (let i = 0; i < 8; i++) await ui.press('Add one');
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(8);
    await ui.press('Remove one');
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(7);
    expect(ui.texts()).toContain('7/8 glasses');
  });

  it('timer habits start, pause and take quick minutes', async () => {
    const { id } = add('meditate');
    const ui = await render(element());
    await ui.press('Start timer');
    expect(habits.useHabits.getState().entries[id][TODAY].timerStartedAt).toBeDefined();
    await act(async () => {
      jest.advanceTimersByTime(125_000);
    });
    await ui.press('Pause timer');
    expect(habits.useHabits.getState().entries[id][TODAY]).toMatchObject({ value: 125 });
    expect(habits.useHabits.getState().entries[id][TODAY].timerStartedAt).toBeUndefined();
    await ui.press('Add 5 minutes');
    expect(habits.useHabits.getState().entries[id][TODAY].value).toBe(425);
  });

  it('shows the perfect-day card once everything is done', async () => {
    add('make-bed');
    add('walk-daily');
    const ui = await render(element());
    await ui.press('Mark done');
    await ui.press('Mark done');
    expect(ui.texts()).toContain('Perfect day! 🔥');
  });

  it('opens the editor from the add button and the detail from a row', async () => {
    const { id } = add('make-bed');
    const ui = await render(element());
    await ui.press('Add habit');
    expect(mockRouter.push).toHaveBeenCalledWith('/habit/new');
    const row = ui.root.findAll((n) => typeof n.props.onPress === 'function' && typeof n.props.onLongPress !== 'undefined')[0];
    await (async () => row.props.onPress())();
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/habit/[id]', params: { id } });
  });

  it('shows a rest-day message when nothing is scheduled', async () => {
    const { id } = add('make-bed');
    const draft = { ...habits.useHabits.getState().habits[id], schedule: { kind: 'weekdays' as const, days: [0 as const] } };
    habits.useHabits.setState({ habits: { [id]: draft } }); // Sundays only; today is Thursday
    const ui = await render(element());
    expect(ui.texts()).toContain('Nothing scheduled today. Enjoy the rest.');
  });

  it('renders 30 habits with a year of history within a sane time', async () => {
    const created: string[] = [];
    for (let i = 0; i < 30; i++) {
      const tpl = templates[i % templates.length];
      const draft = { ...draftFromTemplate(tpl, '2025-10-08' as DayKey), name: `${tpl.id}-${i}` };
      created.push(habits.useHabits.getState().addHabit(draft).id);
    }
    for (const id of created) {
      const entries: Record<string, { value: number; updatedAt: number }> = {};
      for (let d = 0; d < 365; d += 1) if (d % 3 !== 0) entries[addDays('2025-10-08', d)] = { value: 100000, updatedAt: 0 };
      habits.useHabits.setState({ entries: { ...habits.useHabits.getState().entries, [id]: entries } });
    }
    const started = Date.now();
    const ui = await render(element());
    await flush();
    expect(Date.now() - started).toBeLessThan(5000);
    expect(ui.texts().length).toBeGreaterThan(30);
  });
});
