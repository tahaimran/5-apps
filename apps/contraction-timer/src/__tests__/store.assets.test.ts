/** Store-facing files: icon and graphic sizes, listing limits, and no text that belongs to another app. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const aso = fs.readFileSync(path.join(ROOT, 'ASO.md'), 'utf8');

/** What Google Play counts: UTF-16 code units (an emoji costs 2). */
const playLength = (s: string) => Buffer.from(s, 'utf16le').length / 2;

/** The first fenced block under a heading that starts with `heading`. */
function block(heading: string): string {
  const start = aso.indexOf(heading);
  if (start < 0) throw new Error(`No heading ${heading}`);
  const open = aso.indexOf('```', start);
  const close = aso.indexOf('```', open + 3);
  return aso.slice(open + 3, close).trim();
}

/** A value from the "Final metadata" table: `| **Title** | `…` | …`. */
function tableValue(field: string): string {
  const m = new RegExp(`\\|\\s*\\*\\*${field}\\*\\*\\s*\\|\\s*\`([^\`]+)\``).exec(aso);
  if (!m) throw new Error(`No ${field} row`);
  return m[1];
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
    expect(pngSize('assets/splash-icon.png')).toEqual({ width: 1024, height: 1024 });
  });
});

describe('ASO.md listing text', () => {
  const title = tableValue('Title');
  const short = tableValue('Short description');
  const full = block('### 1.1 Full description');

  it('fits the Play limits (title 30, short description 80, full description 4000, counted as Play counts)', () => {
    expect(title).toBe('Contraction Timer & Kick Count');
    expect(playLength(title)).toBeLessThanOrEqual(30);
    expect(playLength(short)).toBeLessThanOrEqual(80);
    expect(playLength(full)).toBeLessThanOrEqual(4000);
  });
  it('keeps Play\'s banned words out of the title and the short description', () => {
    for (const bad of [/\bfree\b/i, /#1/, /\bbest\b/i, /\btop\b/i, /\bnew\b/i]) {
      expect(title).not.toMatch(bad);
      expect(short).not.toMatch(bad);
    }
  });
  it('has no emoji or ALL-CAPS words in the title or the short description', () => {
    expect(title).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(short).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(title.split(/\s+/).some((w) => w.length > 3 && w === w.toUpperCase())).toBe(false);
  });
  it('is about this app: no text from the other four apps (the water-reminder file once held the wrong listing)', () => {
    for (const foreign of [/sipling/i, /quizora/i, /trivia/i, /\bhabit/i, /word search/i, /hydrat/i, /\bwater\b/i, /\bquiz\b/i, /\bstreak/i, /\bpuzzle/i, /\bcrossword/i]) {
      expect(title).not.toMatch(foreign);
      expect(short).not.toMatch(foreign);
      expect(full).not.toMatch(foreign);
    }
    expect(full).toMatch(/contraction timer/i);
    expect(full).toMatch(/kick counter/i);
    expect(full).toMatch(/due date calculator/i);
  });
  it('makes no promise to detect, predict or diagnose labor, in the title, the short description or the full description', () => {
    for (const bad of [/\bdetects? labou?r/i, /\bpredicts? labou?r/i, /\bdiagnos(es|is) (labou?r|you)/i, /tells you when to go/i, /know when you(?:'|’)re in labou?r/i]) {
      expect(title + short + full).not.toMatch(bad);
    }
  });
  it('carries the disclaimer the plan asks for, and the provider advice for worrying signs', () => {
    expect(full).toMatch(/not a medical device/i);
    expect(full).toMatch(/not .*medical advice/i);
    expect(full).toMatch(/contact your provider or emergency services right away/i);
  });
  it('names the Android package the app really has, if it names one of ours anywhere', () => {
    const { promoPackages } = require('@shared/crosspromo/catalog') as typeof import('@shared/crosspromo/catalog');
    for (const match of aso.matchAll(/com\.fiveapps\.[a-z]+/g)) expect(Object.values(promoPackages)).toContain(match[0]);
  });
});
