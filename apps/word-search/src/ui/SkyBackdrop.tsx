import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { useTheme } from '@shared/theme';
import { useAppColors, useIsHighContrast } from '@/theme/mode';

/** A cloud of three puffs on a flat base, `w` wide, at (x, y). */
const cloud = (x: number, y: number, w: number, fill: string, key: string) => (
  <G key={key}>
    <Ellipse cx={x + w * 0.3} cy={y} rx={w * 0.24} ry={w * 0.16} fill={fill} />
    <Ellipse cx={x + w * 0.55} cy={y - w * 0.07} rx={w * 0.26} ry={w * 0.2} fill={fill} />
    <Ellipse cx={x + w * 0.5} cy={y + w * 0.06} rx={w * 0.5} ry={w * 0.11} fill={fill} />
  </G>
);

/** Fixed spots so the sky looks the same on every visit (and in tests). */
const STARS: [number, number, number][] = [
  [0.08, 0.06, 1.6], [0.22, 0.14, 1.1], [0.35, 0.05, 1.4], [0.52, 0.11, 1.2], [0.66, 0.04, 1.7], [0.81, 0.13, 1.2],
  [0.93, 0.07, 1.4], [0.14, 0.27, 1.1], [0.44, 0.22, 1.5], [0.74, 0.25, 1.1], [0.9, 0.31, 1.3], [0.3, 0.36, 1.2],
];

/**
 * The sky behind every screen (plan §7): a soft gradient with a few clouds; at night a deep navy with
 * small stars and a moon; in high contrast nothing at all (pure black). `scene="home"` adds the sun and
 * two low hills along the bottom of a header band. Decoration only: hidden from screen readers and
 * never takes a touch.
 */
export function SkyBackdrop({ scene = 'plain', height }: { scene?: 'plain' | 'home'; height?: number }) {
  const { mode } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const { width, height: windowHeight } = useWindowDimensions();
  if (hc) return null;
  const h = height ?? windowHeight;
  const night = mode === 'dark';
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, height ? { height } : null]}>
      <LinearGradient colors={app.stage} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={h} style={StyleSheet.absoluteFill}>
        {night ? (
          <>
            {STARS.map(([x, y, r], i) => (
              <Circle key={i} cx={x * width} cy={y * Math.min(h, 700)} r={r} fill={app.sparkle} />
            ))}
            <Circle cx={width * 0.84} cy={58} r={22} fill={app.sun} fillOpacity={0.9} />
            <Circle cx={width * 0.84 + 10} cy={50} r={20} fill={app.stage[0]} />
          </>
        ) : (
          <>
            {scene === 'home' && <Circle cx={width * 0.84} cy={64} r={30} fill={app.sun} />}
            {cloud(-width * 0.06, 70, width * 0.42, app.cloud, 'a')}
            {cloud(width * 0.58, 128, width * 0.34, app.cloud, 'b')}
            {scene === 'plain' && cloud(width * 0.2, h * 0.62, width * 0.3, app.cloud, 'c')}
          </>
        )}
        {scene === 'home' && (
          <>
            <Path d={`M0 ${h - 34} C ${width * 0.25} ${h - 70}, ${width * 0.55} ${h - 30}, ${width} ${h - 58} L ${width} ${h} L 0 ${h} Z`} fill={app.hills[0]} />
            <Path d={`M0 ${h - 14} C ${width * 0.35} ${h - 46}, ${width * 0.7} ${h - 8}, ${width} ${h - 26} L ${width} ${h} L 0 ${h} Z`} fill={app.hills[1]} />
          </>
        )}
      </Svg>
    </View>
  );
}
