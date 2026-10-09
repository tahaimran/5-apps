import { categoryOfId } from './categories';
import { allowanceFor, fiftyFifty, MAX_REWARDED_LIFELINES_PER_ROUND, type LifelineCounts, type LifelineKind } from './lifelines';
import { hash32, mulberry32 } from './prng';
import {
  BLITZ_CORRECT_BONUS,
  BLITZ_EXTRA_TIME_SECONDS,
  BLITZ_SECONDS,
  BLITZ_WRONG_PENALTY,
  EXTRA_TIME_SECONDS,
  pointsFor,
  present,
  QUESTION_SECONDS,
  starsFor,
} from './scoring';
import type { CategoryId, DateKey, Difficulty, Presented, Question, RoundMode, Stars } from './types';

/** Everything a round needs, decided before the first question (see domain/modes.ts). */
export interface RoundConfig {
  mode: RoundMode;
  category?: CategoryId;
  /** Category play: the chosen difficulty. */
  difficulty?: Difficulty;
  level?: number;
  date?: DateKey;
  questions: Question[];
  /** Spares for Skip. */
  reserve: Question[];
  /** Seeds the option shuffles and 50/50, so a round is reproducible. */
  seed: number;
  /** Relaxed mode: no timer (plan §7), XP x0.8. */
  relaxed: boolean;
  /** Hearts for hard Classic levels; 0 means none. */
  hearts: number;
}

export interface AnswerRecord {
  id: string;
  category: CategoryId;
  d: Difficulty;
  correct: boolean;
  timedOut: boolean;
  chosen: number | null;
  points: number;
}

export type Phase = 'question' | 'answered' | 'done';

export interface RoundState {
  config: RoundConfig;
  /** Questions still to come after the current one. */
  queue: Question[];
  reserve: Question[];
  current: Presented;
  phase: Phase;
  chosen: number | null;
  correct: boolean | null;
  timedOut: boolean;
  /** Option indexes taken out by 50/50 on the current question. */
  removed: number[];
  answers: AnswerRecord[];
  score: number;
  /** Correct answers in a row. */
  run: number;
  hearts: number;
  outOfHearts: boolean;
  heartContinueUsed: boolean;
  lifelines: LifelineCounts;
  rewardedUsed: number;
  /** Time left in ms: for the current question, or for the whole Blitz run. null = untimed. */
  msLeft: number | null;
  /** Total ms the clock started with for the current question (for the ring). */
  msTotal: number | null;
  /** Points scored by the last answer (for the "+points" float). */
  lastPoints: number;
  skipped: number;
}

export const isBlitz = (c: RoundConfig): boolean => c.mode === 'blitz';

const timerFor = (config: RoundConfig, d: Difficulty): number | null =>
  config.relaxed || config.mode === 'warmup' || config.mode === 'blitz' ? null : QUESTION_SECONDS[d] * 1000;

function show(config: RoundConfig, q: Question, n: number): Presented {
  return present(q, mulberry32(hash32(`${config.seed}:${q.id}:${n}`)));
}

export function startRound(config: RoundConfig): RoundState {
  const [first, ...queue] = config.questions;
  if (!first) throw new Error('A round needs at least one question');
  const blitz = isBlitz(config);
  const perQuestion = timerFor(config, first.d);
  return {
    config,
    queue,
    reserve: [...config.reserve],
    current: show(config, first, 0),
    phase: 'question',
    chosen: null,
    correct: null,
    timedOut: false,
    removed: [],
    answers: [],
    score: 0,
    run: 0,
    hearts: config.hearts,
    outOfHearts: false,
    heartContinueUsed: false,
    lifelines: { ...allowanceFor(config.mode).free },
    rewardedUsed: 0,
    msLeft: blitz ? BLITZ_SECONDS * 1000 : perQuestion,
    msTotal: blitz ? BLITZ_SECONDS * 1000 : perQuestion,
    lastPoints: 0,
    skipped: 0,
  };
}

