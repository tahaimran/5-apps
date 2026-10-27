// usage: node compose.cjs <spec.cjs> [only,names]
// Renders Play Store screenshots (1080x1920) from real UI captures.
// spec exports: { out, raw, theme: { captionColor, accent, subColor, font?, bodyFont? }, panorama(i,n) -> html (optional),
//   slides: [{ name, title: 'Text with *accent* words', sub, shot, statusBar: {bg, dark}, layout, phone: {x,y,w,rotate}, pops: [...], deco: html, extraShots: [...] }] }
// Pop: { shot?, crop: [x,y,w,h] in raw px, x, y, w, rotate?, radius?, shadow? } — x/y/w in canvas px.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const spec = require(path.resolve(process.argv[2]));
const only = process.argv[3] ? process.argv[3].split(',') : null;
const fontsCss = fs.readFileSync(require('path').join(__dirname, 'web/fonts.css'), 'utf8');
const W = 1080, H = 1920;
const RAW_W = 1082, RAW_H = 2402;

const uri = (f) => {
  const p = path.isAbsolute(f) ? f : path.join(spec.raw, f);
  return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
};
const cache = {};
const img = (f) => (cache[f] ??= uri(f));

function statusBar(sb = {}) {
  const c = sb.dark ? '#FFFFFF' : '#14141A';
  return `<div class="sb" style="background:${sb.bg || 'transparent'};color:${c}">
    <span class="sb-time">${spec.sbTime || '9:41'}</span>
    <span class="sb-icons">
      <svg width="34" height="34" viewBox="0 0 24 24"><path fill="${c}" d="M2 22h3v-4H2zm5 0h3v-8H7zm5 0h3V10h-3zm5 0h3V4h-3z"/></svg>
      <svg width="34" height="34" viewBox="0 0 24 24"><path fill="${c}" d="M12 20.5 1.5 8.2C4.4 5.6 8.1 4 12 4s7.6 1.6 10.5 4.2z"/></svg>
      <svg width="44" height="34" viewBox="0 0 30 16"><rect x="1" y="2" width="25" height="12" rx="3.5" fill="none" stroke="${c}" stroke-width="1.6"/><rect x="3.2" y="4.2" width="20.6" height="7.6" rx="2" fill="${c}"/><rect x="27" y="5.5" width="2" height="5" rx="1" fill="${c}"/></svg>
    </span></div>`;
}

// Phone: the screen holds a status bar strip, then the real capture.
function phone(s, p) {
  const w = p.w ?? 720;
  const bez = Math.round(w * 0.032);
  const sw = w - bez * 2; // screen width
  const scale = sw / 1080; // status-bar units are designed at 1080 wide
  const sbH = Math.round(96 * scale);
  const shotH = Math.round(sw * (RAW_H / RAW_W));
  const sh = sbH + shotH;
  const r = Math.round(w * 0.13);
  return `<div class="phone" style="left:${p.x}px;top:${p.y}px;width:${w}px;height:${sh + bez * 2}px;border-radius:${r}px;padding:${bez}px;transform:rotate(${p.rotate || 0}deg);${p.z ? `z-index:${p.z};` : ''}">
    <div class="btn b1" style="height:${Math.round(w * 0.16)}px;top:${Math.round(w * 0.42)}px"></div>
    <div class="btn b2" style="height:${Math.round(w * 0.28)}px;top:${Math.round(w * 0.66)}px"></div>
    <div class="screen" style="border-radius:${r - bez}px;height:${sh}px;background:${((p.statusBar || s.statusBar) || {}).bg || '#fff'}">
      <div style="height:${sbH}px;position:relative;z-index:2"><div style="transform:scale(${scale});transform-origin:0 0;width:1080px;height:96px">${statusBar(p.statusBar || s.statusBar)}</div></div>
      ${p.html ? `<div style="width:${sw}px;height:${shotH}px;position:relative">${p.html(sw, shotH, img)}</div>` : `<img src="${img(p.shot || s.shot)}" style="width:${sw}px;height:${shotH}px;display:block">`}
      <div class="cam" style="width:${Math.round(sw * 0.034)}px;height:${Math.round(sw * 0.034)}px;top:${Math.round(sbH * 0.32)}px"></div>
    </div>
  </div>`;
}

// Where a raw pixel lands on the canvas for a phone (before rotation).
function geom(p) {
  const w = p.w ?? 720, bez = Math.round(w * 0.032), sw = w - bez * 2;
  const sbH = Math.round(96 * (sw / 1080));
  return { ox: (p.x ?? 180) + bez, oy: (p.y ?? 520) + bez + sbH, k: sw / RAW_W };
}

