import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@shared/theme';
import { CSS_EASE_OUT } from './motion';

/**
 * A rounded bar for XP and completion. Purely decorative: the numbers next to it are text. The fill
 * is absolutely positioned with no children, so its width can transition without relaying the bar.
 */
export function ProgressBar({ fraction, color, track, height = 10 }: { fraction: number; color?: string; track?: string; height?: number }) {
  const { colors, mode } = useTheme();
  const reduced = useReducedMotion();
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height, borderRadius: height / 2, backgroundColor: track ?? (mode === 'light' ? colors.surfaceAlt : colors.background), overflow: 'hidden' }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            borderRadius: height / 2,
            backgroundColor: color ?? colors.primary,
            transitionProperty: 'width',
            transitionDuration: reduced ? 0 : 280,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { position: 'absolute', left: 0, top: 0, bottom: 0 } });