function record(s: RoundState, chosen: number | null, timedOut: boolean): RoundState {
  const q = s.current.question;
  const correct = chosen !== null && chosen === s.current.correctIndex;
  const blitz = isBlitz(s.config);
  // Blitz has one global clock, so there is no per-question time bonus there.
  const remainingSec = blitz || s.msLeft === null ? 0 : s.msLeft / 1000;
  const points = correct ? pointsFor(q.d, remainingSec, s.run) : 0;
  const hearts = !correct && s.hearts > 0 ? s.hearts - 1 : s.hearts;
  let msLeft = s.msLeft;
  if (blitz && msLeft !== null) msLeft = correct ? msLeft + BLITZ_CORRECT_BONUS * 1000 : Math.max(0, msLeft - BLITZ_WRONG_PENALTY * 1000);
  return {
    ...s,
    phase: 'answered',
    chosen,
    correct,
    timedOut,
    answers: [...s.answers, { id: q.id, category: categoryOfId(q.id), d: q.d, correct, timedOut, chosen, points }],
    score: s.score + points,
    run: correct ? s.run + 1 : 0,
    hearts,
    outOfHearts: s.config.hearts > 0 && hearts === 0 && !correct,
    msLeft,
    lastPoints: points,
  };
}

/** The player picked an option. `msLeft` at that moment decides the time bonus. */
export function answer(s: RoundState, optionIndex: number): RoundState {
  if (s.phase !== 'question' || s.removed.includes(optionIndex) || optionIndex < 0 || optionIndex > 3) return s;
  return record(s, optionIndex, false);
}

/** The question clock ran out: it counts as a wrong answer ("Time's up!"). */
export function timeout(s: RoundState): RoundState {
  return s.phase === 'question' ? record(s, null, true) : s;
}

/**
 * Moves on after the explanation. Ends the round when the questions are used up, hearts ran out
 * (unless a continue is still pending), or the Blitz clock is at zero.
 */
export function next(s: RoundState): RoundState {
  if (s.phase !== 'answered') return s;
  const blitz = isBlitz(s.config);
  if (s.outOfHearts) return { ...s, phase: 'done' };
  if (blitz && (s.msLeft ?? 0) <= 0) return { ...s, phase: 'done' };
  const [upcoming, ...queue] = s.queue;
  if (!upcoming) return { ...s, phase: 'done' };
  return {
    ...s,
    queue,
    current: show(s.config, upcoming, s.answers.length + s.skipped),
    phase: 'question',
    chosen: null,
    correct: null,
    timedOut: false,
    removed: [],
    msLeft: blitz ? s.msLeft : timerFor(s.config, upcoming.d),
    msTotal: blitz ? s.msTotal : timerFor(s.config, upcoming.d),
  };
}

/** Advances the clock while a question is open. Blitz ends at zero; other modes time the question out. */
export function tick(s: RoundState, deltaMs: number): RoundState {
  if (s.phase !== 'question' || s.msLeft === null || deltaMs <= 0) return s;
  const msLeft = Math.max(0, s.msLeft - deltaMs);
  if (msLeft > 0) return { ...s, msLeft };
  return isBlitz(s.config) ? { ...s, msLeft: 0, phase: 'done' } : timeout({ ...s, msLeft: 0 });
}

/** Available now: one is left, a question is open, 50/50 is not already used on it, and extra time needs a running clock. */
export const lifelineLeft = (s: RoundState, kind: LifelineKind): boolean =>
  s.phase === 'question' && s.lifelines[kind] > 0 && !(kind === 'fifty' && s.removed.length > 0) && !(kind === 'time' && s.msLeft === null);

/** True when watching a video could grant one more of this lifeline (plan §12: max 2 a round). */
export function canOfferRewarded(s: RoundState, kind: LifelineKind): boolean {
  if (!allowanceFor(s.config.mode).rewarded || s.phase !== 'question') return false;
  if (s.lifelines[kind] > 0 || s.rewardedUsed >= MAX_REWARDED_LIFELINES_PER_ROUND) return false;
  return !(isBlitz(s.config) && kind === 'time'); // Blitz extra time is once per run
}

