import { mulberry32 } from '../prng';
import { allowanceFor, fiftyFifty } from '../lifelines';

describe('lifelines', () => {
  it('removes exactly two wrong options and never the right one', () => {
    for (let correct = 0; correct < 4; correct++) {
      for (let s = 0; s < 50; s++) {
        const removed = fiftyFifty(correct, mulberry32(s));
        expect(removed).toHaveLength(2);
        expect(removed).not.toContain(correct);
        expect(new Set(removed).size).toBe(2);
      }
    }
  });
  it('gives one free of each, only Skip in the Daily, nothing in the warm-up', () => {
    expect(allowanceFor('classic')).toEqual({ free: { fifty: 1, skip: 1, time: 1 }, rewarded: true });
    expect(allowanceFor('blitz').rewarded).toBe(true);
    expect(allowanceFor('daily')).toEqual({ free: { fifty: 0, skip: 1, time: 0 }, rewarded: false });
    expect(allowanceFor('warmup')).toEqual({ free: { fifty: 0, skip: 0, time: 0 }, rewarded: false });
  });
});
