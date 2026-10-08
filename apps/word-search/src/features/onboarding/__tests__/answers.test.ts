import { defaultTextSize, resolveAnswers, SETUP_DEFAULTS } from '../answers';

describe('onboarding answers (plan §6)', () => {
  it('preselects Large, or Extra Large when the phone font is already 1.3x or more', () => {
    expect(defaultTextSize(1)).toBe('large');
    expect(defaultTextSize(1.29)).toBe('large');
    expect(defaultTextSize(1.3)).toBe('xlarge');
    expect(defaultTextSize(2)).toBe('xlarge');
  });
  it('skipping everything gives Large text, Easy and normal colors', () => {
    expect(resolveAnswers({}, 1)).toEqual(SETUP_DEFAULTS);
    expect(SETUP_DEFAULTS).toEqual({ textSize: 'large', highContrast: false, difficulty: 'easy' });
  });
  it('keeps what the player chose and defaults the rest', () => {
    expect(resolveAnswers({ display: { textSize: 'huge', highContrast: true } }, 1)).toEqual({ textSize: 'huge', highContrast: true, difficulty: 'easy' });
    expect(resolveAnswers({ level: 'hard' }, 1.5)).toEqual({ textSize: 'xlarge', highContrast: false, difficulty: 'hard' });
  });
});