/** Uses a lifeline if one is left: 50/50, Skip (replaces the question), or extra time. */
export function useLifeline(s: RoundState, kind: LifelineKind): RoundState {
  if (!lifelineLeft(s, kind)) return s;
  const lifelines = { ...s.lifelines, [kind]: s.lifelines[kind] - 1 };
  if (kind === 'fifty') {
    const rng = mulberry32(hash32(`${s.config.seed}:fifty:${s.current.question.id}`));
    return { ...s, lifelines, removed: fiftyFifty(s.current.correctIndex, rng) };
  }
  if (kind === 'time') {
    const extra = (isBlitz(s.config) ? BLITZ_EXTRA_TIME_SECONDS : EXTRA_TIME_SECONDS) * 1000;
    if (s.msLeft === null) return s;
    return { ...s, lifelines, msLeft: s.msLeft + extra, msTotal: (s.msTotal ?? 0) + extra };
  }
  // Skip: a spare of the same difficulty replaces the question (it is not marked as seen). Blitz takes the next one.
  const blitz = isBlitz(s.config);
  let replacement: Question | undefined;
  let queue = s.queue;
  let reserve = s.reserve;
  if (blitz) {
    [replacement, ...queue] = s.queue;
  } else {
    const i = Math.max(0, s.reserve.findIndex((q) => q.d === s.current.question.d));
    replacement = s.reserve[i];
    reserve = s.reserve.filter((_, j) => j !== i);
  }
  if (!replacement) return s; // nothing to swap in: keep the skip
  const skipped = s.skipped + 1;
  const msLeft = blitz ? s.msLeft : timerFor(s.config, replacement.d);
  return {
    ...s,
    lifelines,
    queue,
    reserve,
    skipped,
    current: show(s.config, replacement, s.answers.length + skipped),
    removed: [],
    msLeft,
    msTotal: blitz ? s.msTotal : msLeft,
  };
}

/** A rewarded video was earned: +1 of that lifeline (never before it ran out, never more than 2 a round). */
export function grantRewardedLifeline(s: RoundState, kind: LifelineKind): RoundState {
  if (!canOfferRewarded(s, kind)) return s;
  return { ...s, lifelines: { ...s.lifelines, [kind]: s.lifelines[kind] + 1 }, rewardedUsed: s.rewardedUsed + 1 };
}

/** Plan §8: "Continue with 1 heart", once per level attempt, after the hearts ran out. */
export function canContinueWithHeart(s: RoundState): boolean {
  return s.outOfHearts && !s.heartContinueUsed && s.phase === 'answered';
}

export function continueWithHeart(s: RoundState): RoundState {
  return canContinueWithHeart(s) ? { ...s, hearts: 1, outOfHearts: false, heartContinueUsed: true } : s;
}

export interface RoundSummary {
  mode: RoundMode;
  total: number;
  answered: number;
  correct: number;
  score: number;
  stars: Stars;
  /** Classic level lost by running out of hearts. */
  failedByHearts: boolean;
  correctByDifficulty: Record<Difficulty, number>;
  accuracy: number;
}

export function summarize(s: RoundState): RoundSummary {
  const correctByDifficulty: Record<Difficulty, number> = { 1: 0, 2: 0, 3: 0 };
  let correct = 0;
  for (const a of s.answers) {
    if (a.correct) {
      correct++;
      correctByDifficulty[a.d]++;
    }
  }
  const failedByHearts = s.outOfHearts;
  const total = s.config.questions.length;
  return {
    mode: s.config.mode,
    total: isBlitz(s.config) ? s.answers.length : total,
    answered: s.answers.length,
    correct,
    score: s.score,
    stars: failedByHearts || isBlitz(s.config) ? 0 : starsFor(correct, total),
    failedByHearts,
    correctByDifficulty,
    accuracy: s.answers.length === 0 ? 0 : correct / s.answers.length,
  };
}
