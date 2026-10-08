import { act } from 'react';
import { Alert } from 'react-native';
import { mockParams, mockRouter } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import { sharedStore } from '@shared/storage';
import '@/bootstrap';
import type { ReactElement } from 'react';
import Today from '../../app/(tabs)/index';
import Stats from '../../app/(tabs)/stats';
import Settings from '../../app/(tabs)/settings';
import HabitDetail from '../../app/habit/[id]/index';
import EditHabit from '../../app/habit/[id]/edit';
import NewHabit from '../../app/habit/new';
import Templates from '../../app/templates';
import Archive from '../../app/archive';
import Backup from '../../app/backup';
import NoteScreen from '../../app/note/[date]';
import Onboarding from '../../app/onboarding';
import { templateById } from '@/data/templates';
import type { DayKey } from '@/domain/types';
import { draftFromTemplate } from '@/features/habit-editor/drafts';
import { useCelebration } from '@/store/celebrations';
import { useHabits } from '@/store/habits';
import { useNotes } from '@/store/notes';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { palette } from '@/theme/tokens';

const TODAY = '2026-10-08' as DayKey;
const themed = (el: ReactElement) => <ThemeProvider palette={palette}>{el}</ThemeProvider>;
const add = (id: string, createdAt: DayKey = TODAY) => useHabits.getState().addHabit({ ...draftFromTemplate(templateById(id)!, TODAY), createdAt });

