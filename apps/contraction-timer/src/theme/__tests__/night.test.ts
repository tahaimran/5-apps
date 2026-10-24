/**
 * Plan §7: Night mode is pure black with red only: no blue or green channel above ~30%, so nothing
 * in it washes out night vision or reads as white. This walks every Night value the app defines,
 * gradients and overlays included, so a new token cannot slip past.
 */
import { channels } from '../contrast';
import { appColors, palette } from '../tokens';

const LIMIT = 0.3;

/** Every color string inside a token object (arrays are gradients). */
const colorsIn = (prefix: string, value: unknown): [string, string][] => {
  if (typeof value === 'string') return /^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(value) ? [[prefix, value]] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => colorsIn(`${prefix}[${i}]`, v));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => colorsIn(prefix ? `${prefix}.${k}` : k, v));
  return [];
};

const night = [...colorsIn('palette', palette['high-contrast']), ...colorsIn('app', appColors['high-contrast'])];

it('finds the whole Night palette (gradients and overlays too)', () => {
  expect(night.length).toBeGreaterThan(40);
  expect(night.map(([k]) => k)).toEqual(expect.arrayContaining(['app.start[0]', 'app.wash[2]', 'app.frost', 'app.kickTrack', 'palette.background']));
});

it.each(night)('%s (%s) keeps blue and green at or under 30%%', (_name, hex) => {
  const { g, b } = channels(hex);
  expect(g).toBeLessThanOrEqual(LIMIT);
  expect(b).toBeLessThanOrEqual(LIMIT);
});

it('uses a pure black page (OLED)', () => {
  expect(palette['high-contrast'].background).toBe('#000000');
  expect(appColors['high-contrast'].wash[2]).toBe('#000000');
});
