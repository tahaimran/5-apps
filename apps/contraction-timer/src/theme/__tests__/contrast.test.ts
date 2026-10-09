import { defaultPalettes } from '@shared/theme/tokens';
import { contrastRatio } from '../contrast';
import { appColors, palette, NIGHT_SLOT } from '../tokens';

type Mode = 'light' | 'dark' | 'high-contrast';
const modes: Mode[] = ['light', 'dark', 'high-contrast'];
const merged = (mode: Mode) => ({ ...defaultPalettes[mode], ...palette[mode] });

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});

it('keeps the night palette in the shared high-contrast slot', () => {
  expect(NIGHT_SLOT).toBe('high-contrast');
  expect(palette['high-contrast']!.background).toBe('#000000');
  expect(palette['high-contrast']!.text).toBe('#FF6B5A'); // plan §7: ≈7:1 on black
});

describe.each(modes)('%s palette', (mode) => {
  const c = merged(mode);
  const a = appColors[mode];

  // Plan §7: body text is at least 4.5:1 (night's primary text is 7:1).
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
  ] as const)('body text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('the pattern banner text is at least 4.5:1 on its soft background', () => {
    expect(contrastRatio(a.alertText, a.alertBg)).toBeGreaterThanOrEqual(4.5);
  });

  // Button labels are 18sp bold or bigger (the giant button is 32sp), which WCAG counts as large text: 3:1.
  it.each([
    ['onPrimary', c.onPrimary, c.primary],
    ['onActive', a.onActive, a.active],
  ])('button label %s is at least 3:1 on its fill', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });

  // Controls need a visible edge (WCAG 1.4.11, 3:1 against what is around them).
  it.each([
    ['border', 'background'],
    ['border', 'surface'],
  ] as const)('non-text %s on %s is at least 3:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(3);
  });

  // The big buttons are filled and have a text-colored ring, so their edge is the ring (text on background, 7:1 or more);
  // night's dark red fill is too close to black to be an edge on its own.
  it('the ring around the big buttons is at least 4.5:1 against the background', () => {
    expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(4.5);
  });

  it('success and danger text reads on the surface', () => {
    expect(contrastRatio(c.success, c.surface)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.danger, c.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('night mode', () => {
  const night = merged('high-contrast');
  it('uses no blue and keeps green low in the colors the plan fixes', () => {
    for (const hex of [night.text, night.textMuted, night.primary, appColors['high-contrast'].active, appColors['high-contrast'].alertText]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(b).toBeLessThanOrEqual(0x6b); // the plan's own #FF6B5A is the limit
      expect(g).toBeLessThanOrEqual(0x82);
      expect(r).toBeGreaterThan(g);
    }
  });
});
