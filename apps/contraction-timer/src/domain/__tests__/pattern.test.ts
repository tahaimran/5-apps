import { RULE_PRESETS } from '../defaults';
import { bannerVisible, evaluatePattern, nextPatternState, REARM_MS } from '../pattern';
import { made, NOW, resetIds, series, MINUTE, SECOND } from '@/testing/fixtures';

beforeEach(resetIds);

const R511 = RULE_PRESETS['511'];

describe('5-1-1', () => {
  it('matches 11 contractions, 5 minutes apart and a minute long, over 55 minutes', () => {
    const cs = series(NOW, 11, 5 * MINUTE, 60 * SECOND, 5 * MINUTE);
    expect(evaluatePattern(R511, cs, NOW)).toEqual({ matches: true, reasons: [] });
  });

  it('does not match with 10 contractions (one short of the plan\'s ceil(60/5)-1)', () => {
    const cs = series(NOW, 10, 5 * MINUTE, 60 * SECOND, 5 * MINUTE);
    const r = evaluatePattern(R511, cs, NOW);
    expect(r.matches).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/only 10 contractions, need 11/);
  });

  it('does not match when it has lasted only 40 minutes', () => {
    const cs = series(NOW, 9, 5 * MINUTE, 60 * SECOND, 2 * MINUTE).filter((c) => c.startedAt >= NOW - 42 * MINUTE);
    expect(evaluatePattern(R511, cs, NOW).matches).toBe(false);
  });

  it('is a near miss at 6-minute gaps', () => {
    const cs = series(NOW, 12, 6 * MINUTE, 60 * SECOND, 2 * MINUTE);
    const r = evaluatePattern(R511, cs, NOW);
    expect(r.matches).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/gap/);
  });

  it('is a near miss at 40-second contractions', () => {
    const cs = series(NOW, 11, 5 * MINUTE, 40 * SECOND, 5 * MINUTE);
    const r = evaluatePattern(R511, cs, NOW);
    expect(r.matches).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/shorter than the rule/);
  });

  it('allows a little slack: an average of 5 minutes with a few 5.4-minute gaps still matches', () => {
    const cs = series(NOW, 11, 5 * MINUTE, 60 * SECOND, 5 * MINUTE);
    // push two starts a little later: gaps become 5:24 and 4:36 (average unchanged)
    cs[4].startedAt += 24 * SECOND;
    cs[4].endedAt! += 24 * SECOND;
    expect(evaluatePattern(R511, cs, NOW).matches).toBe(true);
  });

  it('does not match an irregular session whose average looks right but whose gaps are not', () => {
    // gaps alternate 2 and 8 minutes: the average is under 5, but only 6 of 11 gaps are within 5:30
    const gaps = [2, 8, 2, 8, 2, 8, 2, 8, 2, 8, 2];
    let ago = 3 * MINUTE;
    const cs = [made(NOW, ago, 60 * SECOND)];
    for (const g of gaps) {
      ago += g * MINUTE;
      cs.unshift(made(NOW, ago, 60 * SECOND));
    }
    expect(cs).toHaveLength(12);
    const r = evaluatePattern(R511, cs, NOW);
    expect(r.matches).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/too many gaps/);
  });

  it('ignores mis-taps under 10 seconds instead of letting them break the rule', () => {
    const cs = series(NOW, 11, 5 * MINUTE, 60 * SECOND, 5 * MINUTE);
    const taps = [made(NOW, 12 * MINUTE + 20 * SECOND, 2 * SECOND), made(NOW, 31 * MINUTE + 10 * SECOND, 3 * SECOND)];
    expect(evaluatePattern(R511, [...cs, ...taps], NOW).matches).toBe(true);
  });

  it('does not count a pattern that stopped: the newest contraction must be recent', () => {
    const cs = series(NOW, 12, 5 * MINUTE, 60 * SECOND, 15 * MINUTE);
    const r = evaluatePattern(R511, cs, NOW);
    expect(r.matches).toBe(false);
    expect(r.reasons.join(' ')).toMatch(/too long ago/);
  });

  it('does not count the one being timed (it has no end yet)', () => {
    const cs = series(NOW, 10, 5 * MINUTE, 60 * SECOND, 6 * MINUTE);
    const open = { id: 'o', startedAt: NOW - 30 * SECOND, endedAt: null };
    expect(evaluatePattern(R511, [...cs, open], NOW).matches).toBe(false);
  });

  it('has nothing to say with no contractions', () => {
    expect(evaluatePattern(R511, [], NOW).matches).toBe(false);
  });
});

