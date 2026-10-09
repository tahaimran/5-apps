/**
 * Content rules from DEVELOPMENT_PLAN.md §10 step 3-4, as pure functions. This file has no imports so
 * the Node scripts (scripts/build-bank.mjs, scripts/check-raw.mjs) and the Jest tests share it.
 * A test keeps CATEGORY_IDS equal to the app's category list.
 */
export const CATEGORY_IDS = [
  'general',
  'geography',
  'history',
  'science',
  'movies',
  'music',
  'sports',
  'animals',
  'food',
  'literature',
  'logic',
  'flags',
] as const;
export type CategoryKey = (typeof CATEGORY_IDS)[number];

/** Three-letter id prefix per category ("geo-000412"). */
export const ID_PREFIX: Record<CategoryKey, string> = {
  general: 'gen',
  geography: 'geo',
  history: 'his',
  science: 'sci',
  movies: 'mov',
  music: 'mus',
  sports: 'spo',
  animals: 'ani',
  food: 'foo',
  literature: 'lit',
  logic: 'log',
  flags: 'fla',
};

export const MAX_QUESTION_CHARS = 140;
export const MAX_ANSWER_CHARS = 60;
export const MAX_EXPLANATION_CHARS = 220;
/** Classic needs 10 questions per level and 10 levels per difficulty tier. */
export const MIN_PER_TIER = 100;

/** The raw shape written by hand or by a generator, before ids are assigned. `a[0]` is always the correct answer. */
export interface RawQuestion {
  q: string;
  a: [string, string, string, string];
  d: 1 | 2 | 3;
  x: string;
  src?: string;
  tags?: string[];
  /** 1 when the fact can go stale ("current champion"); the plan calls this the evergreen flag. */
  ev?: 1;
}

export interface BankQuestion extends RawQuestion {
  id: string;
  rev: number;
}

const PROFANITY = [
  'fuck', 'shit', 'cunt', 'bitch', 'bastard', 'slut', 'whore', 'nigger', 'nigga', 'faggot', 'porn', 'penis', 'vagina', 'asshole', 'dickhead', 'wank',
];
const GIVEAWAYS = [/all of the above/i, /none of the above/i, /\bboth (a|b|of)\b/i, /\bnot sure\b/i];
const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'is', 'was', 'what', 'which', 'who', 'to', 'and', 'for', 'by', 'at', 'as', 'it', 'its', 'are', 'were', 'this', 'that', 'with', 'from', 'be', 'does', 'did', 'do']);

/** Lowercase, drop punctuation and stopwords: the form used to compare questions. */
export const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(' ');

const shingles = (text: string, n = 3): Set<string> => {
  const words = normalize(text).split(' ').filter(Boolean);
  const out = new Set<string>();
  if (words.length < n) out.add(words.join(' '));
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
};

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / (a.size + b.size - shared);
}

export const NEAR_DUPLICATE_JACCARD = 0.6;
/** Word-level overlap that flags a reworded repeat ("known as" vs "called") when the answer is the same. */
export const NEAR_DUPLICATE_WORD_JACCARD = 0.5;

export interface Fingerprint {
  answer: string;
  shingles: Set<string>;
  words: Set<string>;
}

export const fingerprint = (q: RawQuestion): Fingerprint => ({
  answer: normalize(q.a[0]),
  shingles: shingles(q.q),
  words: new Set(normalize(q.q).split(' ').filter(Boolean)),
});

/** Same answer and similar wording (3-word shingles over 0.6, or word overlap of 0.5 or more). */
export const isNearDuplicate = (a: Fingerprint, b: Fingerprint): boolean =>
  a.answer === b.answer && (jaccard(a.shingles, b.shingles) > NEAR_DUPLICATE_JACCARD || jaccard(a.words, b.words) >= NEAR_DUPLICATE_WORD_JACCARD);

export interface Problem {
  id: string;
  problem: string;
}

