import { fixtureBank } from '@/testing/fixtureBank';
import { buildBlitz, buildCategory, buildClassic, buildDaily, buildWarmup, blitzDifficulty } from '../modes';
import {
  answer,
  canContinueWithHeart,
  canOfferRewarded,
  continueWithHeart,
  grantRewardedLifeline,
  lifelineLeft,
  next,
  startRound,
  summarize,
  tick,
  timeout,
  useLifeline,
  type RoundState,
} from '../round';

const bank = fixtureBank(100);
const base = { bank, seed: 7, relaxed: false };
const classic = (level = 1, relaxed = false) => startRound(buildClassic({ ...base, relaxed, category: 'science', level, seen: {}, today: 100 })!);
const right = (s: RoundState) => answer(s, s.current.correctIndex);
const wrong = (s: RoundState) => answer(s, (s.current.correctIndex + 1) % 4);
const playAll = (s: RoundState, pick: (s: RoundState) => RoundState) => {
  while (s.phase !== 'done') s = next(s.phase === 'question' ? pick(s) : s);
  return s;
};

describe('answering', () => {
  it('scores a correct answer with the time bonus and shows the explanation phase', () => {
    let s = classic();
    expect(s.msLeft).toBe(25_000);
    s = tick(s, 5_000);
    s = right(s);
    expect(s).toMatchObject({ phase: 'answered', correct: true, lastPoints: 100 + 100, run: 1 });
  });
  it('counts a wrong answer and a timeout as wrong, and resets the streak', () => {
    let s = right(classic());
    s = next(s);
    s = wrong(s);
    expect(s).toMatchObject({ correct: false, run: 0, lastPoints: 0, timedOut: false });
    s = next(s);
    s = tick(s, 60_000);
    expect(s).toMatchObject({ phase: 'answered', correct: false, timedOut: true, chosen: null });
    expect(s.answers).toHaveLength(3);
  });
  it('ignores a second tap, an answer after the round, and a removed option', () => {
    let s = classic();
    s = useLifeline(s, 'fifty');
    const gone = s.removed[0];
    expect(answer(s, gone)).toBe(s);
    s = right(s);
    expect(answer(s, 0)).toBe(s);
    expect(timeout(s)).toBe(s);
  });
  it('gives the streak multiplier from the 4th correct in a row', () => {
    let s = classic(1, true); // relaxed: no time bonus, so points are exact
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      s = right(s);
      pts.push(s.lastPoints);
      s = next(s);
    }
    expect(pts).toEqual([100, 100, 100, 110, 110, 125]);
  });
  it('plays a full round to the end and reports stars', () => {
    const s = playAll(classic(), right);
    const sum = summarize(s);
    expect(sum).toMatchObject({ total: 10, answered: 10, correct: 10, stars: 3, failedByHearts: false, accuracy: 1 });
    expect(sum.correctByDifficulty).toEqual({ 1: 10, 2: 0, 3: 0 });
    expect(summarize(playAll(classic(), wrong))).toMatchObject({ correct: 0, stars: 0 });
  });
  it('does not run the clock in relaxed mode', () => {
    const s = classic(1, true);
    expect(s.msLeft).toBeNull();
    expect(tick(s, 99_999)).toBe(s);
  });
  it('pauses the clock while the explanation is shown', () => {
    const s = right(classic());
    expect(tick(s, 5_000)).toBe(s);
  });
});

