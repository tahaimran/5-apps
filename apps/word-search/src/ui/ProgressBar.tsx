import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@shared/theme';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { CSS_EASE_OUT, STATE_MS } from './motion';

/**
 * A thin rounded bar (words found, levels): a lime fill on a soft track. Decorative: the caller says the
 * numbers in words. The fill is absolutely placed and childless, so animating its width re-lays nothing.
 */
export function ProgressBar({ progress, height = 10 }: { progress: number; height?: number }) {
  const { colors } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const reduced = useReducedMotion();
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: hc ? colors.background : colors.surfaceAlt, borderWidth: hc ? 1 : 0, borderColor: colors.border }]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            width: `${p * 100}%`,
            borderRadius: height / 2,
            backgroundColor: hc ? colors.primary : app.go[1],
            transitionProperty: 'width',
            transitionDuration: reduced ? 0 : STATE_MS,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden', alignSelf: 'stretch' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
});
