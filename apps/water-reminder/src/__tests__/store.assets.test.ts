/** The store listing assets stay valid. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), 'utf8');

/** Width and height from a PNG header. */
function pngSize(file: string) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

describe('store graphics', () => {
  it.each([
    ['store/icon-512.png', 512, 512],
    ['store/feature-graphic-1024x500.png', 1024, 500],
    ['assets/icon.png', 1024, 1024],
    ['assets/adaptive-icon-foreground.png', 1024, 1024],
    ['assets/adaptive-icon-monochrome.png', 1024, 1024],
    ['assets/splash-icon.png', 1024, 1024],
  ])('%s is %ix%i', (file, w, h) => {
    expect(pngSize(file)).toEqual({ w, h });
  });
  it('keeps the Play icon under the 1 MB limit', () => {
    expect(fs.statSync(path.join(ROOT, 'store/icon-512.png')).size).toBeLessThan(1_000_000);
  });
});

describe('reminder sound', () => {
  it('is a short PCM wav', () => {
    const buf = fs.readFileSync(path.join(ROOT, 'assets/sounds/drop.wav'));
    expect(buf.subarray(0, 4).toString()).toBe('RIFF');
    expect(buf.subarray(8, 12).toString()).toBe('WAVE');
    expect(buf.length).toBeLessThan(100_000);
  });
});

describe('listing text (ASO.md)', () => {
  const aso = read('ASO.md');
  const row = (label: string) => aso.match(new RegExp(`\\*\\*${label}\\*\\* \\| \`([^\`]+)\``))?.[1] ?? '';
  it('fits the Play limits', () => {
    expect(row('Title')).toBe('Sipling: Drink Water Reminder');
    expect(row('Title').length).toBeLessThanOrEqual(30);
    expect(row('Short description').length).toBeLessThanOrEqual(80);
  });
  it('keeps "free" out of the title and short description (Play rejects it)', () => {
    expect(row('Title').toLowerCase()).not.toContain('free');
    expect(row('Short description').toLowerCase()).not.toContain('free');
  });
});
