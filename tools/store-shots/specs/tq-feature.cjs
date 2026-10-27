// Quizora feature graphic (1024x500): name + tagline left, real question cards right (ASO.md §7).
const RAW = require('path').join(__dirname, '../raw/tq');
const ICON = require('path').join(__dirname, '../../../apps/trivia-quiz/store/icon-512.png');
const GOLD = '#FFC940';
// A crop of a 1082x2402 capture shown at width w.
const crop = (img, file, [cx, cy, cw, ch], w, extra) => {
  const k = w / cw;
  return `<div style="position:absolute;width:${w}px;height:${Math.round(ch * k)}px;border-radius:${Math.round(56 * k)}px;
    background:url(${img(RAW + '/' + file)}) ${-cx * k}px ${-cy * k}px / ${1082 * k}px ${2402 * k}px no-repeat;
    box-shadow:0 22px 44px rgba(15,5,60,.45);${extra}"></div>`;
};
module.exports = {
  width: 1024,
  height: 500,
  html: ({ img }) => {
    let seed = 3;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const spark = (x, y, r, f) => `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${f}"/>`;
    let conf = '';
    const C = [GOLD, '#FF6FB5', '#5EEAD4', '#FFFFFF', '#FF9F43'];
    for (let i = 0; i < 46; i++) {
      const x = rnd() * 1024, y = rnd() * 500;
      conf += `<rect x="${x}" y="${y}" width="${6 + rnd() * 7}" height="${3 + rnd() * 4}" rx="1.5" fill="${C[i % 5]}" opacity="${(0.4 + rnd() * 0.5).toFixed(2)}" transform="rotate(${rnd() * 180} ${x} ${y})"/>`;
    }
    return `<div style="position:relative;width:1024px;height:500px;overflow:hidden;background:linear-gradient(155deg,#8366FF 0%,#5B3DE8 48%,#2A1690 100%)">
      <svg width="1024" height="500" style="position:absolute;inset:0">
        <defs>
          <radialGradient id="g"><stop offset="0" stop-color="${GOLD}" stop-opacity=".45"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
          <radialGradient id="p"><stop offset="0" stop-color="#FF4FA3" stop-opacity=".4"/><stop offset="1" stop-color="#FF4FA3" stop-opacity="0"/></radialGradient>
        </defs>
        <circle cx="760" cy="250" r="330" fill="url(#g)"/><circle cx="80" cy="470" r="260" fill="url(#p)"/>
        <text x="520" y="430" font-family="Bricolage" font-weight="800" font-size="420" fill="#fff" opacity=".07" transform="rotate(12 520 430)">?</text>
        <path d="M-20 455 C 220 380, 420 520, 620 440 S 900 360, 1050 420" fill="none" stroke="${GOLD}" stroke-width="10" stroke-linecap="round" stroke-dasharray="1 26"/>
        ${conf}
        ${spark(585, 70, 16, GOLD)}${spark(990, 470, 11, '#fff')}${spark(46, 70, 10, GOLD)}${spark(470, 330, 8, '#fff')}
      </svg>
      <div style="position:absolute;left:62px;top:96px;display:flex;align-items:center;gap:18px">
        <img src="${img(ICON)}" style="width:84px;height:84px;border-radius:22px;box-shadow:0 10px 26px rgba(20,5,80,.45)">
        <div style="font:800 52px/1 Bricolage;color:#fff;letter-spacing:-1px">Quizora</div>
      </div>
      <div style="position:absolute;left:62px;top:212px;font:800 54px/1.05 Bricolage;letter-spacing:-1px;color:#fff;text-shadow:0 6px 24px rgba(25,10,90,.35)">Trivia that works<br><span style="color:${GOLD}">offline.</span></div>
      <div style="position:absolute;left:64px;top:352px;font:600 23px Figtree;color:rgba(255,255,255,.92)">3,000+ questions · 12 categories · daily challenge</div>
      ${crop(img, 'quiz.png', [42, 330, 998, 594], 330, 'left:600px;top:36px;transform:rotate(6deg)')}
      ${crop(img, 'quiz-right.png', [42, 1720, 998, 410], 320, 'left:660px;top:250px;transform:rotate(-4deg)')}
    </div>`;
  },
};
