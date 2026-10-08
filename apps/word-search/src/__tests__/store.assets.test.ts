/** Store-facing files: icon and graphic sizes, listing limits, and no text that belongs to another app. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const aso = fs.readFileSync(path.join(ROOT, 'ASO.md'), 'utf8');

/** The first fenced block under a heading that starts with `heading`. */
function block(heading: string): string {
  const start = aso.indexOf(heading);
  if (start < 0) throw new Error(`No heading ${heading}`);
  const open = aso.indexOf('```', start);
  const close = aso.indexOf('```', open + 3);
  return aso.slice(open + 3, close).trim();
}

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(path.join(ROOT, file));
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('store graphics', () => {
  it('has the sizes Google Play asks for', () => {
    expect(pngSize('store/icon-512.png')).toEqual({ width: 512, height: 512 });
    expect(pngSize('store/feature-graphic-1024x500.png')).toEqual({ width: 1024, height: 500 });
    expect(pngSize('assets/icon.png')).toEqual({ width: 1024, height: 1024 });
    expect(pngSize('assets/adaptive-icon-foreground.png')).toEqual({ width: 1024, height: 1024 });
    expect(pngSize('assets/adaptive-icon-monochrome.png')).toEqual({ width: 1024, height: 1024 });
  });
});

describe('ASO.md listing text', () => {
  const title = block('### App title');
  const short = block('### Short description');
  const full = block('### Full description');

  it('fits the Play limits', () => {
    expect(title).toBe('Word Search: Large Print Easy');
    expect(title.length).toBeLessThanOrEqual(30);
    expect(short.length).toBeLessThanOrEqual(80);
    expect(full.length).toBeLessThanOrEqual(4000);
  });
  it('keeps Play\'s banned words out of the title and the short description', () => {
    for (const bad of [/\bfree\b/i, /#1/, /\bbest\b/i, /\btop\b/i, /\bnew\b/i]) {
      expect(title).not.toMatch(bad);
      expect(short).not.toMatch(bad);
    }
  });
  it('is about this app: no text from the other four apps (the water-reminder file once held the wrong listing)', () => {
    for (const foreign of [/sipling/i, /quizora/i, /trivia/i, /hydrat/i, /contraction/i, /\bhabit/i, /pregnan/i, /\bwater\b/i, /\bquiz\b/i]) {
      expect(full).not.toMatch(foreign);
      expect(short).not.toMatch(foreign);
    }
    expect(full).toMatch(/word search/i);
    expect(full).toMatch(/large print|big letters/i);
  });
  it('names the Android package the app really has, if it names one anywhere', () => {
    const { promoPackages } = require('@shared/crosspromo/catalog') as typeof import('@shared/crosspromo/catalog');
    for (const match of aso.matchAll(/com\.fiveapps\.[a-z]+/g)) expect(Object.values(promoPackages)).toContain(match[0]);
  });
});
