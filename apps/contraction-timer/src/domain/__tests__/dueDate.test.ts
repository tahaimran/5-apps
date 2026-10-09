import { displayWeeks, eddFrom, gestationOn, lmpEquivalent, profileEdd, startOfWeek, trimesterOf, validateDue } from '../dueDate';

describe('eddFrom', () => {
  it('LMP: 280 days after, adjusted for the cycle length (21, 28, 35)', () => {
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01', cycleLength: 28 })).toBe('2026-10-08');
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01', cycleLength: 35 })).toBe('2026-10-15');
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01', cycleLength: 21 })).toBe('2026-10-01');
  });
  it('LMP: defaults to a 28-day cycle and keeps the cycle within 21–45', () => {
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01' })).toBe('2026-10-08');
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01', cycleLength: 10 })).toBe('2026-10-01');
    expect(eddFrom({ mode: 'lmp', date: '2026-01-01', cycleLength: 90 })).toBe('2026-10-25');
  });
  it('LMP across a leap day', () => {
    expect(eddFrom({ mode: 'lmp', date: '2023-06-01', cycleLength: 28 })).toBe('2024-03-07');
    expect(eddFrom({ mode: 'lmp', date: '2024-02-01', cycleLength: 28 })).toBe('2024-11-07');
  });
  it('conception date: 266 days after', () => {
    expect(eddFrom({ mode: 'conception', date: '2026-01-15' })).toBe('2026-10-08');
  });
  it('IVF transfer: day 5 is +261, day 3 is +263', () => {
    expect(eddFrom({ mode: 'ivf', date: '2026-01-20', ivfEmbryoDay: 5 })).toBe('2026-10-08');
    expect(eddFrom({ mode: 'ivf', date: '2026-01-18', ivfEmbryoDay: 3 })).toBe('2026-10-08');
  });
  it('a known due date is used as it is', () => {
    expect(eddFrom({ mode: 'edd', date: '2026-11-12' })).toBe('2026-11-12');
    expect(lmpEquivalent('2026-11-12')).toBe('2026-02-05');
  });
});

describe('gestationOn', () => {
  it('counts weeks and days from the equivalent LMP', () => {
    const g = gestationOn('2026-11-12', '2026-10-09'); // 280-34 = 246 days
    expect(g.days).toBe(246);
    expect(g.weeks).toBe(35);
    expect(g.day).toBe(1);
    expect(g.daysToGo).toBe(34);
    expect(g.trimester).toBe(3);
    expect(g.pastDue).toBe(false);
  });
  it('is exact on the due date: 40 weeks and 0 days, nought days to go', () => {
    const g = gestationOn('2026-11-12', '2026-11-12');
    expect([g.weeks, g.day, g.daysToGo]).toEqual([40, 0, 0]);
  });
  it('goes negative on days to go after the due date, and flags past 42 weeks', () => {
    expect(gestationOn('2026-11-12', '2026-11-20').daysToGo).toBe(-8);
    expect(gestationOn('2026-11-12', '2026-11-20').pastDue).toBe(false);
    const edge = gestationOn('2026-11-12', '2026-11-26'); // 42w 0d
    expect([edge.weeks, edge.day, edge.pastDue]).toEqual([42, 0, false]);
    expect(gestationOn('2026-11-12', '2026-11-27').pastDue).toBe(true); // 42w 1d
  });
  it('is not off by one across a daylight-saving change (date-only arithmetic)', () => {
    // US spring forward 2026-03-08, fall back 2026-11-01; UK 2026-03-29 and 2026-10-25
    expect(gestationOn('2026-11-12', '2026-11-02').days).toBe(280 - 10);
    expect(gestationOn('2026-11-12', '2026-10-26').days).toBe(280 - 17);
    expect(gestationOn('2026-04-01', '2026-03-29').days).toBe(280 - 3);
  });
  it('never reports before week 0', () => {
    expect(gestationOn('2026-11-12', '2025-01-01').days).toBe(0);
  });
  it('trimesters: 1 below 14 weeks, 2 up to 27w6d, 3 from 28 weeks', () => {
    expect([13, 14, 27, 28].map(trimesterOf)).toEqual([1, 2, 2, 3]);
  });
  it('clamps what is shown to 44 weeks', () => {
    expect(displayWeeks(gestationOn('2026-11-12', '2027-03-01'))).toEqual({ weeks: 44, day: 0 });
    expect(displayWeeks(gestationOn('2026-11-12', '2026-10-09'))).toEqual({ weeks: 35, day: 1 });
  });
  it('finds the first day of a week', () => {
    expect(startOfWeek('2026-11-12', 35)).toBe('2026-10-08');
  });
});

describe('validateDue', () => {
  const today = '2026-10-09';
  it('refuses an LMP in the future or more than 44 weeks ago', () => {
    expect(validateDue({ mode: 'lmp', date: '2026-10-10' }, today)).toBe('lmp-future');
    expect(validateDue({ mode: 'lmp', date: '2025-11-30' }, today)).toBe('lmp-too-old');
    expect(validateDue({ mode: 'lmp', date: '2026-02-05' }, today)).toBeNull();
  });
  it('refuses a future conception or transfer date', () => {
    expect(validateDue({ mode: 'conception', date: '2026-10-10' }, today)).toBe('date-future');
    expect(validateDue({ mode: 'ivf', date: '2026-10-10', ivfEmbryoDay: 5 }, today)).toBe('date-future');
  });
  it('accepts a due date from 4 weeks ago to 42 weeks ahead and no further', () => {
    expect(validateDue({ mode: 'edd', date: '2026-09-11' }, today)).toBeNull();
    expect(validateDue({ mode: 'edd', date: '2026-09-10' }, today)).toBe('edd-too-early');
    expect(validateDue({ mode: 'edd', date: '2027-07-30' }, today)).toBeNull();
    expect(validateDue({ mode: 'edd', date: '2027-07-31' }, today)).toBe('edd-too-late');
  });
});

describe('profileEdd', () => {
  it('uses the stored due date, else works it out, else is null', () => {
    expect(profileEdd({ needs: [], edd: '2026-11-12' })).toBe('2026-11-12');
    expect(profileEdd({ needs: [], dateMode: 'lmp', inputDate: '2026-01-01', cycleLength: 28 })).toBe('2026-10-08');
    expect(profileEdd({ needs: [] })).toBeNull();
  });
});
