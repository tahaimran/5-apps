import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';

const SIZE = 56;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The countdown ring (plan §5). The number in the middle is text, so the time is never shown by the ring
 * alone; the spoken label changes only every 5 seconds so a screen reader is not chattering.
 */
export function TimerRing({ msLeft, msTotal }: { msLeft: number; msTotal: number }) {
  const { colors } = useTheme();
  const seconds = Math.ceil(msLeft / 1000);
  const fraction = msTotal > 0 ? Math.max(0, Math.min(1, msLeft / msTotal)) : 0;
  const low = seconds <= 5;
  const spoken = Math.ceil(seconds / 5) * 5;
  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={t('quiz.timeLeft', { seconds: spoken })} style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.surfaceAlt} strokeWidth={STROKE} fill="none" />
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={low ? colors.danger : colors.primary} strokeWidth={STROKE} fill="none" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - fraction)} strokeLinecap="round" />
      </Svg>
      <AppText variant="body" style={{ color: low ? colors.danger : colors.text, fontWeight: '700' }}>{String(seconds)}</AppText>
    </View>
  );
}
