import { DAY, HOUR } from '../defaults';
import { reviewEligible, REVIEW_GAP_DAYS, type ReviewContext } from '../reviewRules';
import type { Meta } from '../types';

const NOW = 100 * DAY;
const meta = (m: Partial<Meta> = {}): Meta => ({ ratingPromptCount: 0, positiveMoments: 2, installAt: NOW - 10 * DAY, launches: 9, ...m });
const ctx = (over: Partial<Omit<ReviewContext, 'meta'>> & { meta?: Partial<Meta> } = {}): ReviewContext => ({ now: NOW, sessionOpen: false, kickOpen: false, hitSoftLimit: false, ...over, meta: meta(over.meta) });

describe('when the app may ask for a rating (ASO.md §7)', () => {
  it('asks after two good moments in an app that is at least 3 days old', () => {
    expect(reviewEligible(ctx())).toBe(true);
  });
  it('waits for the second good moment', () => {
    expect(reviewEligible(ctx({ meta: { positiveMoments: 1 } }))).toBe(false);
  });
  it('waits until the app is 3 days old', () => {
    expect(reviewEligible(ctx({ meta: { installAt: NOW - 3 * DAY + 1 } }))).toBe(false);
    expect(reviewEligible(ctx({ meta: { installAt: NOW - 3 * DAY } }))).toBe(true);
  });
  it('asks at most twice ever and 90 days apart', () => {
    expect(reviewEligible(ctx({ meta: { ratingPromptCount: 2 } }))).toBe(false);
    expect(reviewEligible(ctx({ meta: { ratingPromptCount: 1, ratingPromptedAt: NOW - (REVIEW_GAP_DAYS * DAY - 1) } }))).toBe(false);
    expect(reviewEligible(ctx({ meta: { ratingPromptCount: 1, ratingPromptedAt: NOW - REVIEW_GAP_DAYS * DAY } }))).toBe(true);
  });
  it('never while a contraction session or a kick count is open', () => {
    expect(reviewEligible(ctx({ sessionOpen: true }))).toBe(false);
    expect(reviewEligible(ctx({ kickOpen: true }))).toBe(false);
  });
  it('never within 24 hours of a contraction session', () => {
    expect(reviewEligible(ctx({ meta: { lastSessionEndedAt: NOW - 24 * HOUR + 1 } }))).toBe(false);
    expect(reviewEligible(ctx({ meta: { lastSessionEndedAt: NOW - 24 * HOUR } }))).toBe(true);
  });
  it('never after a count that ran into the 2-hour message', () => {
    expect(reviewEligible(ctx({ hitSoftLimit: true }))).toBe(false);
  });
});
