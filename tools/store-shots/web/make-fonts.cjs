// Builds web/fonts.css (for the compositor) and web/pre.js (injected into the app's web render) from the
// repo's font files, so captures and captions use the apps' real fonts. Both outputs are git-ignored.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const F = path.join(root, 'packages/shared/assets/fonts');
const A = path.join(root, 'apps/word-search/assets/fonts');
const list = [
  ['Figtree', 400, F, 'Figtree_400Regular.ttf'], ['Figtree', 500, F, 'Figtree_500Medium.ttf'],
  ['Figtree', 600, F, 'Figtree_600SemiBold.ttf'], ['Figtree', 700, F, 'Figtree_700Bold.ttf'],
  ['Bricolage', 600, F, 'BricolageGrotesque_600SemiBold.ttf'], ['Bricolage', 700, F, 'BricolageGrotesque_800ExtraBold.ttf'],
  ['Bricolage', 800, F, 'BricolageGrotesque_800ExtraBold.ttf'],
  ['Atkinson', 400, A, 'AtkinsonHyperlegible_400Regular.ttf'], ['Atkinson', 700, A, 'AtkinsonHyperlegible_700Bold.ttf'],
];
const css = list.map(([fam, w, dir, file]) =>
  `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/ttf;base64,${fs.readFileSync(path.join(dir, file)).toString('base64')}) format("truetype");}`).join('');
fs.writeFileSync(path.join(__dirname, 'fonts.css'), css);
fs.writeFileSync(path.join(__dirname, 'pre.js'),
  `(function(){var css=${JSON.stringify(css)};function add(){var s=document.createElement("style");s.textContent=css;(document.head||document.documentElement).appendChild(s);}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();})();`);
console.log('wrote web/fonts.css and web/pre.js');
