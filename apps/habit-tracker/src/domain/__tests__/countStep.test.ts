import { countStep, stepLabel } from '../countStep';

describe('countStep', () => {
  it.each([
    [1, 1],
    [8, 1],
    [20, 1],
    [30, 2],
    [100, 10],
    [2000, 250],
    [8000, 500],
    [10000, 1000],
    [100000, 10000],
  ])('target %i moves by %i', (target, step) => {
    expect(countStep(target)).toBe(step);
  });

  it('reaches any target in a handful of taps', () => {
    for (let target = 1; target <= 100000; target += 37) {
      expect(Math.ceil(target / countStep(target))).toBeLessThanOrEqual(20);
    }
  });

  it('falls back to 1 for nonsense targets', () => {
    expect(countStep(Number.NaN)).toBe(1);
    expect(countStep(-5)).toBe(1);
  });
});

describe('stepLabel', () => {
  it('shortens thousands', () => {
    expect(stepLabel(5)).toBe('5');
    expect(stepLabel(500)).toBe('500');
    expect(stepLabel(1000)).toBe('1k');
    expect(stepLabel(2500)).toBe('2.5k');
  });
});