beforeEach(() => {
  resetApp();
  sharedStore.remove('onboarding.completedAt');
  mockParams.current = {};
  for (const fn of Object.values(mockRouter)) if (typeof fn === 'function' && 'mockClear' in fn) (fn as jest.Mock).mockClear();
  useToday.setState({ today: TODAY });
  jest.useFakeTimers({ now: new Date(2026, 9, 8, 9, 0, 0), doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(async () => {
  await cleanup();
  jest.useRealTimers();
});

describe('onboarding → first check-in', () => {
  it('walks every step, creates the habits and lands on Today with the coach-mark', async () => {
    const ui = await render(themed(<Onboarding />));
    expect(ui.texts()).toContain('Small habits. Big changes.');
    await ui.press("Let's start");
    expect(ui.texts()).toContain('What do you want to work on?');
    // Continue is disabled until a goal is picked
    expect(ui.root.findAll((n) => n.props.accessibilityLabel === 'Continue' && n.props.disabled === true)).not.toHaveLength(0);
    await ui.press(/Sleep better/);
    await ui.press('Continue');
    expect(ui.texts()).toContain('Pick 1 to 3 habits to start');
    await ui.press('In bed by 23:30');
    await ui.press('Read');
    expect(ui.texts()).toContain('2 of 3');
    await ui.press('Add habits');
    expect(ui.texts()).toContain('When should we remind you?');
    await ui.press(/Evening 20:00/);
    await ui.press('Continue');
    expect(ui.texts().some((t) => t.startsWith('Allow reminders so we can nudge you at 20:00'))).toBe(true);
    await ui.press('Not now');

    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    const habits = Object.values(useHabits.getState().habits);
    expect(habits.map((h) => h.name)).toEqual(['In bed by 23:30', 'Read']);
    expect(habits.every((h) => h.reminders[0].time === '20:00')).toBe(true);
    expect(useProfile.getState().profile).toMatchObject({ onboardingDone: true, goals: ['sleep'] });
    expect(sharedStore.get('onboarding.completedAt')).toBeDefined();

    // ...then the first check-in on Today
    const today = await render(themed(<Today />));
    expect(today.texts()).toContain('Done it already today? Tap to check it off.');
    await today.press('Mark done');
    expect(useCelebration.getState().current).toMatchObject({ kind: 'first' });
  });

  it('"No reminders" ends the flow without asking for permission', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    await ui.press(/Be productive/);
    await ui.press('Continue');
    await ui.press('Make my bed');
    await ui.press('Add habits');
    await ui.press('No reminders');
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(Object.values(useHabits.getState().habits)[0].reminders).toEqual([]);
  });

  it('"I\'ll set up later" lands on an empty Today', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press("I'll set up later");
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    expect(useHabits.getState().habitOrder).toEqual([]);
    expect(useProfile.getState().profile.onboardingDone).toBe(true);
  });

  it('shows Back from the second step and can return', async () => {
    const ui = await render(themed(<Onboarding />));
    await ui.press("Let's start");
    await ui.press('Back');
    expect(ui.texts()).toContain('Small habits. Big changes.');
  });
});

describe('habit editor', () => {
  it('creates a habit from the form', async () => {
    const ui = await render(themed(<NewHabit />));
    expect(ui.root.findAll((n) => n.props.accessibilityLabel === 'Create habit' && n.props.disabled === true)).not.toHaveLength(0);
    await ui.type('Name', 'Stretch');
    await ui.press('Count');
    await ui.press('Weekdays');
    await ui.press('Create habit');
    const created = Object.values(useHabits.getState().habits);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ name: 'Stretch', type: 'count', schedule: { kind: 'weekdays' } });
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('opens from a template with its values filled in', async () => {
    mockParams.current = { template: 'meditate' };
    const ui = await render(themed(<NewHabit />));
    await ui.press('Create habit');
    expect(Object.values(useHabits.getState().habits)[0]).toMatchObject({ name: 'Meditate', type: 'timer', target: 10 });
  });

  it('edits an existing habit', async () => {
    const { id } = add('read');
    mockParams.current = { id };
    const ui = await render(themed(<EditHabit />));
    await ui.type('Name', 'Read more');
    await ui.press('Save changes');
    expect(useHabits.getState().habits[id].name).toBe('Read more');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('says so for a habit that no longer exists', async () => {
    mockParams.current = { id: 'ghost' };
    const ui = await render(themed(<EditHabit />));
    expect(ui.texts()).toContain('This habit no longer exists.');
  });
});

describe('templates', () => {
  it('lists templates by category, filters by search and adds one', async () => {
    const ui = await render(themed(<Templates />));
    expect(ui.texts()).toContain('Health');
    await ui.type('Search templates', 'meditat');
    expect(ui.texts()).toContain('Mind');
    expect(ui.texts()).not.toContain('Health');
    await ui.press(/^Meditate\./);
    await ui.press('Add habit');
    expect(Object.values(useHabits.getState().habits).map((h) => h.name)).toEqual(['Meditate']);
    expect(mockRouter.dismissAll).toHaveBeenCalled();
  });

  it('shows a message when nothing matches', async () => {
    const ui = await render(themed(<Templates />));
    await ui.type('Search templates', 'zzzz');
    expect(ui.texts()).toContain('No templates match "zzzz".');
  });
});

describe('habit detail and archive', () => {
  it('shows streaks and completion, then archives and unarchives', async () => {
    const { id } = add('make-bed', '2026-10-01' as DayKey);
    for (const d of ['2026-10-06', '2026-10-07', '2026-10-08']) useHabits.getState().setValue(id, d as DayKey, 1);
    mockParams.current = { id };
    const ui = await render(themed(<HabitDetail />));
    expect(ui.texts()).toContain('3 days');
    expect(ui.texts()).toContain('Total check-ins');
    await ui.press('Archive');
    expect(useHabits.getState().habits[id].archivedAt).toBe(TODAY);
    expect(mockRouter.back).toHaveBeenCalled();

    const archive = await render(themed(<Archive />));
    expect(archive.texts()).toContain('Make my bed');
    await archive.press('Unarchive');
    expect(useHabits.getState().habits[id].archivedAt).toBeUndefined();
  });

  it('deleting asks first', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { id } = add('make-bed');
    mockParams.current = { id };
    const ui = await render(themed(<HabitDetail />));
    await ui.press('Delete');
    expect(alert).toHaveBeenCalled();
    expect(useHabits.getState().habits[id]).toBeDefined();
    const buttons = alert.mock.calls[0][2]!;
    await act(async () => buttons.find((b) => b.text === 'Delete')!.onPress!());
    expect(useHabits.getState().habits[id]).toBeUndefined();
    alert.mockRestore();
  });

  it('survives a habit with a full year of history and renders its heatmap', async () => {
    const { id } = add('read', '2025-10-08' as DayKey);
    const entries: Record<string, { value: number; updatedAt: number }> = {};
    for (let i = 0; i < 365; i += 2) entries[new Date(2025, 9, 8 + i).toISOString().slice(0, 10)] = { value: 10, updatedAt: 0 };
    useHabits.setState({ entries: { [id]: entries as never } });
    mockParams.current = { id };
    const ui = await render(themed(<HabitDetail />));
    expect(ui.texts()).toContain('Recent days');
  });
});

describe('stats', () => {
  it('shows the empty state, then numbers after a check-in', async () => {
    const empty = await render(themed(<Stats />));
    expect(empty.texts()).toContain('Stats appear after your first check-in.');
    await empty.unmount();
    const { id } = add('make-bed', '2026-10-01' as DayKey);
    useHabits.getState().setValue(id, TODAY, 1);
    const ui = await render(themed(<Stats />));
    expect(ui.texts()).toContain('This week');
    expect(ui.texts()).toContain('Make my bed');
  });
});

describe('settings', () => {
  it('changes theme, week start, day rollover and haptics', async () => {
    const ui = await render(themed(<Settings />));
    await ui.press('Sunday');
    expect(useSettings.getState().settings.weekStartsOn).toBe(0);
    await ui.press('Later'); // day-ends-at stepper: increase
    expect(useSettings.getState().settings.dayEndsAtHour).toBe(1);
    await ui.press('Dark');
    expect(sharedStore.get('theme.mode')).toBe('dark');
  });

  it('shows the permission prompt row and navigates to archive, backup', async () => {
    const ui = await render(themed(<Settings />));
    await act(async () => {});
    expect(ui.byLabel('Allow reminders')).not.toHaveLength(0);
    await ui.press('Archive');
    expect(mockRouter.push).toHaveBeenCalledWith('/archive');
    await ui.press('Backup & restore');
    expect(mockRouter.push).toHaveBeenCalledWith('/backup');
  });

  it('shows the streak freeze count and the rewarded button with its value', async () => {
    const ui = await render(themed(<Settings />));
    expect(ui.texts()).toContain('0 of 2 held');
    expect(ui.texts()).toContain('▶ Watch ad: +1 freeze');
  });
});

describe('notes', () => {
  it('saves a note with a mood', async () => {
    mockParams.current = { date: TODAY };
    const ui = await render(themed(<NoteScreen />));
    await ui.press('Good');
    await ui.type('How was today?', 'Went well');
    await ui.press('Save');
    expect(useNotes.getState().notes[TODAY]).toMatchObject({ text: 'Went well', mood: 4 });
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe('backup screen', () => {
  it('explains where the data lives and offers export and import', async () => {
    const ui = await render(themed(<Backup />));
    expect(ui.texts()).toContain('Export backup');
    expect(ui.texts()).toContain('Import backup');
  });
});
