// Regenerates the Word Search icon set (icon, adaptive layers, monochrome, splash, notification icon, 512 store icon)
// from one mark: the app's "Sky Garden" world in a square. A bright sky with a gold sun peeking out, green hills and a
// cloud; in front, a white letter board with the game's deep-blue frame, tilted a little, whose three big rows hide
// the word "SUN" on the diagonal under a thick coral found-word pill. The board, the pill and the sun stay readable
// at 48px. The Play feature graphic is made with the store screenshots (see store/SCREENSHOTS.md).
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/word-search/assets> <apps/word-search/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

const C = {
  sky: ['#7FD7FB', '#3FA6EC', '#1D5FB4'],
  brand: '#1F5FAF',
  board: '#1D4F8F',
  ink: '#13233F',
  line: '#DCE8F2',
  pill: '#FFAE94',
  pillEdge: '#D2593A',
  sun: ['#FFE38A', '#FFC93C'],
  sunEdge: '#F0A81E',
  hills: ['#B9E0A0', '#7FC25C'],
  cloud: '#FFFFFF',
};

const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
const fontFiles = [
  path.join(assets, 'fonts/AtkinsonHyperlegible_700Bold.ttf'),
  path.join(fontDir, 'BricolageGrotesque_800ExtraBold.ttf'),
  path.join(fontDir, 'Figtree_700Bold.ttf'),
];

// The diagonal (top-left → bottom-right) spells SUN.
const LETTERS = ['SBW', 'LUO', 'EAN'];
const TILT = -7;

