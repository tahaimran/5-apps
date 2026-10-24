import { clamp, flozToMl, formatAmount, groupDigits, kgToLb, lbToKg, mlToFloz, drinkStep, goalStep, percentOf, roundTo, unitToMl, volumeIn } from '../units';

describe('units', () => {
  it('groups thousands', () => {
    expect(groupDigits(950)).toBe('950');
    expect(groupDigits(1250)).toBe('1,250');
    expect(groupDigits(12500)).toBe('12,500');
  });
  it('converts ml and fl oz', () => {
    expect(mlToFloz(250)).toBe(8.5);
    expect(mlToFloz(500)).toBe(16.9);
    expect(flozToMl(8)).toBe(237);
    expect(flozToMl(mlToFloz(1000))).toBeCloseTo(1000, -1);
  });
  it('converts weight', () => {
    expect(kgToLb(65)).toBe(143);
    expect(kgToLb(62)).toBe(137);
    expect(lbToKg(145)).toBe(65.8);
    expect(lbToKg(137)).toBe(62.1);
  });
  it('shows volumes in the chosen unit', () => {
    expect(volumeIn(250, 'ml')).toBe(250);
    expect(volumeIn(250, 'floz')).toBe(8.5);
    expect(formatAmount(1250, 'ml')).toBe('1,250');
    expect(formatAmount(2300, 'floz')).toBe('77.8');
    expect(formatAmount(2956, 'floz')).toBe('100'); // whole numbers drop the decimal
    expect(formatAmount(0, 'ml')).toBe('0');
  });
  it('rounds, clamps and takes percents', () => {
    expect(roundTo(2296, 50)).toBe(2300);
    expect(roundTo(2274, 50)).toBe(2250);
    expect(clamp(5, 1, 3)).toBe(3);
    expect(clamp(-5, 1, 3)).toBe(1);
    expect(percentOf(1250, 2300)).toBe(54);
    expect(percentOf(100, 0)).toBe(0);
  });
  it('moves the goal by 50 ml or 2 fl oz', () => {
    expect(goalStep('ml')).toBe(50);
    expect(goalStep('floz')).toBe(2);
  });
  it.each([
    ['ml', 50, 1, 10],
    ['ml', 100, 1, 25],
    ['ml', 100, -1, 10],
    ['ml', 250, 1, 25],
    ['ml', 300, -1, 25],
    ['ml', 300, 1, 50],
    ['floz', 3, 1, 0.5],
    ['floz', 4, -1, 0.5],
    ['floz', 8.5, 1, 1],
  ] as const)('steps a %s drink from %d (direction %d) by %d', (unit, value, dir, step) => {
    expect(drinkStep(unit, value, dir)).toBe(step);
  });
  it('turns a stepper value back into whole ml', () => {
    expect(unitToMl(250.4, 'ml')).toBe(250);
    expect(unitToMl(8.46, 'floz')).toBe(flozToMl(8.5));
  });
});
