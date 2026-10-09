import { isPositiveMoment, reviewEligible, type ReviewContext } from '../reviewRules';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const base: ReviewContext = { review: { promptCount: 0 }, now: NOW, firstOpenAt: NOW - 10 * DAY, roundsPlayed: 8, mode: 'category', correct: 9, total: 10, stars: 3, failedByHearts: false, lastFullScreenAt: 0 };
const ctx = (o: Partial<ReviewContext> = {}): ReviewContext => ({ ...base, ...o });

describe('review prompt rules (plan §13)', () => {
  it('asks after 8 of 10, a 3-star level or a 3, 7 or 30 day streak', () => {
    expect(reviewEligible(ctx({ correct: 8 }))).toBe(true);
    expect(reviewEligible(ctx({ correct: 7 }))).toBe(false);
    expect(reviewEligible(ctx({ mode: 'classic', correct: 9, stars: 3 }))).toBe(true);
    expect(reviewEligible(ctx({ mode: 'classic', correct: 7, stars: 2 }))).toBe(false);
    expect(reviewEligible(ctx({ mode: 'daily', correct: 5, streak: 7, streakCounted: true }))).toBe(true);
    expect(reviewEligible(ctx({ mode: 'daily', correct: 5, streak: 8, streakCounted: true }))).toBe(false);
    expect(reviewEligible(ctx({ mode: 'daily', correct: 5, streak: 3, streakCounted: false }))).toBe(false);
  });
  it('never asks after a failed level, a lost hearts level, the warm-up or Blitz', () => {
    expect(isPositiveMoment(ctx({ mode: 'classic', stars: 0, correct: 4 }))).toBe(false);
    expect(isPositiveMoment(ctx({ mode: 'classic', stars: 0, failedByHearts: true, correct: 9 }))).toBe(false);
    expect(isPositiveMoment(ctx({ mode: 'warmup', correct: 3, total: 3 }))).toBe(false);
    expect(isPositiveMoment(ctx({ mode: 'blitz', correct: 20, total: 20 }))).toBe(false);
  });
  it('needs 3 days since install and 5 rounds', () => {
    expect(reviewEligible(ctx({ firstOpenAt: NOW - 2 * DAY }))).toBe(false);
    expect(reviewEligible(ctx({ firstOpenAt: NOW - 3 * DAY }))).toBe(true);
    expect(reviewEligible(ctx({ roundsPlayed: 4 }))).toBe(false);
    expect(reviewEligible(ctx({ roundsPlayed: 5 }))).toBe(true);
  });
  it('waits 60 days between asks', () => {
    expect(reviewEligible(ctx({ review: { promptCount: 1, lastPromptAt: NOW - 59 * DAY } }))).toBe(false);
    expect(reviewEligible(ctx({ review: { promptCount: 1, lastPromptAt: NOW - 60 * DAY } }))).toBe(true);
  });
  it('does not ask within 60 s of an ad', () => {
    expect(reviewEligible(ctx({ lastFullScreenAt: NOW - 59_000 }))).toBe(false);
    expect(reviewEligible(ctx({ lastFullScreenAt: NOW - 61_000 }))).toBe(true);
  });
});
