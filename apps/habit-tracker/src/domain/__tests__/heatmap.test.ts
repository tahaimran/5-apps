import { buildHeatmap, heatmapWeeks, levelFor, MAX_WEEKS, MIN_WEEKS } from '../heatmap';
import { d, done, entry, frozen, habit } from '../testHelpers';

const TODAY = d('2026-10-08'); // Thursday

describe('levelFor', () => {
  it('buckets progress into 20/45/70/100%', () => {
    expect([0, 0.2, 0.5, 0.8, 1, 1.4].map(levelFor)).toEqual([0, 1, 2, 3, 4, 4]);
  });
});

describe('heatmapWeeks', () => {
  it('shows at least 20 weeks', () => {
    expect(heatmapWeeks(d('2026-10-01'), TODAY, 1)).toBe(MIN_WEEKS);
  });
  it('grows back to the habit start', () => {
    expect(heatmapWeeks(d('2026-01-05'), TODAY, 1)).toBe(40);
  });
  it('caps at a year', () => {
    expect(heatmapWeeks(d('2020-01-01'), TODAY, 1)).toBe(MAX_WEEKS);
  });
});

describe('buildHeatmap', () => {
  const h = habit({ createdAt: d('2026-09-01') });
  const grid = buildHeatmap(h, done('2026-10-05', '2026-10-06'), TODAY, 1);
  const cell = (day: string) => grid.flat().find((c) => c.day === day)!;

  it('is weeks of 7 ending with the current week', () => {
    expect(grid).toHaveLength(MIN_WEEKS);
    for (const week of grid) expect(week).toHaveLength(7);
    expect(grid[grid.length - 1][0].day).toBe('2026-10-05');
    expect(grid[grid.length - 1][6].day).toBe('2026-10-11');
  });
  it('marks completed days at full intensity', () => {
    expect(cell('2026-10-05')).toMatchObject({ state: 'value', level: 4, ratio: 1 });
  });
  it('shows missed days as empty values', () => {
    expect(cell('2026-10-07')).toMatchObject({ state: 'value', level: 0 });
  });
  it('marks future days and days before the start', () => {
    expect(cell('2026-10-09').state).toBe('future');
    expect(cell('2026-08-31').state).toBe('before');
  });
  it('shades partial counts by progress', () => {
    const water = habit({ type: 'count', target: 8, createdAt: d('2026-09-01') });
    const g = buildHeatmap(water, { '2026-10-07': entry(4), '2026-10-06': entry(8), '2026-10-05': entry(1) } as never, TODAY, 1);
    const c = (day: string) => g.flat().find((x) => x.day === day)!;
    expect(c('2026-10-06').level).toBe(4);
    expect(c('2026-10-07').level).toBe(2);
    expect(c('2026-10-05').level).toBe(1);
  });
  it('shows frozen days and unscheduled days distinctly', () => {
    const mwf = habit({ schedule: { kind: 'weekdays', days: [1, 3, 5] }, createdAt: d('2026-09-01') });
    const g = buildHeatmap(mwf, { '2026-10-07': frozen() }, TODAY, 1);
    const c = (day: string) => g.flat().find((x) => x.day === day)!;
    expect(c('2026-10-07').state).toBe('frozen');
    expect(c('2026-10-06').state).toBe('unscheduled'); // Tuesday
    expect(c('2026-10-05').state).toBe('value'); // Monday, scheduled but missed
  });
  it('a bonus completion on an unscheduled day still shows', () => {
    const mwf = habit({ schedule: { kind: 'weekdays', days: [1, 3, 5] }, createdAt: d('2026-09-01') });
    const g = buildHeatmap(mwf, done('2026-10-06'), TODAY, 1);
    expect(g.flat().find((x) => x.day === '2026-10-06')).toMatchObject({ state: 'value', level: 4 });
  });
  it('supports a Sunday week start', () => {
    const g = buildHeatmap(h, {}, TODAY, 0);
    expect(g[g.length - 1][0].day).toBe('2026-10-04');
  });
});
