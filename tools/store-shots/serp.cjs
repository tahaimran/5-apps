// usage: node serp.cjs <out.png> <ourIcon.png> <ourTitle> <iconUrl|title>... — mock Play search results grid to judge icon stand-out
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const [out, ours, ourTitle, ...rest] = process.argv.slice(2);
const items = rest.map((s) => s.split('|'));
items.splice(3, 0, [`data:image/png;base64,${fs.readFileSync(ours).toString('base64')}`, ourTitle, 'ours']);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  const cells = items.map(([u, t, o]) => `<div style="width:130px;text-align:left;font:13px Roboto,Arial;color:#202124"><img src="${u}" style="width:96px;height:96px;border-radius:22px;${o ? 'outline:3px solid #e33;outline-offset:4px' : ''}"><div style="margin-top:6px;height:34px;overflow:hidden">${t}</div></div>`).join('');
  await p.setContent(`<body style="margin:0;background:#fff;padding:20px;display:flex;flex-wrap:wrap;gap:18px">${cells}</body>`, { waitUntil: 'networkidle0' });
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
