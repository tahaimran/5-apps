import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { scaledType, type TypeName } from '@/theme/tokens';

export const FONT_REGULAR = 'Inter_400Regular';
export const FONT_MEDIUM = 'Inter_500Medium';
export const FONT_SEMIBOLD = 'Inter_600SemiBold';
export const FONT_BOLD = 'Inter_700Bold';

const family = (weight: string): string => {
  if (weight === 'bold' || Number(weight) >= 700) return FONT_BOLD;
  if (Number(weight) >= 600) return FONT_SEMIBOLD;
  if (Number(weight) >= 500) return FONT_MEDIUM;
  return FONT_REGULAR;
};

export interface AppTextProps extends TextProps {
  /** A plan §7 type style; the text-size setting scales it. Omit to style by hand. */
  variant?: TypeName;
}

/**
 * Text in Inter (plan §7). Android needs one font file per weight, so the weight picks the family.
 * The system font scale still applies on top of the text-size setting.
 */
export function AppText({ style, variant, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  const scale = useSettings((s) => s.settings.textScale);
  const base = variant ? scaledType(scale)[variant] : undefined;
  const flat = (StyleSheet.flatten([base, style]) ?? {}) as { fontWeight?: string };
  const weight = String(flat.fontWeight ?? (variant === 'display' || variant === 'h1' ? '700' : variant === 'h2' || variant === 'question' ? '600' : variant === 'answer' ? '500' : '400'));
  return <Text {...rest} style={[{ color: colors.text }, base, style, { fontFamily: family(weight), fontWeight: 'normal' }]} />;
}
