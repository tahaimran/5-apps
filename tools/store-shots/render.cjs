// usage: node render.cjs <module.cjs> <out.png> — module exports { width, height, html(ctx) }; ctx has img(file) and fontsCss
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const [mod, out] = process.argv.slice(2);
const m = require(path.resolve(mod));
const fontsCss = fs.readFileSync(require('path').join(__dirname, 'web/fonts.css'), 'utf8');
const img = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), headless: 'new', args: ['--force-color-profile=srgb'] });
  const p = await b.newPage();
  await p.setViewport({ width: m.width, height: m.height, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontsCss}*{margin:0;padding:0;box-sizing:border-box}body{width:${m.width}px;height:${m.height}px;overflow:hidden}</style></head><body>${m.html({ img, fontsCss })}</body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: m.width, height: m.height } });
  await b.close();
  console.log('wrote', out);
})();
