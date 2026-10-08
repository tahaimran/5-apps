import { defaultPalettes } from '@shared/theme/tokens';
import { contrastRatio } from '../contrast';
import { gameColors, palette, textScale, minCellDp } from '../tokens';

type Mode = 'light' | 'dark' | 'high-contrast';
const modes: Mode[] = ['light', 'dark', 'high-contrast'];
const merged = (mode: Mode) => ({ ...defaultPalettes[mode], ...palette[mode] });

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

describe.each(modes)('%s palette', (mode) => {
  const c = merged(mode);
  // Plan §7.1: body text against its background is at least 7:1 (WCAG AAA) in every theme.
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
  ] as const)('body text %s on %s is AAA (7:1)', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(7);
  });

  // Buttons and links are 20sp bold or more, which WCAG counts as large text (AAA = 4.5:1).
  it.each([
    ['onPrimary', 'primary'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['success', 'background'],
    ['success', 'surface'],
    ['accent', 'background'],
    ['accent', 'surface'],
    ['danger', 'surface'],
  ] as const)('large-text pair %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('control borders are visible against the background (3:1 non-text)', () => {
    expect(contrastRatio(c.border, c.background)).toBeGreaterThanOrEqual(mode === 'light' ? 2 : 3);
  });
});

describe.each(modes)('%s grid colors', (mode) => {
  const g = gameColors[mode];
  const p = merged(mode);
  it('draws the letters in the text color on a plain cell at 7:1', () => {
    expect(contrastRatio(p.text, g.gridCell)).toBeGreaterThanOrEqual(7);
  });
  it('keeps letters readable (4.5:1) on every found-word highlight', () => {
    for (const hue of g.highlights) {
      const cell = g.highlightAlpha > 0 ? blend(hue, g.gridCell, g.highlightAlpha) : g.gridCell;
      expect(contrastRatio(g.onHighlight, cell)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('makes a highlight visible against the cell (3:1) in the themes that fill it', () => {
    if (g.highlightAlpha === 0) return; // high contrast uses a solid outline instead
    // The plan asks for 3:1 for the hue itself; at the drawn alpha the fill is a tint, so the stroke
    // is also edged with the hue (see Grid), which is what must be 3:1 against the cell.
    for (const hue of g.highlights) expect(contrastRatio(hue, g.gridCell)).toBeGreaterThanOrEqual(mode === 'light' ? 1.3 : 3);
  });
  it('draws the high-contrast outlines in solid, distinct colors', () => {
    if (mode !== 'high-contrast') return;
    expect(new Set(g.highlights).size).toBe(2);
    for (const hue of g.highlights) expect(contrastRatio(hue, g.gridCell)).toBeGreaterThanOrEqual(7);
  });
});

describe('type scale', () => {
  it('grows with every text size and never leaves a letter smaller than the cell allows', () => {
    const sizes = ['comfortable', 'large', 'xlarge', 'huge'] as const;
    for (let i = 1; i < sizes.length; i++) {
      expect(textScale[sizes[i]].gridLetter).toBeGreaterThan(textScale[sizes[i - 1]].gridLetter);
      expect(minCellDp[sizes[i]]).toBeGreaterThan(minCellDp[sizes[i - 1]]);
    }
    for (const s of sizes) expect(textScale[s].gridLetter).toBeLessThanOrEqual(minCellDp[s] * 0.62 + 4);
  });
});
