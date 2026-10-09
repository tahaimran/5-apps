import { levelCount } from '@/domain/classic';
import { recordLevel } from '@/domain/classic';
import { recordDaily } from '@/domain/daily';
import { defaultClassic } from '@/domain/defaults';
import { currentDateKey } from '@/store/today';
import { epochDay } from '@/domain/dateKey';
import { type RoundState, summarize, isBlitz } from '@/domain/round';
import { compactSeen, markSeen } from '@/domain/selector';
import { levelFromXp, xpFor, XP_WARMUP } from '@/domain/scoring';
import { completeDailyStreak } from '@/domain/streak';
import type { CategoryId, DateKey, Difficulty, RoundMode, Stars } from '@/domain/types';
import { getBank } from '@/content/bank';
import { useAds } from '@/store/ads';
import { useResult } from '@/store/result';
import { db } from '@/store/storage';
import { useClassic, useDaily, useProfile, useSeen, useStats, useStreak } from '@/store/stores';

/** What the results screens show for a finished round. */
export interface RoundResult {
  id: string;
  mode: RoundMode;
  category?: CategoryId;
  difficulty?: Difficulty;
  level?: number;
  date?: DateKey;
  correct: number;
  total: number;
  score: number;
  stars: Stars;
  failedByHearts: boolean;
  accuracy: number;
  elapsedMs: number;
  relaxed: boolean;
  /** XP earned (already doubled when `doubled`). */
  xp: number;
  /** XP before any doubling. */
  baseXp: number;
  doubled: boolean;
  levelBefore: number;
  levelAfter: number;
  /** A new best: higher classic score for the level, or a new Blitz personal best. */
  newBest: boolean;
  /** The next classic level exists and is unlocked. */
  nextLevel: number | null;
  /** Daily only. */
  streak?: number;
  streakCounted?: boolean;
  freezeUsed?: boolean;
  freezeEarned?: boolean;
  blockedByTimeZone?: boolean;
  /** The Daily was for a date that is no longer today (the day rolled over mid-round). */
  staleDaily?: boolean;
  /** Blitz: personal best before this run, to say "new best". */
  previousBest?: number;
}

/**
 * Turns a finished round into stored progress, once: seen map, stats, classic stars and unlocks, XP and
 * player level, the Daily result and streak. `now` and the date are read here, at the moment of commit,
 * never captured earlier (plan: time-based decisions must not trust an old "today").
 */
