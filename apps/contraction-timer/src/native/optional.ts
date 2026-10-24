/**
 * Native modules that some builds lack: the Habits dev client used to preview this app's screens has
 * neither expo-keep-awake nor expo-print. Each of them looks up its native side when imported, which
 * throws if it is missing, so they load once here inside try/catch and callers handle null (the screen
 * may sleep; the PDF summary falls back to the text summary) instead of crashing the app.
 */
export function optional<T>(load: () => T): T | null {
  try {
    return load();
  } catch {
    return null;
  }
}

export const KeepAwake = optional(() => require('expo-keep-awake') as typeof import('expo-keep-awake'));
export const Print = optional(() => require('expo-print') as typeof import('expo-print'));