/** Problems with one question on its own (schema, lengths, options, giveaways, profanity, quotes). */
export function checkQuestion(q: RawQuestion, id = '(new)'): Problem[] {
  const out: Problem[] = [];
  const bad = (problem: string) => out.push({ id, problem });
  if (typeof q.q !== 'string' || q.q.trim() === '') return [{ id, problem: 'question text missing' }];
  if (!Array.isArray(q.a) || q.a.length !== 4 || q.a.some((o) => typeof o !== 'string' || o.trim() === '')) return [{ id, problem: 'needs exactly 4 non-empty answers' }];
  if (q.d !== 1 && q.d !== 2 && q.d !== 3) bad(`difficulty ${String(q.d)} is not 1, 2 or 3`);
  if (typeof q.x !== 'string' || q.x.trim() === '') bad('explanation missing');
  if (q.q.length > MAX_QUESTION_CHARS) bad(`question is ${q.q.length} chars (max ${MAX_QUESTION_CHARS})`);
  if (typeof q.x === 'string' && q.x.length > MAX_EXPLANATION_CHARS) bad(`explanation is ${q.x.length} chars (max ${MAX_EXPLANATION_CHARS})`);
  for (const o of q.a) if (o.length > MAX_ANSWER_CHARS) bad(`answer "${o}" is over ${MAX_ANSWER_CHARS} chars`);
  const keys = q.a.map((o) => o.trim().toLowerCase());
  if (new Set(keys).size !== 4) bad('the 4 answers are not unique');
  if (!q.q.trim().endsWith('?') && !q.q.includes('___') && !q.q.trim().endsWith('.')) bad('question should end with ? (or a . for a completion)');
  const correct = normalize(q.a[0]);
  if (correct.length >= 4 && normalize(q.q).includes(correct)) bad('the correct answer appears in the question');
  const text = [q.q, q.x, ...q.a].join(' ');
  for (const re of GIVEAWAYS) if (re.test(text)) bad(`contains "${re.source}"`);
  const words = text.toLowerCase().split(/[^a-z]+/);
  for (const p of PROFANITY) if (words.includes(p)) bad(`contains "${p}"`);
  if (/[‘’“” ]/.test(text)) bad('contains a curly quote or non-breaking space (use ASCII quotes)');
  // A correct answer much longer than every other option gives it away; short numeric answers are exempt.
  const lens = q.a.map((o) => o.length);
  const others = Math.max(...lens.slice(1));
  if (lens[0] > 24 && lens[0] > others * 2.5) bad('the correct answer is far longer than the other options');
  if (q.src !== undefined && !/^https?:\/\/[^\s/]+/.test(q.src)) bad('src must be a URL');
  return out;
}

export interface BankCheck {
  problems: Problem[];
  counts: Record<string, Record<1 | 2 | 3, number>>;
}

/** Problems across a whole bank: ids, duplicates, near duplicates, and per-category sizes. */
export function checkBank(bank: Record<string, BankQuestion[]>, options: { minPerTier?: number } = {}): BankCheck {
  const problems: Problem[] = [];
  const counts: BankCheck['counts'] = {};
  const seenIds = new Set<string>();
  const seenText = new Map<string, string>();
  const minTier = options.minPerTier ?? MIN_PER_TIER;
  for (const cat of CATEGORY_IDS) {
    const list = bank[cat] ?? [];
    counts[cat] = { 1: 0, 2: 0, 3: 0 };
    const prefix = ID_PREFIX[cat];
    const prints: { id: string; print: Fingerprint }[] = [];
    for (const q of list) {
      for (const p of checkQuestion(q, q.id)) problems.push(p);
      if (!new RegExp(`^${prefix}-\\d{6}$`).test(q.id)) problems.push({ id: q.id, problem: `id should look like ${prefix}-000001` });
      if (seenIds.has(q.id)) problems.push({ id: q.id, problem: 'duplicate id' });
      seenIds.add(q.id);
      if (!Number.isInteger(q.rev) || q.rev < 1) problems.push({ id: q.id, problem: 'rev must be a positive integer' });
      if (q.d >= 1 && q.d <= 3) counts[cat][q.d]++;
      const key = normalize(q.q);
      const earlier = seenText.get(key);
      if (earlier) problems.push({ id: q.id, problem: `same question as ${earlier}` });
      seenText.set(key, q.id);
      prints.push({ id: q.id, print: fingerprint(q) });
    }
    // Near duplicates: similar wording AND the same answer (a similar question with another answer is fine).
    for (let i = 0; i < prints.length; i++) {
      for (let j = i + 1; j < prints.length; j++) {
        if (isNearDuplicate(prints[i].print, prints[j].print)) problems.push({ id: prints[j].id, problem: `near duplicate of ${prints[i].id}` });
      }
    }
    for (const d of [1, 2, 3] as const) {
      if (counts[cat][d] < minTier) problems.push({ id: cat, problem: `only ${counts[cat][d]} questions of difficulty ${d} (need ${minTier})` });
    }
  }
  for (const cat of Object.keys(bank)) if (!(CATEGORY_IDS as readonly string[]).includes(cat)) problems.push({ id: cat, problem: 'unknown category' });
  return { problems, counts };
}
