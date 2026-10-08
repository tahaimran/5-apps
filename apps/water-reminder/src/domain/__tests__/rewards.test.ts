import { skins } from '../../data/shop';
import { activeId, freezeBlock, isUnlocked, MAX_UNLOCKS_PER_DAY, unlockKey, unlocksLeftToday } from '../rewards';

const progress = (over = {}) => ({ streakFreezes: 0, unlocked: ['classic'], bestStreak: 0, activeSkin: 'classic', activeCupTheme: 'classic', ...over });
const item = (id: string) => skins.find((s) => s.id === id)!;

describe('streak freeze limits (plan §8.6, §12)', () => {
  it('lets one be earned per day, up to two owned', () => {
    expect(freezeBlock(progress(), {}, '2026-10-08')).toBeNull();
    expect(freezeBlock(progress(), { freezeEarnedDay: '2026-10-08' }, '2026-10-08')).toBe('today');
    expect(freezeBlock(progress(), { freezeEarnedDay: '2026-10-07' }, '2026-10-08')).toBeNull();
    expect(freezeBlock(progress({ streakFreezes: 2 }), {}, '2026-10-08')).toBe('full');
    expect(freezeBlock(progress({ streakFreezes: 1 }), {}, '2026-10-08')).toBeNull();
  });
});

describe('rewarded unlock cap', () => {
  it('allows 10 a day and resets the next day', () => {
    expect(unlocksLeftToday({}, '2026-10-08')).toBe(MAX_UNLOCKS_PER_DAY);
    expect(unlocksLeftToday({ unlocksToday: { day: '2026-10-08', count: 4 } }, '2026-10-08')).toBe(6);
    expect(unlocksLeftToday({ unlocksToday: { day: '2026-10-08', count: 12 } }, '2026-10-08')).toBe(0);
    expect(unlocksLeftToday({ unlocksToday: { day: '2026-10-07', count: 10 } }, '2026-10-08')).toBe(10);
  });
});

describe('shop unlocks (plan §3 v1.1: 6 skins, 2 free)', () => {
  it('has 6 skins with two free ones, and the free ones are always usable', () => {
    expect(skins).toHaveLength(6);
    expect(skins.filter((s) => s.unlock.kind === 'free')).toHaveLength(2);
    expect(isUnlocked('skin', item('classic'), progress())).toBe(true);
  });
  it('unlocks an ad item only after its reward', () => {
    expect(isUnlocked('skin', item('berry'), progress())).toBe(false);
    expect(isUnlocked('skin', item('berry'), progress({ unlocked: ['classic', unlockKey('skin', 'berry')] }))).toBe(true);
    expect(isUnlocked('cup', item('berry'), progress({ unlocked: [unlockKey('skin', 'berry')] }))).toBe(false); // skins and cups are separate
  });
  it('unlocks a streak item once the best streak reaches the milestone', () => {
    expect(isUnlocked('skin', item('mint'), progress({ bestStreak: 13 }))).toBe(false);
    expect(isUnlocked('skin', item('mint'), progress({ bestStreak: 14 }))).toBe(true);
  });
  it('reads the active item per kind', () => {
    expect(activeId('skin', progress({ activeSkin: 'sky' }))).toBe('sky');
    expect(activeId('cup', progress({ activeCupTheme: 'leaf' }))).toBe('leaf');
  });
});
