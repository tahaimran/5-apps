// Quizora: Trivia Quiz Offline — Play Store screenshots (ASO.md §6).
const RAW = require('path').join(__dirname, '../raw/tq');
const W = 1080, H = 1920, N = 8;
const GOLD = '#FFC940';

let seed = 29;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const CAT = ['#6366F1', '#0EA5E9', '#D97706', '#10B981', '#F43F5E', '#D946EF', '#F97316', '#84CC16', '#EAB308', '#8B5CF6', '#14B8A6', '#EF4444'];

function sparkle(x, y, r, fill, op = 1) {
  return `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${fill}" opacity="${op}"/>`;
}
// Lucide lightbulb outline (24 units)
function bulb(x, y, s, rot, op) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-12 -12)" opacity="${op}" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></g>`;
}
function qmark(x, y, size, rot, fill, op) {
  return `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Bricolage" font-weight="800" font-size="${size}" fill="${fill}" opacity="${op}" text-anchor="middle">?</text>`;
}

function panorama() {
  const TW = W * N;
  let art = '';
  // big translucent question marks drifting across
  for (let i = 0; i < 22; i++) {
    const x = rnd() * TW, y = 640 + rnd() * 1300;
    art += qmark(x, y, 160 + rnd() * 260, -25 + rnd() * 50, '#FFFFFF', (0.05 + rnd() * 0.08).toFixed(2));
  }
  // category-colour tokens (like the app's category tiles)
  for (let i = 0; i < 40; i++) {
    const x = rnd() * TW, y = 520 + rnd() * 1400, s = 26 + rnd() * 34, c = CAT[i % 12];
    art += `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" fill="${c}" opacity="${(0.55 + rnd() * 0.4).toFixed(2)}" transform="rotate(${rnd() * 60 - 30} ${x} ${y})"/>`;
  }
  // confetti
  for (let i = 0; i < 160; i++) {
    const x = rnd() * TW, y = 480 + rnd() * 1440;
    const c = [GOLD, '#FF6FB5', '#5EEAD4', '#FFFFFF', '#FF9F43'][i % 5];
    art += `<rect x="${x}" y="${y}" width="${8 + rnd() * 10}" height="${4 + rnd() * 6}" rx="2" fill="${c}" opacity="${(0.35 + rnd() * 0.55).toFixed(2)}" transform="rotate(${rnd() * 180} ${x} ${y})"/>`;
  }
  for (let i = 0; i < 16; i++) art += bulb(rnd() * TW, 560 + rnd() * 1300, 3 + rnd() * 3, -20 + rnd() * 40, (0.35 + rnd() * 0.3).toFixed(2));
  for (let i = 0; i < 60; i++) art += sparkle(rnd() * TW, 470 + rnd() * 1450, 6 + rnd() * 16, rnd() < 0.6 ? GOLD : '#FFFFFF', (0.4 + rnd() * 0.6).toFixed(2));
  // the level-map path: a gold dotted trail with star stops flowing through every slide
  let d = 'M -200 1560';
  for (let i = 0; i <= N; i++) {
    const x = i * W;
    d += ` C ${x + 300} ${i % 2 ? 1250 : 1860}, ${x + 780} ${i % 2 ? 1860 : 1250}, ${x + W} 1560`;
  }
  let stops = '';
  for (let i = 0; i < N; i++) {
    const x = i * W + (i % 2 ? 140 : 950), y = i % 2 ? 1700 : 1420;
    stops += `<circle cx="${x}" cy="${y}" r="46" fill="${GOLD}"/><circle cx="${x}" cy="${y}" r="46" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="6"/>${sparkle(x, y, 26, '#7A4A00', 0.9)}`;
  }
  const glows = Array.from({ length: N }, (_, i) =>
    `<circle cx="${i * W + (i % 2 ? 860 : 220)}" cy="${i % 2 ? 1450 : 1050}" r="640" fill="url(#g${i % 3})"/>`).join('');
  return `<svg width="${TW}" height="${H}" viewBox="0 0 ${TW} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0">
  <defs>
    <linearGradient id="bgL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8366FF"/><stop offset=".5" stop-color="#5B3DE8"/><stop offset="1" stop-color="#2A1690"/></linearGradient>
    <radialGradient id="g0"><stop offset="0" stop-color="#FFC940" stop-opacity=".42"/><stop offset="1" stop-color="#FFC940" stop-opacity="0"/></radialGradient>
    <radialGradient id="g1"><stop offset="0" stop-color="#FF4FA3" stop-opacity=".38"/><stop offset="1" stop-color="#FF4FA3" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2"><stop offset="0" stop-color="#2DD4FF" stop-opacity=".32"/><stop offset="1" stop-color="#2DD4FF" stop-opacity="0"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="${TW}" height="${H}" fill="url(#bgL)"/>
  ${glows}
  ${art}
  <path d="${d}" fill="none" stroke="${GOLD}" stroke-width="120" stroke-linecap="round" opacity=".22" filter="url(#blur)"/>
  <path d="${d}" fill="none" stroke="${GOLD}" stroke-width="22" stroke-linecap="round" stroke-dasharray="2 46"/>
  ${stops}
  </svg>`;
}