describe('other rules', () => {
  it('4-1-1 needs 14 contractions 4 minutes apart', () => {
    const r = RULE_PRESETS['411'];
    expect(evaluatePattern(r, series(NOW, 14, 4 * MINUTE, 62 * SECOND, 4 * MINUTE), NOW).matches).toBe(true);
    expect(evaluatePattern(r, series(NOW, 13, 4 * MINUTE, 62 * SECOND, 4 * MINUTE), NOW).matches).toBe(false);
  });
  it('3-1-1 needs 19 contractions 3 minutes apart', () => {
    const r = RULE_PRESETS['311'];
    expect(evaluatePattern(r, series(NOW, 19, 3 * MINUTE, 62 * SECOND, 3 * MINUTE), NOW).matches).toBe(true);
    expect(evaluatePattern(r, series(NOW, 18, 3 * MINUTE, 62 * SECOND, 3 * MINUTE), NOW).matches).toBe(false);
  });
  it('a custom rule: every 8 minutes, 45 seconds, for 30 minutes', () => {
    const r = { preset: 'custom' as const, intervalMaxMin: 8, durationMinSec: 45, sustainMin: 30 };
    // ceil(30/8)-1 = 3 contractions, the first at least 27 minutes ago
    expect(evaluatePattern(r, series(NOW, 4, 8 * MINUTE, 50 * SECOND, 3 * MINUTE), NOW).matches).toBe(true);
    expect(evaluatePattern(r, series(NOW, 4, 8 * MINUTE, 40 * SECOND, 3 * MINUTE), NOW).matches).toBe(false);
  });
});

describe('episodes (the banner shows once, and again only after 30 quiet minutes)', () => {
  it('fires when the match turns on, not while it stays on', () => {
    const first = nextPatternState(undefined, true, NOW);
    expect(first.fire).toBe(true);
    expect(first.state.episodeStartedAt).toBe(NOW);
    const again = nextPatternState(first.state, true, NOW + 10 * SECOND);
    expect(again.fire).toBe(false);
    expect(again.state.episodeStartedAt).toBe(NOW);
    expect(again.state.lastMatchAt).toBe(NOW + 10 * SECOND);
  });
  it('does not fire again after a dismissal within the same episode', () => {
    const first = nextPatternState(undefined, true, NOW);
    const dismissed = { ...first.state, dismissed: true };
    const again = nextPatternState(dismissed, true, NOW + 5 * MINUTE);
    expect(again.fire).toBe(false);
    expect(again.state.dismissed).toBe(true);
  });
  it('treats a match that drops out and returns within 30 minutes as the same episode', () => {
    const first = nextPatternState(undefined, true, NOW);
    const off = nextPatternState(first.state, false, NOW + 10 * MINUTE);
    expect(off.state.episodeStartedAt).toBe(NOW);
    expect(nextPatternState(off.state, true, NOW + 20 * MINUTE).fire).toBe(false);
  });
  it('re-arms after 30 minutes without a match', () => {
    const first = nextPatternState(undefined, true, NOW);
    const closed = nextPatternState(first.state, false, NOW + REARM_MS);
    expect(closed.state.episodeStartedAt).toBeUndefined();
    expect(nextPatternState(closed.state, true, NOW + REARM_MS + MINUTE).fire).toBe(true);
  });
  it('re-arms even when nothing evaluated in between (the app was closed)', () => {
    const first = nextPatternState(undefined, true, NOW);
    expect(nextPatternState(first.state, true, NOW + 2 * 60 * MINUTE).fire).toBe(true);
  });
  it('shows the banner only while the pattern matches and it was not dismissed', () => {
    const { state } = nextPatternState(undefined, true, NOW);
    expect(bannerVisible(state, true)).toBe(true);
    expect(bannerVisible(state, false)).toBe(false);
    expect(bannerVisible({ ...state, dismissed: true }, true)).toBe(false);
    expect(bannerVisible(undefined, true)).toBe(false);
  });
});
