// usage: node sheet.cjs <out.png> <img...>  — contact sheet, 4 per row, labelled
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const [out, ...imgs] = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1600, height: 900 });
  const cells = imgs.map((f) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${f.split(/[\/]/).pop()}</figcaption></figure>`).join('');
  await p.setContent(`<style>body{margin:0;background:#888;display:flex;flex-wrap:wrap;gap:8px;padding:8px;font:16px sans-serif}figure{margin:0;width:390px}img{width:390px;display:block}figcaption{color:#fff}</style>${cells}`);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
