/**
 * Native modules that some builds lack: dev builds made before they were added, and the Habits dev
 * client used to preview Quizora's screens. Each of these modules looks up its native side when
 * imported, which throws if it is missing, so they load once here inside try/catch and callers
 * handle null (the feature quietly steps aside instead of crashing the app).
 */
export function optional<T>(load: () => T): T | null {
  try {
    return load();
  } catch {
    return null;
  }
}

export const ViewShot = optional(() => require('react-native-view-shot') as typeof import('react-native-view-shot'));
