import { goals, rankTemplates } from '../onboarding';
import { templates } from '../templates';

describe('rankTemplates', () => {
  it('returns six, best matches first', () => {
    const out = rankTemplates(['sleep']);
    expect(out).toHaveLength(6);
    const ids = out.map((t) => t.id);
    expect(ids).toContain('in-bed-early');
    expect(ids).toContain('no-screens-late');
    expect(ids).toContain('read');
    expect(out[0].goals).toContain('sleep');
  });
  it('ranks templates matching more of the chosen goals higher', () => {
    const out = rankTemplates(['sleep', 'mind']);
    expect(out[0].id).toBe('no-screens-late'); // sleep + mind
  });
  it('keeps quit templates out unless that goal is chosen', () => {
    expect(rankTemplates(['healthier']).some((t) => t.category === 'quit')).toBe(false);
    expect(rankTemplates(['quit']).filter((t) => t.category === 'quit').length).toBeGreaterThan(0);
  });
  it('falls back to friendly starters with no goals', () => {
    const ids = rankTemplates([]).map((t) => t.id);
    expect(ids).toEqual(['drink-water', 'make-bed', 'walk-daily', 'meditate', 'journal', 'read']);
  });
  it('tops up a short match list and never repeats a template', () => {
    const out = rankTemplates(['quit'], 8);
    expect(new Set(out.map((t) => t.id)).size).toBe(out.length);
    expect(out).toHaveLength(8);
  });
  it('gives every goal at least six matches', () => {
    for (const goal of goals) {
      expect(templates.filter((t) => t.goals.includes(goal.id)).length).toBeGreaterThanOrEqual(6);
    }
  });
  it('respects the limit', () => {
    expect(rankTemplates(['fit'], 3)).toHaveLength(3);
  });
});