const light = { bg: '#F6F4FD' };
const quiz = { bg: '#593DDE', dark: true };
const deco = (inner) => `<svg width="${W}" height="${H}" style="position:absolute;inset:0">${inner}</svg>`;
const PH = { x: 175, y: 560, w: 730 };

module.exports = {
  raw: RAW,
  out: require('path').join(__dirname, '../../../apps/trivia-quiz/store/screenshots'),
  theme: { bg: '#5B3DE8', captionColor: '#FFFFFF', accent: GOLD, subColor: 'rgba(255,255,255,.88)', capShadow: '0 6px 30px rgba(25,10,90,.4)' },
  panorama,
  slides: [
    {
      name: 'offline-questions', title: '*3,000+* trivia\nquestions, offline', sub: 'No internet. No sign-up.', size: 104,
      shot: 'quiz.png', statusBar: quiz, phone: { x: 230, y: 490, w: 620 },
      pops: [{ crop: [42, 330, 998, 594], anchor: true, w: 940, rotate: -3, rr: 60, dy: -118 }],
      deco: deco(qmark(110, 1420, 220, -16, GOLD, 0.95) + sparkle(985, 720, 26, GOLD) + sparkle(90, 700, 16, '#fff')),
    },
    {
      name: 'daily-challenge', title: 'A new daily\n*trivia challenge*', sub: 'Keep your streak alive',
      shot: 'home.png', statusBar: light, phone: PH,
      pops: [{ crop: [42, 651, 998, 624], anchor: true, w: 980, rotate: -3, rr: 66 }],
      deco: deco(sparkle(995, 1330, 24, GOLD) + sparkle(80, 1560, 18, '#fff')),
    },
    {
      name: 'learn-why', title: 'Learn *why* with\nevery answer', sub: 'A fun fact after each question',
      shot: 'quiz-right.png', statusBar: quiz, phone: PH,
      pops: [{ crop: [42, 1720, 998, 640], anchor: true, w: 980, rotate: 2, rr: 60, dy: -420 }],
      deco: deco(bulb(980, 1860, 6, 14, 1) + sparkle(960, 1180, 22, GOLD)),
    },
    {
      name: 'categories', title: '*12 categories*\nto master', sub: 'Movies, history, science & more',
      shot: 'category.png', statusBar: light, phone: PH,
      pops: [{ crop: [556, 168, 484, 321], anchor: true, w: 560, rotate: 4, rr: 50, dx: 40 }],
    },
    {
      name: 'levels', title: '*30 levels* in\nevery category', sub: 'Earn 3 stars on every level',
      shot: 'classic-geo.png', statusBar: light, phone: PH,
      pops: [{ crop: [56, 170, 970, 218], anchor: true, w: 900, rotate: -3, rr: 50 }],
      deco: deco(sparkle(950, 1300, 26, GOLD) + sparkle(120, 1520, 20, GOLD) + sparkle(160, 1180, 12, '#fff')),
    },
    {
      name: 'blitz', title: 'Beat the\n*60-second Blitz*', sub: 'How many can you answer?',
      shot: 'blitz3.png', statusBar: quiz, phone: PH,
      pops: [{ crop: [42, 290, 998, 671], anchor: true, w: 940, rotate: 3, rr: 60, dy: -100 }],
      deco: deco(sparkle(110, 1500, 24, GOLD) + sparkle(990, 1640, 18, '#fff')),
    },
    {
      name: 'lifelines', title: 'Use lifelines:\n*50/50, Skip, +Time*', sub: 'Never get stuck', size: 88,
      shot: 'quiz-fifty.png', statusBar: quiz, phone: { x: 175, y: 470, w: 730 },
      pops: [{ crop: [30, 2190, 1022, 182], anchor: true, w: 1000, rotate: -2, rr: 50, dy: -380 }],
    },
    {
      name: 'progress-dark', title: 'Track your\n*brain progress*', sub: 'Dark mode & big text',
      statusBar: light,
      phones: [
        { shot: 'stats.png', x: 40, y: 640, w: 560, rotate: -6, statusBar: light },
        { shot: 'stats-big.png', x: 480, y: 600, w: 580, rotate: 5, z: 4, statusBar: { bg: '#100D22', dark: true } },
      ],
      deco: deco(sparkle(540, 560, 22, GOLD) + sparkle(985, 1850, 18, '#fff')),
    },
  ],
};
