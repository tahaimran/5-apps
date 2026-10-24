import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@shared/theme';

/**
 * A tiny line of values, oldest on the left, with the scale starting at zero so the height is honest,
 * over a soft fill. It is a picture only: the caller gives the screen reader a sentence with the same numbers.
 */
export function Sparkline({ values, height = 72 }: { values: readonly number[]; height?: number }) {
  const { colors } = useTheme();
  if (values.length === 0) return null;
  const w = 300;
  const pad = 8;
  const max = Math.max(...values, 1);
  const x = (i: number) => (values.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (values.length - 1));
  const y = (v: number) => height - pad - (v / max) * (height - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${x(values.length - 1).toFixed(1)} ${height} L${x(0).toFixed(1)} ${height} Z`;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
        <Defs>
          <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.28} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {values.length > 1 ? <Path d={area} fill="url(#spark)" /> : null}
        {values.length > 1 ? <Path d={d} stroke={colors.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" fill="none" /> : null}
        {values.map((v, i) => (
          <Circle key={i} cx={x(i)} cy={y(v)} r={4.5} fill={colors.surface} stroke={colors.primary} strokeWidth={2.5} />
        ))}
      </Svg>
    </View>
  );
}
