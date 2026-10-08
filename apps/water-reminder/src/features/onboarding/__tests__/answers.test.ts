import '@/testing/mocks';
import { calculatedGoal, cupsFor, profileFrom, resolveAnswers, weightKgOf } from '../answers';
import { defaultWeightUnit } from '../locale';

describe('resolveAnswers', () => {
  it('uses the plan defaults when everything was skipped (2,400 ml for 145 lb, light, mild)', () => {
    const r = resolveAnswers({}, 'lb');
    expect(r.profile).toMatchObject({ weightUnit: 'lb', activity: 'light', climate: 'mild', sex: 'unspecified', mode: 'standard' });
    expect(r.goal).toEqual({ goalMl: 2400, source: 'calculated' });
    expect(r.reminders).toEqual({ wakeMin: 420, bedMin: 1380, frequency: 'smart', intervalMin: 120, style: 'normal' });
    expect(r.preferredCupId).toBe('cup-250');
    expect(r.cups).toHaveLength(4);
  });
  it('defaults to 65 kg for metric users', () => {
    expect(resolveAnswers({}, 'kg').profile.weightKg).toBe(65);
    expect(resolveAnswers({}, 'kg').goal.goalMl).toBe(2400);
  });
  it('takes every answer', () => {
    const r = resolveAnswers(
      {
        about: 'male',
        weight: { unit: 'kg', value: 80 },
        schedule: { wakeMin: 360, bedMin: 1320 },
        activity: 'active',
        climate: 'warm',
        reminders: { frequency: 'interval60', style: 'gentle' },
        cup: { ml: 350 },
      },
      'lb',
    );
    expect(r.profile).toMatchObject({ sex: 'male', weightKg: 80, weightUnit: 'kg', activity: 'active', climate: 'warm' });
    expect(r.goal).toEqual({ goalMl: 3550, source: 'calculated' });
    expect(r.reminders).toEqual({ wakeMin: 360, bedMin: 1320, frequency: 'interval', intervalMin: 60, style: 'gentle' });
    expect(r.preferredCupId).toBe('cup-350');
  });
  it('marks a hand-adjusted goal as manual, but not one left unchanged', () => {
    expect(resolveAnswers({ goal: { adjustedMl: 2600 } }, 'lb').goal).toEqual({ goalMl: 2600, source: 'manual' });
    expect(resolveAnswers({ goal: { adjustedMl: 2400, adjusting: true } }, 'lb').goal).toEqual({ goalMl: 2400, source: 'calculated' });
  });
  it('uses the typed goal for "I already know my goal" and keeps it in range', () => {
    expect(resolveAnswers({ knowsGoal: true, cup: { ml: 250, goalMl: 2750 } }, 'lb').goal).toEqual({ goalMl: 2750, source: 'manual' });
    expect(resolveAnswers({ knowsGoal: true }, 'lb').goal.goalMl).toBe(2000);
    expect(resolveAnswers({ knowsGoal: true, cup: { ml: 250, goalMl: 99999 } }, 'lb').goal.goalMl).toBe(4500);
  });
  it('maps "every 2 hours" to a 120 minute interval', () => {
    expect(resolveAnswers({ reminders: { frequency: 'interval120', style: 'normal' } }, 'kg').reminders).toMatchObject({ frequency: 'interval', intervalMin: 120 });
  });
});

describe('helpers', () => {
  it('converts pounds to kilograms for the calculation', () => {
    expect(weightKgOf({ weight: { unit: 'lb', value: 145 } }, 'kg')).toEqual({ kg: 65.8, unit: 'lb' });
    expect(weightKgOf({}, 'lb')).toEqual({ kg: 65.8, unit: 'lb' });
    expect(profileFrom({ about: 'female' }, 'kg').sex).toBe('female');
    expect(calculatedGoal({ weight: { unit: 'kg', value: 62 }, about: 'female' }, 'kg')).toBe(2300);
  });
  it('puts a custom cup in place of the nearest one and prefers it', () => {
    const { cups, preferredCupId } = cupsFor(400);
    expect(preferredCupId).toBe('cup-custom');
    expect(cups.map((c) => c.ml)).toEqual([150, 250, 400, 500]);
    expect(cups.find((c) => c.id === 'cup-custom')?.label).toBe('custom');
    expect(cupsFor(150).preferredCupId).toBe('cup-150');
  });
  it('picks pounds for the US locale only', () => {
    expect(defaultWeightUnit()).toBe('lb');
  });
});
