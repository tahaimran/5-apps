import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { sharedStore } from '../storage';
import {
  baseType,
  defaultPalettes,
  DISPLAY_TYPE,
  elevation,
  MIN_TOUCH,
  motion,
  radius,
  spacing,
  type FontFamilies,
  type Palette,
  type ThemeMode,
  type TypeToken,
} from './tokens';

export * from './tokens';

export type ThemePreference = ThemeMode | 'system';

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  /** Set only when the app passes `fonts` to the provider. */
  fontFamily?: string;
}

export interface Theme {
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  type: Record<TypeToken, TypeStyle>;
  motion: typeof motion;
  /** The app's font families (empty when it uses the system font). */
  fonts: FontFamilies;
  /** Shadow style for a surface at `level` (0 flat … 3 floating), tuned for the current mode. */
  shadow: (level: 0 | 1 | 2 | 3) => { boxShadow?: string };
  /** Minimum touch target in dp (48, or 56 in the senior/maternity apps). */
  touchTarget: number;
}

export interface ThemeProviderProps {
  /** Per-app palette overrides, per mode. Unspecified colors use the defaults. */
  palette?: Partial<Record<ThemeMode, Partial<Palette>>>;
  /** Multiplier for the type scale (e.g. 1.15 for the senior apps). Default 1. */
  fontScale?: number;
  /** Embedded font families; leave out to use the system font. */
  fonts?: FontFamilies;
  touchTarget?: number;
  children: React.ReactNode;
}

const ThemeContext = createContext<Theme | null>(null);
const NO_FONTS: FontFamilies = {};

export function ThemeProvider({ palette, fontScale = 1, fonts = NO_FONTS, touchTarget = MIN_TOUCH, children }: ThemeProviderProps) {
  const system = useColorScheme();
  const [preference, setPreference] = sharedStore.useStored<'theme.mode'>('theme.mode', 'system');
  const mode: ThemeMode = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo<Theme>(() => {
    const type = Object.fromEntries(
      Object.entries(baseType).map(([k, v]) => {
        const family = DISPLAY_TYPE.includes(k as TypeToken) ? fonts.display ?? fonts.body : fonts.body;
        return [
          k,
          {
            fontSize: Math.round(v.fontSize * fontScale),
            lineHeight: Math.round(v.lineHeight * fontScale),
            ...(family && { fontFamily: family }),
          },
        ];
      }),
    ) as Theme['type'];
    const colors = { ...defaultPalettes[mode], ...palette?.[mode] };
    return {
      mode,
      preference,
      setPreference,
      colors,
      spacing,
      radius,
      type,
      motion,
      fonts,
      shadow: (level) => elevation(colors.shadow, level, mode !== 'light'),
      touchTarget: Math.max(touchTarget, MIN_TOUCH),
    };
  }, [mode, preference, setPreference, palette, fontScale, fonts, touchTarget]);

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
