import { useMemo } from 'react';
import { getLocales, useLocales } from 'expo-localization';
import sharedEn from './shared.en.json';

type Bundle = { [key: string]: string | Bundle };
export type TParams = Record<string, string | number>;

const bundles: Record<string, Bundle> = {};
const FALLBACK = 'en';

/**
 * Register an app's bundled strings. Call once at startup, e.g.
 * `registerStrings({ en: require('./en.json') })`. English is the fallback for missing keys.
 */
export function registerStrings(all: Record<string, Bundle>): void {
  for (const [locale, bundle] of Object.entries(all)) bundles[locale] = bundle;
}

const lookup = (bundle: Bundle | undefined, key: string): string | undefined => {
  let node: string | Bundle | undefined = bundle;
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
};

const currentLanguage = (): string => getLocales()[0]?.languageCode ?? FALLBACK;

const pluralRules = new Map<string, Intl.PluralRules | null>();

/**
 * CLDR plural category for `count`. Hermes on Android has no `Intl.PluralRules`, and a bad
 * locale makes it throw, so fall back to the English one / other rule instead of crashing render.
 */
function pluralCategory(language: string, count: number): string {
  if (!pluralRules.has(language)) {
    let rules: Intl.PluralRules | null = null;
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.PluralRules === 'function') rules = new Intl.PluralRules(language);
    } catch {
      rules = null;
    }
    pluralRules.set(language, rules);
  }
  return pluralRules.get(language)?.select(count) ?? (count === 1 ? 'one' : 'other');
}

function translate(language: string, key: string, params?: TParams): string {
  let template: string | undefined;
  // Plural forms: `key_one` / `key_other` chosen by params.count.
  const suffix = typeof params?.count === 'number' ? `_${pluralCategory(language, params.count)}` : '';
  for (const lang of [language, FALLBACK]) {
    template =
      (suffix ? lookup(bundles[lang], key + suffix) : undefined) ??
      lookup(bundles[lang], key) ??
      (lang === FALLBACK ? lookup(sharedEn as Bundle, key) : undefined);
    if (template !== undefined) break;
  }
  if (template === undefined) return key;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    params && name in params ? String(params[name]) : m,
  );
}

/** Translate a dotted key, with `{name}` interpolation. Falls back to English, then to the key. */
export function t(key: string, params?: TParams): string {
  return translate(currentLanguage(), key, params);
}

export function useLocale() {
  const locales = useLocales();
  const language = locales[0]?.languageCode ?? FALLBACK;
  return useMemo(
    () => ({
      language,
      languageTag: locales[0]?.languageTag ?? FALLBACK,
      isRTL: locales[0]?.textDirection === 'rtl',
      t: (key: string, params?: TParams) => translate(language, key, params),
    }),
    [language, locales],
  );
}
