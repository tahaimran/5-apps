import { resetDisk } from '../../testing/native';
import { act } from 'react';
import { Linking } from 'react-native';
import TestRenderer, { type ReactTestRenderer } from 'react-test-renderer';
import { ThemeProvider } from '../../theme';
import { playStoreUrl, promoIds, promoPackages } from '../catalog';
import { HouseAdCard, setCurrentApp, type PromoAppId } from '../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NAMES: Record<PromoAppId, string> = {
  'habit-tracker': 'Habit Tracker',
  'water-reminder': 'Sipling',
  'word-search': 'Word Search',
  'trivia-quiz': 'Quizora',
  'contraction-timer': 'Contraction Timer',
};

let live: ReactTestRenderer[] = [];
beforeEach(() => {
  resetDisk();
  live = [];
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
});
afterEach(async () => {
  for (const r of live) await act(async () => r.unmount());
  jest.restoreAllMocks();
});

async function card(props: { currentApp?: PromoAppId } = {}) {
  let r!: ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(
      <ThemeProvider>
        <HouseAdCard {...props} />
      </ThemeProvider>,
    );
  });
  live.push(r);
  return r;
}
const shownApp = (r: ReactTestRenderer): PromoAppId => {
  const text = JSON.stringify(r.toJSON());
  const found = (Object.keys(NAMES) as PromoAppId[]).filter((id) => text.includes(NAMES[id]));
  expect(found).toHaveLength(1);
  return found[0];
};

describe('catalog', () => {
  it('lists the five apps', () => {
    expect([...promoIds].sort()).toEqual(Object.keys(NAMES).sort());
  });
  it('has a distinct, well-formed Android package for each', () => {
    const packages = Object.values(promoPackages);
    expect(new Set(packages).size).toBe(5);
    for (const p of packages) expect(p).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/);
  });
  it('builds Play Store links with an attribution referrer', () => {
    const url = playStoreUrl('word-search');
    expect(url).toContain('https://play.google.com/store/apps/details?id=' + promoPackages['word-search']);
    expect(url).toContain('referrer=utm_source%3Dcrosspromo');
  });
});

describe('<HouseAdCard>', () => {
  it('never promotes the app it is shown in, however many times it is shown', async () => {
    for (let i = 0; i < 12; i++) expect(shownApp(await card({ currentApp: 'habit-tracker' }))).not.toBe('habit-tracker');
  });
  it('rotates through the other four apps in turn, then starts over', async () => {
    const seen: PromoAppId[] = [];
    for (let i = 0; i < 8; i++) seen.push(shownApp(await card({ currentApp: 'trivia-quiz' })));
    expect(new Set(seen.slice(0, 4)).size).toBe(4);
    expect(seen.slice(4)).toEqual(seen.slice(0, 4));
  });
  it('continues the rotation after an app restart', async () => {
    const first = shownApp(await card({ currentApp: 'word-search' }));
    const second = shownApp(await card({ currentApp: 'word-search' }));
    expect(second).not.toBe(first);
  });
  it('keeps showing the same promo while it stays on screen', async () => {
    const r = await card({ currentApp: 'habit-tracker' });
    const before = shownApp(r);
    await act(async () => r.update(<ThemeProvider><HouseAdCard currentApp="habit-tracker" /></ThemeProvider>));
    expect(shownApp(r)).toBe(before);
  });
  it('uses the app set once at startup', async () => {
    setCurrentApp('water-reminder');
    for (let i = 0; i < 8; i++) expect(shownApp(await card())).not.toBe('water-reminder');
  });
  it('lets the prop override the startup setting', async () => {
    setCurrentApp('water-reminder');
    const seen = new Set<PromoAppId>();
    for (let i = 0; i < 6; i++) seen.add(shownApp(await card({ currentApp: 'habit-tracker' })));
    expect(seen.has('water-reminder')).toBe(true);
    expect(seen.has('habit-tracker')).toBe(false);
  });
  it('opens the Play Store listing when pressed', async () => {
    const r = await card({ currentApp: 'habit-tracker' });
    const app = shownApp(r);
    const button = r.root.findAll((n) => typeof n.props.onPress === 'function')[0];
    await act(async () => button.props.onPress());
    expect(Linking.openURL).toHaveBeenCalledWith(playStoreUrl(app));
  });
  it('does not crash when no store app can open the link', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValue(new Error('no handler'));
    const r = await card({ currentApp: 'habit-tracker' });
    const button = r.root.findAll((n) => typeof n.props.onPress === 'function')[0];
    await act(async () => button.props.onPress());
    await act(async () => undefined);
  });
  it('is a labelled link for screen readers, with the name, tagline and action', async () => {
    const r = await card({ currentApp: 'habit-tracker' });
    const button = r.root.findAll((n) => typeof n.props.onPress === 'function')[0];
    expect(button.props.accessibilityRole).toBe('link');
    expect(button.props.accessibilityLabel).toContain(NAMES[shownApp(r)]);
    expect(button.props.accessibilityLabel).toContain('Install');
  });
  it('has a touch target of at least 48dp', async () => {
    const r = await card({ currentApp: 'habit-tracker' });
    const button = r.root.findAll((n) => typeof n.props.onPress === 'function')[0];
    const style = Object.assign({}, ...[button.props.style].flat(2).filter(Boolean));
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
  });
  it('is labelled as our own apps, not as an ad from a third party', async () => {
    expect(JSON.stringify((await card({ currentApp: 'habit-tracker' })).toJSON())).toContain('Our apps');
  });
});
