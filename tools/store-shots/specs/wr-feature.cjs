// Sipling feature graphic (1024×500), ASO.md §7: headline left; the app's real plant art (seed → sprout → bloom,
// SVG taken from the web render of src/components/Plant.tsx) on an island right; sky, waves and droplets as in the screenshots.
// usage: node wr-feature.cjs <out.png>
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const out = process.argv[2];
const fonts = fs.readFileSync(require('path').join(__dirname, '../web/fonts.css'), 'utf8');
const plants = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../raw/wr/plants.json'), 'utf8'));
const icon = `data:image/png;base64,${fs.readFileSync(require('path').join(__dirname, '../../../apps/water-reminder/store/icon-512.png')).toString('base64')}`;
const plant = (i, size, x, bottom) => `<div style="position:absolute;left:${x}px;bottom:${bottom}px;width:${size}px;height:${size}px">${plants[i].replace(/width="180" height="180"/, `width="${size}" height="${size}"`)}</div>`;

const DROP = 'M0 -40 C 14 -20 30 -4 30 14 C 30 31 17 42 0 42 C -17 42 -30 31 -30 14 C -30 -4 -14 -20 0 -40 Z';
const drop = (x, y, s, op = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${op}"><path d="${DROP}" fill="url(#dropG)"/><ellipse cx="-11" cy="6" rx="5" ry="11" fill="#fff" opacity=".8" transform="rotate(20 -11 6)"/></g>`;
const LEAF = 'M0 0 C 18 -30 52 -40 84 -30 C 72 2 36 18 0 0 Z';
const leaf = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="${LEAF}" fill="url(#leafG)"/></g>`;
const wave = (y, amp, per) => {
  let d = `M -20 ${y}`;
  for (let x = -20, k = 1; x < 1100; x += per / 2, k = -k) d += ` Q ${x + per / 4} ${y + amp * k} ${x + per / 2} ${y}`;
  return d + ' L 1100 520 L -20 520 Z';
};
let bubbles = '';
let seed = 5;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
for (let i = 0; i < 26; i++) {
  const x = rnd() * 1024, y = 445 + rnd() * 50, r = 3 + rnd() * 8;
  bubbles += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".15" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`;
}

const html = `<!doctype html><html><head><style>${fonts}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1024px;height:500px;overflow:hidden;font-family:Figtree}
.c{position:relative;width:1024px;height:500px;background:linear-gradient(180deg,#E9FAFF 0%,#BDEEFF 55%,#86D7FB 100%);overflow:hidden}
h1{position:absolute;left:64px;top:150px;font-family:Bricolage;font-weight:800;font-size:66px;line-height:1.02;letter-spacing:-1.5px;color:#0B2A4A}
h1 em{font-style:normal;color:#0E86E0}
.sub{position:absolute;left:66px;top:304px;font-weight:600;font-size:23px;color:#2C4C66}
.brand{position:absolute;left:64px;top:62px;display:flex;align-items:center;gap:16px;font-family:Bricolage;font-weight:800;font-size:36px;color:#0B2A4A}
.brand img{width:64px;height:64px;border-radius:16px;box-shadow:0 8px 20px rgba(200,90,20,.35)}
</style></head><body><div class="c">
<svg width="1024" height="500" style="position:absolute;inset:0">
  <defs>
    <radialGradient id="glow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2AA6F5"/><stop offset="1" stop-color="#0B4F9C"/></linearGradient>
    <linearGradient id="dropG" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#D5F6FF"/><stop offset=".5" stop-color="#6FD3FF"/><stop offset="1" stop-color="#2AA2F2"/></linearGradient>
    <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BF07A"/><stop offset="1" stop-color="#2FB25C"/></linearGradient>
    <linearGradient id="isle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8BE07C"/><stop offset="1" stop-color="#3FB45E"/></linearGradient>
  </defs>
  <circle cx="790" cy="150" r="260" fill="url(#glow)"/>
  <path d="${wave(430, 10, 300)}" fill="#7FD8FF" opacity=".6"/>
  <ellipse cx="790" cy="436" rx="250" ry="40" fill="#1E7A3E" opacity=".25"/>
  <path d="M 545 432 C 560 390 650 372 790 372 C 930 372 1020 390 1035 432 Z" fill="url(#isle)"/>
  <path d="M 560 418 C 600 396 700 386 790 386" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="${wave(442, 9, 220)}" fill="url(#sea)"/>
  <path d="M -20 442 ${Array.from({ length: 10 }, (_, i) => `Q ${-20 + i * 110 + 55} ${442 + (i % 2 ? -9 : 9)} ${-20 + (i + 1) * 110} 442`).join(' ')}" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>
  ${bubbles}
  ${drop(640, 120, 0.55, 0.9)}${drop(735, 70, 0.75)}${drop(905, 95, 0.6, 0.9)}${drop(990, 210, 0.45, 0.8)}
  ${leaf(520, 70, 0.6, -20)}${leaf(960, 300, 0.5, 200)}
</svg>
${plant(0, 150, 575, 70)}${plant(2, 190, 680, 70)}${plant(4, 240, 800, 70)}
<div class="brand"><img src="${icon}">Sipling</div>
<h1>Drink water.<br><em>Grow a plant.</em></h1>
<div class="sub">Gentle water reminders, private and offline</div>
</div></body></html>`;

(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-color-profile=srgb'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await b.close();
  console.log('wrote', out);
})();
