// Sipling: Drink Water Reminder — Play Store screenshots (ASO.md §6).
const RAW = require('path').join(__dirname, '../raw/wr');
const en = require(require('path').join(__dirname, '../../../apps/water-reminder/src/i18n/en.json'));
const W = 1080, H = 1920, N = 8;
const SURFACE = 1230; // water line across the panorama

let seed = 29;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const DROP = 'M0 -40 C 14 -20 30 -4 30 14 C 30 31 17 42 0 42 C -17 42 -30 31 -30 14 C -30 -4 -14 -20 0 -40 Z';
const LEAF = 'M0 0 C 18 -30 52 -40 84 -30 C 72 2 36 18 0 0 Z';
const drop = (x, y, s, op = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}"><path d="${DROP}" fill="url(#dropG)"/><ellipse cx="-11" cy="6" rx="5" ry="11" fill="#fff" opacity=".8" transform="rotate(20 -11 6)"/></g>`;
const leaf = (x, y, s, rot, op = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${op}"><path d="${LEAF}" fill="url(#leafG)"/><path d="M4 -1 C 30 -12 54 -20 78 -28" stroke="#1E8A4C" stroke-opacity=".45" stroke-width="3" fill="none"/></g>`;
const bubble = (x, y, r, op) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="${op * 0.18}" stroke="#fff" stroke-opacity="${op}" stroke-width="${Math.max(2, r / 7)}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.22}" fill="#fff" opacity="${op}"/>`;

function wavePath(y0, amp, period, phase = 0, TW = W * N) {
  let d = `M -100 ${y0}`;
  for (let x = -100; x <= TW + 100; x += period / 2) {
    const k = Math.round((x + 100) / (period / 2)) % 2 ? -1 : 1;
    d += ` Q ${x + period / 4} ${y0 + amp * k} ${x + period / 2} ${y0}`;
  }
  return d;
}

function panorama() {
  const TW = W * N;
  let art = '';
  // sun glow + clouds in the sky band
  for (let i = 0; i < N; i++) {
    art += `<circle cx="${i * W + (i % 2 ? 860 : 220)}" cy="${i % 2 ? 360 : 460}" r="520" fill="url(#glow)"/>`;
  }
  // drifting leaves and droplets above the water
  for (let k = 0; k < 34; k++) {
    const x = rnd() * TW, y = 520 + rnd() * 620;
    art += rnd() < 0.5 ? leaf(x, y, 0.7 + rnd() * 0.9, -40 + rnd() * 80, 0.55 + rnd() * 0.4) : drop(x, y, 0.6 + rnd() * 1.1, 0.5 + rnd() * 0.45, -15 + rnd() * 30);
  }
  // the sea: three wave layers spanning every slide
  const sea = (y, amp, per, fill, op) => `<path d="${wavePath(y, amp, per)} L ${TW + 100} ${H + 50} L -100 ${H + 50} Z" fill="${fill}" opacity="${op}"/>`;
  let water = sea(SURFACE - 40, 34, 540, '#7FD8FF', 0.55) + sea(SURFACE, 40, 720, 'url(#sea)', 1) + sea(SURFACE + 120, 28, 460, '#0A4E9C', 0.35);
  water += `<path d="${wavePath(SURFACE, 40, 720)}" stroke="#fff" stroke-width="7" fill="none" opacity=".85"/>`;
  // bubbles rising in the water
  let bubbles = '';
  for (let k = 0; k < 90; k++) bubbles += bubble(rnd() * TW, SURFACE + 90 + rnd() * (H - SURFACE - 60), 6 + rnd() * 26, 0.35 + rnd() * 0.5);
  // light rays under the surface
  let rays = '';
  for (let k = 0; k < 16; k++) {
    const x = k * 560 + rnd() * 200;
    rays += `<path d="M ${x} ${SURFACE} L ${x + 120} ${SURFACE} L ${x + 300} ${H} L ${x + 60} ${H} Z" fill="#fff" opacity=".07"/>`;
  }
  return `<svg width="${TW}" height="${H}" viewBox="0 0 ${TW} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9FAFF"/><stop offset=".5" stop-color="#B5EBFF"/><stop offset="1" stop-color="#7FD3FB"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2AA6F5"/><stop offset=".45" stop-color="#1477D6"/><stop offset="1" stop-color="#083E86"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <linearGradient id="dropG" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#D5F6FF"/><stop offset=".5" stop-color="#6FD3FF"/><stop offset="1" stop-color="#2AA2F2"/></linearGradient>
    <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BF07A"/><stop offset="1" stop-color="#2FB25C"/></linearGradient>
  </defs>
  <rect width="${TW}" height="${H}" fill="url(#sky)"/>
  ${art}${water}${rays}${bubbles}
  </svg>`;
}

const DEFS = `<defs><linearGradient id="dropG" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#D5F6FF"/><stop offset=".5" stop-color="#6FD3FF"/><stop offset="1" stop-color="#2AA2F2"/></linearGradient>
  <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9BF07A"/><stop offset="1" stop-color="#2FB25C"/></linearGradient></defs>`;
const deco = (inner) => `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${DEFS}${inner}</svg>`;

// Android notification shade over the dimmed Today screen; the copy is the app's own (en.json notify.*).
const NOTE_ICON = require('path').join(__dirname, '../../../apps/water-reminder/assets/notification-icon.png');
const APP_ICON = require('path').join(__dirname, '../../../apps/water-reminder/store/icon-512.png');
function card(k, img, extra = '') {
  const px = (v) => `${(v * k).toFixed(1)}px`;
  return `<div style="${extra};background:#F4F9FD;border-radius:${px(28)};padding:${px(16)} ${px(16)} ${px(12)};color:#0F2436;box-shadow:0 ${px(8)} ${px(24)} rgba(0,0,0,.3)">
      <div style="display:flex;align-items:center;gap:${px(8)};font:600 ${px(12)} Figtree;color:#506A7E">
        <span style="width:${px(22)};height:${px(22)};border-radius:50%;background:#136CAD url(${img(NOTE_ICON)}) center/70% no-repeat;display:inline-block"></span>
        Sipling · now
      </div>
      <div style="display:flex;gap:${px(12)};margin-top:${px(8)}">
        <div style="flex:1">
          <div style="font:700 ${px(17)} Figtree">${en.notify.title}</div>
          <div style="font:500 ${px(15)} Figtree;color:#30485C;margin-top:${px(3)};line-height:1.3">${en.notify.messages['0']}</div>
        </div>
        <img src="${img(APP_ICON)}" style="width:${px(44)};height:${px(44)};border-radius:${px(12)}">
      </div>
      <div style="display:flex;gap:${px(8)};margin-top:${px(14)}">
        <div style="padding:${px(9)} ${px(16)};border-radius:${px(20)};background:#136CAD;color:#fff;font:700 ${px(14)} Figtree">${en.notify.addCup.replace('{amount}', '250 ml')}</div>
        <div style="padding:${px(9)} ${px(16)};border-radius:${px(20)};background:#DCEEFB;color:#136CAD;font:700 ${px(14)} Figtree">${en.notify.snooze.replace('{minutes}', '15')}</div>
      </div>
    </div>`;
}
const uri = (f) => `data:image/png;base64,${require('fs').readFileSync(f).toString('base64')}`;

function shade(sw, sh, img) {
  const k = sw / 412;
  const px = (v) => `${(v * k).toFixed(1)}px`;
  const tile = (on, label) => `<div style="flex:1;height:${px(56)};border-radius:${px(20)};background:${on ? '#BFE4FF' : 'rgba(255,255,255,.14)'};color:${on ? '#062F55' : '#E6F1F9'};display:flex;align-items:center;padding:0 ${px(14)};font:600 ${px(13)} Figtree">${label}</div>`;
  return `<div style="position:absolute;inset:0;background:url(${img('today.png')}) 0 0/100% auto no-repeat;filter:blur(${px(6)});transform:scale(1.04)"></div>
  <div style="position:absolute;inset:0;background:rgba(8,22,40,.72)"></div>
  <div style="position:absolute;left:${px(20)};right:${px(20)};top:${px(14)};color:#fff;font-family:Figtree">
    <div style="font-weight:500;font-size:${px(52)};letter-spacing:-1px">13:41</div>
    <div style="font-weight:600;font-size:${px(15)};opacity:.85;margin-top:${px(2)}">Thursday, October 29</div>
    <div style="display:flex;gap:${px(10)};margin-top:${px(18)}">${tile(true, 'Wi‑Fi')}${tile(true, 'Bluetooth')}</div>
    <div style="display:flex;gap:${px(10)};margin-top:${px(10)}">${tile(false, 'Flashlight')}${tile(false, 'Do not disturb')}</div>
    ${card(k, img, `margin-top:${px(22)}`)}
  </div>`;
}

const SB = { bg: '#F2F8FC' };
module.exports = {
  raw: RAW,
  sbTime: '13:41',
  out: require('path').join(__dirname, '../../../apps/water-reminder/store/screenshots'),
  theme: { bg: '#B5EBFF', captionColor: '#0B2A4A', accent: '#0E86E0', subColor: '#2C4C66', size: 100 },
  panorama,
  slides: [
    {
      name: 'grow-your-plant', title: 'Drink water,\n*grow your plant*', sub: 'Every glass helps it bloom', size: 112,
      shot: 'today.png', statusBar: SB, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [42, 233, 998, 1035], x: 110, y: 760, w: 860, rotate: -3, radius: 64 }],
      deco: deco(leaf(860, 760, 1.6, -30) + leaf(150, 640, 1.1, 200, 0.95) + drop(960, 640, 1.3) + drop(100, 1500, 1.0, 0.9)),
    },
    {
      name: 'reminder', title: 'Log right from\nthe *reminder*', sub: 'One tap adds a glass. No need to open the app.',
      statusBar: { bg: '#0D2236', dark: true }, phone: { x: 175, y: 560, w: 730, html: shade },
      deco: deco(drop(950, 720, 1.3) + leaf(120, 760, 1.2, -20)) + card(2.45, uri, 'position:absolute;left:70px;top:1250px;width:940px;transform:rotate(-2deg);box-shadow:0 40px 80px -10px rgba(5,30,60,.5)'),
    },
    {
      name: 'daily-goal', title: 'Your personal\n*daily goal*', sub: 'Based on weight, activity & climate',
      shot: 'goal.png', statusBar: SB, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [42, 211, 1000, 430], x: 60, y: 820, w: 960, rotate: -3, radius: 56 }, { crop: [42, 1940, 1000, 182], x: 120, y: 1560, w: 900, rotate: 2, radius: 44 }],
      deco: deco(drop(960, 690, 1.2) + leaf(110, 700, 1.1, -25)),
    },
    {
      name: 'smart-reminders', title: 'Smart reminders,\n*only when awake*', sub: 'Spread from wake-up to bedtime', size: 92,
      shot: 'reminders.png', statusBar: SB, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [42, 405, 1000, 462], x: 50, y: 1050, w: 980, rotate: -2, radius: 50 }],
    },
    {
      name: 'garden', title: 'Build a streak,\n*watch it bloom*', sub: 'Your plant grows with every goal day',
      shot: 'garden.png', statusBar: SB, phone: { x: 175, y: 720, w: 730 },
      pops: [{ crop: [42, 1088, 1000, 296], x: 40, y: 1500, w: 1000, rotate: -2, radius: 48 }],
      deco: deco(leaf(880, 700, 1.5, -35) + leaf(90, 820, 1.2, 190, 0.9)),
    },
    {
      name: 'weekly-progress', title: 'See your\n*weekly progress*', sub: 'Daily, weekly & monthly charts',
      shot: 'history-week.png', statusBar: SB, phone: { x: 175, y: 560, w: 730 },
      pops: [{ crop: [42, 694, 1000, 985], x: 90, y: 990, w: 900, rotate: -3, radius: 56 }],
      deco: deco(drop(980, 760, 1.2)),
    },
    {
      name: 'drinks', title: 'Water, coffee, tea\n*& more*', sub: 'Quick-add cups in one tap',
      shot: 'logcustom.png', statusBar: SB, phone: { x: 175, y: 560, w: 730 },
      pops: [{ shot: 'today.png', crop: [42, 1398, 1000, 232], x: 50, y: 1360, w: 980, rotate: -2, radius: 44 }],
      deco: deco(leaf(140, 690, 1.2, -15) + drop(950, 700, 1.1)),
    },
    {
      name: 'private', title: 'Private, offline,\n*no sign-up*', sub: 'Your data stays on your phone',
      phones: [
        { shot: 'backup.png', x: 40, y: 640, w: 560, rotate: -6, statusBar: SB },
        { shot: 'today-dark.png', x: 480, y: 600, w: 580, rotate: 5, z: 4, statusBar: { bg: '#0B1620', dark: true } },
      ],
      deco: deco(drop(540, 600, 1.1) + leaf(960, 560, 1.1, -30)),
    },
  ],
};
