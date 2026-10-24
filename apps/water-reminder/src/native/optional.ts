/**
 * Native modules that some builds lack: dev builds made before they were added, and the Habits dev
 * client used to preview Sipling's screens. Each of these Expo modules calls requireNativeModule when
 * imported, which throws if the native side is missing, so they load once here inside try/catch and
 * callers handle null (the feature quietly steps aside instead of crashing the app).
 */
export function optional<T>(load: () => T): T | null {
  try {
    return load();
  } catch {
    return null;
  }
}

export const Device = optional(() => require('expo-device') as typeof import('expo-device'));
export const IntentLauncher = optional(() => require('expo-intent-launcher') as typeof import('expo-intent-launcher'));
export const BackgroundTask = optional(() => require('expo-background-task') as typeof import('expo-background-task'));