describe('lifelines', () => {
  it('50/50 removes two wrong options once per question', () => {
    let s = useLifeline(classic(), 'fifty');
    expect(s.removed).toHaveLength(2);
    expect(s.removed).not.toContain(s.current.correctIndex);
    expect(lifelineLeft(s, 'fifty')).toBe(false);
    expect(useLifeline(s, 'fifty')).toBe(s);
    expect(s.lifelines.fifty).toBe(0);
    s = next(right(s));
    expect(s.removed).toEqual([]);
  });
  it('Skip swaps in a spare of the same difficulty and does not count as answered', () => {
    const s = classic();
    const before = s.current.question;
    const after = useLifeline(s, 'skip');
    expect(after.current.question.id).not.toBe(before.id);
    expect(after.current.question.d).toBe(before.d);
    expect(after.answers).toHaveLength(0);
    expect(after.lifelines.skip).toBe(0);
    expect(after.reserve).toHaveLength(2);
    expect(after.msLeft).toBe(25_000);
    const ids = playAll(after, right).answers.map((a) => a.id);
    expect(ids).not.toContain(before.id);
    expect(ids).toHaveLength(10);
  });
  it('Extra time adds 15 s; it needs a running clock', () => {
    const s = useLifeline(tick(classic(), 10_000), 'time');
    expect(s.msLeft).toBe(30_000);
    expect(lifelineLeft(classic(1, true), 'time')).toBe(false);
    expect(useLifeline(classic(1, true), 'time').lifelines.time).toBe(1);
  });
  it('allows only Skip once in the Daily and nothing in the warm-up', () => {
    const daily = startRound(buildDaily({ ...base, date: '2026-10-08' }));
    expect(['fifty', 'skip', 'time'].map((k) => lifelineLeft(daily, k as 'fifty'))).toEqual([false, true, false]);
    const skipped = useLifeline(daily, 'skip');
    expect(skipped.current.question.d).toBe(daily.current.question.d);
    const warm = startRound(buildWarmup({ ...base, favorites: ['general'] }));
    expect(['fifty', 'skip', 'time'].map((k) => lifelineLeft(warm, k as 'fifty'))).toEqual([false, false, false]);
  });
  it('grants at most 2 rewarded lifelines a round, only after the free one is used, never in Daily or warm-up', () => {
    let s = classic();
    expect(canOfferRewarded(s, 'fifty')).toBe(false); // still has the free one
    s = useLifeline(s, 'fifty');
    expect(canOfferRewarded(s, 'fifty')).toBe(true);
    s = grantRewardedLifeline(s, 'fifty');
    expect(s.lifelines.fifty).toBe(1);
    s = next(right(useLifeline(s, 'fifty')));
    s = useLifeline(s, 'skip');
    s = grantRewardedLifeline(s, 'skip');
    expect(s.rewardedUsed).toBe(2);
    s = useLifeline(s, 'skip');
    expect(canOfferRewarded(s, 'skip')).toBe(false);
    expect(grantRewardedLifeline(s, 'skip')).toBe(s);
    const daily = useLifeline(startRound(buildDaily({ ...base, date: '2026-10-08' })), 'skip');
    expect(canOfferRewarded(daily, 'skip')).toBe(false);
  });
});

describe('hearts on hard levels', () => {
  it('starts with 3 hearts only from level 21, and a lost level ends after the third miss', () => {
    expect(classic(20).hearts).toBe(0);
    let s = classic(21);
    expect(s.hearts).toBe(3);
    s = next(wrong(s));
    s = next(wrong(s));
    s = wrong(s);
    expect(s).toMatchObject({ hearts: 0, outOfHearts: true });
    expect(next(s).phase).toBe('done');
    expect(summarize(next(s))).toMatchObject({ failedByHearts: true, stars: 0 });
  });
  it('offers one continue with 1 heart per level attempt', () => {
    let s = classic(21);
    for (let i = 0; i < 2; i++) s = next(wrong(s));
    s = wrong(s);
    expect(canContinueWithHeart(s)).toBe(true);
    s = continueWithHeart(s);
    expect(s).toMatchObject({ hearts: 1, outOfHearts: false, heartContinueUsed: true });
    s = next(s);
    expect(s.phase).toBe('question');
    s = wrong(s);
    expect(s.outOfHearts).toBe(true);
    expect(canContinueWithHeart(s)).toBe(false);
    expect(continueWithHeart(s)).toBe(s);
  });
  it('a hearts level can still be won with misses left', () => {
    let s = classic(21);
    s = next(wrong(s));
    s = playAll(s, right);
    expect(summarize(s)).toMatchObject({ correct: 9, stars: 3, failedByHearts: false });
  });
});

