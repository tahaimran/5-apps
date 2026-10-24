import '@/testing/mocks';
import { insetTones } from '@shared/ui';
import { blend, contrastRatio, luminance } from '../contrast';
import { appColors, NIGHT_SLOT, palette } from '../tokens';

type Mode = 'light' | 'dark' | 'high-contrast';
const modes: Mode[] = ['light', 'dark', 'high-contrast'];

describe('contrast helpers', () => {
  it('matches known ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
  it('blends an overlay with its alpha', () => {
    expect(blend('#FFFFFF80', '#000000')).toBe('#808080');
    expect(blend('#FF0000', '#00FF00')).toBe('#FF0000');
  });
});

it('keeps the night palette in the shared high-contrast slot', () => {
  expect(NIGHT_SLOT).toBe('high-contrast');
  expect(palette['high-contrast'].background).toBe('#000000');
});

describe.each(modes)('%s palette', (mode) => {
  const c = palette[mode];
  const a = appColors[mode];

  // Plan §7: body text is at least 4.5:1 on every surface it sits on.
  it.each([
    ['text', 'background'],
    ['text', 'surface'],
    ['text', 'surfaceAlt'],
    ['textMuted', 'background'],
    ['textMuted', 'surface'],
    ['textMuted', 'surfaceAlt'],
    ['primary', 'surface'],
    ['primary', 'background'],
    ['primary', 'primarySoft'],
  ] as const)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it('the primary button label reads on its fill', () => {
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it('text and muted text read on every stop of the Timer wash, resting and contracting', () => {
    for (const stop of [...a.wash, ...a.washActive]) {
      expect(contrastRatio(c.text, stop)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, stop)).toBeGreaterThanOrEqual(4.5);
    }
  });

  // The button labels are 34sp bold or bigger (large text: 3:1), and the digits sit on the wash, not on the button.
  it('the Start and Stop labels read on both stops of their gradients', () => {
    for (const stop of a.start) expect(contrastRatio(a.onStart, stop)).toBeGreaterThanOrEqual(4.5);
    for (const stop of a.stop) expect(contrastRatio(a.onStop, stop)).toBeGreaterThanOrEqual(3);
  });

  it('the pattern banner (and every amber card) reads: text and icon on the soft background', () => {
    expect(contrastRatio(a.alertText, a.alertBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(a.alertIcon, a.alertBg)).toBeGreaterThanOrEqual(3);
  });

  it('the Kicks stage: its text on both stops, and under the frosted chips', () => {
    for (const stop of a.kickStage) {
      expect(contrastRatio(a.onKick, stop)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.onKick, blend(a.frost, stop))).toBeGreaterThanOrEqual(4.5);
      // The ring around the counter: 3:1 against the stage (WCAG 1.4.11).
      expect(contrastRatio(a.kickRing, stop)).toBeGreaterThanOrEqual(3);
    }
    expect(contrastRatio(a.onKickDisc, a.kickDisc)).toBeGreaterThanOrEqual(4.5);
  });

  it('the My Pregnancy hero: text, muted text and the ring on both stops', () => {
    for (const stop of a.hero) {
      expect(contrastRatio(a.onHero, stop)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.heroMuted, stop)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(a.heroRing, blend(a.heroTrack, stop))).toBeGreaterThanOrEqual(3);
    }
  });

  // Controls need a visible edge (WCAG 1.4.11, 3:1 against what is around them): the Switch's off track, outlines.
  it.each([
    ['border', 'background'],
    ['border', 'surface'],
  ] as const)('non-text %s on %s is at least 3:1', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(3);
  });

  it('the breathing ring stands out from the page (3:1)', () => {
    for (const stop of a.washActive) expect(contrastRatio(a.ring, stop)).toBeGreaterThanOrEqual(3);
  });

  it('coral as text reads on the surface and its soft tint', () => {
    expect(contrastRatio(a.activeText, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(a.activeText, a.activeSoft)).toBeGreaterThanOrEqual(4.5);
  });

  it('success and danger text read on the surface', () => {
    expect(contrastRatio(c.success, c.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.danger, c.surface)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('depth in dark and night modes', () => {
  it.each(['dark', 'high-contrast'] as const)('%s: each layer is lighter than the one under it', (mode) => {
    const c = palette[mode];
    expect(luminance(c.surface)).toBeGreaterThan(luminance(c.background));
    expect(luminance(c.surfaceAlt)).toBeGreaterThan(luminance(c.surface));
    // Segmented pills and stepper buttons: the raised part is lighter than its track.
    const { track, raised } = insetTones(c, mode);
    expect(luminance(raised)).toBeGreaterThan(luminance(track));
    // The counter disc is raised above the Kicks stage.
    const a = appColors[mode];
    expect(luminance(a.kickDisc)).toBeGreaterThan(Math.max(...a.kickStage.map(luminance)));
  });
  it('light: the raised part of an inset control is lighter than its track', () => {
    const { track, raised } = insetTones(palette.light, 'light');
    expect(luminance(raised)).toBeGreaterThan(luminance(track));
  });
});
