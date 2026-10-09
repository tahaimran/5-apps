import { addDays, addMonths, addYears, dayDiff } from '../dateKey';

describe('addMonths and addYears', () => {
  it.each([
    ['2026-01-31', 1, '2026-02-28'],
    ['2024-01-31', 1, '2024-02-29'],
    ['2026-03-31', -1, '2026-02-28'],
    ['2026-11-12', 1, '2026-12-12'],
    ['2026-12-12', 1, '2027-01-12'],
    ['2026-01-12', -1, '2025-12-12'],
    ['2026-05-15', 14, '2027-07-15'],
  ])('%s %+d months is %s', (key, n, expected) => expect(addMonths(key, n)).toBe(expected));
  it('moves whole years and keeps 29 Feb valid', () => {
    expect(addYears('2026-06-10', 1)).toBe('2027-06-10');
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
  });
  it('day maths is not affected by daylight saving', () => {
    expect(dayDiff('2026-03-07', '2026-03-09')).toBe(2);
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
  });
});
