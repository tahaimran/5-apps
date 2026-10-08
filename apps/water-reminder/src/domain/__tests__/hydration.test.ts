import { clampFactor, defaultBeverages, effectiveMl, factorOf } from '../hydration';

describe('beverage factors (plan §8.7)', () => {
  it('has the six MVP drinks with the plan factors', () => {
    expect(Object.fromEntries(defaultBeverages.map((b) => [b.id, b.factor]))).toEqual({
      water: 1,
      sparkling: 1,
      tea: 0.9,
      milk: 0.9,
      juice: 0.85,
      coffee: 0.8,
    });
  });
  it('rounds the effective volume', () => {
    expect(effectiveMl(250, 0.8)).toBe(200);
    expect(effectiveMl(250, 0.85)).toBe(213);
    expect(effectiveMl(333, 0.9)).toBe(300);
  });
  it('keeps edited factors between 0.5 and 1.0 on a 0.05 step', () => {
    expect(clampFactor(0.2)).toBe(0.5);
    expect(clampFactor(1.4)).toBe(1);
    expect(clampFactor(0.87)).toBe(0.85);
    expect(clampFactor(0.93)).toBe(0.95);
  });
  it('falls back to the default factor for a drink missing from the list', () => {
    expect(factorOf([], 'coffee')).toBe(0.8);
    expect(factorOf([{ id: 'coffee', factor: 0.7 }], 'coffee')).toBe(0.7);
    expect(factorOf([], 'soda')).toBe(1);
  });
});
