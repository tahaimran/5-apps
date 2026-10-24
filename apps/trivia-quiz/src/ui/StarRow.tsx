import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Star from 'lucide-react-native/icons/star';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { extraColorsFor } from '@/theme/tokens';
import { CSS_EASE_OUT, STAR_GAP_MS, STAR_POP } from './motion';

/**
 * Up to three stars. Empty stars are outlines and the spoken label says the number, so color is never
 * the only cue. With `pop`, earned stars land one after another 150 ms apart (plan §7); Reduce Motion
 * shows them at once.
 */
export function StarRow({ stars, size = 24, pop = false, emptyColor }: { stars: number; size?: number; pop?: boolean; emptyColor?: string }) {
  const { colors, mode } = useTheme();
  const reduced = useReducedMotion();
  const gold = extraColorsFor(mode).gold;
  return (
    <View accessible accessibilityLabel={t('stars.label', { count: stars })} style={[styles.row, { gap: size > 30 ? 8 : 2 }]}>
      {[1, 2, 3].map((i) => {
        const earned = i <= stars;
        const animate = pop && earned && !reduced;
        return (
          <Animated.View
            key={i}
            style={
              animate
                ? {
                    opacity: 0,
                    animationName: STAR_POP,
                    animationDuration: '260ms',
                    animationDelay: `${120 + (i - 1) * STAR_GAP_MS}ms`,
                    animationFillMode: 'forwards',
                    animationTimingFunction: CSS_EASE_OUT,
                  }
                : null
            }
          >
            <Star size={size} color={earned ? gold : (emptyColor ?? colors.textMuted)} fill={earned ? gold : 'transparent'} strokeWidth={earned ? 1.5 : 2} />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' } });
