// Word Search: Large Print Easy — Play Store screenshots (ASO.md §6), "Sky Garden" panorama.
const RAW = require('path').join(__dirname, '../raw/ws');
const W = 1080, H = 1920, N = 8;
const TW = W * N;
const ICON = require('path').join(__dirname, '../../../apps/word-search/store/icon-512.png');

let seed = 5;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const INK = '#13233F';
const cloud = (x, y, k, o = 0.95) => `<g transform="translate(${x} ${y}) scale(${k})" fill="#fff" opacity="${o}">
  <ellipse cx="0" cy="0" rx="150" ry="52"/><circle cx="-52" cy="-34" r="62"/><circle cx="40" cy="-56" r="80"/><circle cx="110" cy="-14" r="46"/></g>`;
const tile = (x, y, s, ch, rot, pill = null) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <rect x="${-s / 2 + 4}" y="${-s / 2 + 10}" width="${s}" height="${s}" rx="${s * 0.22}" fill="#0B2A55" opacity=".18"/>
  <rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" rx="${s * 0.22}" fill="${pill || '#FFFDF6'}" stroke="${pill ? '#D2593A' : '#1D4F8F'}" stroke-width="${s * 0.06}"/>
  <text x="0" y="${s * 0.25}" text-anchor="middle" font-family="Atkinson" font-weight="700" font-size="${s * 0.66}" fill="${INK}">${ch}</text></g>`;
const flower = (x, y, k, c) => `<g transform="translate(${x} ${y}) scale(${k})">
  <path d="M0 0 V40" stroke="#4B8F22" stroke-width="5"/>
  ${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-14" rx="9" ry="14" fill="${c}" transform="rotate(${a})"/>`).join('')}
  <circle r="8" fill="#FFD45E"/></g>`;
const bird = (x, y, k) => `<path transform="translate(${x} ${y}) scale(${k})" d="M-20 0 Q-10 -12 0 0 Q10 -12 20 0" fill="none" stroke="#2A5F94" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
const leaf = (x, y, k, rot, c = '#7FC25C') => `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" d="M0 0 C20 -30 60 -30 80 0 C60 30 20 30 0 0Z" fill="${c}"/><path transform="translate(${x} ${y}) rotate(${rot}) scale(${k})" d="M4 0 H70" stroke="#4B8F22" stroke-width="3" opacity=".6"/>`;

function sun(x, y, r) {
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a = (i * (360 / 14) * Math.PI) / 180;
    return `<line x1="${x + Math.cos(a) * r * 1.25}" y1="${y + Math.sin(a) * r * 1.25}" x2="${x + Math.cos(a) * r * 1.62}" y2="${y + Math.sin(a) * r * 1.62}" stroke="#FFC93C" stroke-width="${r * 0.16}" stroke-linecap="round"/>`;
  }).join('');
  return `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="#FFF6C8" opacity=".55" filter="url(#glow)"/>${rays}
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#sunG)" stroke="#F0A81E" stroke-width="${r * 0.05}"/>`;
}

function hills() {
  // Two continuous rolling layers along the whole strip.
  const layer = (base, amp, phase, color) => {
    let d = `M0 ${H} L0 ${base}`;
    const step = 540;
    for (let x = 0; x <= TW; x += step) {
      const y = base + Math.sin((x / step) * 1.3 + phase) * amp;
      d += ` S ${x + step / 2} ${y - amp * 0.6}, ${x + step} ${y}`;
    }
    return `<path d="${d} L${TW} ${H} Z" fill="${color}"/>`;
  };
  return layer(1620, 60, 0, '#C6E8AE') + layer(1720, 50, 2, '#9ED37E') + layer(1820, 40, 4, '#7FC25C');
}

