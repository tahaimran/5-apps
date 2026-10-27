// Word Search feature graphic (1024x500), ASO.md §7, in the screenshots' Sky Garden art. Run from scratchpad/tools:
//   node ../specs/ws-feature.cjs
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const RAW = require('path').join(__dirname, '../raw/ws');
const OUT = require('path').join(__dirname, '../../../apps/word-search/store/feature-graphic-1024x500.png');
const b64 = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const fonts = fs.readFileSync(require('path').join(__dirname, '../web/fonts.css'), 'utf8');
const shot = b64(RAW + '/play-L.png');
const icon = b64(require('path').join(__dirname, '../../../apps/word-search/store/icon-512.png'));

const cloud = (x, y, k, o = 0.95) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity="${o}">
  <ellipse cx="0" cy="0" rx="150" ry="52"/><circle cx="-52" cy="-34" r="62"/><circle cx="40" cy="-56" r="80"/><circle cx="110" cy="-14" r="46"/></g>`;
const flower = (x, y, k, c) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M0 0 V40" stroke="#4B8F22" stroke-width="5"/>
  ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-14" rx="9" ry="14" fill="${c}" transform="rotate(${a})"/>`).join('')}<circle r="8" fill="#FFD45E"/></g>`;
const rays = Array.from({ length: 14 }, (_, i) => {
  const a = (i * (360 / 14) * Math.PI) / 180, x = 905, y = 92, r = 62;
  return `<line x1="${x + Math.cos(a) * r * 1.25}" y1="${y + Math.sin(a) * r * 1.25}" x2="${x + Math.cos(a) * r * 1.62}" y2="${y + Math.sin(a) * r * 1.62}" stroke="#FFC93C" stroke-width="10" stroke-linecap="round"/>`;
}).join('');

// Phone with the real game screen: 270 wide.
const PW = 262, BZ = 9, SW = PW - BZ * 2, SH = Math.round(SW * 2402 / 1082);
const html = `<!doctype html><html><head><style>${fonts}
*{margin:0;padding:0;box-sizing:border-box}body{width:1024px;height:500px;overflow:hidden}
.c{position:relative;width:1024px;height:500px;overflow:hidden;background:linear-gradient(180deg,#4FB9F2 0%,#94D8F8 55%,#D6F0FB 100%)}
.phone{position:absolute;left:690px;top:58px;width:${PW}px;padding:${BZ}px;border-radius:40px;background:linear-gradient(145deg,#2b2b33,#0c0c10 40%,#1d1d24);transform:rotate(7deg);box-shadow:0 30px 60px -10px rgba(10,30,70,.55),inset 0 0 0 2px #3a3a44}
.screen{border-radius:32px;overflow:hidden;height:${SH}px;background:url(${shot}) 0 0/${SW}px ${SH}px}
.pop{position:absolute;left:520px;top:300px;width:330px;height:${Math.round(330 * 445 / 1013)}px;border-radius:22px;border:5px solid #1D4F8F;
  background:url(${shot}) ${-33 * 330 / 1013}px ${-728 * 330 / 1013}px/${1082 * 330 / 1013}px ${2402 * 330 / 1013}px no-repeat;transform:rotate(-4deg);box-shadow:0 22px 40px rgba(10,30,70,.4)}
h1{position:absolute;left:150px;top:96px;font-family:Bricolage;font-weight:800;font-size:62px;line-height:1;letter-spacing:-1.5px;color:#13233F;text-shadow:0 3px 18px rgba(255,255,255,.6)}
h1 em{font-style:normal;color:#E0591F}
p{position:absolute;left:152px;top:252px;font-family:Figtree;font-weight:700;font-size:25px;color:#1D3B66}
.icon{position:absolute;left:44px;top:100px;width:88px;height:88px;border-radius:22px;box-shadow:0 12px 26px rgba(10,30,70,.35)}
</style></head><body><div class="c">
<svg width="1024" height="500" style="position:absolute;inset:0">
  <defs><radialGradient id="s" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#FFC93C"/></radialGradient>
  <filter id="g"><feGaussianBlur stdDeviation="26"/></filter></defs>
  <circle cx="905" cy="92" r="140" fill="#FFF6C8" opacity=".5" filter="url(#g)"/>${rays}<circle cx="905" cy="92" r="62" fill="url(#s)" stroke="#F0A81E" stroke-width="3"/>
  ${cloud(80, 420, 0.6)}${cloud(560, 90, 0.45, 0.9)}${cloud(1010, 300, 0.5, 0.9)}
  <path d="M0 430 C200 380 380 420 520 445 C680 470 820 400 1024 420 V500 H0Z" fill="#C6E8AE"/>
  <path d="M0 470 C220 430 420 470 600 485 C780 500 900 455 1024 460 V500 H0Z" fill="#9ED37E"/>
  ${flower(40, 470, 0.7, '#FF8FA3')}${flower(300, 462, 0.6, '#fff')}${flower(470, 478, 0.7, '#FFD45E')}${flower(990, 470, 0.7, '#CDB6F0')}
</svg>
<img class="icon" src="${icon}">
<h1>Large Print<br><em>Word Search</em></h1>
<p>Big letters · No timers · Play offline</p>
<div class="phone"><div class="screen"></div></div>
<div class="pop"></div>
</div></body></html>`;

(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await b.close();
  console.log('wrote', OUT);
})();
