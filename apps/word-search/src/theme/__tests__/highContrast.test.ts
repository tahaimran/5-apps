import '@/testing/mocks';
/**
 * Plan §7.1: high contrast is black, white and yellow (with cyan, green and orange only as the second
 * outline, the success mark and the hint ring), AAA everywhere. This walks every high-contrast value the
 * app defines, gradients and overlays included, so a new token cannot slip a soft color in.
 */
import { contrastRatio } from '../contrast';
import { appColors, gameColors, palette } from '../tokens';

const ALLOWED = new Set(['#000000', '#FFFFFF', '#FFFF00', '#00FFFF', '#00FF00', '#FFA500']);

/** Every color string inside a token object (arrays are gradients), with its path. */
const colorsIn = (prefix: string, value: unknown): [string, string][] => {
  if (typeof value === 'string') return /^(#[0-9A-F]{6}([0-9A-F]{2})?|rgba\()/i.test(value) ? [[prefix, value]] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => colorsIn(`${prefix}[${i}]`, v));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => colorsIn(prefix ? `${prefix}.${k}` : k, v));
  return [];
};

const all = [...colorsIn('palette', palette['high-contrast']), ...colorsIn('app', appColors['high-contrast']), ...colorsIn('game', gameColors['high-contrast'])];
/** The solid color of a token: #RRGGBB, an #RRGGBBAA (fully transparent ones are "nothing drawn"), or rgba(). */
const solid = (value: string): string | null => {
  if (value.startsWith('rgba(')) {
    const [r, g, b] = value.match(/[\d.]+/g)!.map(Number);
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  }
  if (value.length === 9 && value.slice(7).toUpperCase() === '00') return null;
  return value.slice(0, 7).toUpperCase();
};

it('finds the whole high-contrast palette (gradients and overlays too)', () => {
  expect(all.length).toBeGreaterThan(45);
  expect(all.map(([k]) => k)).toEqual(expect.arrayContaining(['app.stage[2]', 'app.go[0]', 'app.frost', 'game.highlights[1]', 'game.selection', 'palette.background']));
});

it.each(all)('%s (%s) is black, white, yellow, or one of the three marker colors', (_name, value) => {
  const hex = solid(value);
  if (hex === null) return;
  expect(ALLOWED.has(hex)).toBe(true);
});

it('has no sky: every stage stop is pure black', () => {
  expect(appColors['high-contrast'].stage).toEqual(['#000000', '#000000', '#000000']);
});

it('puts every label and mark AAA (7:1) on black', () => {
  const p = palette['high-contrast'];
  for (const fg of [p.text, p.textMuted, p.primary, p.success, p.accent, appColors['high-contrast'].onRibbon, appColors['high-contrast'].onGo]) {
    expect(contrastRatio(fg, '#000000')).toBeGreaterThanOrEqual(7);
  }
});

describe('the pack drawings in high contrast', () => {
  // The drawings call their tone function for every color they paint; record them all.
  const { PACK_DRAWINGS, SCENE_DRAWINGS, contrastTone } = require('@/features/packs/drawings') as typeof import('@/features/packs/drawings');
  const used = new Set<string>();
  for (const draw of [...Object.values(PACK_DRAWINGS), ...Object.values(SCENE_DRAWINGS)]) draw((hex) => (used.add(hex), hex));

  it('paints with a real palette', () => {
    expect(used.size).toBeGreaterThan(40);
  });
  it.each([...used])('%s becomes a yellow (red = green, no blue)', (hex) => {
    const out = contrastTone(hex);
    expect(out.slice(1, 3)).toBe(out.slice(3, 5));
    expect(out.slice(5, 7)).toBe('00');
    // Never darker than a deep olive, so a shape never vanishes into the black page.
    expect(contrastRatio(out, '#000000')).toBeGreaterThanOrEqual(3);
  });
  it('keeps lightness order (a pale color stays lighter than a dark one)', () => {
    expect(contrastRatio(contrastTone('#FFFFFF'), '#000000')).toBeGreaterThan(contrastRatio(contrastTone('#13233F'), '#000000'));
  });
});
