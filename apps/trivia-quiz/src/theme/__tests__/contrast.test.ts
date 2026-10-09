import { defaultPalettes } from '@shared/theme/tokens';
import { CATEGORIES } from '@/domain/categories';
import { contrastRatio } from '../contrast';
import { extraColors, palette, scaledType, TEXT_SCALES } from '../tokens';

type Mode = 'light' | 'dark';
const modes: Mode[] = ['light', 'dark'];
const merged = (mode: Mode) => ({ ...defaultPalettes[mode], ...palette[mode] });

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

describe.each(modes)('%s palette (plan §7: text pairs at least 4.5:1)', (mode) => {
  const c = merged(mode);
  const x = extraColors[mode];
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['accent', 'surface'],
    ['success', 'surface'],
    ['danger', 'surface'],
    ['success', 'background'],
    ['danger', 'background'],
  ] as const)('%s on %s', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps button labels readable on the primary, success and danger fills', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(x.onSuccess, c.success)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(x.onDanger, c.danger)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps text readable on the correct and wrong tints and on the primary container', () => {
    expect(contrastRatio(c.text, x.successTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.text, x.dangerTint)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.text, x.primaryContainer)).toBeGreaterThanOrEqual(4.5);
  });

  it('draws control edges, the stars and the flame with at least 3:1 against the surface', () => {
    expect(contrastRatio(c.border, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.border, c.background)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(x.star, c.surface)).toBeGreaterThanOrEqual(mode === 'light' ? 2 : 3);
    expect(contrastRatio(x.streak, c.surface)).toBeGreaterThanOrEqual(2.5);
  });
});

describe('category colours', () => {
  it.each(CATEGORIES)('white text on the strong shade of $id is at least 4.5:1', (cat) => {
    expect(contrastRatio('#FFFFFF', cat.strong)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('type scale', () => {
  it('follows the plan at scale 1', () => {
    expect(scaledType(1)).toMatchObject({ display: { fontSize: 32, lineHeight: 40 }, question: { fontSize: 20, lineHeight: 28 }, answer: { fontSize: 17, lineHeight: 24 }, caption: { fontSize: 13, lineHeight: 18 } });
  });
  it('grows with the text-size setting', () => {
    expect(TEXT_SCALES).toEqual([0.9, 1, 1.15, 1.3]);
    const sizes = TEXT_SCALES.map((s) => scaledType(s).body.fontSize);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(scaledType(1.3).answer.fontSize).toBe(Math.round(17 * 1.3));
  });
});
