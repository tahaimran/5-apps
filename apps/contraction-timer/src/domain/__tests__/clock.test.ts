import { clockJump } from '../clock';

describe('clockJump', () => {
  it('is zero when both clocks moved the same', () => {
    expect(clockJump({ wall: 1_000_000, mono: 5000 }, { wall: 1_000_250, mono: 5250 })).toBe(0);
  });
  it('ignores small drift', () => {
    expect(clockJump({ wall: 0, mono: 0 }, { wall: 4000, mono: 0 })).toBe(0);
  });
  it('reports a clock set back (negative) and forward (positive)', () => {
    expect(clockJump({ wall: 10_000_000, mono: 1000 }, { wall: 9_000_000, mono: 1250 })).toBe(-1_000_250);
    expect(clockJump({ wall: 10_000_000, mono: 1000 }, { wall: 13_600_000, mono: 1250 })).toBe(3_599_750);
  });
});
