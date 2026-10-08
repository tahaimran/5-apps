import { moodFor, nextStage, settledStage, stageForGoalDays } from '../plant';

describe('plant (plan §7.3)', () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 1],
    [4, 2],
    [9, 2],
    [10, 3],
    [20, 3],
    [21, 4],
    [500, 4],
  ])('%i goal days is stage %i', (days, stage) => {
    expect(stageForGoalDays(days)).toBe(stage);
  });
  it.each([
    [0, 'thirsty'],
    [24, 'thirsty'],
    [25, 'ok'],
    [74, 'ok'],
    [75, 'happy'],
    [99, 'happy'],
    [100, 'sparkle'],
    [180, 'sparkle'],
  ])('%i%% makes the plant %s', (pct, mood) => {
    expect(moodFor(pct)).toBe(mood);
  });
  it('tells how far the next stage is', () => {
    expect(nextStage(0)).toEqual({ stage: 1, remaining: 1, have: 0, need: 1 });
    expect(nextStage(4)).toEqual({ stage: 3, remaining: 6, have: 0, need: 6 });
    expect(nextStage(7)).toEqual({ stage: 3, remaining: 3, have: 3, need: 6 });
    expect(nextStage(21)).toBeNull();
  });
  it('never lets a stage go back', () => {
    expect(settledStage({ stage: 3 }, 2)).toBe(3);
    expect(settledStage({ stage: 1 }, 5)).toBe(2);
  });
});
