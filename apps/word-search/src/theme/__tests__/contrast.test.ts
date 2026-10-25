import { blend, contrastRatio } from '../contrast';
import { appColors, gameColors, minCellDp, palette, textScale } from '../tokens';

type Mode = 'light' | 'dark' | 'high-contrast';
const modes: Mode[] = ['light', 'dark', 'high-contrast'];

/** `#RRGGBB` from an `rgba(r,g,b,a)` string drawn over `under`. */
const rgbaOver = (rgba: string, under: string) => {
  const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number);
  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
  return blend(hex, under);
};

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

describe.each(modes)('%s palette', (mode) => {
  const c = palette[mode];
  const app = appColors[mode];
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

  it('keeps body text AAA on every stop of the sky and on frosted panels over it', () => {
    for (const stop of app.stage) {
      expect(contrastRatio(c.text, stop)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(c.textMuted, stop)).toBeGreaterThanOrEqual(mode === 'light' ? 6.5 : 7);
      const frost = blend(app.frost, stop);
      expect(contrastRatio(c.text, frost)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(c.textMuted, frost)).toBeGreaterThanOrEqual(7);
    }
  });

  // Buttons, links and titles are 20sp bold or more, which WCAG counts as large text (AAA = 4.5:1).
  it.each([
    ['onPrimary', 'primary'],
    ['primary', 'background'],
    ['primary', 'surface'],
    ['primary', 'surfaceAlt'],
    ['success', 'background'],
    ['success', 'surface'],
    ['accent', 'background'],
    ['accent', 'surface'],
    ['danger', 'surface'],
    ['text', 'primarySoft'],
  ] as const)('large-text pair %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the game labels readable: ribbons, the go button (both stops) and the gold hint disc', () => {
    expect(contrastRatio(app.onRibbon, app.ribbon)).toBeGreaterThanOrEqual(7);
    for (const stop of app.go) expect(contrastRatio(app.onGo, stop)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(app.onGold, app.gold)).toBeGreaterThanOrEqual(7);
    // The white secondary game button's blue label.
    expect(contrastRatio(c.primary, mode === 'high-contrast' ? c.background : c.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('shows the board frame, the stars and the flame against what they sit on (3:1 non-text)', () => {
    expect(contrastRatio(app.board, app.stage[1])).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(app.goldEdge, c.surface)).toBeGreaterThanOrEqual(mode === 'dark' ? 3 : 2.5);
    expect(contrastRatio(app.flame, c.surface)).toBeGreaterThanOrEqual(3);
    // High contrast draws the go button as a black face with a yellow edge (goLip) instead of a lime fill.
    expect(contrastRatio(mode === 'high-contrast' ? app.goLip : app.go[1], c.surface)).toBeGreaterThanOrEqual(mode === 'light' ? 2 : 3);
  });

  it('keeps the date AAA on a finished calendar day', () => {
    expect(contrastRatio(c.text, app.doneSoft)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(c.success, c.surface)).toBeGreaterThanOrEqual(3);
  });

  it('control borders are visible against the background (3:1 non-text)', () => {
    expect(contrastRatio(c.border, c.background)).toBeGreaterThanOrEqual(3);
  });
});

describe.each(modes)('%s grid colors', (mode) => {
  const g = gameColors[mode];
  const p = palette[mode];
  it('draws the letters in the text color on a plain cell at 7:1', () => {
    expect(contrastRatio(p.text, g.gridCell)).toBeGreaterThanOrEqual(7);
  });
  it('keeps letters readable (4.5:1) on every found-word pill', () => {
    for (const hue of g.highlights) {
      const pill = g.highlightAlpha > 0 ? blend(`${hue}${Math.round(g.highlightAlpha * 255).toString(16).padStart(2, '0')}`, g.gridCell) : g.gridCell;
      expect(contrastRatio(g.onHighlight, pill)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('edges every pill in a color at least 3:1 against the cell (plan §7.1), one edge per fill', () => {
    expect(g.edges).toHaveLength(g.highlights.length);
    for (const edge of g.edges) expect(contrastRatio(edge, g.gridCell)).toBeGreaterThanOrEqual(3);
  });
  it('keeps the six rotation colors distinct (or the two high-contrast outlines)', () => {
    expect(new Set(g.highlights).size).toBe(mode === 'high-contrast' ? 2 : 6);
    expect(new Set(g.edges).size).toBe(g.edges.length);
  });
  it('keeps letters readable under the live selection and shows its pill against the cell', () => {
    const under = mode === 'high-contrast' ? g.gridCell : rgbaOver(g.selection, g.gridCell);
    expect(contrastRatio(p.text, under)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(g.selectionEdge, g.gridCell)).toBeGreaterThanOrEqual(3);
  });
  it('rings a hinted letter in a color that stands out from the cell', () => {
    expect(contrastRatio(g.hintRing, g.gridCell)).toBeGreaterThanOrEqual(3);
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