export function commitRound(id: string, s: RoundState, elapsedMs: number, now: number = Date.now(), offsetMin: number = new Date(now).getTimezoneOffset()): RoundResult {
  const config = s.config;
  const sum = summarize(s);
  const today: DateKey = currentDateKey();
  const warmup = config.mode === 'warmup';
  const daily = config.mode === 'daily';
  const blitz = isBlitz(config);

  // Seen map: classic, category and Blitz mark what was shown; the Daily and warm-up leave it alone (plan §8).
  if (!warmup && !daily) {
    let seen = useSeen.getState().value;
    for (const a of s.answers) seen = markSeen(seen, a.id, epochDay(today), a.correct);
    useSeen.getState().set(compactSeen(seen, epochDay(today)));
  }

  // Classic stars and unlocks.
  let newBest = false;
  let nextLevel: number | null = null;
  if (config.mode === 'classic' && config.category && config.level) {
    const total = levelCount(getBank(), config.category);
    const all = useClassic.getState().value;
    const before = all[config.category] ?? defaultClassic();
    newBest = sum.score > (before.bestScores[config.level] ?? 0);
    const after = recordLevel(before, config.level, sum.stars, sum.score, total);
    useClassic.getState().set({ ...all, [config.category]: after });
    db.set('classic.last', { category: config.category, level: config.level });
    if (sum.stars >= 1 && config.level < total && after.unlocked > config.level) nextLevel = config.level + 1;
  }

  // Stats.
  const stats = useStats.getState().value;
  let previousBest: number | undefined;
  if (!warmup) {
    const byCategory = { ...stats.byCategory };
    for (const a of s.answers) {
      const old = byCategory[a.category] ?? { a: 0, c: 0 };
      byCategory[a.category] = { a: old.a + 1, c: old.c + (a.correct ? 1 : 0) };
    }
    const next = { ...stats, answered: stats.answered + sum.answered, correct: stats.correct + sum.correct, byCategory, roundsPlayed: stats.roundsPlayed + 1 };
    if (sum.total >= 5 && sum.correct / sum.total >= 0.8 && !blitz) next.perfectRounds = stats.perfectRounds + 1;
    if (blitz) {
      previousBest = stats.blitzBest;
      newBest = sum.correct > stats.blitzBest && sum.correct > 0;
      next.blitzBest = Math.max(stats.blitzBest, sum.correct);
      const day = Math.max(stats.blitzBestByDate[today] ?? 0, sum.correct);
      const recent = Object.entries({ ...stats.blitzBestByDate, [today]: day })
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30);
      next.blitzBestByDate = Object.fromEntries(recent);
    }
    useStats.getState().set(next);
  }

  // Daily result and streak.
  let streakInfo: Pick<RoundResult, 'streak' | 'streakCounted' | 'freezeUsed' | 'freezeEarned' | 'blockedByTimeZone' | 'staleDaily'> = {};
  if (daily && config.date) {
    useDaily.getState().set(recordDaily(useDaily.getState().value, config.date, sum.correct));
    if (config.date === today) {
      const out = completeDailyStreak(useStreak.getState().value, today, now, offsetMin);
      useStreak.getState().set(out.state);
      streakInfo = { streak: out.state.current, streakCounted: out.counted, freezeUsed: out.freezeUsed, freezeEarned: out.freezeEarned, blockedByTimeZone: out.blockedByTimeZone };
    } else {
      streakInfo = { staleDaily: true, streakCounted: false };
    }
  }

  if (!warmup) useAds.getState().recordRound();
  if (warmup) {
    db.set('onboarding.warmupDone', true);
    db.set('onboarding.warmupScore', sum.correct);
  }

  // XP and the player level.
  const baseXp = warmup
    ? XP_WARMUP
    : xpFor({
        correctByDifficulty: sum.correctByDifficulty,
        levelCompleted: config.mode === 'classic' && sum.stars >= 1,
        dailyCompleted: daily,
        relaxed: config.relaxed,
        doubled: false,
      });
  const profile = useProfile.getState().value;
  const levelBefore = levelFromXp(profile.xp);
  const levelAfter = levelFromXp(profile.xp + baseXp);
  useProfile.getState().update({ xp: profile.xp + baseXp, level: levelAfter });

  const result: RoundResult = {
    id,
    mode: config.mode,
    category: config.category,
    difficulty: config.difficulty,
    level: config.level,
    date: config.date,
    correct: sum.correct,
    total: sum.total,
    score: sum.score,
    stars: sum.stars,
    failedByHearts: sum.failedByHearts,
    accuracy: sum.accuracy,
    elapsedMs,
    relaxed: config.relaxed,
    xp: baseXp,
    baseXp,
    doubled: false,
    levelBefore,
    levelAfter,
    newBest,
    nextLevel,
    previousBest,
    ...streakInfo,
  };
  useResult.getState().set(result);
  return result;
}

/**
 * Double XP (plan §8, §12): an earned video doubles the round's XP once, at most 3 a day. The extra XP is
 * the round's base XP again; the result and the player level are updated.
 */
export function applyDoubleXp(): RoundResult | null {
  const r = useResult.getState().last;
  if (!r || r.doubled) return r;
  const today = currentDateKey();
  const stats = useStats.getState().value;
  const used = stats.doubleXpToday.date === today ? stats.doubleXpToday.count : 0;
  useStats.getState().update({ doubleXpToday: { date: today, count: used + 1 } });
  const profile = useProfile.getState().value;
  const xp = profile.xp + r.baseXp;
  const levelAfter = levelFromXp(xp);
  useProfile.getState().update({ xp, level: levelAfter });
  const next: RoundResult = { ...r, xp: r.baseXp * 2, doubled: true, levelAfter };
  useResult.getState().set(next);
  return next;
}
