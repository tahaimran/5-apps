import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@shared/theme';

/** Bricolage ships 600 and 800 only; anything bold asks for the 800 file. */
const displayWeight = (weight: string) => (weight === 'bold' || Number(weight) >= 700 ? '800' : '600');

/**
 * All text goes through here (plan §7): Figtree unless the style asks for the display family (the
 * theme's title, headline and display tokens carry Bricolage). Both are embedded as Android font
 * families, so `fontWeight` picks the real file. It scales with the phone's font size; nothing here
 * turns that scaling off or caps it.
 */
export function AppText({ style, ...rest }: TextProps) {
  const { fonts } = useTheme();
  const flat = (StyleSheet.flatten(style) ?? {}) as { fontWeight?: string; fontFamily?: string };
  const display = !!fonts.display && flat.fontFamily === fonts.display;
  const weight = String(flat.fontWeight ?? '400');
  return (
    <Text
      {...rest}
      style={[style, { fontFamily: flat.fontFamily ?? fonts.body, fontWeight: (display ? displayWeight(weight) : weight) as '400' }]}
    />
  );
}
