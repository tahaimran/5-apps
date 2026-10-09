import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@shared/theme';

/**
 * A tiny line of values, oldest on the left, with the scale starting at zero so the height is honest.
 * It is a picture only: the caller gives the screen reader a sentence with the same numbers.
 */
export function Sparkline({ values, height = 64 }: { values: readonly number[]; height?: number }) {
  const { colors } = useTheme();
  if (values.length === 0) return null;
  const w = 300;
  const pad = 6;
  const max = Math.max(...values, 1);
  const x = (i: number) => (values.length === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (values.length - 1));
  const y = (v: number) => height - pad - (v / max) * (height - 2 * pad);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ height }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
        {values.length > 1 ? <Path d={d} stroke={colors.text} strokeWidth={3} fill="none" /> : null}
        {values.map((v, i) => (
          <Circle key={i} cx={x(i)} cy={y(v)} r={4} fill={colors.text} />
        ))}
      </Svg>
    </View>
  );
}
