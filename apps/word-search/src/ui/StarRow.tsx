import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useAppColors } from '@/theme/mode';
import { CSS_EASE_OUT, STAR_GAP_MS, STAR_LEAD_MS, STAR_MS, STAR_POP } from './motion';

const STAR = 'M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z';

/** One drawn star: gold with a darker edge when earned, a soft outline when not. */
export function StarShape({ size, filled }: { size: number; filled: boolean }) {
  const app = useAppColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={STAR} fill={filled ? app.gold : 'none'} stroke={filled ? app.goldEdge : app.starEmpty} strokeWidth={7} strokeLinejoin="round" />
      {filled && <Path d="M50 18 L57 37 L40 39 Z" fill="#FFFFFF" fillOpacity={0.45} />}
    </Svg>
  );
}

/**
 * One to three stars out of three; empty stars are outlines, and the label says the number. With
 * `pop`, the earned stars land one after another (Puzzle Complete); never under Reduce Motion.
 */
export function StarRow({ stars, size = 24, pop = false }: { stars: number; size?: number; pop?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <View accessible accessibilityLabel={t('stars.label', { count: stars })} style={[styles.row, { gap: Math.round(size * 0.12) }]}>
      {[1, 2, 3].map((i) => {
        const filled = i <= stars;
        const animate = pop && filled && !reduced;
        return (
          // The middle star sits a little higher on the finish screen, like a podium.
          <View key={i} style={pop && i === 2 ? { transform: [{ translateY: -size * 0.12 }] } : null}>
            <Animated.View
              style={
                animate
                  ? {
                      animationName: STAR_POP,
                      animationDuration: STAR_MS,
                      animationDelay: STAR_LEAD_MS + (i - 1) * STAR_GAP_MS,
                      animationFillMode: 'backwards',
                      animationTimingFunction: CSS_EASE_OUT,
                    }
                  : null
              }
            >
              <StarShape size={pop && i === 2 ? Math.round(size * 1.2) : size} filled={filled} />
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-end' } });
