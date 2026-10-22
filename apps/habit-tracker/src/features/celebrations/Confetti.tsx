import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Brand violet and ember lead; the rest are habit colors so a burst always looks like the app.
const COLORS = ['#5B3DF5', '#FF8A3D', '#22C55E', '#EC4899', '#0EA5E9', '#EAB308', '#8B78FF'];
const COUNT = 44;
const DURATION = 1700;

interface Piece {
  x: number;
  drift: number;
  size: number;
  color: string;
  spin: number;
  delay: number;
}

function Particle({ piece, progress, height }: { piece: Piece; progress: { value: number }; height: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, (progress.value * (1 + piece.delay) - piece.delay) / 1));
    return {
      opacity: p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2,
      transform: [
        { translateX: piece.drift * p },
        { translateY: -height * 0.25 * Math.sin(Math.min(p * 1.6, 1) * Math.PI) + height * 0.8 * p * p },
        { rotate: `${piece.spin * p}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { left: piece.x, width: piece.size, height: piece.size * 0.5, backgroundColor: piece.color, top: height * 0.35 },
        style,
      ]}
    />
  );
}

/** A short burst of confetti. Calls `onDone` when finished. Skip rendering it under reduced motion. */
export function Confetti({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: width * (0.15 + 0.7 * ((i * 37) % 100) / 100),
        drift: (((i * 53) % 100) / 100 - 0.5) * width * 0.6,
        size: 8 + ((i * 7) % 8),
        color: COLORS[i % COLORS.length],
        spin: 180 + ((i * 41) % 360),
        delay: ((i * 13) % 20) / 100,
      })),
    [width],
  );

  useEffect(() => {
    progress.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) scheduleOnRN(onDone);
    }));
  }, [progress, onDone]);

  return (
    <>
      {pieces.map((piece, i) => (
        <Particle key={i} piece={piece} progress={progress} height={height} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', borderRadius: 2 },
});