/** The letter board centered at (512,512) with side `side`. */
function board({ side = 660, mono = false } = {}) {
  const r = side * 0.17;
  const frame = side * 0.045;
  const x = 512 - side / 2;
  const y = 512 - side / 2;
  const inner = side - frame * 2;
  const cell = inner / 3;
  const ix = x + frame;
  const iy = y + frame;
  const letters = LETTERS.flatMap((row, rr) =>
    [...row].map(
      (ch, c) =>
        `<text x="${ix + cell * c + cell / 2}" y="${iy + cell * rr + cell / 2 + cell * 0.29}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="${cell * 0.84}" fill="${mono ? '#000000' : C.ink}">${ch}</text>`,
    ),
  );
  // The pill: from the center of the first cell to the center of the last one, as wide as most of a cell.
  const a = { x: ix + cell / 2, y: iy + cell / 2 };
  const b = { x: ix + cell * 2.5, y: iy + cell * 2.5 };
  const pw = cell * 0.82;
  const pill = (stroke, width, extra = '') =>
    `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  const grid = [1, 2]
    .map(
      (i) => `<line x1="${ix + cell * i}" y1="${iy + 10}" x2="${ix + cell * i}" y2="${iy + inner - 10}" stroke="${C.line}" stroke-width="${side * 0.006}"/>
      <line x1="${ix + 10}" y1="${iy + cell * i}" x2="${ix + inner - 10}" y2="${iy + cell * i}" stroke="${C.line}" stroke-width="${side * 0.006}"/>`,
    )
    .join('');
  const t = `rotate(${TILT} 512 512)`;
  if (mono) {
    return `<g transform="${t}"><mask id="cut"><rect width="1024" height="1024" fill="#FFFFFF"/>
      <rect x="${ix}" y="${iy}" width="${inner}" height="${inner}" rx="${r - frame}" fill="#000000"/>
      </mask>
      <rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${r}" fill="#FFFFFF" mask="url(#cut)"/>
      <mask id="cut2"><rect width="1024" height="1024" fill="#FFFFFF"/>${letters.join('')}</mask>
      <g mask="url(#cut2)">${pill('#FFFFFF', pw)}</g>
      ${LETTERS.flatMap((row, rr) => [...row].map((ch, c) => (rr === c ? '' : `<text x="${ix + cell * c + cell / 2}" y="${iy + cell * rr + cell / 2 + cell * 0.29}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="${cell * 0.84}" fill="#FFFFFF">${ch}</text>`))).join('')}
    </g>`;
  }
  return `
    <g transform="${t}">
      <rect x="${x + side * 0.01}" y="${y + side * 0.035}" width="${side}" height="${side}" rx="${r}" fill="#0B2A55" fill-opacity="0.3" filter="url(#soft)"/>
      <rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${r}" fill="${C.board}"/>
      <rect x="${x}" y="${y}" width="${side}" height="${side * 0.5}" rx="${r}" fill="#FFFFFF" fill-opacity="0.08"/>
      <rect x="${ix}" y="${iy}" width="${inner}" height="${inner}" rx="${r - frame}" fill="#FFFFFF"/>
      ${grid}
      ${pill(C.pillEdge, pw + side * 0.024)}
      ${pill(C.pill, pw - side * 0.012)}
      ${letters.join('')}
    </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${C.sky[0]}"/><stop offset="0.55" stop-color="${C.sky[1]}"/><stop offset="1" stop-color="${C.sky[2]}"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.4" cy="0.35" r="0.7">
      <stop offset="0" stop-color="${C.sun[0]}"/><stop offset="1" stop-color="${C.sun[1]}"/>
    </radialGradient>
  </defs>`;

/** The sky scene. The sun sits just off the board's top-right corner for a board of side `side`. */
function background(side = 660) {
  const sx = 512 + side * 0.5;
  const sy = 512 - side * 0.52;
  const sr = 92 + side * 0.06;
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 * Math.PI) / 180;
    const r0 = sr * 1.22;
    const r1 = sr * 1.62;
    return `<line x1="${sx + Math.cos(a) * r0}" y1="${sy + Math.sin(a) * r0}" x2="${sx + Math.cos(a) * r1}" y2="${sy + Math.sin(a) * r1}" stroke="${C.sun[1]}" stroke-width="${sr * 0.2}" stroke-linecap="round"/>`;
  }).join('');
  const cloud = (cx, cy, k, o) => `<g transform="translate(${cx} ${cy}) scale(${k})" fill="${C.cloud}" fill-opacity="${o}">
    <ellipse cx="0" cy="0" rx="120" ry="44"/><circle cx="-40" cy="-30" r="52"/><circle cx="34" cy="-44" r="64"/></g>`;
  return `<rect width="1024" height="1024" fill="url(#bg)"/>
    <circle cx="${sx}" cy="${sy}" r="${sr * 1.9}" fill="#FFFFFF" fill-opacity="0.28" filter="url(#glow)"/>
    ${rays}
    <circle cx="${sx}" cy="${sy}" r="${sr}" fill="url(#sun)" stroke="${C.sunEdge}" stroke-width="${sr * 0.06}"/>
    ${cloud(150, 250, 1.1, 0.92)}
    ${cloud(880, 640, 0.8, 0.55)}
    <path d="M0 800 C240 690 440 740 620 790 C780 830 900 760 1024 720 V1024 H0 Z" fill="${C.hills[0]}"/>
    <path d="M0 910 C200 830 380 880 560 930 C720 975 880 900 1024 860 V1024 H0 Z" fill="${C.hills[1]}"/>`;
}

const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

const render = (markup, size) =>
  new Resvg(markup, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Figtree' },
  })
    .render()
    .asPng();

function write(file, markup, size = 1024) {
  const png = render(markup, size);
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

const FULL = 740;
// Adaptive icons: the launcher masks a 108dp layer to ~72dp (a ~680px circle here) and guarantees only the inner
// 66dp; the tilted board's farthest corner stays inside that safe circle.
const SAFE = 470;
const full = svg(background(FULL) + board({ side: FULL }));
const fg = svg(board({ side: SAFE }));
const bgOnly = svg(background(SAFE));
const mono = svg(board({ side: SAFE, mono: true }));
const splash = svg(background(FULL) + board({ side: FULL }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon (white on transparent, Android uses only its alpha): a 3×3 grid of letter tiles with a
// diagonal capsule over them, the same found-word pill as the launcher icon, which still reads at 24dp.
const tiles = [0, 1, 2]
  .flatMap((r) => [0, 1, 2].map((c) => (r === c ? '' : `<rect x="${232 + c * 200}" y="${232 + r * 200}" width="160" height="160" rx="44" fill="#FFFFFF"/>`)))
  .join('');
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">
  ${tiles}
  <line x1="312" y1="312" x2="712" y2="712" stroke="#FFFFFF" stroke-width="200" stroke-linecap="round"/>
</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  const fgPng = render(fg, 512).toString('base64');
  const bgPng = render(bgOnly, 512).toString('base64');
  const monoPng = render(mono, 512).toString('base64');
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2200" height="760" viewBox="0 0 2200 760">
    <rect width="2200" height="760" fill="#E9E4DF"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        // 108dp layer drawn at 960px, so the 72dp visible area is 640px.
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})">
          <image href="data:image/png;base64,${bgPng}" x="${x - 160}" y="-100" width="960" height="960"/>
          <image href="data:image/png;base64,${fgPng}" x="${x - 160}" y="-100" width="960" height="960"/></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  const icon192 = render(full, 192).toString('base64');
  write(
    path.join(preview, 'preview-small.png'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120" viewBox="0 0 520 120"><rect width="520" height="120" fill="#FFFFFF"/>
    <image href="data:image/png;base64,${icon192}" x="10" y="36" width="48" height="48"/>
    <image href="data:image/png;base64,${icon192}" x="80" y="12" width="96" height="96"/>
    <rect x="200" y="12" width="96" height="96" fill="${C.brand}"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" x="200" y="12" width="96" height="96"/>
    <rect x="316" y="12" width="96" height="96" rx="48" fill="#3A4A5E"/><image href="data:image/png;base64,${monoPng}" x="296" y="-8" width="136" height="136"/>
  </svg>`,
    1040,
  );
}
