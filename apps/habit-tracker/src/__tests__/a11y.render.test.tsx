import { mockParams } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { auditPressables, cleanup, isPressable, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';
import Today from '../../app/(tabs)/index';
import Stats from '../../app/(tabs)/stats';
import Settings from '../../app/(tabs)/settings';
import HabitDetail from '../../app/habit/[id]/index';
import NewHabit from '../../app/habit/new';
import Templates from '../../app/templates';
import Archive from '../../app/archive';
import Backup from '../../app/backup';
import NoteScreen from '../../app/note/[date]';
import Onboarding from '../../app/onboarding';
import { templateById } from '@/data/templates';
import type { DayKey } from '@/domain/types';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';
import { palette } from '@/theme/tokens';

const TODAY = '2026-10-08' as DayKey;
const themed = (el: ReactElement, scale = 1) => <ThemeProvider palette={palette} fontScale={scale}>{el}</ThemeProvider>;
const add = (id: string) => useHabits.getState().addHabit(draftFromTemplate(templateById(id)!, TODAY));

beforeEach(() => {
  resetApp();
  sharedStore.remove('onboarding.completedAt');
  mockParams.current = {};
  useToday.setState({ today: TODAY });
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

/** Every screen, in the states a user sees, at normal and 1.6x text size. */
describe.each([1, 1.6])('touch targets and labels at font scale %s', (scale) => {
  it('Today with every habit type', async () => {
    add('make-bed');
    add('drink-water');
    add('meditate');
    const ui = await render(themed(<Today />, scale));
    expect(ui.root.findAll(isPressable).length).toBeGreaterThan(10); // the audit sees real buttons
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('Today empty state', async () => {
    const ui = await render(themed(<Today />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('Stats', async () => {
    const { id } = add('make-bed');
    useHabits.getState().setValue(id, TODAY, 1);
    const ui = await render(themed(<Stats />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('Settings', async () => {
    const ui = await render(themed(<Settings />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('habit detail', async () => {
    const { id } = add('make-bed');
    mockParams.current = { id };
    const ui = await render(themed(<HabitDetail />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('habit editor', async () => {
    const ui = await render(themed(<NewHabit />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('templates', async () => {
    const ui = await render(themed(<Templates />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
  });
  it('archive, backup and note', async () => {
    for (const el of [<Archive key="a" />, <Backup key="b" />]) {
      const ui = await render(themed(el, scale));
      expect(auditPressables(ui.root)).toEqual([]);
    }
    mockParams.current = { date: TODAY };
    const note = await render(themed(<NoteScreen />, scale));
    expect(auditPressables(note.root)).toEqual([]);
  });
  it('every onboarding step', async () => {
    const ui = await render(themed(<Onboarding />, scale));
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press("Let's start");
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press(/Sleep better/);
    await ui.press('Continue');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press('In bed by 23:30');
    await ui.press('Add habits');
    expect(auditPressables(ui.root)).toEqual([]);
    await ui.press(/Evening/);
    await ui.press('Continue');
    expect(auditPressables(ui.root)).toEqual([]);
  });
});

describe('week strip', () => {
  it('gives every day at least a 48dp touch target (it scrolls on narrow phones)', async () => {
    add('make-bed');
    const ui = await render(themed(<Today />));
    const { StyleSheet } = require('react-native');
    const days = ui.root.findAll((n) => isPressable(n) && /^\w+day, \w+ \d+/.test(String(n.props.accessibilityLabel)));
    expect(days).toHaveLength(7);
    for (const day of days) {
      const style = StyleSheet.flatten(typeof day.props.style === 'function' ? day.props.style({ pressed: false }) : day.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(48);
      expect(style.minHeight).toBeGreaterThanOrEqual(48);
    }
  });
});

describe('screens are readable by a screen reader', () => {
  it('Today rows expose one labelled element with the state and actions', async () => {
    add('drink-water');
    const ui = await render(themed(<Today />));
    const row = ui.root.findAll((n) => typeof n.props.onAccessibilityAction === 'function')[0];
    expect(row.props.accessibilityLabel).toBe('Drink water, 0 of 8 glasses, no streak yet');
    expect(row.props.accessibilityActions.map((a: { name: string }) => a.name)).toEqual(['increment', 'decrement', 'details', 'moveUp', 'moveDown']);
  });
  it('the progress ring and week days have spoken labels', async () => {
    add('make-bed');
    const ui = await render(themed(<Today />));
    expect(ui.byLabel('0 of 1 habits done')).not.toHaveLength(0);
    expect(ui.byLabel(/^Thursday, Oct 8/).length).toBeGreaterThan(0);
  });
});
