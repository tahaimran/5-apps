import '@/testing/mocks';
import { shiftTime } from '../TimeStepper';

describe('shiftTime', () => {
  it.each([
    [21, 0, -15, 20, 45],
    [9, 0, -15, 8, 45],
    [9, 45, 15, 10, 0],
    [0, 0, -15, 23, 45],
    [23, 45, 15, 0, 0],
    [0, 30, -60, 23, 30],
    [23, 30, 60, 0, 30],
    [20, 0, 60, 21, 0],
  ])('%d:%d %+d min is %d:%d', (h, m, delta, eh, em) => {
    expect(shiftTime(h, m, delta)).toEqual({ hour: eh, minute: em });
  });
});
