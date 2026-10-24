// Regenerates the Habits icon set (icon, adaptive layers, monochrome, splash, store icon, notification icon).
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/habit-tracker/assets> <apps/habit-tracker/store>
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

/** Ring + flame, centered at (512,512); `k` scales the whole mark (1 = full-bleed icon size). */
function mark({ k = 1, mono = false } = {}) {
  const r = 318 * k;
  const sw = 58 * k;
  const c = 2 * Math.PI * r;
  const arc = 0.78; // most of the way round: a streak in progress
  const s = 23 * k; // flame units → px
  const fx = 512 - 12 * s;
  const fy = 512 - 12.4 * s;
  const inner = 0.47;
  const white = mono ? '#FFFFFF' : '#FFFFFF';
  return `
    <circle cx="512" cy="512" r="${r}" fill="none" stroke="${white}" stroke-opacity="${mono ? 0.45 : 0.22}" stroke-width="${sw}"/>
    <circle cx="512" cy="512" r="${r}" fill="none" stroke="${white}" stroke-width="${sw}" stroke-linecap="round"
      stroke-dasharray="${c * arc} ${c}" transform="rotate(-90 512 512)"/>
    ${mono ? '' : `<g transform="translate(${fx} ${fy + 16 * k}) scale(${s})" filter="url(#soft)"><path d="${FLAME}" fill="#22097A" fill-opacity="0.45"/></g>`}
    <g transform="translate(${fx} ${fy}) scale(${s})">
      <path d="${FLAME}" fill="${mono ? white : 'url(#ember)'}"/>
      ${mono ? '' : `<g transform="translate(${12 - 12 * inner} ${19.6 - 12 * inner - 3.6}) scale(${inner})"><path d="${FLAME}" fill="url(#core)"/></g>`}
    </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="0.9"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8366FF"/><stop offset="1" stop-color="#3C1CC4"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.22" cy="0.12" r="0.75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.58" r="0.5">
      <stop offset="0" stop-color="#FF8A3D" stop-opacity="0.55"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFC56B"/><stop offset="0.55" stop-color="#FF8A2B"/><stop offset="1" stop-color="#EE5A0C"/>
    </linearGradient>
    <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFF6D6"/><stop offset="1" stop-color="#FFD36B"/>
    </linearGradient>
  </defs>`;

const background = `<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#sheen)"/>`;
const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

function write(file, markup, size = 1024) {
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

const full = svg(background + mark());
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~61%.
const fg = svg(mark({ k: 0.84 }));
const bgOnly = svg(background);
const mono = svg(mark({ k: 0.84, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background + mark(), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);
if (preview) {
  // How launchers show it: circle and squircle masks over the adaptive layers.
  const layered = bgOnly.replace('</svg>', '') + fg.replace(/^<svg[^>]*>/, '').replace(defs, '');
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F2F1F6"/>
    ${[0, 1, 2].map((i) => {
      const x = 60 + i * 720;
      const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
      return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background}${mark({ k: 0.84 })}</g></g>`;
    }).join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  void layered;
}

// Notification small icon: white flame only (a ring is too thin at 24dp); Android uses its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24"><g transform="translate(12 12.4) scale(1.12) translate(-12 -12)"><path d="${FLAME}" fill="#FFFFFF"/></g></svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

// Play Store feature graphic (1024×500): the copy from ASO.md in the app's fonts, a heatmap of
// check-ins (what the app is about), and the mark on the right.
{
  // apps/<app>/assets → packages/shared/assets/fonts, wherever this script runs from.
  const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
  const cells = [];
  for (let col = 0; col < 12; col++) {
    for (let row = 0; row < 7; row++) {
      const n = Math.sin((col * 7 + row + 1) * 12.9898) * 43758.5453;
      const v = n - Math.floor(n); // deterministic, evenly spread fill
      const level = col > 7 ? 0.15 + v * 0.75 : 0.08 + v * 0.45;
      cells.push(`<rect x="${630 + col * 30}" y="${46 + row * 30}" width="24" height="24" rx="6" fill="#FFFFFF" fill-opacity="${level.toFixed(2)}"/>`);
    }
  }
  const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">${defs}
    <rect width="1024" height="500" fill="url(#bg)"/><rect width="1024" height="500" fill="url(#sheen)"/>
    ${cells.join('')}
    <text x="64" y="222" font-family="Bricolage Grotesque" font-weight="800" font-size="78" fill="#FFFFFF">Habit Tracker</text>
    <text x="66" y="290" font-family="Figtree" font-weight="600" font-size="34" fill="#FFFFFF" fill-opacity="0.9">Streaks &amp; widget, no paywall</text>
    <g transform="translate(700 210) scale(0.27)">${mark()}</g>
  </svg>`;
  const png = new Resvg(feature, {
    fitTo: { mode: 'width', value: 1024 },
    font: {
      fontFiles: ['BricolageGrotesque_800ExtraBold.ttf', 'Figtree_600SemiBold.ttf'].map((f) => path.join(fontDir, f)),
      loadSystemFonts: false,
      defaultFontFamily: 'Figtree',
    },
  }).render().asPng();
  fs.writeFileSync(path.join(store, 'feature-graphic-1024x500.png'), png);
  console.log('feature-graphic-1024x500.png', `${(png.length / 1024).toFixed(0)}KB`);
}
