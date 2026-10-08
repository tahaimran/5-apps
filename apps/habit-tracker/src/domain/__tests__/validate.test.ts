import { COUNT_MAX, isValid, normalizeDraft, validateDraft, type HabitDraft } from '../validate';
import { d } from '../testHelpers';

const draft = (over: Partial<HabitDraft> = {}): HabitDraft => ({
  name: 'Read',
  icon: 'book-open-variant',
  color: '#7C5CFF',
  type: 'boolean',
  target: 1,
  schedule: { kind: 'daily' },
  category: 'learning',
  createdAt: d('2026-10-08'),
  reminderTime: null,
  ...over,
});

describe('validateDraft', () => {
  it('accepts a simple habit', () => {
    expect(isValid(draft())).toBe(true);
  });
  it('requires a name', () => {
    expect(validateDraft(draft({ name: '   ' })).name).toBe('required');
  });
  it('limits the name to 40 characters', () => {
    expect(validateDraft(draft({ name: 'x'.repeat(41) })).name).toBe('tooLong');
    expect(isValid(draft({ name: 'x'.repeat(40) }))).toBe(true);
  });
  it('count needs a whole target between 1 and 999', () => {
    expect(validateDraft(draft({ type: 'count', target: 0 })).target).toBe('range');
    expect(validateDraft(draft({ type: 'count', target: 2.5 })).target).toBe('range');
    expect(validateDraft(draft({ type: 'count', target: COUNT_MAX + 1 })).target).toBe('range');
    expect(isValid(draft({ type: 'count', target: 8 }))).toBe(true);
  });
  it('timer needs 1 to 600 minutes', () => {
    expect(validateDraft(draft({ type: 'timer', target: 601 })).target).toBe('range');
    expect(isValid(draft({ type: 'timer', target: 20 }))).toBe(true);
  });
  it('weekday schedules need at least one day', () => {
    expect(validateDraft(draft({ schedule: { kind: 'weekdays', days: [] } })).days).toBe('required');
    expect(isValid(draft({ schedule: { kind: 'weekdays', days: [1] } }))).toBe(true);
  });
  it('yes/no ignores the target', () => {
    expect(isValid(draft({ type: 'boolean', target: 99 }))).toBe(true);
  });
});

describe('normalizeDraft', () => {
  it('trims the name and fixes yes/no and timer fields', () => {
    expect(normalizeDraft(draft({ name: ' Read ', target: 5, unit: 'x' }))).toMatchObject({ name: 'Read', target: 1, unit: undefined });
    expect(normalizeDraft(draft({ type: 'timer', target: 15 })).unit).toBe('min');
  });
  it('keeps a trimmed count unit', () => {
    expect(normalizeDraft(draft({ type: 'count', target: 8, unit: ' glasses ' })).unit).toBe('glasses');
    expect(normalizeDraft(draft({ type: 'count', target: 8, unit: '  ' })).unit).toBeUndefined();
  });
});
