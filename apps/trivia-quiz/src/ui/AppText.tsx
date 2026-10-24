import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { DISPLAY_STYLES, scaledType, type TypeName } from '@/theme/tokens';

/** Bricolage ships 600 and 800 only; anything bold asks for the 800 file. */
const displayWeight = (weight: string) => (weight === 'bold' || Number(weight) >= 700 ? '800' : '600');

const DEFAULT_WEIGHT: Record<TypeName, string> = { display: '800', h1: '800', h2: '600', question: '600', answer: '600', body: '400', caption: '500', overline: '700' };

export interface AppTextProps extends TextProps {
  /** A plan §7 type style; the text-size setting scales it. Omit to style by hand. */
  variant?: TypeName;
}

/**
 * Text in the app's fonts (plan §7): Bricolage for titles, the question and big numbers, Figtree for
 * everything else. Both are embedded as Android font families, so `fontWeight` picks the real file.
 * The system font scale still applies on top of the text-size setting.
 */
export function AppText({ style, variant, ...rest }: AppTextProps) {
  const { colors, fonts } = useTheme();
  const scale = useSettings((s) => s.settings.textScale);
  const base = variant ? scaledType(scale)[variant] : undefined;
  const flat = (StyleSheet.flatten([base, style]) ?? {}) as { fontWeight?: string; fontFamily?: string };
  const display = variant ? DISPLAY_STYLES.includes(variant) : flat.fontFamily === fonts.display;
  const weight = String(flat.fontWeight ?? (variant ? DEFAULT_WEIGHT[variant] : '400'));
  const family = display ? fonts.display : fonts.body;
  return (
    <Text
      {...rest}
      style={[
        { color: colors.text },
        base,
        variant === 'overline' && styles.overline,
        style,
        family ? { fontFamily: family } : null,
        { fontWeight: (display ? displayWeight(weight) : weight) as '400' },
      ]}
    />
  );
}

// Overlines are uppercased by the caller (toUpperCase), so screen readers and tests see the same text.
const styles = StyleSheet.create({ overline: { letterSpacing: 0.8 } });