function panorama() {
  let deco = '';
  // clouds
  const cl = [[60, 1260, 0.9], [980, 400, 0.7], [1500, 1320, 1], [2250, 520, 0.8], [2900, 1250, 0.9], [3500, 430, 0.75], [4100, 1300, 1], [4700, 500, 0.8],
    [5300, 1250, 0.9], [5950, 420, 0.75], [6500, 1300, 1], [7150, 480, 0.8], [7800, 1260, 0.9], [8450, 420, 0.7]];
  deco += cl.map(([x, y, k]) => cloud(x, y, k)).join('');
  // birds
  for (let i = 0; i < 18; i++) deco += bird(rnd() * TW, 460 + rnd() * 260, 0.8 + rnd() * 0.8);
  // floating letter tiles on the sky edges (around the phone, outside the caption)
  const letters = 'WORDSEARCHBIGLETTERSCALMPLAYSUNNYGARDEN';
  for (let i = 0; i < N; i++) {
    const L = letters.slice(i * 4, i * 4 + 4);
    deco += tile(i * W + 70, 760 + (i % 3) * 120, 96, L[0], -12);
    deco += tile(i * W + 1010, 980 + (i % 2) * 140, 84, L[1], 10, i % 2 ? '#FFAE94' : null);
  }
  // flowers and leaves on the hills
  const fc = ['#FF8FA3', '#FFFFFF', '#FFD45E', '#CDB6F0', '#FFAE94'];
  for (let i = 0; i < 70; i++) deco += flower(rnd() * TW, 1700 + rnd() * 200, 0.8 + rnd() * 0.7, fc[i % fc.length]);
  for (let i = 0; i < 26; i++) deco += leaf(rnd() * TW, 1640 + rnd() * 120, 0.6 + rnd() * 0.5, -30 + rnd() * 60);
  return `<svg width="${TW}" height="${H}" viewBox="0 0 ${TW} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
  <defs>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FB9F2"/><stop offset=".45" stop-color="#94D8F8"/><stop offset=".8" stop-color="#D6F0FB"/><stop offset="1" stop-color="#EAF7FC"/></linearGradient>
    <radialGradient id="sunG" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#FFC93C"/></radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>
  <rect width="${TW}" height="${H}" fill="url(#skyG)"/>
  ${sun(1050, 560, 120)}${sun(5400, 600, 90)}
  ${hills()}
  ${deco}
  </svg>`;
}

const svg = (inner) => `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0">${inner}</svg>`;
const tag = (x, y, text, rot = 0, bg = '#FFC93C', fg = '#4A2C00') =>
  `<div style="position:absolute;left:${x}px;top:${y}px;transform:rotate(${rot}deg);background:${bg};color:${fg};font-family:Bricolage;font-weight:800;font-size:46px;padding:10px 30px;border-radius:999px;box-shadow:0 14px 30px rgba(11,42,85,.28);z-index:8">${text}</div>`;

// Airplane-mode quick tile and Wi-Fi off chip, as art (slide 4).
const plane = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M2 16.5 21 12 2 7.5l3 4.5z" fill="#fff"/></g>`;
const offline = `
  <div style="position:absolute;left:520px;top:1120px;z-index:8;transform:rotate(5deg);display:flex;align-items:center;gap:22px;background:#1F5FAF;border-radius:999px;padding:22px 40px 22px 26px;box-shadow:0 24px 50px rgba(11,42,85,.4)">
    <div style="width:92px;height:92px;border-radius:50%;background:#FFC93C;display:flex;align-items:center;justify-content:center">
      <svg width="58" height="58" viewBox="0 0 24 24"><path fill="#4A2C00" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>
    </div>
    <div style="font-family:Bricolage;font-weight:800;font-size:46px;color:#fff;line-height:1">Airplane mode<div style="font-family:Figtree;font-weight:700;font-size:30px;opacity:.9;margin-top:6px">Still playing</div></div>
  </div>
  <div style="position:absolute;left:60px;top:1500px;z-index:8;transform:rotate(-5deg);display:flex;align-items:center;gap:16px;background:#fff;border-radius:999px;padding:18px 34px 18px 22px;box-shadow:0 20px 40px rgba(11,42,85,.3)">
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#13233F" stroke-width="2.4" stroke-linecap="round"><path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2-1.5M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8a15 15 0 0 0-11.3-3.8M2 2l20 20" /></svg>
    <span style="font-family:Bricolage;font-weight:800;font-size:44px;color:#13233F">No Wi-Fi needed</span>
  </div>`;

