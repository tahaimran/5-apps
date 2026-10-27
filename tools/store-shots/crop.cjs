// usage: node crop.cjs <png> <x> <y> <w> <h> <out>
const { PNG } = require('pngjs');
const fs = require('fs');
const [f, x, y, w, h, out] = process.argv.slice(2);
const p = PNG.sync.read(fs.readFileSync(f));
const o = new PNG({ width: +w, height: +h });
PNG.bitblt(p, o, +x, +y, +w, +h, 0, 0);
fs.writeFileSync(out, PNG.sync.write(o));
