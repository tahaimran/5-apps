// Regenerates the Word Search icon set (icon, adaptive layers, monochrome, splash, notification icon) and the Play
// graphics (512 icon, 1024×500 feature graphic) from one mark (ASO.md §5): a cream letter tile, three rows of big
// letters, the middle word "BIG" circled by a thick rounded orange highlight, and a small gold magnifying glass, on
// the deep-blue background layer. The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/word-search/assets> <apps/word-search/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

const C = {
  blue: ['#2C77CF', '#1A4E93'],
  brand: '#1F5FAF',
  cream: '#FFF9EC',
  creamEdge: '#EADFC6',
  ink: '#13233F',
  orange: '#F4A261',
  orangeEdge: '#D2593A',
  sky: '#9FD8F5',
  skyEdge: '#2A86BD',
  gold: '#FFC93C',
  goldEdge: '#C98A00',
  stage: ['#BFE6F8', '#DDF2FB', '#F2FAFD'],
};

const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
const fontFiles = [
  path.join(assets, 'fonts/AtkinsonHyperlegible_700Bold.ttf'),
  path.join(fontDir, 'BricolageGrotesque_800ExtraBold.ttf'),
  path.join(fontDir, 'Figtree_600SemiBold.ttf'),
  path.join(fontDir, 'Figtree_700Bold.ttf'),
];

const LETTERS = ['TAK', 'BIG', 'ENS'];

