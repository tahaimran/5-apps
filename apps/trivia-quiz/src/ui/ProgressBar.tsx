import { View } from 'react-native';
import { useTheme } from '@shared/theme';

/** A thin bar for XP and completion. Purely decorative: the numbers next to it are text. */
export function ProgressBar({ fraction, color }: { fraction: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`, height: 8, backgroundColor: color ?? colors.primary }} />
    </View>
  );
}
