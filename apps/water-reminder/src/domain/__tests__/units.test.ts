import { clamp, flozToMl, formatAmount, groupDigits, kgToLb, lbToKg, mlToFloz, percentOf, roundTo, stepMl, volumeIn } from '../units';

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
  it('steps by 50 ml or 2 fl oz', () => {
    expect(stepMl('ml')).toBe(50);
    expect(stepMl('floz')).toBe(59);
  });
});
