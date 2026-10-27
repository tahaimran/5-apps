// Habit Tracker: Streak & Widget — Play Store screenshots (ASO.md §6).
const RAW = require('path').join(__dirname, '../raw/ht');
const fs = require('fs');
const W = 1080, H = 1920, N = 8;

// Deterministic scatter
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

function sparkle(x, y, r, fill, op = 1) {
  return `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${fill}" opacity="${op}"/>`;
}
function flame(x, y, s, rot = 0, op = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="url(#ember)"/></g>`;
}

function panorama() {
  const TW = W * N;
  let squares = '';
  // heatmap patches drifting through the top band
  for (let p = 0; p < 9; p++) {
    const px = p * 980 + 120 + rnd() * 300, py = 40 + rnd() * 120;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) {
      if (rnd() < 0.3) continue;
      const o = 0.05 + rnd() * 0.16;
      squares += `<rect x="${px + c * 46}" y="${py + r * 46}" width="36" height="36" rx="10" fill="#fff" opacity="${o.toFixed(2)}"/>`;
    }
  }
  let sparks = '';
  for (let k = 0; k < 70; k++) {
    const x = rnd() * TW, y = rnd() * H;
    sparks += sparkle(x, y, 6 + rnd() * 16, rnd() < 0.5 ? '#FFD36B' : '#FFFFFF', 0.35 + rnd() * 0.6);
  }
  // dots
  for (let k = 0; k < 120; k++) sparks += `<circle cx="${rnd() * TW}" cy="${rnd() * H}" r="${2 + rnd() * 5}" fill="#fff" opacity="${(0.1 + rnd() * 0.35).toFixed(2)}"/>`;
  // flowing ribbon across all slides
  let d = `M -200 1500`;
  for (let i = 0; i <= N; i++) {
    const x = i * W;
    d += ` C ${x + 270} ${i % 2 ? 1180 : 1820}, ${x + 810} ${i % 2 ? 1820 : 1180}, ${x + W} 1500`;
  }
  const glows = Array.from({ length: N }, (_, i) =>
    `<circle cx="${i * W + (i % 2 ? 900 : 180)}" cy="${i % 2 ? 1500 : 1150}" r="620" fill="url(#g${i % 3})"/>`).join('');
  return `<svg width="${TW}" height="${H}" viewBox="0 0 ${TW} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
  <defs>
    <linearGradient id="bgL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B5CFF"/><stop offset=".55" stop-color="#5531E8"/><stop offset="1" stop-color="#2E1499"/></linearGradient>
    <radialGradient id="g0"><stop offset="0" stop-color="#FF8A3D" stop-opacity=".55"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient>
    <radialGradient id="g1"><stop offset="0" stop-color="#FF4FA3" stop-opacity=".45"/><stop offset="1" stop-color="#FF4FA3" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2"><stop offset="0" stop-color="#38D3FF" stop-opacity=".35"/><stop offset="1" stop-color="#38D3FF" stop-opacity="0"/></radialGradient>
    <linearGradient id="rib" x1="0" y1="0" x2="${TW}" y2="0" gradientUnits="userSpaceOnUse">
      ${Array.from({ length: 17 }, (_, i) => `<stop offset="${i / 16}" stop-color="${['#FFB547', '#FF6A3D', '#FF4FA3', '#FF8A3D'][i % 4]}"/>`).join('')}
    </linearGradient>
    <linearGradient id="ember" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD36B"/><stop offset=".55" stop-color="#FF8A2B"/><stop offset="1" stop-color="#EE5A0C"/></linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="30"/></filter>
  </defs>
  <rect width="${TW}" height="${H}" fill="url(#bgL)"/>
  ${glows}
  ${squares}
  <path d="${d}" fill="none" stroke="url(#rib)" stroke-width="150" stroke-linecap="round" opacity=".35" filter="url(#blur)"/>
  <path d="${d}" fill="none" stroke="url(#rib)" stroke-width="54" stroke-linecap="round"/>
  <path d="${d}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55" transform="translate(0 -14)"/>
  ${sparks}
  </svg>`;
}

const emberDefs = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="ember" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD36B"/><stop offset=".55" stop-color="#FF8A2B"/><stop offset="1" stop-color="#EE5A0C"/></linearGradient></defs></svg>`;
const deco = (inner) => `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${emberDefs.replace(/<\/?svg[^>]*>/g, '')}${inner}</svg>`;

// Android home screen with the real widget (cropped from the web render of TodayWidget).
const ICON = fs.existsSync(require('path').join(__dirname, '../../../apps/habit-tracker/assets/icon.png')) ? require('path').join(__dirname, '../../../apps/habit-tracker/assets/icon.png') : null;
function home(sw, sh, img) {
  const k = sw / 412; // dp → px
  const widget = (y, which) => {
    const top = which === 'light' ? 42 : 42 + (280 + 24) * 2.625;
    const cw = 360 * 2.625, ch = 232 * 2.625;
    const w = 372 * k, sc = w / cw;
    return `<div style="position:absolute;left:${20 * k}px;top:${y}px;width:${w}px;height:${ch * sc}px;border-radius:${24 * k}px;overflow:hidden;box-shadow:0 ${10 * k}px ${30 * k}px rgba(20,10,60,.35);
      background:url(${img('widget.png')}) ${-42 * sc}px ${-top * sc}px / ${1082 * sc}px ${2402 * sc}px no-repeat"></div>`;
  };
  const apps = [['#34A853', 'M'], ['#4285F4', 'C'], ['#EA4335', 'P'], ['#FBBC05', 'K']];
  const dock = apps.map(([c], i) => `<div style="position:absolute;left:${(46 + i * 88) * k}px;bottom:${70 * k}px;width:${56 * k}px;height:${56 * k}px;border-radius:50%;background:${c};opacity:.9"></div>`).join('');
  return `<div style="position:absolute;left:0;right:0;bottom:0;top:-${Math.round(96 * sw / 1080)}px;background:radial-gradient(120% 70% at 20% 10%,#FFC27A 0%,#FF7E8C 35%,#7B5CFF 70%,#3A1BC2 100%)"></div>
    <div style="position:absolute;left:${28 * k}px;top:${36 * k}px;color:#fff;font-family:Figtree;font-weight:500;font-size:${62 * k}px;letter-spacing:-1px">9:41</div>
    <div style="position:absolute;left:${30 * k}px;top:${112 * k}px;color:#fff;font-family:Figtree;font-weight:600;font-size:${17 * k}px;opacity:.92">Thursday, Oct 29</div>
    ${widget(170 * k, 'light')}
    ${ICON ? `<img src="${img(ICON)}" style="position:absolute;left:${46 * k}px;top:${520 * k}px;width:${60 * k}px;height:${60 * k}px;border-radius:50%;box-shadow:0 6px 16px rgba(0,0,0,.25)">
    <div style="position:absolute;left:${36 * k}px;top:${586 * k}px;width:${80 * k}px;text-align:center;color:#fff;font-family:Figtree;font-weight:600;font-size:${13 * k}px">Habits</div>` : ''}
    ${dock}
    <div style="position:absolute;left:${20 * k}px;right:${20 * k}px;bottom:${150 * k}px;height:${50 * k}px;border-radius:${25 * k}px;background:rgba(255,255,255,.85)"></div>`;
}

module.exports = {
  raw: RAW,
  out: require('path').join(__dirname, '../../../apps/habit-tracker/store/screenshots'),
  theme: { bg: '#5531E8', captionColor: '#FFFFFF', accent: '#FFC15A', subColor: 'rgba(255,255,255,.86)', capShadow: '0 6px 30px rgba(30,10,90,.35)' },
  panorama,
  slides: [
    {
      name: 'build-habits', title: 'Build habits\nthat *stick*', sub: 'Daily streaks, reminders & a widget', size: 112,
      shot: 'today.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [44, 477, 994, 394], anchor: true, w: 960, rotate: -3, rr: 66 }],
      deco: deco(flame(880, 1530, 9, 12) + flame(70, 1350, 6, -14, 0.95) + sparkle(960, 700, 26, '#FFD36B') + sparkle(110, 690, 18, '#fff')),
    },
    {
      name: 'widget', title: 'Check off from your\n*home screen*', sub: 'Tick habits without opening the app',
      statusBar: { bg: 'transparent', dark: true }, phone: { x: 175, y: 540, w: 730, html: home },
      pops: [{ shot: 'widget.png', crop: [42, 840, 945, 609], x: 520, y: 1380, w: 520, rotate: 4, radius: 34 }],
      deco: deco(sparkle(110, 1280, 22, '#FFD36B') + sparkle(980, 1300, 16, '#fff')),
    },
    {
      name: 'progress', title: 'See your progress\n*grow*', sub: 'Heatmap, best streak & completion rates',
      shot: 'detail-bed.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [44, 1252, 994, 540], anchor: true, w: 980, rotate: 2, rr: 52, dy: -40 }],
    },
    {
      name: 'count-timer', title: 'Track water, workouts\n& *study time*', sub: 'Yes/no, counts and timers', size: 88,
      shot: 'today.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [44, 1133, 994, 214], anchor: true, w: 900, rotate: -3, rr: 52, dx: -40 },
             { crop: [44, 1646, 994, 218], anchor: true, w: 900, rotate: 3, rr: 52, dx: 40 }],
      deco: deco(sparkle(990, 940, 22, '#FFD36B') + sparkle(70, 1580, 18, '#fff')),
    },
    {
      name: 'stats', title: 'Weekly stats that\n*motivate*', sub: 'Every check-in adds up',
      shot: 'stats.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [44, 174, 994, 598], anchor: true, w: 900, rotate: -3, rr: 52 }],
    },
    {
      name: 'streak-freeze', title: 'Missed a day?\n*Keep your streak*', sub: 'Streak freezes protect your progress',
      shot: 'settings2.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [44, 1002, 994, 200], anchor: true, w: 980, rotate: -2, rr: 52, style: 'border-bottom-left-radius:20px;border-bottom-right-radius:20px' }],
      deco: deco(flame(860, 1420, 8, 10) + sparkle(130, 1020, 24, '#9BE7FF') + sparkle(980, 980, 18, '#fff')),
    },
    {
      name: 'reminders', title: 'Gentle reminders,\n*your way*', sub: 'Pick the time for each habit',
      shot: 'edit2.png', statusBar: { bg: '#F6F5FA' }, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [16, 1080, 1050, 380], anchor: true, w: 960, rotate: -2, radius: 50, style: 'background-color:#F6F5FA' }],
    },
    {
      name: 'private', title: 'Private. Offline.\n*No sign-up.*', sub: 'Your habits stay on your phone',
      statusBar: { bg: '#F6F5FA' },
      phones: [
        { shot: 'backup.png', x: 40, y: 640, w: 560, rotate: -6, statusBar: { bg: '#F6F5FA' } },
        { shot: 'today-dark.png', x: 480, y: 600, w: 580, rotate: 5, z: 4, statusBar: { bg: '#121019', dark: true } },
      ],
      deco: deco(sparkle(540, 560, 22, '#FFD36B') + sparkle(980, 1840, 18, '#fff')),
    },
  ],
};
