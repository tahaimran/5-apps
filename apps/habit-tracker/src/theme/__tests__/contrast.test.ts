import { defaultPalettes } from '@shared/theme/tokens';
import { contrastRatio, readableOn } from '../contrast';
import { extraColors, habitColors, palette } from '../tokens';

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
  it('picks a foreground with at least 3:1 (non-text UI contrast) for every habit color', () => {
    for (const color of Object.values(habitColors)) {
      expect(contrastRatio(readableOn(color), color)).toBeGreaterThanOrEqual(3);
    }
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
    ['danger', 'background'],
    ['danger', 'surface'],
  ] as const)('%s on %s', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(AA);
  });
  it('body text stays readable on the warning banner (15% tint over the background)', () => {
    expect(contrastRatio(c.text, blend(extraColors[mode].warning, c.background, 0.15))).toBeGreaterThanOrEqual(AA);
  });
});
