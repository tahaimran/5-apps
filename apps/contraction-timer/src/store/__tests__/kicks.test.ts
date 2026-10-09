import { mockDisk } from '@/testing/mocks';
import { resetApp } from '@/testing/stores';
import { NOW, MINUTE, SECOND } from '@/testing/fixtures';
import { HARD_LIMIT_MS, SOFT_LIMIT_MS } from '@/domain/kicks';
import { reloadKicksFromDisk, useKicks } from '@/store/kicks';
import { useMeta } from '@/store/meta';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';

beforeEach(() => {
  resetApp();
  useKicks.setState({ active: null, history: [] });
});

const tapAt = (ms: number) => useKicks.getState().tap(NOW + ms);
const coldStart = () => {
  useKicks.setState({ active: null, history: [] });
  reloadKicksFromDisk();
};

describe('a kick count', () => {
  it('starts with the target from Settings (10 by default, 5–20)', () => {
    useKicks.getState().start(NOW);
    expect(useKicks.getState().active).toMatchObject({ startedAt: NOW, target: 10, taps: [] });
    useKicks.getState().reset();
    useSettings.getState().update({ kickTarget: 14 });
    useKicks.getState().start(NOW);
    expect(useKicks.getState().active!.target).toBe(14);
  });

  it('does not start a second count while one is open', () => {
    useKicks.getState().start(NOW);
    useKicks.getState().start(NOW + MINUTE);
    expect(useKicks.getState().active!.startedAt).toBe(NOW);
  });

  it('writes every tap to disk, and a kill in the middle loses nothing', () => {
    useKicks.getState().start(NOW);
    for (let i = 1; i <= 4; i++) tapAt(i * 70 * SECOND);
    expect(db.get('activeKick')!.taps).toHaveLength(4);
    coldStart();
    expect(useKicks.getState().active!.taps).toHaveLength(4);
    expect(tapAt(5 * 70 * SECOND)).toBe('counted');
  });

  it('reaches the target on the 10th movement and saves the count at that time', () => {
    useKicks.getState().start(NOW);
    for (let i = 1; i <= 9; i++) expect(tapAt(i * 80 * SECOND)).toBe('counted');
    expect(tapAt(10 * 80 * SECOND)).toBe('reached');
    expect(tapAt(11 * 80 * SECOND)).toBe('ignored');
    const saved = useKicks.getState().finish(NOW + 60 * MINUTE)!;
    expect(saved.endedAt).toBe(NOW + 800 * SECOND);
    expect(useKicks.getState().active).toBeNull();
    expect(useKicks.getState().history[0].id).toBe(saved.id);
    expect(db.get('kicks')).toHaveLength(1);
    expect(useMeta.getState().meta.lastKickEndedAt).toBe(NOW + 800 * SECOND);
  });

  it('ignores flutters inside one second and counts the next movement', () => {
    useKicks.getState().start(NOW);
    expect(tapAt(5000)).toBe('counted');
    expect(tapAt(5400)).toBe('ignored');
    expect(tapAt(6000)).toBe('counted');
  });

  it('undo takes back the last movement', () => {
    useKicks.getState().start(NOW);
    tapAt(5000);
    tapAt(10_000);
    useKicks.getState().undo();
    expect(useKicks.getState().active!.taps).toHaveLength(1);
  });

  it('ending an empty count saves nothing; ending a partial one saves it as it is', () => {
    useKicks.getState().start(NOW);
    expect(useKicks.getState().finish(NOW + MINUTE)).toBeNull();
    expect(useKicks.getState().history).toHaveLength(0);
    useKicks.getState().start(NOW);
    tapAt(5000);
    tapAt(15_000);
    const saved = useKicks.getState().finish(NOW + 30 * MINUTE)!;
    expect(saved.taps).toHaveLength(2);
    expect(saved.targetReachedAt).toBeUndefined();
    expect(saved.endedAt).toBe(NOW + 30 * MINUTE);
  });

  it('keeps at most 365 counts, newest first', () => {
    for (let i = 0; i < 370; i++) {
      useKicks.getState().start(NOW + i * HARD_LIMIT_MS);
      useKicks.getState().tap(NOW + i * HARD_LIMIT_MS + 5000);
      useKicks.getState().finish(NOW + i * HARD_LIMIT_MS + 10_000);
    }
    const h = useKicks.getState().history;
    expect(h).toHaveLength(365);
    expect(h[0].startedAt).toBeGreaterThan(h[364].startedAt);
    expect(db.get('kicks')).toHaveLength(365);
  });
});

describe('the 2-hour and 3-hour rules', () => {
  it('says "soft" after 2 hours and remembers it for the review rule', () => {
    useKicks.getState().start(NOW);
    tapAt(10_000);
    expect(useKicks.getState().checkLimits(NOW + SOFT_LIMIT_MS - 1)).toBe('ok');
    expect(useKicks.getState().checkLimits(NOW + SOFT_LIMIT_MS)).toBe('soft');
    expect(useMeta.getState().meta.lastKickSoftLimitAt).toBe(NOW + SOFT_LIMIT_MS);
    expect(useKicks.getState().active).not.toBeNull();
  });
  it('closes and saves the count at exactly 3 hours', () => {
    useKicks.getState().start(NOW);
    tapAt(10_000);
    expect(useKicks.getState().checkLimits(NOW + HARD_LIMIT_MS)).toBe('closed');
    expect(useKicks.getState().active).toBeNull();
    expect(useKicks.getState().history[0].endedAt).toBe(NOW + HARD_LIMIT_MS);
  });
  it('closes an empty count after 3 hours without keeping it', () => {
    useKicks.getState().start(NOW);
    expect(useKicks.getState().checkLimits(NOW + HARD_LIMIT_MS)).toBe('closed');
    expect(useKicks.getState().history).toHaveLength(0);
  });
  it('applies the 3-hour rule on a cold start too (killed at 1:00, opened at 5:00)', () => {
    useKicks.getState().start(NOW);
    tapAt(10_000);
    coldStart();
    expect(useKicks.getState().checkLimits(NOW + 4 * 60 * MINUTE)).toBe('closed');
    expect(mockDisk.get('ct')!.get('activeKick')).toBe('null');
  });
});