/** The tile with its letters; centered at (512,512), `k` scales it. */
function mark({ k = 1, mono = false, glass = true } = {}) {
  const t = `translate(512 512) scale(${k}) translate(-512 -512)`;
  const x0 = 212;
  const y0 = 212;
  const cell = 200;
  const letters = LETTERS.flatMap((row, r) =>
    [...row].map(
      (ch, c) =>
        `<text x="${x0 + cell * c + cell / 2}" y="${y0 + cell * r + cell / 2 + 58}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="164" fill="${mono ? '#000000' : C.ink}">${ch}</text>`,
    ),
  );
  if (mono) {
    // Monochrome: the tile with its letters cut out, and the highlight drawn as an outline (alpha only).
    return `<g transform="${t}">
      <mask id="cut"><rect width="1024" height="1024" fill="#FFFFFF"/>${letters.join('')}
        <rect x="${x0 + 18}" y="${y0 + cell + 22}" width="${cell * 3 - 36}" height="${cell - 44}" rx="${(cell - 44) / 2}" fill="none" stroke="#000000" stroke-width="22"/></mask>
      <rect x="180" y="180" width="664" height="664" rx="120" fill="#FFFFFF" mask="url(#cut)"/>
    </g>`;
  }
  return `<g transform="${t}">
    <rect x="186" y="204" width="664" height="664" rx="120" fill="#0B2A55" fill-opacity="0.35" filter="url(#soft)"/>
    <rect x="180" y="180" width="664" height="664" rx="120" fill="${C.cream}"/>
    <rect x="180" y="180" width="664" height="664" rx="120" fill="none" stroke="${C.creamEdge}" stroke-width="6"/>
    <rect x="${x0 + 14}" y="${y0 + cell + 18}" width="${cell * 3 - 28}" height="${cell - 36}" rx="${(cell - 36) / 2}" fill="${C.orange}" stroke="${C.orangeEdge}" stroke-width="10"/>
    ${letters.join('')}
    ${glass ? `<g transform="translate(742 742) rotate(-45)">
      <rect x="-22" y="70" width="44" height="150" rx="22" fill="${C.goldEdge}"/>
      <circle cx="0" cy="0" r="104" fill="#FFFFFF" fill-opacity="0.35" stroke="${C.gold}" stroke-width="34"/>
      <circle cx="0" cy="0" r="104" fill="none" stroke="${C.goldEdge}" stroke-width="6"/>
    </g>` : ''}
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <radialGradient id="bg" cx="0.35" cy="0.25" r="0.95">
      <stop offset="0" stop-color="${C.blue[0]}"/><stop offset="1" stop-color="${C.blue[1]}"/>
    </radialGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.stage[0]}"/><stop offset="0.6" stop-color="${C.stage[1]}"/><stop offset="1" stop-color="${C.stage[2]}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#CBEBF9"/><stop offset="1" stop-color="#F2FAFD"/>
    </linearGradient>
  </defs>`;

const background = (w = 1024, h = 1024) => `<rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="120" cy="140" r="260" fill="#FFFFFF" fill-opacity="0.07"/><circle cx="930" cy="960" r="300" fill="#000000" fill-opacity="0.08"/>`;
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

const full = svg(background() + mark({ k: 1.02 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~60%.
const fg = svg(mark({ k: 0.66 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.66, mono: true }));
const splash = svg(background() + mark({ k: 1.02 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon (white on transparent, Android uses only its alpha): a 3×3 grid of letter tiles with a
// capsule around the middle row, which still reads at 24dp where letters would not.
const dots = [0, 1, 2]
  .flatMap((r) => [0, 1, 2].map((c) => `<rect x="${232 + c * 200}" y="${232 + r * 200}" width="160" height="160" rx="44" fill="#FFFFFF"/>`))
  .join('');
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">
  <mask id="nm"><rect width="1024" height="1024" fill="#FFFFFF"/><rect x="200" y="400" width="624" height="224" rx="112" fill="#000000"/></mask>
  <g mask="url(#nm)">${dots}</g>
  <rect x="180" y="420" width="664" height="184" rx="92" fill="none" stroke="#FFFFFF" stroke-width="44"/>
  ${[0, 1, 2].map((c) => `<rect x="${262 + c * 200}" y="472" width="100" height="80" rx="30" fill="#FFFFFF"/>`).join('')}
</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#E9E4DF"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background()}${mark({ k: 0.66 })}</g></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(path.join(preview, 'preview-small.png'), `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120"><rect width="400" height="120" fill="#FFFFFF"/>
    <image href="data:image/png;base64,${render(full, 192).toString('base64')}" x="10" y="36" width="48" height="48"/>
    <image href="data:image/png;base64,${render(full, 192).toString('base64')}" x="80" y="12" width="96" height="96"/>
    <rect x="200" y="12" width="96" height="96" fill="${C.brand}"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" x="200" y="12" width="96" height="96"/>
  </svg>`, 800);
}

// Play Store feature graphic (1024×500), per ASO.md §7: a deep-blue left half with the white headline "Large Print
// Word Search" and "Big letters · No timers · Play offline"; on the right, on the app's sky, a tilted phone with a
// large-letter grid and one orange highlighted word, a coffee cup and reading glasses. No badges, ratings or "#1".
{
  const grid = ['CALMS', 'TEAPW', 'ROSEA', 'BIRDN', 'GLOWS'];
  const cell = 44;
  const gx = 22;
  const gy = 118;
  const pill = (r0, c0, r1, c1, fill, edge) => {
    const x0 = gx + c0 * cell + cell / 2;
    const y0 = gy + r0 * cell + cell / 2;
    const x1 = gx + c1 * cell + cell / 2;
    const y1 = gy + r1 * cell + cell / 2;
    return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${edge}" stroke-width="${cell * 0.8}" stroke-linecap="round"/>
      <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${fill}" stroke-width="${cell * 0.8 - 6}" stroke-linecap="round"/>`;
  };
  const phone = `
    <rect x="-6" y="16" width="268" height="520" rx="40" fill="#0B2A55" fill-opacity="0.3" filter="url(#soft)"/>
    <rect x="0" y="0" width="264" height="520" rx="40" fill="#1C2433"/>
    <rect x="9" y="9" width="246" height="502" rx="32" fill="url(#screen)"/>
    <rect x="102" y="20" width="60" height="10" rx="5" fill="#1C2433"/>
    <rect x="62" y="48" width="140" height="36" rx="8" fill="${C.gold}"/>
    <text x="132" y="73" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="18" fill="#4A2C00">Garden · 4</text>
    <rect x="${gx - 8}" y="${gy - 8}" width="${cell * 5 + 16}" height="${cell * 5 + 16}" rx="18" fill="#1D4F8F"/>
    <rect x="${gx - 2}" y="${gy - 2}" width="${cell * 5 + 4}" height="${cell * 5 + 4}" rx="14" fill="#FFFFFF"/>
    ${pill(0, 0, 0, 3, C.orange, C.orangeEdge)}
    ${pill(1, 0, 1, 2, C.sky, C.skyEdge)}
    ${pill(0, 4, 4, 4, '#B8E38A', '#4B8F22')}
    ${grid
      .flatMap((row, r) =>
        [...row].map(
          (ch, c) =>
            `<text x="${gx + c * cell + cell / 2}" y="${gy + r * cell + cell / 2 + 11}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="30" fill="${C.ink}">${ch}</text>`,
        ),
      )
      .join('')}
    ${['CALM', 'TEA', 'ROSE', 'BIRD']
      .map((w, i) => `<rect x="${22 + (i % 2) * 112}" y="${370 + Math.floor(i / 2) * 50}" width="104" height="40" rx="20" fill="#FFFFFF" stroke="#C8D6E5" stroke-width="2"/>
        <text x="${74 + (i % 2) * 112}" y="${397 + Math.floor(i / 2) * 50}" text-anchor="middle" font-family="Atkinson Hyperlegible" font-weight="700" font-size="20" fill="${C.ink}" ${i < 2 ? 'text-decoration="line-through" fill-opacity="0.6"' : ''}>${w}</text>`)
      .join('')}`;
  const cup = `
    <ellipse cx="0" cy="96" rx="78" ry="12" fill="#0B2A55" fill-opacity="0.18"/>
    <path d="M-58 0 L58 0 L48 86 Q46 96 34 96 L-34 96 Q-46 96 -48 86 Z" fill="#D9693F"/>
    <path d="M-58 0 L58 0 L56 18 L-56 18 Z" fill="#E8875F"/>
    <path d="M56 22 C96 20 98 70 50 70" stroke="#D9693F" stroke-width="14" fill="none" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="58" ry="12" fill="#6B3A1E"/>
    <path d="M-16 -24 C-30 -44 -2 -54 -16 -76 M14 -22 C0 -42 28 -52 14 -74" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" fill="none" stroke-opacity="0.85"/>`;
  const glasses = `
    <ellipse cx="0" cy="40" rx="120" ry="12" fill="#0B2A55" fill-opacity="0.16"/>
    <ellipse cx="-56" cy="0" rx="46" ry="34" fill="#FFFFFF" fill-opacity="0.45" stroke="#2A2F3D" stroke-width="10"/>
    <ellipse cx="56" cy="0" rx="46" ry="34" fill="#FFFFFF" fill-opacity="0.45" stroke="#2A2F3D" stroke-width="10"/>
    <path d="M-12 -6 Q0 -18 12 -6" stroke="#2A2F3D" stroke-width="9" fill="none"/>
    <path d="M-100 -8 L-150 26 M100 -8 L150 26" stroke="#2A2F3D" stroke-width="9" stroke-linecap="round"/>`;
  const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">${defs}
    <rect width="1024" height="500" fill="url(#sky)"/>
    <ellipse cx="760" cy="96" rx="90" ry="34" fill="#FFFFFF" fill-opacity="0.9"/><ellipse cx="810" cy="80" rx="60" ry="36" fill="#FFFFFF" fill-opacity="0.9"/>
    <ellipse cx="960" cy="200" rx="70" ry="24" fill="#FFFFFF" fill-opacity="0.8"/>
    <ellipse cx="800" cy="560" rx="420" ry="130" fill="#B9E0A0"/>
    <path d="M0 0 H520 C470 140 560 330 480 500 H0 Z" fill="url(#bg)"/>
    <text x="64" y="150" font-family="Bricolage Grotesque" font-weight="800" font-size="58" fill="#FFFFFF">Large Print</text>
    <text x="64" y="218" font-family="Bricolage Grotesque" font-weight="800" font-size="58" fill="#FFFFFF">Word Search</text>
    <rect x="64" y="248" width="120" height="10" rx="5" fill="${C.gold}"/>
    <text x="64" y="306" font-family="Figtree" font-weight="600" font-size="25" fill="#FFFFFF">Big letters · No timers · Play offline</text>
    <g transform="translate(64 360) scale(0.11)">${mark({ glass: false })}</g>
    <text x="186" y="414" font-family="Figtree" font-weight="700" font-size="22" fill="#FFFFFF">Word Search: Large Print Easy</text>
    <g transform="translate(596 -6) rotate(8)">${phone}</g>
    <g transform="translate(930 360)">${cup}</g>
    <g transform="translate(560 476) rotate(-4) scale(0.7)">${glasses}</g>
  </svg>`;
  const png = render(feature, 1024);
  fs.writeFileSync(path.join(store, 'feature-graphic-1024x500.png'), png);
  console.log('feature-graphic-1024x500.png', `${(png.length / 1024).toFixed(0)}KB`);
}
