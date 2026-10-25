import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@shared/theme';
import { GRID_FONT } from '@/theme/tokens';

/** Bricolage ships 600 and 800, Atkinson 400 and 700: anything bold asks for the heavier file. */
const displayWeight = (weight: string) => (weight === 'bold' || Number(weight) >= 700 ? '800' : '600');
const gridWeight = (weight: string) => (weight === 'bold' || Number(weight) >= 600 ? '700' : '400');

/**
 * All text goes through here (plan §7.2): Figtree unless the style asks for the display family (the
 * theme's title, headline and display tokens carry Bricolage) or for Atkinson Hyperlegible (the grid
 * letters and the word list). All three are embedded as Android font families, so `fontWeight` picks
 * the real file. It scales with the phone's font size; only the grid letters cap that (plan §7.2).
 */
export function AppText({ style, ...rest }: TextProps) {
  const { fonts } = useTheme();
  const flat = (StyleSheet.flatten(style) ?? {}) as { fontWeight?: string; fontFamily?: string };
  const family = flat.fontFamily ?? fonts.body;
  const weight = String(flat.fontWeight ?? '400');
  const resolved = family === fonts.display ? displayWeight(weight) : family === GRID_FONT ? gridWeight(weight) : weight;
  return <Text {...rest} style={[style, { fontFamily: family, fontWeight: resolved as '400' }]} />;
}
