import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { sharedStore } from '../storage';
import {
  baseType,
  defaultPalettes,
  MIN_TOUCH,
  motion,
  radius,
  spacing,
  type Palette,
  type ThemeMode,
  type TypeToken,
} from './tokens';

export * from './tokens';

export type ThemePreference = ThemeMode | 'system';

export interface Theme {
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  type: Record<TypeToken, { fontSize: number; lineHeight: number }>;
  motion: typeof motion;
  /** Minimum touch target in dp (48, or 56 in the senior/maternity apps). */
  touchTarget: number;
}

export interface ThemeProviderProps {
  /** Per-app palette overrides, per mode. Unspecified colors use the defaults. */
  palette?: Partial<Record<ThemeMode, Partial<Palette>>>;
  /** Multiplier for the type scale (e.g. 1.15 for the senior apps). Default 1. */
  fontScale?: number;
  touchTarget?: number;
  children: React.ReactNode;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ palette, fontScale = 1, touchTarget = MIN_TOUCH, children }: ThemeProviderProps) {
  const system = useColorScheme();
  const [preference, setPreference] = sharedStore.useStored<'theme.mode'>('theme.mode', 'system');
  const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo<Theme>(() => {
    const type = Object.fromEntries(
      Object.entries(baseType).map(([k, v]) => [
        k,
        { fontSize: Math.round(v.fontSize * fontScale), lineHeight: Math.round(v.lineHeight * fontScale) },
      ]),
    ) as Theme['type'];
    return {
      mode,
      preference,
      setPreference,
      colors: { ...defaultPalettes[mode], ...palette?.[mode] },
      spacing,
      radius,
      type,
      motion,
      touchTarget: Math.max(touchTarget, MIN_TOUCH),
    };
  }, [mode, preference, setPreference, palette, fontScale, touchTarget]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}

export function useHaptics() {
  return useMemo(
    () => ({
      tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
      press: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
      select: () => Haptics.selectionAsync(),
      success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
    }),
    [],
  );
}
