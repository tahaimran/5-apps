import { StyleSheet, Text, type TextProps } from 'react-native';

export const FONT_REGULAR = 'AtkinsonHyperlegible_400Regular';
export const FONT_BOLD = 'AtkinsonHyperlegible_700Bold';

/**
 * Text in Atkinson Hyperlegible (plan §7.2). Android needs one font file per weight, so any
 * weight of 600 or more selects the bold family. Falls back to the system font until loaded.
 */
export function AppText({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {};
  const weight = String(flat.fontWeight ?? '400');
  const bold = weight === 'bold' || Number(weight) >= 600;
  return <Text {...rest} style={[style, { fontFamily: bold ? FONT_BOLD : FONT_REGULAR, fontWeight: 'normal' }]} />;
}
