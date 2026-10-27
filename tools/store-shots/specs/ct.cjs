// Contraction Timer & Kick Count — Play Store screenshots (ASO.md §5 storyboard).
// Panorama: a sky that moves from mint dawn → blush → deep night (slide 4) → sunrise → lavender (kicks) → mint again,
// with a soft sun, layered gentle waves along the bottom, and stars that only come out around the night slide.
const RAW = require('path').join(__dirname, '../raw/ct');
const W = 1080, H = 1920, N = 8;

let seed = 23;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const sparkle = (x, y, r, fill, op = 1) =>
  `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${fill}" opacity="${op}"/>`;

// Sky colours at the centre of each slide (top, bottom).
const SKY = [
  ['#BFE9E1', '#FDE6DA'], // 1 dawn mint
  ['#FFE3C2', '#FBD3D8'], // 2 warm amber (the banner)
  ['#CDEDE7', '#F8E2E9'], // 3 mint/blush
  ['#0B1430', '#241034'], // 4 night
  ['#FFC9A8', '#FFE7D6'], // 5 sunrise coral
  ['#D9D0FF', '#F6DCE5'], // 6 lavender (kicks)
  ['#C9EEE6', '#FCE6DD'], // 7 mint
  ['#FDE0CF', '#DDF1ED'], // 8 peach → mint
];

