import { getLocales } from 'expo-localization';

/** Pounds for the US, kilograms everywhere else (plan §6 step 2). */
export function defaultWeightUnit(): 'kg' | 'lb' {
  const locale = getLocales()[0];
  const region = locale?.regionCode ?? locale?.languageTag?.split('-')[1];
  return region === 'US' ? 'lb' : 'kg';
}
