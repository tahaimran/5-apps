/** Store-facing files: icon and graphic sizes, listing limits, no text that belongs to another app, no unbuilt features. */
import * as fs from 'fs';
import * as path from 'path';
import { getBank } from '@/content/bank';

const ROOT = path.resolve(__dirname, '../..');
const aso = fs.readFileSync(path.join(ROOT, 'ASO.md'), 'utf8');

/** The back-ticked value in a metadata table row such as `| **Title** | \`...\` | 28 / 30 |`. */
function tableValue(field: string): string {
  const line = aso.split('\n').find((l) => l.startsWith(`| **${field}**`));
  if (!line) throw new Error(`No row ${field}`);
  const m = /`([^`]+)`/.exec(line);
  if (!m) throw new Error(`No value in row ${field}`);
  return m[1];
}

/** The first fenced block after a heading. */
function block(heading: string): string {
  const start = aso.indexOf(heading);
  if (start < 0) throw new Error(`No heading ${heading}`);
  const open = aso.indexOf('```', start);
  const close = aso.indexOf('```', open + 3);
  return aso.slice(open + 3, close).trim();
}

/** Play counts UTF-16 code units, which is what String.length returns. */
const utf16 = (s: string) => s.length;

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
  const title = tableValue('Title');
  const short = tableValue('Short description');
  const full = block('### Full description');

  it('fits the Play limits and matches what ASO.md says about itself', () => {
    expect(title).toBe('Quizora: Trivia Quiz Offline');
    expect(utf16(title)).toBeLessThanOrEqual(30);
    expect(utf16(short)).toBeLessThanOrEqual(80);
    expect(utf16(full)).toBeLessThanOrEqual(4000);
    expect(aso).toContain(`${utf16(title)} / 30`);
    expect(aso).toContain(`${utf16(short)} / 80`);
  });

  it("keeps Play's banned words, emoji and shouting out of the title and the short description", () => {
    for (const bad of [/\bfree\b/i, /#1/, /\bbest\b/i, /\btop\b/i, /\bnew\b/i, /\p{Extended_Pictographic}/u]) {
      expect(title).not.toMatch(bad);
      expect(short).not.toMatch(bad);
    }
    expect(title).not.toMatch(/\b[A-Z]{4,}\b/);
    expect(short).not.toMatch(/\b[A-Z]{4,}\b/);
  });

  it('is about this app: no text from the other four apps', () => {
    for (const foreign of [/sipling/i, /hydrat/i, /\bwater\b/i, /contraction/i, /pregnan/i, /\blabor\b/i, /\bhabit/i, /word search/i, /large print/i, /\bgrid\b/i, /\bmeditat/i]) {
      expect(full).not.toMatch(foreign);
      expect(short).not.toMatch(foreign);
      expect(title).not.toMatch(foreign);
    }
    expect(full).toMatch(/Quizora/);
    expect(full).toMatch(/trivia quiz/i);
    expect(full).toMatch(/offline/i);
  });

  it('names the Android package the app really has, if it names one anywhere', () => {
    const { promoPackages } = require('@shared/crosspromo/catalog') as typeof import('@shared/crosspromo/catalog');
    for (const match of aso.matchAll(/com\.fiveapps\.[a-z]+/g)) expect(Object.values(promoPackages)).toContain(match[0]);
  });

  it('does not advertise v1.1 or v2 features, earning money or an account', () => {
    for (const unbuilt of [/pass\s*&\s*play/i, /pass and play/i, /IQ test/i, /achievement/i, /badge/i, /picture round/i, /widget/i, /weekly/i, /leaderboard/i, /multiplayer/i, /earn money/i, /sign[- ]?in\b/i, /remove ads/i]) {
      expect(full).not.toMatch(unbuilt);
      expect(short).not.toMatch(unbuilt);
    }
  });

  it('promises no more questions than the bank holds, and the 12 categories it names exist', () => {
    const promised = Number(/([\d,]+)\+ (?:general knowledge )?questions/i.exec(full)?.[1].replace(',', ''));
    expect(promised).toBeLessThanOrEqual(getBank().all.length);
    expect(full).toMatch(/12 CATEGORIES/);
  });

  it('names only game modes that are built', () => {
    for (const mode of [/Classic levels: 30 levels per category/, /Category play/, /Timed Blitz: answer as many as you can in 60 seconds/, /50\/50/, /DAILY TRIVIA CHALLENGE/]) expect(full).toMatch(mode);
    expect(full).toMatch(/streak freezes/);
    expect(full).toMatch(/relaxed mode with no timer/);
    expect(full).toMatch(/No ads while you answer questions/);
  });
});
