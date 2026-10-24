// Regenerates the Contraction Timer icon set (icon, adaptive layers, monochrome, splash, notification icon) and the
// Play graphics (512 icon, 1024×500 feature graphic) from one mark (ASO.md §5): the giant teal button, a coral
// stopwatch arc around it with its crown, and a white crescent inside, on the cream-to-blush "Dawn" wash.
// The renderer is not an app dependency; run it from a scratch folder:
//   npm i @resvg/resvg-js@2.6.2 && node generate-icons.cjs <apps/contraction-timer/assets> <apps/contraction-timer/store> [preview-dir]
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const [assets, store, preview] = process.argv.slice(2);
if (!assets || !store) throw new Error('usage: node generate-icons.cjs <assets dir> <store dir> [preview dir]');

const C = {
  cream: '#FBF6F2',
  mint: '#DDF1ED',
  blush: '#F6DCE5',
  teal: ['#33938B', '#1B5C57'],
  coral: '#E07A5F',
  ink: '#2A2B3D',
  night: '#FF4A3A',
};

/** An arc on a circle centered at (cx, cy) from `a0` to `a1` degrees (0 = up, clockwise). */
const arc = (cx, cy, r, a0, a1) => {
  const p = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

/** The crescent: a circle with a smaller circle bitten out of its upper right (a moon, and a belly's curve). */
const crescent = (fill, id) => `
  <mask id="${id}"><rect width="1024" height="1024" fill="#FFFFFF"/><circle cx="566" cy="452" r="118" fill="#000000"/></mask>
  <circle cx="500" cy="520" r="150" fill="${fill}" mask="url(#${id})"/>`;

/** The mark, centered at (512,512); `k` scales it (1 = the full-bleed icon). */
function mark({ k = 1, mono = false } = {}) {
  const t = `translate(512 512) scale(${k}) translate(-512 -512)`;
  if (mono) {
    // Monochrome / notification: the solid disc with the crescent cut out, the arc and its crown (alpha only).
    return `<g transform="${t}">
      <mask id="monocut"><rect width="1024" height="1024" fill="#FFFFFF"/>${crescent('#000000', 'monomoon')}</mask>
      <circle cx="512" cy="512" r="270" fill="#FFFFFF" mask="url(#monocut)"/>
      <path d="${arc(512, 512, 360, 28, 332)}" stroke="#FFFFFF" stroke-width="44" stroke-linecap="round" fill="none"/>
      <rect x="482" y="104" width="60" height="64" rx="18" fill="#FFFFFF"/>
    </g>`;
  }
  return `<g transform="${t}">
    <circle cx="512" cy="540" r="276" fill="#1B5C57" fill-opacity="0.28" filter="url(#soft)"/>
    <circle cx="512" cy="512" r="270" fill="url(#disc)"/>
    <circle cx="512" cy="512" r="270" fill="url(#sheen)"/>
    ${crescent('#FFFFFF', 'moon')}
    <path d="${arc(512, 512, 360, 28, 332)}" stroke="${C.coral}" stroke-width="40" stroke-linecap="round" fill="none"/>
    <rect x="484" y="108" width="56" height="60" rx="16" fill="${C.coral}"/>
  </g>`;
}

const defs = `
  <defs>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${C.mint}"/><stop offset="0.55" stop-color="${C.cream}"/><stop offset="1" stop-color="${C.blush}"/>
    </linearGradient>
    <linearGradient id="disc" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${C.teal[0]}"/><stop offset="1" stop-color="${C.teal[1]}"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0.5" y1="0" x2="0.5" y2="0.6">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.24"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="stop" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#6E140A"/><stop offset="1" stop-color="#4A0E07"/>
    </linearGradient>
  </defs>`;

const background = (w = 1024, h = 1024) => `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
const svg = (body, { rounded = false } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}${
    rounded ? `<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath><g clip-path="url(#r)">${body}</g>` : body
  }</svg>`;

function write(file, markup, size = 1024) {
  const png = new Resvg(markup, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' }).render().asPng();
  fs.writeFileSync(file, png);
  console.log(path.basename(file), size, `${(png.length / 1024).toFixed(0)}KB`);
}

const full = svg(background() + mark({ k: 0.92 }));
// Adaptive icons: the launcher masks a 108dp layer to ~72dp, so the mark sits in the inner ~60%.
const fg = svg(mark({ k: 0.62 }));
const bgOnly = svg(background());
const mono = svg(mark({ k: 0.62, mono: true }));
// Splash: the whole icon as a rounded tile, so it reads on both the light and dark splash colors.
const splash = svg(background() + mark({ k: 0.92 }), { rounded: true });

write(path.join(assets, 'icon.png'), full);
write(path.join(assets, 'adaptive-icon-foreground.png'), fg);
write(path.join(assets, 'adaptive-icon-background.png'), bgOnly, 512);
write(path.join(assets, 'adaptive-icon-monochrome.png'), mono);
write(path.join(assets, 'splash-icon.png'), splash);
write(path.join(store, 'icon-512.png'), full, 512);

// Notification small icon: the cut-out mark, white on transparent; Android uses only its alpha.
const note = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 1024 1024">${mark({ k: 1.12, mono: true })}</svg>`;
write(path.join(assets, 'notification-icon.png'), note, 96);

if (preview) {
  // How launchers show it: circle, squircle and rounded-square masks over the adaptive layers.
  const masks = `<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="760" viewBox="0 0 2200 760">${defs}
    <rect width="2200" height="760" fill="#E9E4DF"/>
    ${[0, 1, 2]
      .map((i) => {
        const x = 60 + i * 720;
        const clip = i === 0 ? `<circle cx="${x + 320}" cy="380" r="320"/>` : `<rect x="${x}" y="60" width="640" height="640" rx="${i === 1 ? 150 : 40}"/>`;
        return `<clipPath id="m${i}">${clip}</clipPath><g clip-path="url(#m${i})"><g transform="translate(${x - 64} -4) scale(0.75)">${background()}${mark({ k: 0.62 })}</g></g>`;
      })
      .join('')}
  </svg>`;
  write(path.join(preview, 'preview-masks.png'), masks, 1100);
  write(
    path.join(preview, 'preview-notification.png'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#2A8079"/><image href="data:image/png;base64,${fs.readFileSync(path.join(assets, 'notification-icon.png')).toString('base64')}" width="96" height="96"/></svg>`,
    192,
  );
}

// Play Store feature graphic (1024×500), per ASO.md §5: on the left a phone showing the Timer in Night mode
// (black and red) with "0:47" and "Stop" glowing; on the right, on cream, "One tap. Calm numbers. Ready for
// your midwife." and a small "Contraction Timer & Kick Count" lockup. No badges, ratings or "#1" claims.
{
  // apps/<app>/assets → packages/shared/assets/fonts, wherever this script runs from.
  const fontDir = path.resolve(assets, '../../../packages/shared/assets/fonts');
  const phoneX = 92;
  const phoneY = 44;
  const cx = phoneX + 150;
  const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">${defs}
    <rect width="1024" height="500" fill="${C.cream}"/>
    <ellipse cx="240" cy="260" rx="270" ry="260" fill="${C.mint}"/>
    <ellipse cx="900" cy="520" rx="260" ry="170" fill="${C.blush}"/>
    <g>
      <rect x="${phoneX - 4}" y="${phoneY + 18}" width="308" height="560" rx="46" fill="#000000" fill-opacity="0.22" filter="url(#soft)"/>
      <rect x="${phoneX}" y="${phoneY}" width="300" height="560" rx="44" fill="#1C1C1E"/>
      <rect x="${phoneX + 10}" y="${phoneY + 10}" width="280" height="540" rx="36" fill="#000000"/>
      <rect x="${cx - 30}" y="${phoneY + 22}" width="60" height="10" rx="5" fill="#1C1C1E"/>
      <text x="${phoneX + 32}" y="${phoneY + 76}" font-family="Bricolage Grotesque" font-weight="800" font-size="22" fill="${C.night}">Timer</text>
      <rect x="${phoneX + 46}" y="${phoneY + 100}" width="208" height="34" rx="17" fill="#140403"/>
      <circle cx="${phoneX + 66}" cy="${phoneY + 117}" r="5" fill="${C.night}"/>
      <text x="${phoneX + 78}" y="${phoneY + 123}" font-family="Figtree" font-weight="600" font-size="14" fill="${C.night}">Contraction in progress</text>
      <text x="${cx}" y="${phoneY + 200}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="64" fill="${C.night}" fill-opacity="0.45" filter="url(#glow)">0:47</text>
      <text x="${cx}" y="${phoneY + 200}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="64" fill="${C.night}">0:47</text>
      <circle cx="${cx}" cy="${phoneY + 330}" r="104" fill="none" stroke="${C.night}" stroke-width="10" stroke-opacity="0.5" filter="url(#glow)"/>
      <circle cx="${cx}" cy="${phoneY + 330}" r="104" fill="none" stroke="${C.night}" stroke-width="4"/>
      <circle cx="${cx}" cy="${phoneY + 330}" r="84" fill="url(#stop)"/>
      <rect x="${cx - 13}" y="${phoneY + 290}" width="26" height="26" rx="5" fill="${C.night}"/>
      <text x="${cx}" y="${phoneY + 360}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="34" fill="${C.night}">Stop</text>
      <text x="${cx}" y="${phoneY + 470}" text-anchor="middle" font-family="Figtree" font-weight="600" font-size="13" fill="${C.night}" fill-opacity="0.85">Breathe with the ring</text>
    </g>
    <text x="482" y="138" font-family="Bricolage Grotesque" font-weight="800" font-size="48" fill="${C.ink}">One tap.</text>
    <text x="482" y="196" font-family="Bricolage Grotesque" font-weight="800" font-size="48" fill="${C.ink}">Calm numbers.</text>
    <text x="482" y="254" font-family="Bricolage Grotesque" font-weight="800" font-size="48" fill="#25756F">Ready for your</text>
    <text x="482" y="312" font-family="Bricolage Grotesque" font-weight="800" font-size="48" fill="#25756F">midwife.</text>
    <g transform="translate(482 352) scale(0.07)">${mark()}</g>
    <text x="566" y="392" font-family="Figtree" font-weight="700" font-size="22" fill="${C.ink}">Contraction Timer &amp; Kick Count</text>
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
