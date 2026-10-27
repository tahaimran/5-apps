// Regenerates the Quizora icon set (icon, adaptive layers, monochrome, splash, notification icon, 512 store icon)
// from one mark: a big, chunky violet "?" whose dot glows like a lightbulb, on a gold sunburst tile.
// Gold was picked over the brand violet because Play's "trivia quiz" results are almost all blue and purple
// (checked against the top 10 on 2026-10-26); the violet glyph keeps the brand.
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/trivia-quiz/assets> <apps/trivia-quiz/store> [preview-dir]
// The feature graphic and store screenshots are made by tools/store-shots (see store/SCREENSHOTS.md).
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

// The "?" as one round-capped stroke on a 1024 canvas; the dot is drawn separately.
const QUESTION = 'M362 392 Q362 222 512 222 Q662 222 662 372 Q662 466 578 512 Q512 548 512 636';
const DOT = { x: 512, y: 798, r: 74 };
const STROKE = 140;
/** A four-point sparkle centered on (x, y). */
const sparkle = (x, y, r, fill) =>
  `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${fill}"/>`;
/** Sunburst rays from just above the center, as in a quiz-show backdrop. */
const rays = (n = 18) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = a0 + Math.PI / n;
    s += `<path d="M512 540 L${(512 + 900 * Math.cos(a0)).toFixed(1)} ${(540 + 900 * Math.sin(a0)).toFixed(1)} L${(512 + 900 * Math.cos(a1)).toFixed(1)} ${(540 + 900 * Math.sin(a1)).toFixed(1)} Z" fill="#FFFFFF" opacity="0.18"/>`;
  }
  return s;
};

/** The mark, centered at (512,512); `k` scales it (1 = full-bleed icon size). */
function mark({ k = 1, mono = false } = {}) {
  const t = `translate(512 512) scale(${k}) translate(-512 -530)`;
  if (mono) {
    // Monochrome / notification: the solid "?" and dot (launchers use alpha only).
    return `<g transform="${t}"><path d="${QUESTION}" fill="none" stroke="#FFFFFF" stroke-width="${STROKE}" stroke-linecap="round"/>
      <circle cx="${DOT.x}" cy="${DOT.y}" r="${DOT.r}" fill="#FFFFFF"/></g>`;
  }
  return `<g transform="${t}">
    <circle cx="${DOT.x}" cy="${DOT.y}" r="160" fill="url(#haloW)"/>
    <path d="${QUESTION}" fill="none" stroke="#7A3A00" stroke-opacity="0.45" stroke-width="${STROKE}" stroke-linecap="round" transform="translate(0 26)" filter="url(#soft)"/>
    <path d="${QUESTION}" fill="none" stroke="#24127A" stroke-width="${STROKE}" stroke-linecap="round" transform="translate(0 14)"/>
    <path d="${QUESTION}" fill="none" stroke="url(#ink)" stroke-width="${STROKE}" stroke-linecap="round"/>
    <path d="M400 360 Q408 270 500 262" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="26" stroke-linecap="round"/>
    <circle cx="${DOT.x}" cy="${DOT.y + 14}" r="${DOT.r}" fill="#24127A"/>
    <circle cx="${DOT.x}" cy="${DOT.y}" r="${DOT.r}" fill="url(#ink)"/>
    ${sparkle(DOT.x, DOT.y, 36, '#FFE27A')}
    ${sparkle(770, 230, 46, '#FFFFFF')}
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
    <radialGradient id="bg" cx="0.5" cy="0.42" r="0.78">
      <stop offset="0" stop-color="#FFE680"/><stop offset="0.55" stop-color="#FFC233"/><stop offset="1" stop-color="#FF8A1F"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7457F5"/><stop offset="1" stop-color="#3B24B0"/>
    </linearGradient>
    <radialGradient id="haloW"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
  </defs>`;

const background = () => `<rect width="1024" height="1024" fill="url(#bg)"/>${rays()}`;
const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

function write(file, markup, size = 1024) {
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

// Full-bleed icon: the glyph fills ~75% of the tile, like the top results do.
const full = svg(background() + mark({ k: 1.1 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~60%.
const fg = svg(mark({ k: 0.84 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.84, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background() + mark({ k: 1.1 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon: the white "?", Android uses only its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">${mark({ k: 1.12, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  // How launchers show it: circle and squircle masks over the adaptive layers, the themed icon, and 48px.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F6F4FD"/>
    ${[0, 1]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="150"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background()}${mark({ k: 0.84 })}</g></g>`;
      })
      .join('')}
    <circle cx="1820" cy="380" r="320" fill="#3B3355"/><g transform="translate(1436 -4) scale(0.75)">${mark({ k: 0.84, mono: true })}</g>
    <clipPath id="tiny"><circle cx="1820" cy="720" r="24"/></clipPath><g clip-path="url(#tiny)"><g transform="translate(1790 690) scale(0.0586)">${background()}${mark({ k: 0.84 })}</g></g>
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(
    path.join(preview, 'preview-notification.png'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#5B3FE0"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" width="96" height="96"/></svg>`,
    192,
  );
}