// A calm cup of tea (slide 3)
const cup = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">
  <ellipse cx="0" cy="98" rx="96" ry="16" fill="#0B2A55" opacity=".16"/>
  <path d="M-70 0 L70 0 L58 92 Q56 104 42 104 L-42 104 Q-56 104 -58 92 Z" fill="#FF8F6B"/>
  <path d="M-70 0 L70 0 L68 20 L-68 20 Z" fill="#FFAE94"/>
  <path d="M66 26 C116 22 118 84 58 82" stroke="#FF8F6B" stroke-width="16" fill="none" stroke-linecap="round"/>
  <ellipse cx="0" cy="0" rx="70" ry="14" fill="#8A4B23"/>
  <path d="M-22 -26 C-38 -50 -4 -60 -22 -88 M18 -24 C2 -48 34 -58 18 -86" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".9"/></g>`;

module.exports = {
  raw: RAW,
  out: require('path').join(__dirname, '../../../apps/word-search/store/screenshots'),
  theme: { bg: '#94D8F8', captionColor: INK, accent: '#E0591F', subColor: '#1D3B66', size: 104, subSize: 46, capShadow: '0 4px 24px rgba(255,255,255,.65)' },
  panorama,
  slides: [
    {
      name: 'big-letters', title: 'Big Letters.\n*Easy to Read.*', sub: 'Word search in large print',
      shot: 'play-L.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [33, 728, 1013, 445], x: 30, y: 1250, w: 1020, rotate: -3, radius: 40, style: 'border:8px solid #1D4F8F;' }],
    },
    {
      name: 'letter-size', title: 'Pick Your\n*Letter Size*', sub: 'From comfortable to huge',
      shot: 'settings.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 40, y: 600, w: 660, rotate: -4 },
      pops: [
        { shot: 'play-C.png', crop: [33, 402, 1015, 1012], x: 590, y: 700, w: 420, rotate: 5, radius: 34 },
        { shot: 'play-H.png', crop: [28, 499, 1026, 1018], x: 470, y: 1250, w: 580, rotate: -3, radius: 40 },
      ],
      under: tag(650, 1135, 'Comfortable', 5) + tag(700, 1830, 'Huge', -3, '#1F5FAF', '#fff'),
    },
    {
      name: 'no-timers', title: 'No Timers.\n*No Pressure.*', sub: 'Play at your own pace',
      shot: 'play-food.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [33, 1531, 1013, 420], x: 40, y: 1330, w: 820, rotate: -3, radius: 44 }],
      deco: svg(cup(900, 1430, 1.3)),
    },
    {
      name: 'offline', title: 'Play Offline,\n*Anywhere*', sub: 'Unlimited puzzles, no Wi-Fi needed',
      shot: 'home.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 175, y: 560, w: 730 },
      deco: offline + svg(`<path d="M40 900 C180 820 260 980 380 880" stroke="#fff" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round" fill="none" opacity=".9"/>${plane(400, 860, 5, -25)}`),
    },
    {
      name: 'packs', title: '*12* Themed\nWord Packs', sub: 'Animals, food, travel, holidays and more',
      shot: 'home-scroll.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 175, y: 560, w: 730 },
      pops: [
        { crop: [44, 325, 477, 485], x: 20, y: 1010, w: 380, rotate: -6, radius: 40 },
        { crop: [44, 1359, 477, 483], x: 650, y: 1330, w: 380, rotate: 6, radius: 40 },
      ],
    },
    {
      name: 'daily', title: 'A New Puzzle\n*Every Day*', sub: 'Build your daily streak',
      shot: 'daily-scroll.png', statusBar: { bg: '#BFE6F8' }, phone: { x: 175, y: 560, w: 730 },
      pops: [
        { shot: 'complete.png', crop: [132, 336, 817, 530], x: 520, y: 800, w: 540, rotate: 5, radius: 44, style: 'background-color:#C6E8F8;' },
        { shot: 'complete.png', crop: [190, 1370, 700, 170], x: 40, y: 1480, w: 640, rotate: -4, radius: 90 },
      ],
    },
    {
      name: 'contrast-dark', title: 'High Contrast\n& *Dark Mode*', sub: 'Comfortable day or night',
      phones: [
        { shot: 'play-hc.png', x: 30, y: 640, w: 570, rotate: -6, statusBar: { bg: '#000000', dark: true } },
        { shot: 'play-dark.png', x: 480, y: 600, w: 580, rotate: 5, z: 4, statusBar: { bg: '#0B1F3A', dark: true } },
      ],
    },
    {
      name: 'easy-to-hard', title: 'Easy to Hard.\n*You Choose.*', sub: 'Diagonals and backwards words for a challenge', size: 100,
      phones: [
        { shot: 'pack-food.png', x: 30, y: 660, w: 560, rotate: -6, statusBar: { bg: '#BFE6F8' } },
        { shot: 'play-hard.png', x: 480, y: 610, w: 580, rotate: 5, z: 4, statusBar: { bg: '#BFE6F8' } },
      ],
      pops: [{ shot: 'pack-food.png', crop: [50, 500, 988, 170], x: 60, y: 1500, w: 760, rotate: -3, radius: 50 }],
    },
  ],
};
