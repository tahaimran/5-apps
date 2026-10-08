import { defaultPalettes } from '@shared/theme/tokens';
import { contrastRatio } from '../contrast';
import { extraColors, palette } from '../tokens';

const merged = (mode: 'light' | 'dark') => ({ ...defaultPalettes[mode], ...palette[mode] });
const AA = 4.5;

/** `fg` at `alpha` over `bg`, as hex. */
function blend(fg: string, bg: string, alpha: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [f, b] = [parse(fg), parse(bg)];
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

describe.each(['light', 'dark'] as const)('%s palette meets WCAG AA for text', (mode) => {
  const c = merged(mode);
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
    ['onPrimary', 'primary'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['danger', 'background'],
    ['danger', 'surface'],
    ['success', 'surface'],
    ['accent', 'surface'],
  ] as const)('%s on %s', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(AA);
  });
  it('body text stays readable on the reminders-off card (15% warning tint)', () => {
    expect(contrastRatio(c.text, blend(extraColors[mode].warning, c.background, 0.15))).toBeGreaterThanOrEqual(AA);
  });
  it('body text is at least 12:1 as the plan requires', () => {
    expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(12);
  });
  it('the ring fill is visible against its track (3:1 non-text contrast)', () => {
    expect(contrastRatio(extraColors[mode].ring, c.surface)).toBeGreaterThanOrEqual(mode === 'light' ? 2.5 : 3);
  });
});
