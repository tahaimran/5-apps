// Web stand-in for native-only modules when rendering store screenshots. Every property is a callable no-op.
function make(name) {
  const fn = function () { return null; };
  return new Proxy(fn, {
    get(t, k) {
      if (k === '__esModule') return true;
      if (k === 'then') return undefined;
      if (k === Symbol.toPrimitive) return () => '';
      if (k === 'toString') return () => '';
      if (k === 'default') return make(name + '.default');
      if (typeof k === 'symbol') return undefined;
      if (/^[A-Z_]+$/.test(String(k))) return String(k);
      return make(name + '.' + String(k));
    },
    apply() { return make(name + '()'); },
    construct() { return make('new ' + name); },
  });
}
module.exports = make('stub');
