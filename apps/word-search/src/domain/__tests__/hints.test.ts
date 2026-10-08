import { defaultHints } from '../defaults';
import { startGame } from '../game';
import { generatePuzzle } from '../generator';
import { applyHint, grantCourtesy, grantReward, grantTutorialBonus, hintsAvailable, MAX_BONUS_HINTS, refreshWallet, spendHint } from '../hints';
import { PACKS } from '../packs';

describe('hint wallet (plan §8.5)', () => {
  const today = '2026-10-08';
  it('gives three free hints a day, resetting at local midnight', () => {
    let w = defaultHints('2026-10-07');
    w = spendHint(spendHint(w)!)!;
    expect(hintsAvailable(w)).toBe(1);
    expect(refreshWallet(w, '2026-10-07')).toBe(w);
    const next = refreshWallet(w, today);
    expect(next.free).toBe(3);
    expect(next.resetDateKey).toBe(today);
  });
  it('keeps bonus hints across days and spends free ones first', () => {
    let w = { ...defaultHints('2026-10-07'), bonus: 4 };
    expect(refreshWallet(w, today).bonus).toBe(4);
    w = spendHint(w)!;
    expect(w).toMatchObject({ free: 2, bonus: 4 });
    for (let i = 0; i < 6; i++) w = spendHint(w)!;
    expect(hintsAvailable(w)).toBe(0);
    expect(spendHint(w)).toBeNull();
  });
  it('adds 2 for a rewarded video, never more than 10 bonus hints', () => {
    let w = defaultHints(today);
    w = grantReward(w);
    expect(w.bonus).toBe(2);
    for (let i = 0; i < 10; i++) w = grantReward(w);
    expect(w.bonus).toBe(MAX_BONUS_HINTS);
  });
  it('gives one courtesy hint a day when no video is available', () => {
    const w = defaultHints(today);
    const once = grantCourtesy(w, today)!;
    expect(once.bonus).toBe(1);
    expect(grantCourtesy(once, today)).toBeNull();
    expect(grantCourtesy(once, '2026-10-09')!.bonus).toBe(2);
  });
  it('gives the tutorial bonus hint', () => {
    expect(grantTutorialBonus(defaultHints(today)).bonus).toBe(1);
    expect(grantTutorialBonus({ ...defaultHints(today), bonus: 10 }).bonus).toBe(10);
  });
});

describe('applyHint', () => {
  const game = () => startGame(generatePuzzle({ id: 'h', packId: 'animals', difficulty: 'easy', size: 8, seed: 21, words: PACKS[0].words }), 0);

  it('rings the first letter of the shortest unfound word and counts the hint', () => {
    const g = game();
    const out = applyHint(g)!;
    const shortest = Math.min(...g.puzzle.words.map((w) => w.word.length));
    expect(out.word.length).toBe(shortest);
    expect(out.level).toBe(1);
    expect(out.cells).toHaveLength(1);
    const w = g.puzzle.words.find((x) => x.word === out.word)!;
    expect(out.cells[0]).toEqual({ row: w.row, col: w.col });
    expect(out.game.hintsUsed).toBe(1);
    expect(out.game.hintedWords).toEqual([{ word: out.word, level: 1 }]);
  });

  it('also rings the last letter on a second hint for the same word', () => {
    const first = applyHint(game())!;
    const second = applyHint(first.game)!;
    expect(second.word).toBe(first.word);
    expect(second.level).toBe(2);
    expect(second.cells).toHaveLength(2);
    expect(second.game.hintsUsed).toBe(2);
    expect(second.game.hintedCells.length).toBe(2);
    const third = applyHint(second.game)!;
    expect(third.level).toBe(2);
    expect(third.game.hintedCells.length).toBe(2); // no duplicates
  });

  it('moves on to the next shortest word once one is found, and returns null when all are found', () => {
    const g = game();
    const all = { ...g, puzzle: { ...g.puzzle, words: g.puzzle.words.map((w) => ({ ...w, found: true })) } };
    expect(applyHint(all)).toBeNull();
    const firstFound = { ...g, puzzle: { ...g.puzzle, words: g.puzzle.words.map((w, i) => ({ ...w, found: i === 0 })) } };
    expect(applyHint(firstFound)!.word).not.toBe(g.puzzle.words[0].word);
  });
});
