// Habits feature graphic (1024x500): title + tagline left, real Today screen and widget right.
const RAW = require('path').join(__dirname, '../raw/ht');
const ICON = require('path').join(__dirname, '../../../apps/habit-tracker/store/icon-512.png');
const FLAME = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';
module.exports = {
  width: 1024,
  height: 500,
  html: ({ img }) => {
    let squares = '';
    let seed = 5;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) {
      if (rnd() < 0.25) continue;
      squares += `<rect x="${28 + c * 30}" y="${300 + r * 30}" width="22" height="22" rx="6" fill="#fff" opacity="${(0.05 + rnd() * 0.14).toFixed(2)}"/>`;
    }
    const spark = (x, y, r, f) => `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${f}"/>`;
    // phone showing the real Today screen; screen width 236 → scale for a 1082-wide capture
    const pw = 250, bez = 8, sw = pw - bez * 2, sh = Math.round(sw * 2402 / 1082);
    return `<div style="position:relative;width:1024px;height:500px;overflow:hidden;background:linear-gradient(160deg,#8466FF 0%,#5531E8 50%,#2E1499 100%)">
      <svg width="1024" height="500" style="position:absolute;inset:0">
        <defs>
          <radialGradient id="o"><stop offset="0" stop-color="#FF8A3D" stop-opacity=".6"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient>
          <radialGradient id="p"><stop offset="0" stop-color="#FF4FA3" stop-opacity=".45"/><stop offset="1" stop-color="#FF4FA3" stop-opacity="0"/></radialGradient>
          <linearGradient id="rib" x1="0" x2="1"><stop offset="0" stop-color="#FFB547"/><stop offset=".5" stop-color="#FF4FA3"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
          <linearGradient id="ember" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#FFD25E"/><stop offset=".45" stop-color="#FF8A2B"/><stop offset="1" stop-color="#F2410F"/></linearGradient>
          <filter id="b"><feGaussianBlur stdDeviation="14"/></filter>
        </defs>
        <circle cx="760" cy="430" r="330" fill="url(#o)"/>
        <circle cx="980" cy="60" r="260" fill="url(#p)"/>
        ${squares}
        <path d="M-40 430 C 200 300, 420 520, 640 400 S 900 250, 1080 330" fill="none" stroke="url(#rib)" stroke-width="70" opacity=".35" filter="url(#b)"/>
        <path d="M-40 430 C 200 300, 420 520, 640 400 S 900 250, 1080 330" fill="none" stroke="url(#rib)" stroke-width="22" stroke-linecap="round"/>
        ${spark(560, 70, 14, '#FFD36B')}${spark(980, 300, 10, '#fff')}${spark(470, 440, 9, '#fff')}${spark(40, 60, 9, '#FFD36B')}
        <g transform="translate(955 360) rotate(14) scale(3.2)"><path d="${FLAME}" fill="url(#ember)"/></g>
      </svg>
      <div style="position:absolute;left:64px;top:118px;display:flex;align-items:center;gap:18px">
        <img src="${img(ICON)}" style="width:76px;height:76px;border-radius:20px;box-shadow:0 10px 24px rgba(20,5,80,.4)">
        <div style="font:600 24px Figtree;color:rgba(255,255,255,.9);letter-spacing:.5px">Habits</div>
      </div>
      <div style="position:absolute;left:64px;top:210px;font:800 70px/1 Bricolage;letter-spacing:-1.5px;color:#fff;text-shadow:0 6px 24px rgba(30,10,90,.35)">Habit Tracker</div>
      <div style="position:absolute;left:66px;top:296px;font:700 31px Figtree;color:#fff">Streaks, reminders <span style="color:#FFC15A">&amp; a widget</span></div>
      <div style="position:absolute;left:640px;top:58px;width:${pw}px;height:${sh + bez * 2}px;border-radius:36px;padding:${bez}px;background:linear-gradient(145deg,#2b2b33,#0c0c10 40%,#1d1d24);transform:rotate(8deg);box-shadow:0 30px 60px rgba(10,5,40,.5)">
        <div style="width:${sw}px;height:${sh}px;border-radius:29px;overflow:hidden;background:#F6F5FA;padding-top:14px">
          <img src="${img(RAW + '/today.png')}" style="width:${sw}px;display:block">
        </div>
      </div>
      <div style="position:absolute;left:560px;top:250px;width:300px;height:${Math.round(300 * 609 / 945)}px;border-radius:22px;transform:rotate(-5deg);
        background:url(${img(RAW + '/widget.png')}) ${-42 * 300 / 945}px ${-42 * 300 / 945}px / ${1082 * 300 / 945}px ${2402 * 300 / 945}px no-repeat;box-shadow:0 24px 50px rgba(10,5,40,.45)"></div>
    </div>`;
  },
};
