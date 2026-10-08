jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({}) }));
jest.mock('@shared/ads', () => ({ adShownThisSession: () => false }));
jest.mock('@shared/review', () => ({ maybeAskForReview: jest.fn() }));
jest.mock('@/store/profile', () => ({ useProfile: { getState: () => ({ update: jest.fn() }) } }));

import { REVIEW_DELAY_MS, REVIEW_MILESTONES, scheduleReviewAfterMilestone, type ReviewDeps } from '../askForReview';

const deps = (over: Partial<ReviewDeps> = {}): ReviewDeps & { ask: jest.Mock; onAsked: jest.Mock } => ({
  adShown: () => false,
  ask: jest.fn(async () => true),
  onAsked: jest.fn(),
  ...over,
}) as never;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('scheduleReviewAfterMilestone', () => {
  it('asks at the 3 and 14 day milestones, after the confetti has finished', async () => {
    expect(REVIEW_MILESTONES).toEqual([3, 14]);
    for (const milestone of [3, 14]) {
      const d = deps();
      scheduleReviewAfterMilestone(milestone, d);
      await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS - 1);
      expect(d.ask).not.toHaveBeenCalled();
      await jest.advanceTimersByTimeAsync(2);
      expect(d.ask).toHaveBeenCalledWith(`streak-${milestone}`, { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 30 });
      expect(d.onAsked).toHaveBeenCalledTimes(1);
    }
  });
  it.each([7, 30, 100, 2])('does nothing at the %s milestone', async (milestone) => {
    const d = deps();
    scheduleReviewAfterMilestone(milestone, d);
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it('holds back when an ad was shown this session', async () => {
    const d = deps({ adShown: () => true });
    scheduleReviewAfterMilestone(3, d);
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
  it('does not record a prompt when the store declined to show it', async () => {
    const d = deps({ ask: jest.fn(async () => false) as never });
    scheduleReviewAfterMilestone(3, d);
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS * 2);
    expect(d.onAsked).not.toHaveBeenCalled();
  });
  it('can be cancelled', async () => {
    const d = deps();
    const cancel = scheduleReviewAfterMilestone(3, d);
    cancel();
    await jest.advanceTimersByTimeAsync(REVIEW_DELAY_MS * 2);
    expect(d.ask).not.toHaveBeenCalled();
  });
});
