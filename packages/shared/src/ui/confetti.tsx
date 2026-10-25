import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

export interface ConfettiProps {
  /** Piece colors, used in turn (an app passes its own palette so a burst looks like the app). */
  colors: readonly string[];
  /** Called once when the burst is over (or at once under Reduce Motion, which draws nothing). */
  onDone?: () => void;
  /** Number of pieces. Default 40. */
  count?: number;
  /** ms. Default 1600. */
  duration?: number;
}

interface Piece {
  x: number;
  drift: number;
  size: number;
  color: string;
  spin: number;
  delay: number;
}

/** Spread evenly but not in a visible pattern: the same burst every time (no Math.random in render). */
export function confettiPieces(count: number, width: number, colors: readonly string[]): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    x: width * (0.08 + (0.84 * ((i * 37) % 100)) / 100),
    drift: (((i * 53) % 100) / 100 - 0.5) * width * 0.5,
    size: 8 + ((i * 7) % 8),
    color: colors[i % Math.max(1, colors.length)] ?? '#FFFFFF',
    spin: 180 + ((i * 41) % 360),
    delay: ((i * 13) % 20) / 100,
  }));
}

function Particle({ piece, progress, height }: { piece: Piece; progress: SharedValue<number>; height: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, progress.get() * (1 + piece.delay) - piece.delay));
    return {
      opacity: p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2,
      transform: [
        { translateX: piece.drift * p },
        { translateY: -height * 0.18 * Math.sin(Math.min(p * 1.6, 1) * Math.PI) + height * 0.85 * p * p },
        { rotate: `${piece.spin * p}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { left: piece.x, width: piece.size, height: piece.size * 0.5, backgroundColor: piece.color, top: height * 0.12 }, style]} />;
}

/**
 * A one-shot burst of paper pieces over the whole screen, for a rare celebration only (a finished
 * puzzle, a goal met). It never takes touches, is hidden from screen readers, runs on the UI thread,
 * and under Reduce Motion draws nothing at all.
 */
export function Confetti({ colors, onDone, count = 40, duration = 1600 }: ConfettiProps) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  const pieces = useMemo(() => confettiPieces(count, width, colors), [count, width, colors]);

  useEffect(() => {
    if (reduced) {
      onDone?.();
      return;
    }
    progress.set(withTiming(1, { duration, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
    // A plain timer, not the animation callback: it fires even if the animation is interrupted.
    const timer = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(timer);
    // One burst per mount: a new `onDone` identity must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, duration, progress]);

  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((piece, i) => (
        <Particle key={i} piece={piece} progress={progress} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ piece: { position: 'absolute', borderRadius: 2 } });
