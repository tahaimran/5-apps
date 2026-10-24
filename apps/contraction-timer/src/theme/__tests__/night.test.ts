import '@/testing/mocks';
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

describe('the week drawings in Night mode', () => {
  // The drawings call their tone function for every color they paint; record them all.
  const { DRAWINGS, nightTone } = require('@/features/pregnancy/drawings') as typeof import('@/features/pregnancy/drawings');
  const used = new Set<string>();
  for (const draw of Object.values(DRAWINGS)) draw((hex) => (used.add(hex), hex));

  it('paints with a real palette', () => {
    expect(used.size).toBeGreaterThan(40);
  });
  it.each([...used])('%s becomes a Night red with blue and green at or under 30%%', (hex) => {
    const { r, g, b } = channels(nightTone(hex));
    expect(g).toBeLessThanOrEqual(LIMIT);
    expect(b).toBeLessThanOrEqual(LIMIT);
    expect(r).toBeGreaterThan(g);
  });
  it('keeps lightness order (a pale color stays lighter than a dark one) without reaching full red', () => {
    expect(channels(nightTone('#FFFFFF')).r).toBeGreaterThan(channels(nightTone('#3E2A1C')).r);
    expect(channels(nightTone('#FFFFFF')).r).toBeLessThan(0.9);
  });
});
