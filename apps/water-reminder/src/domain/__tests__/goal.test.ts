import { calcGoalMl, clampGoal, glassesOf, goalBreakdown } from '../goal';
import { defaultProfile } from '../defaults';
import type { Profile } from '../types';

const p = (over: Partial<Profile>): Profile => ({ ...defaultProfile, ...over });

describe('goal calculator (plan §8.1)', () => {
  // weightKg, activity, climate, sex, mode → raw ml, goal
  const cases: [string, Partial<Profile>, number, number][] = [
    ['plan example: 62 kg, light, mild, female', { weightKg: 62, activity: 'light', climate: 'mild', sex: 'female' }, 2296, 2300],
    ['65 kg, sedentary, mild', { weightKg: 65, activity: 'sedentary' }, 2145, 2150],
    ['80 kg, active, warm, male', { weightKg: 80, activity: 'active', climate: 'warm', sex: 'male' }, 3540, 3550],
    ['50 kg, sedentary, cool, female', { weightKg: 50, activity: 'sedentary', climate: 'cool', sex: 'female' }, 1550, 1550],
    ['100 kg, very active, hot, male is capped', { weightKg: 100, activity: 'very_active', climate: 'hot', sex: 'male' }, 4700, 4500],
    ['40 kg, sedentary, cool rounds down to the floor', { weightKg: 40, activity: 'sedentary', climate: 'cool' }, 1220, 1200],
    ['30 kg is raised to the floor', { weightKg: 30, activity: 'sedentary', climate: 'cool' }, 890, 1200],
    ['70 kg, light, warm, pregnancy', { weightKg: 70, climate: 'warm', mode: 'pregnancy' }, 3110, 3100],
    ['58 kg, active, hot, breastfeeding', { weightKg: 58, activity: 'active', climate: 'hot', mode: 'breastfeeding' }, 3614, 3600],
    ['90 kg, light, mild, male', { weightKg: 90, sex: 'male' }, 3370, 3350],
    ['75 kg senior does not lower the goal', { weightKg: 75, mode: 'senior' }, 2725, 2750],
    ['fasting does not change the goal', { weightKg: 75, mode: 'fasting' }, 2725, 2750],
  ];
  it.each(cases)('%s', (_name, over, raw, goal) => {
    const b = goalBreakdown(p(over));
    expect(b.rawMl).toBeCloseTo(raw, 5);
    expect(b.goalMl).toBe(goal);
    expect(calcGoalMl(p(over))).toBe(goal);
  });
  it('returns the parts that the goal reveal shows', () => {
    expect(goalBreakdown(p({ weightKg: 62, sex: 'female' }))).toMatchObject({
      baseMl: 2046,
      activityMl: 250,
      climateMl: 0,
      sexMl: 0,
      modeMl: 0,
    });
  });
  it('treats a missing sex as unspecified', () => {
    expect(calcGoalMl(p({ sex: undefined, weightKg: 65 }))).toBe(calcGoalMl(p({ sex: 'unspecified', weightKg: 65 })));
  });
  it('always lands on a multiple of 50 inside 1,200 to 4,500', () => {
    for (let kg = 30; kg <= 200; kg += 7) {
      for (const activity of ['sedentary', 'very_active'] as const) {
        const g = calcGoalMl(p({ weightKg: kg, activity }));
        expect(g % 50).toBe(0);
        expect(g).toBeGreaterThanOrEqual(1200);
        expect(g).toBeLessThanOrEqual(4500);
      }
    }
  });
  it('clamps a typed goal and counts glasses', () => {
    expect(clampGoal(990)).toBe(1200);
    expect(clampGoal(9000)).toBe(4500);
    expect(clampGoal(2333)).toBe(2350);
    expect(glassesOf(2300)).toBe(9);
    expect(glassesOf(2000)).toBe(8);
  });
});
