import { landingRoute } from '@/features/onboarding/landing';

describe('where the app opens (plan §4)', () => {
  it('on the Timer', () => {
    expect(landingRoute([], undefined, '2026-11-04')).toBe('/(tabs)/timer');
    expect(landingRoute(['timer'], '2026-11-04', '2026-11-04')).toBe('/(tabs)/timer');
    expect(landingRoute(['kicks', 'timer'], '2026-11-04', '2026-11-04')).toBe('/(tabs)/timer');
  });
  it('on Kicks on the first day when kicks were the only need, and never after', () => {
    expect(landingRoute(['kicks'], '2026-11-04', '2026-11-04')).toBe('/(tabs)/kicks');
    expect(landingRoute(['kicks'], '2026-11-04', '2026-11-05')).toBe('/(tabs)/timer');
  });
});
