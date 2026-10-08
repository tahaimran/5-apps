import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { Mood } from '@/domain/plant';
import type { PlantStage } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';
import { skinById } from '@/data/shop';

export interface PlantProps {
  stage: PlantStage;
  mood: Mood;
  /** Plant skin id (pot and leaf colors); defaults to the classic one. */
  skin?: string;
  size?: number;
}

const LEAVES: Record<number, [number, number, number][]> = {
  // [x, y, rotation in degrees]
  1: [
    [88, 110, -35],
    [112, 110, 35],
  ],
  2: [
    [86, 116, -35],
    [114, 116, 35],
    [88, 94, -30],
    [112, 94, 30],
  ],
  3: [
    [84, 120, -40],
    [116, 120, 40],
    [86, 98, -32],
    [114, 98, 32],
    [90, 78, -25],
    [110, 78, 25],
  ],
  4: [
    [84, 120, -40],
    [116, 120, 40],
    [86, 98, -32],
    [114, 98, 32],
    [90, 78, -25],
    [110, 78, 25],
  ],
};
const STEM_TOP: Record<number, number> = { 1: 104, 2: 84, 3: 66, 4: 62 };
const FLOWERS: [number, number][] = [
  [100, 54],
  [72, 76],
  [128, 76],
];

const Flower = ({ x, y, petal, center }: { x: number; y: number; petal: string; center: string }) => (
  <G>
    {[0, 72, 144, 216, 288].map((a) => (
      <Circle key={a} cx={x + 8 * Math.cos((a * Math.PI) / 180)} cy={y + 8 * Math.sin((a * Math.PI) / 180)} r={6} fill={petal} />
    ))}
    <Circle cx={x} cy={y} r={5} fill={center} />
  </G>
);

/** The face on the pot: how the plant feels today. */
function Face({ mood }: { mood: Mood }) {
  const eye = '#11263A';
  const mouth: Record<Mood, string> = {
    thirsty: 'M90 176 Q100 170 110 176',
    ok: 'M91 173 Q100 177 109 173',
    happy: 'M89 172 Q100 183 111 172',
    sparkle: 'M88 171 Q100 186 112 171 Z',
  };
  return (
    <G>
      <Circle cx={88} cy={160} r={mood === 'thirsty' ? 2.2 : 3} fill={eye} />
      <Circle cx={112} cy={160} r={mood === 'thirsty' ? 2.2 : 3} fill={eye} />
      <Path d={mouth[mood]} stroke={eye} strokeWidth={2.4} strokeLinecap="round" fill={mood === 'sparkle' ? eye : 'none'} />
    </G>
  );
}

/**
 * The plant companion (plan §7.3): five growth stages and a daily mood, drawn as vectors so the
 * pot and leaf colors can follow the chosen skin. It sways gently unless reduced motion is on.
 */
export function Plant({ stage, mood, skin = 'classic', size = 200 }: PlantProps) {
  const { mode } = useTheme();
  const extra = extraColorsFor(mode);
  const s = skinById(skin);
  const leaf = s.leaf ?? extra.leaf;
  const pot = s.pot;
  const reduced = useReducedMotion();
  const sway = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    sway.value = withRepeat(withSequence(withTiming(2.5, { duration: 1800 }), withTiming(-2.5, { duration: 1800 })), -1, true);
  }, [reduced, sway]);
  const swayStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));

  const droop = mood === 'thirsty' && stage > 0 ? -14 : 0;
  const stemTop = STEM_TOP[stage] ?? 130;
  const label = t('plant.label', { stage: t(`plant.stages.${stage}`), mood: t(`plant.moods.${mood}`) });

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.box, { width: size, height: size }, swayStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {stage > 0 && (
          <G rotation={droop} origin="100, 132">
            <Path d={`M100 134 L100 ${stemTop}`} stroke={leaf} strokeWidth={5} strokeLinecap="round" />
            {(LEAVES[stage] ?? []).map(([x, y, r], i) => (
              <G key={i} rotation={mood === 'thirsty' ? r * 0.6 : r} origin={`${x}, ${y}`}>
                <Path d={`M${x} ${y} q 12 -9 22 0 q -10 9 -22 0 Z`} fill={leaf} transform={`translate(${r < 0 ? -22 : 0} 0)`} />
              </G>
            ))}
            {stage === 3 && <Circle cx={100} cy={stemTop - 6} r={7} fill={extra.bloom} />}
            {stage === 4 && FLOWERS.map(([x, y]) => <Flower key={x} x={x} y={y} petal={extra.bloom} center={extra.sun} />)}
          </G>
        )}
        {stage === 0 && <Path d="M94 132 q 6 -9 12 0 q -6 6 -12 0 Z" fill="#8A5A3C" />}
        <Rect x={50} y={130} width={100} height={16} rx={7} fill={pot} />
        <Path d="M58 146 L142 146 L132 192 L68 192 Z" fill={pot} />
        <Path d="M58 146 L142 146 L140 152 L60 152 Z" fill="#000000" fillOpacity={0.12} />
        <Face mood={mood} />
        {mood === 'sparkle' && (
          <G fill={extra.sun}>
            <Circle cx={36} cy={60} r={4} />
            <Circle cx={166} cy={48} r={5} />
            <Circle cx={158} cy={110} r={3} />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center', justifyContent: 'center' } });
