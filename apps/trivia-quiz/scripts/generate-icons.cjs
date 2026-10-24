// Regenerates the Quizora icon set (icon, adaptive layers, monochrome, splash, notification icon) and the
// Play graphics (512 icon, 1024×500 feature graphic) from one mark: a speech bubble holding a bold "?"
// whose dot is a gold lightbulb (ASO.md §5), on the violet "Spark" gradient.
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/trivia-quiz/assets> <apps/trivia-quiz/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

// The bubble on a 1024 canvas, tail at the lower left.
const BUBBLE = 'M372 214 H652 Q774 214 774 336 V568 Q774 690 652 690 H506 L376 806 L396 690 H372 Q250 690 250 568 V336 Q250 214 372 214 Z';
const QUESTION = 'M434 384 Q434 300 512 300 Q590 300 590 374 Q590 424 546 450 Q512 470 512 504';
/** A four-point sparkle centered on (x, y). */
const sparkle = (x, y, r) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`;

/** The mark, centered at (512,512); `k` scales it (1 = full-bleed icon size). */
function mark({ k = 1, mono = false, sparkles = true } = {}) {
  const t = `translate(512 512) scale(${k}) translate(-512 -510)`;
  if (mono) {
    // Monochrome / notification: a solid bubble with the "?" and its dot cut out (launchers use alpha only).
    return `<g transform="${t}"><mask id="cut"><rect width="1024" height="1024" fill="#FFFFFF"/>
      <path d="${QUESTION}" stroke="#000" stroke-width="70" stroke-linecap="round" fill="none"/><circle cx="512" cy="604" r="42" fill="#000"/>
    </mask><path d="${BUBBLE}" fill="#FFFFFF" mask="url(#cut)"/></g>`;
  }
  return `<g transform="${t}">
    <path d="${BUBBLE}" fill="#1B0F6B" fill-opacity="0.32" transform="translate(0 22)" filter="url(#soft)"/>
    <path d="${BUBBLE}" fill="url(#bubble)"/>
    <path d="${QUESTION}" stroke="url(#ink)" stroke-width="70" stroke-linecap="round" fill="none"/>
    <circle cx="512" cy="604" r="58" fill="#FFC940" fill-opacity="0.28" filter="url(#glow)"/>
    <circle cx="512" cy="596" r="40" fill="url(#bulb)"/>
    <rect x="494" y="628" width="36" height="22" rx="8" fill="#D9961A"/>
    ${sparkles ? `<path d="${sparkle(800, 206, 56)}" fill="#FFC940"/><path d="${sparkle(214, 286, 30)}" fill="#FFFFFF" fill-opacity="0.85"/>` : ''}
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="#7457F5"/><stop offset="1" stop-color="#3B24B0"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.18" cy="0.08" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bubble" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEEAFF"/>
    </linearGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6A4BF0"/><stop offset="1" stop-color="#4B30C8"/>
    </linearGradient>
    <radialGradient id="bulb" cx="0.38" cy="0.32" r="0.75">
      <stop offset="0" stop-color="#FFE38A"/><stop offset="1" stop-color="#FFBE2E"/>
    </radialGradient>
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
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~60%.
const fg = svg(mark({ k: 0.74 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.74, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background() + mark(), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon: the cut-out bubble, white on transparent; Android uses only its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">${mark({ k: 1.18, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  // How launchers show it: circle, squircle and rounded-square masks over the adaptive layers.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#F6F4FD"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background()}${mark({ k: 0.74 })}</g></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(
    path.join(preview, 'preview-notification.png'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#5B3FE0"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" width="96" height="96"/></svg>`,
    192,
  );
}

// Play Store feature graphic (1024×500), per ASO.md §7: "Quizora" and "Trivia that works offline." on the
// left, three tilted question cards (Geography, Movies, Science) on the right, one answered with a green
// check and a "Did you know?" chip.
{
  // apps/<app>/assets → packages/shared/assets/fonts, wherever this script runs from.
  const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
  const card = ({ x, y, angle, label, color, soft, answered }) => `
    <g transform="translate(${x} ${y}) rotate(${angle})">
      <rect x="-128" y="-92" width="256" height="184" rx="26" fill="#1B0F6B" fill-opacity="0.3" transform="translate(0 12)" filter="url(#soft)"/>
      <rect x="-128" y="-92" width="256" height="184" rx="26" fill="#FFFFFF"/>
      <rect x="-104" y="-70" width="${label.length * 11 + 44}" height="30" rx="15" fill="${soft}"/>
      <circle cx="-88" cy="-55" r="6" fill="${color}"/>
      <text x="-74" y="-49" font-family="Figtree" font-weight="700" font-size="17" fill="${color}">${label}</text>
      <rect x="-104" y="-22" width="200" height="14" rx="7" fill="#1C1838" fill-opacity="0.82"/>
      <rect x="-104" y="2" width="150" height="14" rx="7" fill="#1C1838" fill-opacity="0.82"/>
      ${
        answered
          ? `<rect x="-104" y="32" width="208" height="38" rx="19" fill="#137A47"/>
             <path d="M-86 51 l8 8 l14 -16" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
             <rect x="-54" y="45" width="100" height="12" rx="6" fill="#FFFFFF" fill-opacity="0.9"/>`
          : `<rect x="-104" y="32" width="208" height="38" rx="19" fill="#ECE8FF"/>
             <rect x="-84" y="45" width="120" height="12" rx="6" fill="#5B3FE0" fill-opacity="0.45"/>`
      }
    </g>`;
  const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">${defs}
    ${background(1024, 500)}
    <path d="${sparkle(612, 84, 20)}" fill="#FFC940"/>
    <path d="${sparkle(960, 432, 14)}" fill="#FFFFFF" fill-opacity="0.8"/>
    <g transform="translate(58 92) scale(0.115)">${mark({ sparkles: false })}</g>
    <text x="190" y="156" font-family="Bricolage Grotesque" font-weight="800" font-size="46" fill="#FFFFFF">Quizora</text>
    <text x="64" y="262" font-family="Bricolage Grotesque" font-weight="800" font-size="58" fill="#FFFFFF">Trivia that works</text>
    <text x="64" y="330" font-family="Bricolage Grotesque" font-weight="800" font-size="58" fill="#FFC940">offline.</text>
    <text x="66" y="384" font-family="Figtree" font-weight="600" font-size="24" fill="#FFFFFF" fill-opacity="0.92">3,000+ questions, a daily challenge, no sign-up</text>
    ${card({ x: 800, y: 128, angle: 7, label: 'Geography', color: '#0369A1', soft: '#E0F2FE', answered: false })}
    ${card({ x: 884, y: 286, angle: -5, label: 'Movies', color: '#BE123C', soft: '#FFE4E9', answered: false })}
    ${card({ x: 736, y: 352, angle: -2, label: 'Science', color: '#047857', soft: '#D9F7EC', answered: true })}
    <g transform="translate(612 250) rotate(-4)">
      <rect x="0" y="0" width="150" height="36" rx="18" fill="#FFC940"/>
      <text x="18" y="24" font-family="Figtree" font-weight="700" font-size="17" fill="#1C1838">Did you know?</text>
    </g>
  </svg>`;
  const png = new Resvg(feature, {
    fitTo: { mode: 'width', value: 1024 },
    font: {
      fontFiles: ['BricolageGrotesque_800ExtraBold.ttf', 'Figtree_600SemiBold.ttf', 'Figtree_700Bold.ttf'].map((f) => path.join(fontDir, f)),
      loadSystemFonts: false,
      defaultFontFamily: 'Figtree',
    },
  })
    .render()
    .asPng();
  fs.writeFileSync(path.join(store, 'feature-graphic-1024x500.png'), png);
  console.log('feature-graphic-1024x500.png', `${(png.length / 1024).toFixed(0)}KB`);
}
