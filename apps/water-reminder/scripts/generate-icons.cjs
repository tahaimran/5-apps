// Regenerates the Sipling icon set (icon, adaptive layers, monochrome, splash, notification icon) and the
// Play graphics (512 icon, 1024×500 feature graphic) from one droplet-and-sprout mark.
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/water-reminder/assets> <apps/water-reminder/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

// The droplet on a 1024 canvas: tip at the top, round belly below.
const DROP = 'M512 196 C 604 330 742 462 742 618 C 742 746 640 846 512 846 C 384 846 282 746 282 618 C 282 462 420 330 512 196 Z';
// Water inside the drop: a gentle wave line two-fifths of the way up.
const WATER = 'M250 664 C 318 632 386 632 454 664 C 522 696 590 696 658 664 C 726 632 794 632 862 664 L 862 900 L 250 900 Z';
const STEM = 'M512 736 L512 600';
const LEAF_L = 'M512 600 C 500 528 438 486 368 492 C 372 562 430 610 512 600 Z';
const LEAF_R = 'M512 596 C 520 514 584 464 666 468 C 664 550 600 602 512 596 Z';

/** The mark, centered at (512,512); `k` scales it (1 = full-bleed icon size). */
function mark({ k = 1, mono = false } = {}) {
  // The drop's visual center sits a little low (the belly is heavier than the tip), so lift it 9px.
  const t = `translate(512 503) scale(${k}) translate(-512 -521)`;
  if (mono) {
    // Monochrome / notification: a solid drop with the sprout cut out (launchers use alpha only).
    return `<g transform="${t}"><mask id="cut"><rect width="1024" height="1024" fill="#FFFFFF"/>
      <path d="${STEM}" stroke="#000" stroke-width="30" stroke-linecap="round"/><path d="${LEAF_L}" fill="#000"/><path d="${LEAF_R}" fill="#000"/>
    </mask><path d="${DROP}" fill="#FFFFFF" mask="url(#cut)"/></g>`;
  }
  return `<g transform="${t}">
    <path d="${DROP}" fill="#063B6B" fill-opacity="0.28" transform="translate(0 18)" filter="url(#soft)"/>
    <path d="${DROP}" fill="url(#drop)"/>
    <clipPath id="inside"><path d="${DROP}"/></clipPath>
    <path d="${WATER}" fill="url(#water)" clip-path="url(#inside)"/>
    <path d="${STEM}" stroke="#2A9257" stroke-width="28" stroke-linecap="round"/>
    <path d="${LEAF_L}" fill="url(#leaf)"/>
    <path d="${LEAF_R}" fill="url(#leaf)"/>
    <ellipse cx="420" cy="420" rx="34" ry="62" fill="#FFFFFF" fill-opacity="0.7" transform="rotate(28 420 420)"/>
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="#3FB1F0"/><stop offset="1" stop-color="#0B5DA3"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.2" cy="0.1" r="0.8">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.3"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EAF6FE"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8FD6FA"/><stop offset="1" stop-color="#4FB3EE"/>
    </linearGradient>
    <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6BD494"/><stop offset="1" stop-color="#2E9E5B"/>
    </linearGradient>
  </defs>`;

const background = (w = 1024, h = 1024) => `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#sheen)"/>`;
const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

function write(file, markup, size = 1024) {
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

const full = svg(background() + mark());
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~61%.
const fg = svg(mark({ k: 0.8 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.8, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background() + mark(), { rounded: true });

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
  // How launchers show it: circle, squircle and rounded-square masks over the adaptive layers.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F2F8FC"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background()}${mark({ k: 0.8 })}</g></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(path.join(preview, 'preview-notification.png'), `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#136CAD"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" width="96" height="96"/></svg>`, 192);
}

// Play Store feature graphic (1024×500), per ASO.md §7: the headline in the app's fonts, a small
// mark, three pots growing seed → sprout → bloom, and waves along the bottom.
{
  // apps/<app>/assets → packages/shared/assets/fonts, wherever this script runs from.
  const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
  const pot = (x, stage) => {
    const leaf = '#2E9E5B';
    const plant =
      stage === 0
        ? `<path d="M${x - 8} 352 q 8 -12 16 0 q -8 8 -16 0 Z" fill="#8A5A3C"/>`
        : `<path d="M${x} 356 L${x} ${stage === 1 ? 318 : 282}" stroke="${leaf}" stroke-width="7" stroke-linecap="round"/>
           <path d="M${x} ${stage === 1 ? 330 : 312} c -10 -16 -30 -20 -42 -14 c 6 16 26 22 42 14 Z" fill="url(#leaf)"/>
           <path d="M${x} ${stage === 1 ? 326 : 300} c 10 -18 30 -22 44 -16 c -6 18 -28 24 -44 16 Z" fill="url(#leaf)"/>
           ${
             stage === 2
               ? [0, 72, 144, 216, 288].map((a) => `<circle cx="${x + 13 * Math.cos((a * Math.PI) / 180)}" cy="${270 + 13 * Math.sin((a * Math.PI) / 180)}" r="10" fill="#FF8FB1"/>`).join('') +
                 `<circle cx="${x}" cy="270" r="8" fill="#FFC94D"/>`
               : ''
           }`;
    return `${plant}
      <rect x="${x - 58}" y="352" width="116" height="20" rx="8" fill="#C86B3C"/>
      <path d="M${x - 48} 372 L${x + 48} 372 L${x + 36} 430 L${x - 36} 430 Z" fill="#C86B3C"/>
      <path d="M${x - 48} 372 L${x + 48} 372 L${x + 46} 380 L${x - 46} 380 Z" fill="#000" fill-opacity="0.12"/>`;
  };
  const wave = (y, amp, alpha) =>
    `<path d="M0 ${y} C 128 ${y - amp} 256 ${y - amp} 384 ${y} C 512 ${y + amp} 640 ${y + amp} 768 ${y} C 896 ${y - amp} 960 ${y - amp} 1024 ${y} L1024 500 L0 500 Z" fill="#FFFFFF" fill-opacity="${alpha}"/>`;
  const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">${defs}
    ${background(1024, 500)}
    ${wave(436, 14, 0.1)}${wave(456, 10, 0.12)}
    <g transform="translate(64 96) scale(0.11)">${mark()}</g>
    <text x="186" y="160" font-family="Bricolage Grotesque" font-weight="800" font-size="44" fill="#FFFFFF">Sipling</text>
    <text x="64" y="262" font-family="Bricolage Grotesque" font-weight="800" font-size="62" fill="#FFFFFF">Drink water.</text>
    <text x="64" y="334" font-family="Bricolage Grotesque" font-weight="800" font-size="62" fill="#FFFFFF">Grow a plant.</text>
    <text x="66" y="386" font-family="Figtree" font-weight="600" font-size="26" fill="#FFFFFF" fill-opacity="0.92">Gentle reminders, private and offline</text>
    ${pot(640, 0)}${pot(780, 1)}${pot(920, 2)}
  </svg>`;
  const png = new Resvg(feature, {
    fitTo: { mode: 'width', value: 1024 },
    font: {
      fontFiles: ['BricolageGrotesque_800ExtraBold.ttf', 'Figtree_600SemiBold.ttf'].map((f) => path.join(fontDir, f)),
      loadSystemFonts: false,
      defaultFontFamily: 'Figtree',
    },
  })
    .render()
    .asPng();
  fs.writeFileSync(path.join(store, 'feature-graphic-1024x500.png'), png);
  console.log('feature-graphic-1024x500.png', `${(png.length / 1024).toFixed(0)}KB`);
}
