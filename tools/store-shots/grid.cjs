// usage: node grid.cjs <png> <out> [y0] [y1] — renders a region with a 50px ruler so crops can be read off precisely
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const [f, out, y0 = 0, y1 = 2402] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
  const p = await b.newPage();
  const h = y1 - y0;
  await p.setViewport({ width: 1182, height: h, deviceScaleFactor: 0.5 });
  let lines = '';
  for (let y = Math.ceil(y0 / 50) * 50; y < y1; y += 50) lines += `<div style="position:absolute;left:0;top:${y - y0}px;width:${y % 100 ? 1102 : 1182}px;border-top:2px solid ${y % 100 ? 'rgba(255,0,0,.35)' : 'red'}"></div>${y % 100 ? '' : `<div style="position:absolute;left:1090px;top:${y - y0 + 2}px;font:bold 34px sans-serif;color:red">${y}</div>`}`;
  for (let x = 0; x < 1082; x += 100) lines += `<div style="position:absolute;top:0;left:${x}px;height:${h}px;border-left:2px solid rgba(0,0,255,.3)"></div>`;
  await p.setContent(`<body style="margin:0;position:relative;width:1182px;height:${h}px;background:#fff"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="position:absolute;left:0;top:${-y0}px;width:1082px">${lines}</body>`);
  await p.screenshot({ path: out });
  await b.close();
})();
