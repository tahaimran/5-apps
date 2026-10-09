/**
 * Source-level ad rules (CLAUDE.md rule 3 and plan §12): the AdMob SDK is never called from app code, and no
 * ad API of any kind can be reached from the Timer, the Kicks tab or onboarding. This stands in for the plan's
 * `no-restricted-imports` lint rule (ESLint is not set up in this repo).
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'testing' ? [] : files(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join('/');
const all = [...files(path.join(ROOT, 'app')), ...files(path.join(ROOT, 'src'))];
const imports = (file: string) => [...fs.readFileSync(file, 'utf8').matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

describe('ad code stays behind @shared/ads', () => {
  it('nothing imports react-native-google-mobile-ads directly', () => {
    expect(all.filter((f) => imports(f).includes('react-native-google-mobile-ads')).map(rel)).toEqual([]);
  });

  it('only a short list of files imports @shared/ads, and none of them is on the Timer, Kicks or onboarding path', () => {
    const allowed = ['app/(tabs)/pregnancy/index.tsx', 'app/_layout.tsx', 'src/ads.config.ts', 'src/ads/guard.ts', 'src/ads/rewarded.ts', 'src/ads/start.ts', 'src/ads/weekClose.ts', 'src/ui/BannerSlot.tsx'];
    const found = all.filter((f) => imports(f).includes('@shared/ads')).map(rel).sort();
    expect(found).toEqual(allowed.sort());
  });

  it('no file under the Timer or Kicks tabs, the timer feature, onboarding or the timer-adjacent screens imports an ad module at all', () => {
    const forbidden = ['app/(tabs)/timer/index.tsx', 'app/(tabs)/kicks/index.tsx', 'app/onboarding.tsx'];
    const dirs = ['src/features/timer/', 'src/features/onboarding/', 'src/features/kicks/'];
    const scope = all.map(rel).filter((f) => forbidden.includes(f) || dirs.some((d) => f.startsWith(d)));
    expect(scope.length).toBeGreaterThan(5);
    for (const f of scope) {
      const bad = imports(path.join(ROOT, f)).filter((m) => m === '@shared/ads' || m.startsWith('@/ads/rewarded') || m.startsWith('@/ads/weekClose') || m === 'react-native-google-mobile-ads');
      expect({ file: f, bad }).toEqual({ file: f, bad: [] });
    }
  });

  it('the Timer screen has no banner slot and no native card', () => {
    const timer = fs.readFileSync(path.join(ROOT, 'app/(tabs)/timer/index.tsx'), 'utf8') + fs.readFileSync(path.join(ROOT, 'app/(tabs)/kicks/index.tsx'), 'utf8');
    expect(timer).not.toMatch(/BannerSlot|NativeAdCard|AdBanner|showInterstitial|showRewarded/);
  });

  it('full-screen ads are only requested from the week-close helper and the rewarded helper', () => {
    const callers = all.filter((f) => /\b(showInterstitial|showRewarded)\b/.test(fs.readFileSync(f, 'utf8'))).map(rel).sort();
    expect(callers).toEqual(['src/ads/rewarded.ts', 'src/ads/weekClose.ts']);
  });

  it('banners appear only through BannerSlot, on the screens the plan lists', () => {
    const slots = all.filter((f) => /<BannerSlot\b/.test(fs.readFileSync(f, 'utf8'))).map(rel).sort();
    expect(slots).toEqual([
      'app/(tabs)/kicks/history.tsx',
      'app/(tabs)/pregnancy/hospital-bag.tsx',
      'app/(tabs)/pregnancy/birth-plan.tsx',
      'app/(tabs)/pregnancy/week/[n].tsx',
      'app/(tabs)/pregnancy/index.tsx',
      'app/(tabs)/timer/history.tsx',
    ].sort());
  });
});
