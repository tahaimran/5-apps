// Regenerates the Contraction Timer icon set (icon, adaptive layers, monochrome, splash, notification icon, 512 store icon)
// from one mark: a bold stopwatch with a cream face and a coral contraction wave on it, on a deep teal tile (the "Start"
// teal). Teal stands apart from the pink, mint and purple fetus icons that fill this category's search results.
// The feature graphic and the store screenshots are made by tools/store-shots (see store/SCREENSHOTS.md).
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/contraction-timer/assets> <apps/contraction-timer/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2=".6" y2="1">
      <stop offset="0" stop-color="#2BA399"/><stop offset=".55" stop-color="#17716C"/><stop offset="1" stop-color="#0C4547"/>
    </linearGradient>
    <radialGradient id="sheen" cx=".22" cy=".06" r=".75">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".28"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFEFE4"/></linearGradient>
    <radialGradient id="face" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#FFFBF6"/><stop offset="1" stop-color="#FFE2D2"/></radialGradient>
    <linearGradient id="wave" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F49A6E"/><stop offset=".5" stop-color="#EE6F50"/><stop offset="1" stop-color="#D9533C"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
  </defs>`;

// The stopwatch is drawn around (CX, CY); with its crown it spans y 144..874, so its visual center is (512, 509).
const CX = 512;
const CY = 548;
const R = 292;
const WAVE = `M ${CX - 196} ${CY + 60} L ${CX - 150} ${CY + 60} C ${CX - 110} ${CY + 60}, ${CX - 100} ${CY - 110}, ${CX - 40} ${CY - 110}
  C ${CX + 20} ${CY - 110}, ${CX + 30} ${CY + 60}, ${CX + 75} ${CY + 60} C ${CX + 110} ${CY + 60}, ${CX + 115} ${CY - 10}, ${CX + 145} ${CY - 10}
  C ${CX + 175} ${CY - 10}, ${CX + 172} ${CY + 60}, ${CX + 205} ${CY + 60}`;

/** The mark, centered on the tile; `k` scales it (1 = drawn size). Mono: one flat white shape (alpha only). */
function mark({ k = 1, mono = false } = {}) {
  const ink = mono ? '#FFFFFF' : 'url(#ring)';
  return `<g transform="translate(512 512) scale(${k}) translate(-512 -509)">
    ${mono ? '' : `<circle cx="${CX}" cy="${CY + 26}" r="${R + 34}" fill="#06292B" fill-opacity=".45" filter="url(#soft)"/>`}
    ${mono ? '' : `<circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#face)"/>`}
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${ink}" stroke-width="68"/>
    <rect x="${CX - 52}" y="${CY - R - 112}" width="104" height="58" rx="22" fill="${ink}"/>
    <rect x="${CX - 20}" y="${CY - R - 70}" width="40" height="50" fill="${ink}"/>
    <g transform="rotate(45 ${CX} ${CY})"><rect x="${CX - 26}" y="${CY - R - 78}" width="52" height="56" rx="16" fill="${ink}"/></g>
    <path d="${WAVE}" fill="none" stroke="${mono ? '#FFFFFF' : 'url(#wave)'}" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
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

const full = svg(background + mark({ k: 1.06 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~61%.
const fg = svg(mark({ k: 0.84 }));
const bgOnly = svg(background);
const mono = svg(mark({ k: 0.84, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background + mark({ k: 1.06 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon: the flat white stopwatch and wave; Android uses only its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">${mark({ k: 1.25, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  // How launchers show it: circle and squircle masks over the adaptive layers, the themed icon, and 48px.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#E9E4DF"/>
    ${[0, 1]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="150"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background}${mark({ k: 0.84 })}</g></g>`;
      })
      .join('')}
    <circle cx="1820" cy="380" r="320" fill="#3B3355"/><g transform="translate(1436 -4) scale(0.75)">${mark({ k: 0.84, mono: true })}</g>
    <clipPath id="tiny"><circle cx="1820" cy="720" r="24"/></clipPath><g clip-path="url(#tiny)"><g transform="translate(1790 690) scale(0.0586)">${background}${mark({ k: 0.84 })}</g></g>
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
}
