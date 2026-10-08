import { mockMotion } from '@/testing/mocks';
import { act } from 'react';
import { cleanup, render } from '@/testing/ui';
import { ThemeProvider } from '@shared/theme';
import '@/bootstrap';
import { defaultProfile } from '@/domain/defaults';
import type { Profile } from '@/domain/types';
import { palette } from '@/theme/tokens';
import { GoalReveal } from '../GoalReveal';

const profile: Profile = { ...defaultProfile, weightKg: 62, weightUnit: 'kg', sex: 'male', activity: 'light', climate: 'mild' };
const themed = (goal: number, p = profile) => (
  <ThemeProvider palette={palette}>
    <GoalReveal profile={p} goalMl={goal} />
  </ThemeProvider>
);

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(async () => {
  await cleanup();
  mockMotion.reduced = true;
  jest.useRealTimers();
});

describe('goal reveal animation (plan §6 step 6)', () => {
  it('ticks the rows in 300 ms apart, then counts the goal up', async () => {
    mockMotion.reduced = false;
    const ui = await render(themed(2450));
    expect(ui.texts().filter((t) => t.includes('→'))).toHaveLength(0);
    await act(async () => void jest.advanceTimersByTime(300));
    expect(ui.texts().filter((t) => t.includes('→'))).toEqual(['Body weight 62 kg → 2,050 ml']);
    await act(async () => void jest.advanceTimersByTime(300));
    await act(async () => void jest.advanceTimersByTime(300));
    await act(async () => void jest.advanceTimersByTime(300)); // the male row
    expect(ui.texts().filter((t) => t.includes('→'))).toEqual(['Body weight 62 kg → 2,050 ml', 'Lightly active → +250 ml', 'Mild climate → +0 ml', 'Male → +150 ml']);
    expect(ui.texts().join('|')).not.toContain('2,450 ml');
    await act(async () => void jest.advanceTimersByTime(40 * 14));
    expect(ui.texts().join('|')).toContain('2,450 ml');
    expect(ui.texts()).toContain('About 10 glasses');
  });
  it('shows everything at once with reduced motion', async () => {
    const ui = await render(themed(2300, { ...profile, sex: 'female', climate: 'cool', weightUnit: 'lb' }));
    expect(ui.texts()).toContain('Cool climate → −100 ml');
    expect(ui.texts()).toContain('Body weight 137 lb → 2,050 ml');
    expect(ui.texts().join('|')).toContain('2,300 ml');
    expect(ui.texts().some((t) => t.startsWith('Male'))).toBe(false);
  });
  it('announces the goal to screen readers', async () => {
    const ui = await render(themed(2300));
    expect(ui.byLabel('Your daily goal 2,300 ml')).toHaveLength(1);
  });
});
