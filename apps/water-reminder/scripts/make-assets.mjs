// Renders the app icon set, store graphics and the reminder sound.
//   node scripts/make-assets.mjs
// Needs Playwright with Chromium (PLAYWRIGHT_BROWSERS_PATH). No network access.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? '/opt/node-tools/node_modules/playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BLUE_TOP = '#5BB8F5';
const BLUE_BOTTOM = '#1572B6';

// A water drop with a two-leaf sprout. Designed on a 1024 canvas, centred.
const drop = (id, { fill, leaf }) => `
  <defs>
    <linearGradient id="${id}-d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CDEBFB"/>
    </linearGradient>
  </defs>
  <path d="M512 150 C 600 290 740 420 740 590 C 740 722 640 820 512 820 C 384 820 284 722 284 590
           C 284 420 424 290 512 150 Z" fill="${fill ?? `url(#${id}-d)`}"/>
  <path d="M512 700 L512 560" stroke="${leaf}" stroke-width="30" stroke-linecap="round" fill="none"/>
  <path d="M512 590 C 512 500 440 470 400 478 C 400 548 450 596 512 590 Z" fill="${leaf}"/>
  <path d="M512 570 C 512 480 584 450 630 458 C 630 530 576 580 512 570 Z" fill="${leaf}"/>`;

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const bg = (w, h) => `
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
    <stop offset="0" stop-color="${BLUE_TOP}"/><stop offset="1" stop-color="${BLUE_BOTTOM}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>`;
const scaled = (s, inner) => `<g transform="translate(${512 - 512 * s} ${512 - 512 * s}) scale(${s})">${inner}</g>`;

const LEAF = '#2E9E5B';
const icon = svg(1024, 1024, bg(1024, 1024) + scaled(1.05, drop('a', { leaf: LEAF })));
// Adaptive icons keep important art inside the central 66%.
const adaptiveFg = svg(1024, 1024, scaled(0.72, drop('b', { leaf: LEAF })));
const monochrome = svg(1024, 1024, scaled(0.72, drop('c', { fill: '#000000', leaf: '#FFFFFF' })));
const splash = svg(1024, 1024, scaled(0.8, drop('d', { fill: '#2B9FE6', leaf: '#FFFFFF' })));

const bubbles = [];
for (let i = 0; i < 18; i++) {
  const r = 8 + ((i * 7) % 22);
  bubbles.push(`<circle cx="${620 + ((i * 53) % 380)}" cy="${40 + ((i * 89) % 420)}" r="${r}" fill="#fff" fill-opacity="${0.08 + ((i * 3) % 10) / 60}"/>`);
}
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  ${bg(1024, 500)}
  ${bubbles.join('')}
  <g transform="translate(640 80) scale(0.34)">${drop('e', { leaf: LEAF })}</g>
  <text x="64" y="215" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="800" font-size="92" fill="#fff">Sipling</text>
  <text x="66" y="290" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="600" font-size="38" fill="#fff" fill-opacity="0.94">Water reminder that grows a plant</text>
</svg>`;

const jobs = [
  ['assets/icon.png', icon, 1024, 1024, false],
  ['assets/adaptive-icon-foreground.png', adaptiveFg, 1024, 1024, true],
  ['assets/adaptive-icon-monochrome.png', monochrome, 1024, 1024, true],
  ['assets/splash-icon.png', splash, 1024, 1024, true],
  ['store/icon-512.png', icon, 512, 512, false],
  ['store/feature-graphic-1024x500.png', feature, 1024, 500, false],
];

mkdirSync(resolve(root, 'assets/sounds'), { recursive: true });
mkdirSync(resolve(root, 'store'), { recursive: true });
const browser = await chromium.launch();
for (const [file, markup, w, h, transparent] of jobs) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup.replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`)}</body></html>`);
  await page.screenshot({ path: resolve(root, file), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  console.log('wrote', file);
}
await browser.close();

// drop.wav: a short falling "plink" (sine, 880 -> 520 Hz, fast decay), 16-bit mono 22.05 kHz.
const rate = 22050;
const samples = Math.floor(rate * 0.45);
const pcm = Buffer.alloc(samples * 2);
let phase = 0;
for (let i = 0; i < samples; i++) {
  const t = i / rate;
  const freq = 520 + 360 * Math.exp(-t * 9);
  phase += (2 * Math.PI * freq) / rate;
  const envelope = Math.min(1, t * 400) * Math.exp(-t * 8);
  pcm.writeInt16LE(Math.round(Math.sin(phase) * envelope * 0.6 * 32767), i * 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);
writeFileSync(resolve(root, 'assets/sounds/drop.wav'), Buffer.concat([header, pcm]));
console.log('wrote assets/sounds/drop.wav');
writeFileSync(resolve(root, 'assets/.generated'), 'Generated by scripts/make-assets.mjs\n');