function pop(s, q) {
  const [cx, cy, cw, ch] = q.crop;
  const k = q.w / cw;
  if (q.rr != null) q.radius = Math.round(q.rr * k);
  if (q.anchor) {
    const g = geom((s.phones && s.phones[0]) || s.phone || {});
    const mx = g.ox + (cx + cw / 2) * g.k, my = g.oy + (cy + ch / 2) * g.k;
    q.x = Math.round(mx - q.w / 2 + (q.dx || 0));
    q.y = Math.round(my - (ch * k) / 2 + (q.dy || 0));
  }
  return `<div class="pop" style="left:${q.x}px;top:${q.y}px;width:${q.w}px;height:${Math.round(ch * k)}px;border-radius:${q.radius ?? 40}px;
    background-image:url(${img(q.shot || s.shot)});background-size:${RAW_W * k}px ${RAW_H * k}px;background-position:${-cx * k}px ${-cy * k}px;
    transform:rotate(${q.rotate || 0}deg);${q.border ? `outline:${q.border};` : ''}${q.style || ''}"></div>`;
}

function title(t, accent) {
  return t.replace(/\*(.+?)\*/g, `<em style="color:${accent}">$1</em>`).replace(/\n/g, '<br>');
}

function slideHtml(s, i, n) {
  const th = { ...spec.theme, ...(s.theme || {}) };
  const phones = (s.phones || [{ ...(s.phone || {}) }]).map((p) => phone(s, { x: 180, y: 520, ...p }));
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontsCss}
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:${W}px;height:${H}px;overflow:hidden;font-family:${th.bodyFont || 'Figtree'},sans-serif}
  .canvas{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${th.bg}}
  .pano{position:absolute;top:0;left:${-i * W}px;width:${W * n}px;height:${H}px}
  .cap{position:absolute;left:0;right:0;top:${th.capTop ?? 120}px;padding:0 70px;text-align:${th.align || 'center'};z-index:5}
  .cap h1{font-family:${th.font || 'Bricolage'};font-weight:800;font-size:${s.size || th.size || 96}px;line-height:1.02;letter-spacing:-2px;color:${th.captionColor};${th.capShadow ? `text-shadow:${th.capShadow};` : ''}}
  .cap h1 em{font-style:normal}
  .cap p{margin-top:26px;font-family:${th.bodyFont || 'Figtree'};font-weight:600;font-size:${th.subSize || 44}px;line-height:1.25;color:${th.subColor}}
  .phone{position:absolute;background:linear-gradient(145deg,#2b2b33,#0c0c10 40%,#1d1d24);box-shadow:0 60px 120px -20px rgba(10,5,40,.55),0 25px 50px -10px rgba(10,5,40,.35),inset 0 0 0 3px #3a3a44,inset 0 0 0 6px #0a0a0d;z-index:3}
  .screen{position:relative;overflow:hidden;width:100%}
  .cam{position:absolute;left:50%;transform:translateX(-50%);background:#050507;border-radius:50%;box-shadow:inset 0 0 0 3px #15151c}
  .btn{position:absolute;right:-7px;width:8px;background:#22222a;border-radius:0 6px 6px 0}
  .sb{position:relative;width:1080px;height:96px;display:flex;align-items:center;justify-content:space-between;padding:10px 64px 0}
  .sb-time{font-family:Figtree;font-weight:600;font-size:38px}
  .sb-icons{display:flex;gap:8px;align-items:center}
  .pop{position:absolute;z-index:6;background-repeat:no-repeat;box-shadow:0 40px 80px -10px rgba(10,5,40,.45),0 12px 30px rgba(10,5,40,.25)}
  .deco{position:absolute;inset:0;pointer-events:none}
  </style></head><body><div class="canvas">
  ${spec.panorama ? `<div class="pano">${spec.panorama(i, n)}</div>` : ''}
  ${s.under || ''}
  <div class="cap"><h1>${title(s.title, th.accent)}</h1>${s.sub ? `<p>${s.sub}</p>` : ''}</div>
  ${phones.join('')}
  ${(s.pops || []).map((q) => pop(s, q)).join('')}
  ${s.deco ? `<div class="deco" style="z-index:7">${s.deco}</div>` : ''}
  </div></body></html>`;
}

(async () => {
  fs.mkdirSync((process.env.OUT || spec.out), { recursive: true });
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-color-profile=srgb'] });
  const page = await b.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const n = spec.slides.length;
  for (let i = 0; i < n; i++) {
    const s = spec.slides[i];
    if (only && !only.includes(s.name)) continue;
    await page.setContent(slideHtml(s, i, n), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const f = path.join((process.env.OUT || spec.out), `${String(i + 1).padStart(2, '0')}-${s.name}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H } });
    console.log('wrote', f);
  }
  await b.close();
})();
