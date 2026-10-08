import { mockLocale, resetDisk } from '../../testing/native';
import { act, type ReactElement } from 'react';
import TestRenderer, { type ReactTestRenderer } from 'react-test-renderer';
import { registerStrings, t, useLocale } from '../index';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  resetDisk();
  mockLocale.current = 'en';
  registerStrings({
    en: {
      hello: 'Hello',
      greet: 'Hi {name}, you have {n} new',
      nested: { deep: { key: 'Deep value' } },
      items_one: '{count} item',
      items_other: '{count} items',
      onlyEnglish: 'Only in English',
      title: 'Title',
    },
    es: { hello: 'Hola', items_one: '{count} elemento', items_other: '{count} elementos' },
    ru: { items_one: '{count} предмет', items_few: '{count} предмета', items_many: '{count} предметов', items_other: '{count} предмета' },
  });
});

describe('t', () => {
  it('returns the string for a key', () => {
    expect(t('hello')).toBe('Hello');
  });
  it('looks up nested keys with dots', () => {
    expect(t('nested.deep.key')).toBe('Deep value');
  });
  it('fills {params}, numbers included', () => {
    expect(t('greet', { name: 'Ana', n: 3 })).toBe('Hi Ana, you have 3 new');
  });
  it('leaves a placeholder visible when its param is missing, rather than printing "undefined"', () => {
    expect(t('greet', { name: 'Ana' })).toBe('Hi Ana, you have {n} new');
  });
  it('fills a placeholder used more than once', () => {
    registerStrings({ en: { twice: '{x} and {x}' } });
    expect(t('twice', { x: 'A' })).toBe('A and A');
  });
  it('returns the key itself for an unknown key (visible in the UI, never a crash)', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
  });
  it('does not treat a branch as a string', () => {
    expect(t('nested')).toBe('nested');
    expect(t('nested.deep')).toBe('nested.deep');
  });
  it('handles keys that run past a string value', () => {
    expect(t('hello.world')).toBe('hello.world');
  });
  it('is not fooled by prototype keys', () => {
    expect(t('constructor')).toBe('constructor');
    expect(t('__proto__')).toBe('__proto__');
  });
  it('replaces $ characters in params literally', () => {
    registerStrings({ en: { price: 'Cost {p}' } });
    expect(t('price', { p: '$&' })).toBe('Cost $&');
  });
});

describe('plurals', () => {
  it('picks one / other by count in English', () => {
    expect(t('items', { count: 1 })).toBe('1 item');
    expect(t('items', { count: 2 })).toBe('2 items');
    expect(t('items', { count: 0 })).toBe('0 items');
  });
  it('uses the plain key when there is no count', () => {
    registerStrings({ en: { items: 'Items' } });
    expect(t('items')).toBe('Items');
  });
  it('uses the plain key when the plural form is missing', () => {
    registerStrings({ en: { solo: 'Just {count}' } });
    expect(t('solo', { count: 5 })).toBe('Just 5');
  });
  it("follows the language's plural rules", () => {
    mockLocale.current = 'ru';
    expect([1, 2, 5, 21].map((n) => t('items', { count: n }))).toEqual(['1 предмет', '2 предмета', '5 предметов', '21 предмет']);
  });
});

describe('locales', () => {
  it('uses the device language when the app has a bundle for it', () => {
    mockLocale.current = 'es';
    expect(t('hello')).toBe('Hola');
    expect(t('items', { count: 2 })).toBe('2 elementos');
  });
  it('falls back to English for keys the language lacks', () => {
    mockLocale.current = 'es';
    expect(t('onlyEnglish')).toBe('Only in English');
    expect(t('nested.deep.key')).toBe('Deep value');
  });
  it('falls back to English for a language with no bundle at all', () => {
    mockLocale.current = 'ja';
    expect(t('hello')).toBe('Hello');
  });
  it('lets a later registration replace a language bundle', () => {
    registerStrings({ en: { hello: 'Howdy' } });
    expect(t('hello')).toBe('Howdy');
    expect(t('greet', { name: 'x', n: 1 })).toBe('greet'); // the whole bundle was replaced
  });
});

describe('built-in shared strings', () => {
  it('provide the shared UI copy without the app registering anything', () => {
    registerStrings({ en: {} });
    expect(t('shared.onboarding.skip')).toBe('Skip');
    expect(t('shared.ads.badge')).toBe('Ad');
    expect(t('shared.onboarding.progress', { current: 2, total: 5 })).toBe('Step 2 of 5');
  });
  it('can be overridden by the app bundle', () => {
    registerStrings({ en: { shared: { ads: { badge: 'Sponsored' } } } });
    expect(t('shared.ads.badge')).toBe('Sponsored');
  });
  it('cover the five apps in the cross-promo cards', () => {
    for (const id of ['habit-tracker', 'water-reminder', 'word-search', 'trivia-quiz', 'contraction-timer']) {
      expect(t(`shared.crosspromo.apps.${id}.name`)).not.toContain('shared.crosspromo');
      expect(t(`shared.crosspromo.apps.${id}.tagline`)).not.toContain('shared.crosspromo');
    }
  });
});

describe('useLocale', () => {
  let live: ReactTestRenderer[] = [];
  afterEach(async () => {
    for (const r of live) await act(async () => r.unmount());
    live = [];
  });
  async function read() {
    let value!: ReturnType<typeof useLocale>;
    const Probe = (): ReactElement | null => {
      value = useLocale();
      return null;
    };
    await act(async () => {
      live.push(TestRenderer.create(<Probe />));
    });
    return value;
  }

  it('exposes the language, tag and a bound translate function', async () => {
    mockLocale.current = 'es';
    const locale = await read();
    expect(locale).toMatchObject({ language: 'es', languageTag: 'es', isRTL: false });
    expect(locale.t('hello')).toBe('Hola');
  });
  it('flags right-to-left languages', async () => {
    mockLocale.current = 'ar';
    expect((await read()).isRTL).toBe(true);
  });
});
