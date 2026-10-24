import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@shared/theme';
import { ProgressRing } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';

/** A full term, the dial's 360°. */
export const TERM_WEEKS = 40;
const STROKE = 14;

/** A point on the dial at `fraction` of a turn, clockwise from the top. */
const at = (c: number, r: number, fraction: number) => {
  const a = fraction * 2 * Math.PI;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
};

/**
 * The pregnancy dial (from the reference's cycle wheel): 40 week ticks around the face, every fourth
 * one numbered, an arc that fills to today, and a knob on the current week. The middle says the week
 * and day. A picture only: the caller gives screen readers the same facts as one sentence.
 */
export function PregnancyDial({ weeks, day, size, top, bottom }: { weeks: number | null; day: number; size: number; top: string; bottom: string }) {
  const { colors, fonts } = useTheme();
  const app = useAppColors();
  const { fontScale } = useWindowDimensions();
  // The face is a fixed size: its text keeps its drawn size at any font scale (the sentence carries it).
  const fit = (sp: number) => Math.round(sp / Math.max(1, fontScale));
  const c = size / 2;
  const ringR = c - STROKE / 2 - 2;
  const tickR = ringR - STROKE - 10;
  const labelR = tickR - 16;
  const progress = weeks === null ? 0 : Math.min(1, (weeks * 7 + day) / (TERM_WEEKS * 7));
  const knob = at(c, ringR, progress);
  return (
    <View style={{ width: size, height: size }} importantForAccessibility="no-hide-descendants">
      <View style={styles.ring}>
        <ProgressRing size={size - 4} strokeWidth={STROKE} progress={progress} color={app.heroRing} trackColor={app.heroTrack} duration={280} />
      </View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {Array.from({ length: TERM_WEEKS }, (_, i) => {
          const p = at(c, tickR, i / TERM_WEEKS);
          const passed = weeks !== null && i < weeks;
          return <Circle key={i} cx={p.x} cy={p.y} r={i % 4 === 0 ? 3 : 1.8} fill={passed ? app.heroRing : colors.textMuted} fillOpacity={passed ? 0.9 : 0.35} />;
        })}
        {[4, 8, 12, 16, 20, 24, 28, 32, 36, 40].map((w) => {
          const p = at(c, labelR, (w % TERM_WEEKS) / TERM_WEEKS);
          return (
            <SvgText key={w} x={p.x} y={p.y + 4} fontSize={11} fontWeight="700" fill={colors.textMuted} textAnchor="middle" fontFamily={fonts.body}>
              {String(w)}
            </SvgText>
          );
        })}
        {weeks !== null ? (
          <>
            <Circle cx={knob.x} cy={knob.y} r={STROKE / 2 + 6} fill={colors.surface} />
            <Circle cx={knob.x} cy={knob.y} r={STROKE / 2 + 1} fill={app.heroRing} />
          </>
        ) : null}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <AppText style={{ fontSize: fit(13), lineHeight: fit(17), color: colors.textMuted, fontFamily: fonts.body, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 }}>{top}</AppText>
        <AppText style={{ fontSize: fit(52), lineHeight: fit(58), color: colors.text, fontFamily: fonts.display, fontWeight: '800' }}>{weeks === null ? '?' : String(weeks)}</AppText>
        <AppText style={{ fontSize: fit(15), lineHeight: fit(20), color: colors.textMuted, fontFamily: fonts.body, fontWeight: '600' }}>{bottom}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: 2, top: 2 },
});