function panorama() {
  const TW = W * N;
  const stops = (k) => SKY.map((c, i) => `<stop offset="${((i + 0.5) / N).toFixed(4)}" stop-color="${c[k]}"/>`).join('');
  let stars = '';
  for (let k = 0; k < 90; k++) {
    const x = 2 * W + 200 + rnd() * (W * 2.6), y = rnd() * 1250;
    const fade = Math.max(0, 1 - Math.abs(x - 3.5 * W) / (1.25 * W));
    if (fade < 0.05) continue;
    stars += rnd() < 0.25 ? sparkle(x, y, 8 + rnd() * 10, '#FFE9C7', fade) : `<circle cx="${x}" cy="${y}" r="${1.5 + rnd() * 3}" fill="#fff" opacity="${(fade * (0.4 + rnd() * 0.6)).toFixed(2)}"/>`;
  }
  let sparks = '';
  for (let k = 0; k < 40; k++) {
    const x = rnd() * TW;
    if (Math.abs(x - 3.5 * W) < W) continue;
    sparks += sparkle(x, 80 + rnd() * 700, 6 + rnd() * 12, rnd() < 0.5 ? '#FFFFFF' : '#FFD7B8', 0.5 + rnd() * 0.4);
  }
  // Layered waves across the whole strip (the "surge" curve, gentle).
  const wave = (base, amp, len, phase) => {
    let d = `M 0 ${H} L 0 ${base}`;
    for (let x = 0; x <= TW; x += 60) d += ` L ${x} ${(base + amp * Math.sin((x / len) * 2 * Math.PI + phase)).toFixed(1)}`;
    return d + ` L ${TW} ${H} Z`;
  };
  // Suns / moon: soft glowing discs.
  const suns = [
    [0.5 * W + 330, 640, 150, '#FFD3A6'], [2.5 * W - 300, 560, 120, '#FFE0B8'], [3.5 * W + 300, 520, 90, '#FFF1D6'],
    [4.5 * W - 320, 600, 170, '#FFB088'], [6.5 * W + 300, 560, 130, '#FFE0C8'],
  ].map(([x, y, r, c], i) => `<circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#halo${i})"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${i === 2 ? 0.95 : 0.85}"/>
     <radialGradient id="halo${i}"><stop offset="0" stop-color="${c}" stop-opacity=".7"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
  return `<svg width="${TW}" height="${H}" viewBox="0 0 ${TW} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
    <defs>
      <linearGradient id="skyT" x1="0" x2="${TW}" y1="0" y2="0" gradientUnits="userSpaceOnUse">${stops(0)}</linearGradient>
      <linearGradient id="skyB" x1="0" x2="${TW}" y1="0" y2="0" gradientUnits="userSpaceOnUse">${stops(1)}</linearGradient>
      <linearGradient id="fadeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <mask id="topMask"><rect width="${TW}" height="${H}" fill="url(#fadeV)"/></mask>
      <linearGradient id="w1" x1="0" x2="${TW}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        ${['#7FCFC3', '#F7B79D', '#9AD8CC', '#1E3A5F', '#F59C7C', '#A99AE6', '#86D3C6', '#F7B79D'].map((c, i) => `<stop offset="${((i + 0.5) / N).toFixed(4)}" stop-color="${c}"/>`).join('')}
      </linearGradient>
      <linearGradient id="w2" x1="0" x2="${TW}" y1="0" y2="0" gradientUnits="userSpaceOnUse">
        ${['#2A8079', '#E07A5F', '#2A8079', '#3A2A6B', '#DB6E53', '#65559F', '#2A8079', '#E07A5F'].map((c, i) => `<stop offset="${((i + 0.5) / N).toFixed(4)}" stop-color="${c}"/>`).join('')}
      </linearGradient>
    </defs>
    <rect width="${TW}" height="${H}" fill="url(#skyB)"/>
    <rect width="${TW}" height="${H}" fill="url(#skyT)" mask="url(#topMask)"/>
    ${suns}
    ${stars}
    ${sparks}
    <path d="${wave(1500, 46, 1440, 0)}" fill="url(#w1)" opacity=".55"/>
    <path d="${wave(1640, 38, 1080, 1.7)}" fill="url(#w1)" opacity=".85"/>
    <path d="${wave(1770, 30, 1620, 3.1)}" fill="url(#w2)" opacity=".9"/>
  </svg>`;
}

const deco = (inner) => `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${inner}</svg>`;
const ink = { captionColor: '#1D2433', subColor: '#3D4458', accent: '#D4563B' };
const tealAccent = { captionColor: '#1D2433', subColor: '#3D4458', accent: '#1F7A72' };
const PH = { x: 175, y: 560, w: 730 };

module.exports = {
  raw: RAW,
  out: require('path').join(__dirname, '../../../apps/contraction-timer/store/screenshots'),
  theme: { bg: '#FBF6F2', ...ink, size: 100 },
  panorama,
  slides: [
    {
      name: 'one-button', title: 'One big button.\n*That\'s it.*', sub: 'Time contractions with a single tap', size: 108,
      theme: tealAccent,
      shot: 'pattern.png', statusBar: { bg: '#DDF1ED' }, phone: PH,
      pops: [{ crop: [40, 1328, 1002, 400], x: 90, y: 1520, w: 900, rotate: -2, radius: 48, style: 'background-color:#FAF4F1' }],
      deco: deco(sparkle(110, 640, 22, '#E07A5F') + sparkle(975, 700, 16, '#2A8079')),
    },
    {
      name: 'pattern-511', title: 'Know when your\n*5-1-1 pattern* is reached', sub: 'A calm heads-up from your last hour', size: 80,
      shot: 'pattern-s.png', statusBar: { bg: '#DCEFEA' }, phone: PH,
      pops: [{ crop: [53, 1544, 977, 659], x: 45, y: 1170, w: 990, rotate: -2, rr: 53 }],
    },
    {
      name: 'share-summary', title: 'Send a clear summary\nto your *midwife*', sub: 'As text or a PDF, made on your phone', size: 80,
      theme: tealAccent,
      shot: 'share.png', statusBar: { bg: '#FBF6F2' }, phone: PH,
      pops: [{ crop: [53, 1055, 977, 800], anchor: true, w: 900, rotate: 2, radius: 50, style: 'border-bottom-left-radius:22px;border-bottom-right-radius:22px', dy: -40 }],
    },
    {
      name: 'night-mode', title: 'Night mode\nmade for *3 a.m.*', sub: 'Red on black, easy on tired eyes', size: 108,
      theme: { captionColor: '#FFFFFF', subColor: 'rgba(255,236,226,.85)', accent: '#FF7A5C', capShadow: '0 6px 30px rgba(0,0,0,.4)' },
      shot: 'night.png', statusBar: { bg: '#2A0703', dark: true }, phone: PH,
      deco: deco(sparkle(120, 760, 22, '#FFE9C7') + sparkle(960, 860, 14, '#fff') + sparkle(1000, 1300, 18, '#FFE9C7')),
    },
    {
      name: 'partner-mode', title: 'Partner mode:\n*big text, zero setup*', sub: 'Easy to read and tap at arm\'s length', size: 96,
      shot: 'partner.png', statusBar: { bg: '#FBE3D9' }, phone: PH,
    },
    {
      name: 'kick-counter', title: 'Count kicks to *10*', sub: 'Every session saved in your history', size: 108,
      theme: { captionColor: '#1D2433', subColor: '#3D4458', accent: '#5A4AA0' },
      shot: 'kicks.png', statusBar: { bg: '#FBF6F2' }, phone: PH,
      pops: [{ shot: 'khistory.png', crop: [53, 179, 977, 360], x: 50, y: 1330, w: 980, rotate: -2, rr: 53 }],
      deco: deco(sparkle(120, 560, 22, '#8E7FD6') + sparkle(960, 520, 16, '#fff')),
    },
    {
      name: 'pregnancy-weeks', title: 'Due date &\n*week-by-week sizes*', sub: 'Your pregnancy at a glance', size: 96,
      theme: tealAccent,
      shot: 'preg.png', statusBar: { bg: '#FBF6F2' }, phone: PH,
      pops: [{ shot: 'preg2.png', crop: [62, 536, 900, 880], x: 560, y: 1420, w: 470, rotate: 4, rr: 53 }],
    },
    {
      name: 'hospital-bag', title: 'Hospital bag &\n*birth plan checklists*', sub: 'Private and offline. No account.', size: 90,
      shot: 'bag.png', statusBar: { bg: '#FBF6F2' }, phone: PH,
      pops: [{ crop: [53, 362, 977, 252], anchor: true, w: 980, rotate: -2, rr: 53, dy: 40 }],
      deco: deco(sparkle(110, 1180, 20, '#E07A5F') + sparkle(980, 640, 16, '#2A8079')),
    },
  ],
};
