// usage: node rows.cjs <png> <x> — prints vertical runs where column x differs from the page background (card spans)
const { PNG } = require('pngjs');
const fs = require('fs');
const [f, X, tol = 12] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(f));
const at = (x, y) => { const i = (p.width * y + +x) * 4; return [p.data[i], p.data[i + 1], p.data[i + 2]]; };
const d = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
const bg = at(2, 300);
let inRun = false, start = 0; const runs = [];
for (let y = 0; y < p.height; y++) {
  const on = d(at(X, y), bg) > +tol;
  if (on && !inRun) { inRun = true; start = y; }
  if (!on && inRun) { inRun = false; if (y - start > 20) runs.push([start, y - start]); }
}
if (inRun) runs.push([start, p.height - start]);
console.log('bg', bg.join(','), JSON.stringify(runs));
