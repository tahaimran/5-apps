/**
 * Native-module stand-ins for the shared package's tests. Import this first in a test file.
 */
type Disk = Map<string, Map<string, string | number>>;
export const mockDisk: Disk = new Map();
export const resetDisk = () => mockDisk.forEach((m) => m.clear()); // keep the Maps: live stores point at them

jest.mock('react-native-mmkv', () => ({
  createMMKV: ({ id }: { id: string }) => {
    if (!mockDisk.has(id)) mockDisk.set(id, new Map());
    const m = mockDisk.get(id)!;
    return {
      getString: (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : undefined),
      getNumber: (k: string) => (typeof m.get(k) === 'number' ? (m.get(k) as number) : undefined),
      set: (k: string, v: string | number) => void m.set(k, v),
      remove: (k: string) => m.delete(k),
      getAllKeys: () => [...m.keys()],
      clearAll: () => m.clear(),
    };
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: mockLocale.current, languageTag: mockLocale.current, textDirection: 'ltr' }],
  useLocales: () => [{ languageCode: mockLocale.current, languageTag: mockLocale.current, textDirection: mockLocale.current === 'ar' ? 'rtl' : 'ltr' }],
}));
export const mockLocale = { current: 'en' };

export const mockHaptics = { impact: jest.fn(), selection: jest.fn(), notification: jest.fn() };
jest.mock('expo-haptics', () => ({
  impactAsync: (...a: unknown[]) => mockHaptics.impact(...a),
  selectionAsync: (...a: unknown[]) => mockHaptics.selection(...a),
  notificationAsync: (...a: unknown[]) => mockHaptics.notification(...a),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));
