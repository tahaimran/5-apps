// Regenerates the Sipling icon set (icon, adaptive layers, monochrome, splash, notification icon, 512 store
// icon) from one mark: a happy water droplet with a two-leaf sprout growing from its tip, on a sunny
// gradient (every big competitor is blue-on-blue, so the warm tile is what makes it stand out).
// The 1024×500 feature graphic is made separately with the store screenshots (see store/SCREENSHOTS.md).
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/water-reminder/assets> <apps/water-reminder/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

// The droplet on a 1024 canvas: tip at the top, round belly below.
const DROP = 'M512 232 C 596 344 774 470 774 650 C 774 790 660 902 512 902 C 364 902 250 790 250 650 C 250 470 428 344 512 232 Z';
// Deeper water in the lower belly, for depth.
const WATER = 'M220 770 C 318 732 416 732 512 770 C 608 808 706 808 804 770 L 804 940 L 220 940 Z';
// The sprout grows out of the tip: a short stem and two leaves.
const STEM = 'M512 250 C 512 214 512 196 512 170';
const LEAF_L = 'M508 206 C 466 128 376 100 290 128 C 320 214 420 252 508 206 Z';
const LEAF_R = 'M516 184 C 550 92 650 50 752 74 C 728 176 620 226 516 184 Z';
const VEIN_L = 'M496 202 C 450 176 400 162 352 158';
const VEIN_R = 'M528 178 C 584 148 640 122 694 108';
// Face: two eyes and a smile, a little below the belly's middle.
const EYES = [
  [446, 652],
  [578, 652],
];
const SMILE = 'M462 716 C 486 754 538 754 562 716';

/** The mark, centered at (512,512); `k` scales it (1 = full-bleed icon size). */
function mark({ k = 1, mono = false } = {}) {
  // Drop + leaves span y 66–902; center that box on 512.
  const t = `translate(512 512) scale(${k}) translate(-512 -484)`;
  if (mono) {
    // Monochrome / notification: a solid drop and leaves, the face cut out (launchers use alpha only).
    return `<g transform="${t}"><mask id="cut"><rect x="-200" y="-200" width="1424" height="1424" fill="#FFFFFF"/>
      ${EYES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" fill="#000"/>`).join('')}
      <path d="${SMILE}" stroke="#000" stroke-width="26" stroke-linecap="round" fill="none"/>
    </mask><g mask="url(#cut)"><path d="${DROP}" fill="#FFFFFF"/>
      <path d="${STEM}" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round" fill="none"/>
      <path d="${LEAF_L}" fill="#FFFFFF"/><path d="${LEAF_R}" fill="#FFFFFF"/></g></g>`;
  }
  return `<g transform="${t}">
    <ellipse cx="512" cy="918" rx="240" ry="34" fill="#8A3A00" fill-opacity="0.35" filter="url(#soft)"/>
    <path d="${STEM}" stroke="#1E8A4C" stroke-width="30" stroke-linecap="round" fill="none"/>
    <path d="${LEAF_L}" fill="url(#leaf)"/>
    <path d="${LEAF_R}" fill="url(#leaf)"/>
    <path d="${VEIN_L}" stroke="#1E8A4C" stroke-opacity="0.45" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="${VEIN_R}" stroke="#1E8A4C" stroke-opacity="0.45" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="${DROP}" fill="url(#drop)"/>
    <clipPath id="inside"><path d="${DROP}"/></clipPath>
    <g clip-path="url(#inside)">
      <path d="${WATER}" fill="url(#water)"/>
      <path d="M220 770 C 318 732 416 732 512 770 C 608 808 706 808 804 770" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="10" fill="none"/>
    </g>
    <path d="${DROP}" fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="10"/>
    <ellipse cx="370" cy="560" rx="38" ry="92" fill="#FFFFFF" fill-opacity="0.85" transform="rotate(24 392 540)"/>
    <circle cx="404" cy="440" r="18" fill="#FFFFFF" fill-opacity="0.85"/>
    ${EYES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30" fill="#0A2E55"/><circle cx="${x + 9}" cy="${y - 10}" r="9" fill="#FFFFFF"/>`).join('')}
    <path d="${SMILE}" stroke="#0A2E55" stroke-width="22" stroke-linecap="round" fill="none"/>
    <ellipse cx="396" cy="716" rx="34" ry="20" fill="#FF7A93" fill-opacity="0.85"/>
    <ellipse cx="628" cy="716" rx="34" ry="20" fill="#FF7A93" fill-opacity="0.85"/>
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#FFE36E"/><stop offset="0.5" stop-color="#FFB23E"/><stop offset="1" stop-color="#FF7A3D"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.3" cy="0.2" r="0.7">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="drop" x1="0.2" y1="0" x2="0.7" y2="1">
      <stop offset="0" stop-color="#C9F3FF"/><stop offset="0.45" stop-color="#6FD3FF"/><stop offset="1" stop-color="#2AA2F2"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2BA8F5"/><stop offset="1" stop-color="#1679D6"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9BF07A"/><stop offset="1" stop-color="#2FB25C"/>
    </linearGradient>
  </defs>`;

const background = (w = 1024, h = 1024) =>
  `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#sheen)"/>`;
const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

function write(file, markup, size = 1024) {
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

const full = svg(background() + mark({ k: 1.12 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~61%.
const fg = svg(mark({ k: 0.74 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.74, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background() + mark({ k: 1.12 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon: the cut-out drop, white on transparent; Android uses only its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">${mark({ k: 1.12, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  // How launchers show it: circle, squircle and rounded-square masks over the adaptive layers,
  // plus the full icon at 48 px.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F2F8FC"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        // The 108dp layer drawn at 853px so its 72dp visible part fills the 640px mask.
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x + 320 - 426.5} ${380 - 426.5}) scale(0.833)">${background()}${mark({ k: 0.74 })}</g></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(path.join(preview, 'preview-48.png'), full, 48);
  write(path.join(preview, 'preview-mono.png'), `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#3A4A5A"/>${mark({ k: 0.74, mono: true })}</svg>`, 256);
  write(path.join(preview, 'preview-notification.png'), `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#136CAD"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" width="96" height="96"/></svg>`, 192);
}
