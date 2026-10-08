import { resetDisk } from '../../testing/native';

const mockRequestReview = jest.fn(async () => undefined);
const mockAvailable = { current: true };
jest.mock('expo-store-review', () => ({
  isAvailableAsync: async () => mockAvailable.current,
  requestReview: () => mockRequestReview(),
}));

const DAY = 86_400_000;

function load() {
  let m!: { review: typeof import('../index'); storage: typeof import('../../storage') };
  jest.isolateModules(() => {
    m = { review: require('../index'), storage: require('../../storage') };
  });
  return m;
}

beforeEach(() => {
  resetDisk();
  mockRequestReview.mockClear();
  mockAvailable.current = true;
  jest.useFakeTimers({ now: 100 * DAY, doNotFake: ['nextTick', 'setImmediate'] });
});
afterEach(() => jest.useRealTimers());

/** An app installed `days` days ago. */
function installedAgo(m: ReturnType<typeof load>, days: number) {
  m.storage.sharedStore.set('install.firstOpenAt', Date.now() - days * DAY);
}

describe('maybeAskForReview (defaults: 3 positive events, 2 days old, once per 60 days)', () => {
  it('does not ask before the third positive event', async () => {
    const m = load();
    installedAgo(m, 10);
    expect(await m.review.maybeAskForReview('a')).toBe(false);
    expect(await m.review.maybeAskForReview('b')).toBe(false);
    expect(mockRequestReview).not.toHaveBeenCalled();
  });
  it('asks on the third event once the app is old enough', async () => {
    const m = load();
    installedAgo(m, 10);
    await m.review.maybeAskForReview('a');
    await m.review.maybeAskForReview('b');
    expect(await m.review.maybeAskForReview('c')).toBe(true);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
  });
  it('keeps counting events while the app is too new, then asks at the first chance', async () => {
    const m = load();
    installedAgo(m, 1);
    for (let i = 0; i < 5; i++) expect(await m.review.maybeAskForReview('x')).toBe(false);
    expect(m.storage.sharedStore.get('review.positiveEvents')).toBe(5);
    jest.setSystemTime(Date.now() + 2 * DAY);
    expect(await m.review.maybeAskForReview('x')).toBe(true);
  });
  it('is not allowed again within 60 days, then allowed after', async () => {
    const m = load();
    installedAgo(m, 100);
    for (const t of ['a', 'b', 'c']) await m.review.maybeAskForReview(t);
    expect(mockRequestReview).toHaveBeenCalledTimes(1);
    for (const t of ['a', 'b', 'c']) expect(await m.review.maybeAskForReview(t)).toBe(false);
    jest.setSystemTime(Date.now() + 59 * DAY);
    for (const t of ['a', 'b', 'c']) expect(await m.review.maybeAskForReview(t)).toBe(false);
    jest.setSystemTime(Date.now() + 2 * DAY);
    expect(await m.review.maybeAskForReview('d')).toBe(true);
    expect(mockRequestReview).toHaveBeenCalledTimes(2);
  });
  it('restarts the count after asking', async () => {
    const m = load();
    installedAgo(m, 100);
    for (const t of ['a', 'b', 'c']) await m.review.maybeAskForReview(t);
    expect(m.storage.sharedStore.get('review.positiveEvents')).toBe(0);
  });
  it('does not mark it asked when the store cannot show the prompt', async () => {
    const m = load();
    installedAgo(m, 100);
    mockAvailable.current = false;
    for (const t of ['a', 'b', 'c']) expect(await m.review.maybeAskForReview(t)).toBe(false);
    expect(m.storage.sharedStore.get('review.lastAskedAt')).toBeUndefined();
    mockAvailable.current = true;
    expect(await m.review.maybeAskForReview('d')).toBe(true);
  });
  it('records when it asked', async () => {
    const m = load();
    installedAgo(m, 100);
    for (const t of ['a', 'b', 'c']) await m.review.maybeAskForReview(t);
    expect(m.storage.sharedStore.get('review.lastAskedAt')).toBe(Date.now());
  });
});

describe('custom rules', () => {
  const rules = { minPositiveEvents: 1, minDaysSinceInstall: 0, minDaysBetweenAsks: 30 };
  it('can ask on the very first event on day zero', async () => {
    const m = load();
    installedAgo(m, 0);
    expect(await m.review.maybeAskForReview('streak-3', rules)).toBe(true);
  });
  it('uses the shorter gap between asks', async () => {
    const m = load();
    installedAgo(m, 0);
    await m.review.maybeAskForReview('streak-3', rules);
    jest.setSystemTime(Date.now() + 29 * DAY);
    expect(await m.review.maybeAskForReview('streak-14', rules)).toBe(false);
    jest.setSystemTime(Date.now() + 2 * DAY);
    expect(await m.review.maybeAskForReview('streak-14', rules)).toBe(true);
  });
  it('falls back to the defaults for rules that are left out', async () => {
    const m = load();
    installedAgo(m, 10);
    expect(await m.review.maybeAskForReview('x', { minDaysBetweenAsks: 1 })).toBe(false); // still needs 3 events
  });
});