describe('Timed Blitz', () => {
  const blitz = () => startRound(buildBlitz({ ...base, seen: {}, today: 100 }));
  it('runs a 60 s clock that gains 1 s on a correct answer and loses 3 s on a wrong one', () => {
    let s = blitz();
    expect(s.msLeft).toBe(60_000);
    s = tick(s, 10_000);
    s = right(s);
    expect(s.msLeft).toBe(51_000);
    s = next(s);
    s = wrong(s);
    expect(s.msLeft).toBe(48_000);
  });
  it('gives no per-question time bonus and pauses while the explanation shows', () => {
    const s = right(blitz());
    expect(s.lastPoints).toBe(100);
    expect(tick(next(s), 1000).msLeft).toBe(60_000 + 1000 - 1000);
    expect(tick(s, 1000).msLeft).toBe(61_000);
  });
  it('ends when the clock hits zero, mid-question or after a wrong answer', () => {
    expect(tick(blitz(), 60_000).phase).toBe('done');
    let s = tick(blitz(), 58_000);
    s = wrong(s);
    expect(s.msLeft).toBe(0);
    expect(next(s).phase).toBe('done');
  });
  it('has +10 s of extra time once per run, never from a rewarded ad', () => {
    let s = useLifeline(tick(blitz(), 5_000), 'time');
    expect(s.msLeft).toBe(65_000);
    expect(canOfferRewarded(s, 'time')).toBe(false);
    expect(useLifeline(s, 'time')).toBe(s);
  });
  it('skips to the next queued question', () => {
    const s = blitz();
    const second = s.queue[0].id;
    expect(useLifeline(s, 'skip').current.question.id).toBe(second);
  });
  it('ramps the difficulty and never repeats a question in the queue', () => {
    expect([0, 7, 8, 21, 22, 60].map(blitzDifficulty)).toEqual([1, 1, 2, 2, 3, 3]);
    const s = blitz();
    const ids = [s.current.question.id, ...s.queue.map((q) => q.id)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(90);
  });
  it('reports the number correct', () => {
    let s = blitz();
    for (let i = 0; i < 5; i++) s = next(right(s));
    s = tick(s, 999_999);
    expect(summarize(s)).toMatchObject({ correct: 5, answered: 5, total: 5 });
  });
});

describe('round setup', () => {
  it('shuffles the options the same way for the same seed and differently for another', () => {
    const a = classic().current.options;
    expect(classic().current.options).toEqual(a);
    expect(startRound(buildClassic({ ...base, seed: 8, category: 'science', level: 1, seen: {}, today: 100 })!).current.options).not.toEqual(a);
  });
  it('keeps the right answer reachable: correctIndex is always 0 to 3 over a whole level', () => {
    let s = classic();
    while (s.phase !== 'done') {
      expect(s.current.correctIndex).toBeGreaterThanOrEqual(0);
      expect(s.current.correctIndex).toBeLessThanOrEqual(3);
      expect(s.current.options[s.current.correctIndex]).toBe(s.current.question.a[0]);
      s = next(right(s));
    }
  });
  it('builds a category round of 10 unseen questions and a warm-up of 3 easy ones from the favourites', () => {
    const cat = buildCategory({ ...base, category: 'sports', difficulty: 3, seen: {}, today: 100 });
    expect(cat.questions).toHaveLength(10);
    expect(cat.questions.every((q) => q.d === 3 && q.id.startsWith('spo'))).toBe(true);
    const warm = buildWarmup({ ...base, favorites: ['music', 'food'] });
    expect(warm.questions).toHaveLength(3);
    expect(warm.questions.every((q) => q.d === 1 && /^(mus|foo)/.test(q.id))).toBe(true);
    expect(warm.relaxed).toBe(true);
    expect(startRound(warm).msLeft).toBeNull();
  });
  it('refuses an empty round', () => {
    expect(() => startRound({ ...buildWarmup({ ...base, favorites: ['music'] }), questions: [] })).toThrow();
    expect(buildClassic({ ...base, category: 'music', level: 99, seen: {}, today: 1 })).toBeNull();
  });
});
