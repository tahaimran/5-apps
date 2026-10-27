// Regenerates the Habits icon set (icon, adaptive layers, monochrome, splash, store icon, notification icon).
// The mark: a streak flame with a check mark knocked out of its belly ("done today, streak alive").
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/habit-tracker/assets> <apps/habit-tracker/store> [previewDir]
// The feature graphic and store screenshots are made by tools/store-shots (see store/SCREENSHOTS.md).
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
const CHECK = 'M -100 0 L -32 66 L 104 -70';
const S = 33; // flame units → px at full size
const FX = 512 - 12 * S, FY = 512 - 12.4 * S;

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8E6BFF"/><stop offset=".5" stop-color="#5B3DF5"/><stop offset="1" stop-color="#3214B8"/>
    </linearGradient>
    <radialGradient id="sheen" cx=".2" cy=".08" r=".8">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".35"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lift"><stop offset="0" stop-color="#C9B8FF" stop-opacity=".55"/><stop offset="1" stop-color="#C9B8FF" stop-opacity="0"/></radialGradient>
    <linearGradient id="ember" x1="0" y1="0" x2=".3" y2="1">
      <stop offset="0" stop-color="#FFD25E"/><stop offset=".45" stop-color="#FF8A2B"/><stop offset="1" stop-color="#F2410F"/>
    </linearGradient>
    <radialGradient id="hot" cx=".5" cy=".72" r=".45">
      <stop offset="0" stop-color="#FFE9A8" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <clipPath id="flameClip"><path transform="translate(${FX} ${FY}) scale(${S})" d="${FLAME}"/></clipPath>
  </defs>`;

/** Flame + check centered on (512,512); `k` scales the whole mark (1 = full-bleed icon size). */
function mark({ k = 1, mono = false, knock = '#000' } = {}) {
  const flame = `<path transform="translate(${FX} ${FY}) scale(${S})" d="${FLAME}"`;
  const check = (stroke) => `<path d="${CHECK}" transform="translate(530 652)" fill="none" stroke="${stroke}" stroke-width="76" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (mono) {
    // One flat color with the check cut out, so themed icons keep the check.
    return `<mask id="knock"><rect width="1024" height="1024" fill="#fff"/>${check('#000')}</mask>
      <g transform="translate(512 518) scale(${k}) translate(-512 -512)" mask="url(#knock)">${flame} fill="#FFFFFF"/></g>`;
  }
  void knock;
  return `<g transform="translate(512 ${512 + 6 * k}) scale(${k}) translate(-512 -512)">
    <circle cx="512" cy="560" r="400" fill="url(#lift)"/>
    <g transform="translate(0 30)" filter="url(#soft)">${flame} fill="#1E0A80" fill-opacity=".55"/></g>
    ${flame} fill="url(#ember)"/>
    ${flame} fill="url(#hot)"/>
    <g clip-path="url(#flameClip)"><ellipse cx="420" cy="330" rx="70" ry="190" transform="rotate(28 420 330)" fill="#FFFFFF" opacity=".16"/></g>
    ${check('#FFFFFF')}
  </g>`;
}

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

const full = svg(background + mark({ k: 1.1 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~61%.
const fg = svg(mark({ k: 0.88 }));
const bgOnly = svg(background);
const mono = svg(mark({ k: 0.88, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background + mark({ k: 1.1 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);
if (preview) {
  // How launchers show it: circle and squircle masks over the adaptive layers, the themed icon, and 48px.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F2F1F6"/>
    ${[0, 1].map((i) => {
      const x = 60 + i * 720;
      const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="150"/>`;
      return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background}${mark({ k: 0.88 })}</g></g>`;
    }).join('')}
    <circle cx="1820" cy="380" r="320" fill="#3B3355"/><g transform="translate(1436 -4) scale(0.75)">${mark({ k: 0.88, mono: true })}</g>
    <clipPath id="tiny"><circle cx="1820" cy="720" r="24"/></clipPath><g clip-path="url(#tiny)"><g transform="translate(1790 690) scale(0.0586)">${background}${mark({ k: 0.88 })}</g></g>
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
}

// Notification small icon: the white flame with the check cut out; Android uses its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${mark({ k: 1.08, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);
