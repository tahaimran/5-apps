import '@/testing/mocks';
import { MAX_PROMPTS, MIN_GOAL_DAYS, REVIEW_DELAY_MS, scheduleReviewAfterGoal, type ReviewDeps } from '../askForReview';

const deps = (over: Partial<ReviewDeps> = {}): ReviewDeps => ({
  adShown: () => false,
  ask: jest.fn(async () => true),
  prompted: () => 0,
  onAsked: jest.fn(),
  ...over,
});

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('review prompt after the goal is reached (plan §13)', () => {
  it('asks once the celebration is over, with the plan rules, and records it', async () => {
    const d = deps();
    scheduleReviewAfterGoal({ goalDays: MIN_GOAL_DAYS, fromNotification: false }, d);
    expect(d.ask).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS);
    expect(d.ask).toHaveBeenCalledWith('goal_reached', { minPositiveEvents: 1, minDaysSinceInstall: 3, minDaysBetweenAsks: 60 });
    expect(d.onAsked).toHaveBeenCalledTimes(1);
  });
  it('waits for 3 goal days in total', () => {
    const d = deps();
    scheduleReviewAfterGoal({ goalDays: MIN_GOAL_DAYS - 1, fromNotification: false }, d);
    jest.advanceTimersByTime(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it('does not ask after a log made from a notification', () => {
    const d = deps();
    scheduleReviewAfterGoal({ goalDays: 9, fromNotification: true }, d);
    jest.advanceTimersByTime(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it(`stops after ${MAX_PROMPTS} prompts`, () => {
    const d = deps({ prompted: () => MAX_PROMPTS });
    scheduleReviewAfterGoal({ goalDays: 9, fromNotification: false }, d);
    jest.advanceTimersByTime(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it('stays quiet if an ad was shown this session', async () => {
    const d = deps({ adShown: () => true });
    scheduleReviewAfterGoal({ goalDays: 9, fromNotification: false }, d);
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it('does not record a prompt the shared rules declined', async () => {
    const d = deps({ ask: jest.fn(async () => false) });
    scheduleReviewAfterGoal({ goalDays: 9, fromNotification: false }, d);
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS);
    expect(d.onAsked).not.toHaveBeenCalled();
  });
  it('can be cancelled (leaving the screen)', () => {
    const d = deps();
    scheduleReviewAfterGoal({ goalDays: 9, fromNotification: false }, d)();
    jest.advanceTimersByTime(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
});
