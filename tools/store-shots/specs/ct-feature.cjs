// Contraction Timer feature graphic (1024x500), ASO.md §5: the real Timer in Night mode on a phone at the left,
// "One tap. Calm numbers. Ready for your midwife." on a dawn wash at the right, with the icon lockup.
const RAW = require('path').join(__dirname, '../raw/ct');
const ICON = require('path').join(__dirname, '../../../apps/contraction-timer/store/icon-512.png');
module.exports = {
  width: 1024,
  height: 500,
  html: ({ img }) => {
    const spark = (x, y, r, f) => `<path transform="translate(${x} ${y}) scale(${r / 10})" d="M0-10C1 -3 3 -1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${f}"/>`;
    const wave = (base, amp, len, ph) => {
      let d = `M 0 500 L 0 ${base}`;
      for (let x = 0; x <= 1024; x += 16) d += ` L ${x} ${(base + amp * Math.sin((x / len) * 2 * Math.PI + ph)).toFixed(1)}`;
      return d + ' L 1024 500 Z';
    };
    const pw = 236, bez = 8, sw = pw - bez * 2, sbh = 18, sh = Math.round(sw * 2402 / 1082) + sbh;
    return `<div style="position:relative;width:1024px;height:500px;overflow:hidden;background:linear-gradient(115deg,#0E1A38 0%,#2A1440 30%,#C98A93 48%,#FBE3D6 62%,#DDF1ED 100%)">
      <svg width="1024" height="500" style="position:absolute;inset:0">
        <defs>
          <radialGradient id="sun"><stop offset="0" stop-color="#FFD7B0" stop-opacity=".95"/><stop offset=".35" stop-color="#FFD7B0" stop-opacity=".55"/><stop offset="1" stop-color="#FFD7B0" stop-opacity="0"/></radialGradient>
          <linearGradient id="wa" x1="0" x2="1"><stop offset="0" stop-color="#1E3A5F"/><stop offset=".5" stop-color="#F59C7C"/><stop offset="1" stop-color="#86D3C6"/></linearGradient>
          <linearGradient id="wb" x1="0" x2="1"><stop offset="0" stop-color="#3A2A6B"/><stop offset=".5" stop-color="#DB6E53"/><stop offset="1" stop-color="#2A8079"/></linearGradient>
        </defs>
        <circle cx="905" cy="95" r="190" fill="url(#sun)"/>
        ${[[40, 60, 1.8], [120, 30, 1.2], [200, 120, 1.6], [70, 200, 1.1], [300, 50, 1.4], [260, 170, 1], [30, 330, 1.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 2}" fill="#fff" opacity=".8"/>`).join('')}
        ${spark(330, 90, 10, '#FFE9C7')}${spark(160, 300, 8, '#FFE9C7')}${spark(980, 300, 9, '#fff')}
        <path d="${wave(430, 14, 520, 0)}" fill="url(#wa)" opacity=".7"/>
        <path d="${wave(462, 10, 380, 2)}" fill="url(#wb)" opacity=".9"/>
      </svg>
      <div style="position:absolute;left:96px;top:44px;width:${pw}px;height:${sh + bez * 2}px;border-radius:34px;padding:${bez}px;background:linear-gradient(145deg,#2b2b33,#0c0c10 40%,#1d1d24);transform:rotate(-6deg);box-shadow:0 30px 60px rgba(0,0,0,.55),0 0 80px rgba(255,74,58,.25)">
        <div style="width:${sw}px;height:${sh}px;border-radius:27px;overflow:hidden;background:#2A0703;padding-top:${sbh}px">
          <img src="${img(RAW + '/night.png')}" style="width:${sw}px;display:block">
        </div>
      </div>
      <div style="position:absolute;left:440px;top:92px;font:800 45px/1.08 Bricolage;letter-spacing:-1px;color:#1D2433;white-space:nowrap">One tap.<br>Calm numbers.<br><span style="color:#1F7A72">Ready for your midwife.</span></div>
      <div style="position:absolute;left:442px;top:284px;display:flex;align-items:center;gap:16px">
        <img src="${img(ICON)}" style="width:68px;height:68px;border-radius:18px;box-shadow:0 10px 24px rgba(12,69,71,.35)">
        <div style="font:700 26px Figtree;color:#1D2433">Contraction Timer<br><span style="font-weight:600;color:#3D4458;font-size:22px">&amp; Kick Count</span></div>
      </div>
    </div>`;
  },
};
