// usage: node capture.cjs <config.json>
// Config: { base, out, fakeTime?, css?, viewport?: {w,h,dpr}, shots: [{ name, url, wait?, dark?, fresh?, steps?: [...] }] }
// Steps: { click: "visible text" } | { clickSel: "css" } | { scroll: px } | { scrollText: "text" } | { eval: "js" } | { wait: ms } | { type: "text" }
// Each shot runs in its own incognito context, so storage never leaks between shots.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
// out and demo paths in a config are relative to the config file
for (const k of ['out', 'demo']) if (cfg[k] && !path.isAbsolute(cfg[k])) cfg[k] = path.resolve(path.dirname(process.argv[2]), cfg[k]);
const only = process.argv[3] ? process.argv[3].split(',') : null;
const pre = fs.readFileSync(require('path').join(__dirname, 'web/pre.js'), 'utf8');

function clockJs(iso) {
  return `(function(){var target=new Date(${JSON.stringify(iso)}).getTime();var off=target-Date.now();var R=Date;
  function D(){ if(!(this instanceof D)) return new R(R.now()+off).toString(); var a=[].slice.call(arguments); if(a.length===0) return new R(R.now()+off); return new (Function.prototype.bind.apply(R,[null].concat(a)))(); }
  D.prototype=R.prototype; D.now=function(){return R.now()+off}; D.UTC=R.UTC; D.parse=R.parse; Object.setPrototypeOf(D,R); window.Date=D;})();`;
}

(async () => {
  fs.mkdirSync(cfg.out, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: (process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
    headless: 'new',
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });
  const vp = cfg.viewport || { w: 412, h: 915, dpr: 2.625 };
  for (const s of cfg.shots) {
    if (only && !only.includes(s.name)) continue;
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    const v = { ...vp, ...(s.viewport || {}) };
    await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: v.dpr, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: s.dark ? 'dark' : 'light' }]);
    const logs = [];
    page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') logs.push('[error] ' + m.text().slice(0, 300)); });
    await page.evaluateOnNewDocument(pre);
    const t = s.fakeTime || cfg.fakeTime;
    if (t) await page.evaluateOnNewDocument(clockJs(t));
    const css = (cfg.css || '') + (s.css || '');
    if (css) await page.evaluateOnNewDocument(`(function(){function a(){var st=document.createElement('style');st.textContent=${JSON.stringify(css)};document.head.appendChild(st);}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',a);else a();})();`);
    if (cfg.demo) await page.evaluateOnNewDocument('window.__DEMO__=' + fs.readFileSync(cfg.demo, 'utf8'));
    if (s.init) await page.evaluateOnNewDocument(s.init);
    await page.goto(cfg.base + s.url, { waitUntil: 'networkidle0', timeout: 180000 }).catch((e) => logs.push('[goto] ' + e.message));
    await new Promise((r) => setTimeout(r, s.wait ?? 3500));
    for (const st of s.steps || []) {
      try {
        if (st.click) {
          const ok = await page.evaluate((txt) => {
            const all = [...document.querySelectorAll('body *')].filter((e) => e.childElementCount === 0 && e.textContent.trim() === txt && e.getBoundingClientRect().width > 0);
            const el = all[all.length - 1];
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return [r.x + r.width / 2, r.y + r.height / 2];
          }, st.click);
          if (!ok) logs.push('[step] text not found: ' + st.click);
          else await page.mouse.click(ok[0], ok[1]);
        }
        if (st.clickLabel) {
          const ok = await page.evaluate((lbl) => {
            const el = [...document.querySelectorAll('[aria-label]')].filter((e) => e.getAttribute('aria-label') === lbl && e.getBoundingClientRect().width > 0)[0];
            if (!el) return false;
            const r = el.getBoundingClientRect();
            return [r.x + r.width / 2, r.y + r.height / 2];
          }, st.clickLabel);
          if (!ok) logs.push('[step] label not found: ' + st.clickLabel);
          else await page.mouse.click(ok[0], ok[1]);
        }
        if (st.tap) await page.mouse.click(st.tap[0], st.tap[1]);
        if (st.scroll) await page.evaluate((px) => { const els = [...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)); const el = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (el) el.scrollBy(0, px); else window.scrollBy(0, px); }, st.scroll);
        if (st.eval) logs.push('[eval] ' + JSON.stringify(await page.evaluate(st.eval)));
        if (st.type) await page.keyboard.type(st.type);
      } catch (e) { logs.push('[steperr] ' + e.message); }
      await new Promise((r) => setTimeout(r, st.wait ?? 900));
    }
    const file = path.join(cfg.out, s.name + '.png');
    await page.screenshot({ path: file });
    console.log('saved', file, logs.length ? '\n  ' + logs.slice(0, 8).join('\n  ') : '');
    await ctx.close();
  }
  await browser.close();
})();
