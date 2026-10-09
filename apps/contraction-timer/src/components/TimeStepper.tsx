import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { timeOfDay } from '@/ui/format';
import { Stepper } from '@/ui/Stepper';

const DAY_MIN = 24 * 60;
/** Moves a time of day by `delta` minutes and wraps past midnight, so "15 minutes earlier" from 9:00 is 8:45, never 9:45. */
export const shiftTime = (hour: number, minute: number, delta: number): { hour: number; minute: number } => {
  const total = (((hour * 60 + minute + delta) % DAY_MIN) + DAY_MIN) % DAY_MIN;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

/** Picks a time of day with big plus and minus buttons (hours by 1, minutes by 15): no tiny wheel to hit. */
export function TimeStepper({ hour, minute, onChange }: { hour: number; minute: number; onChange: (hour: number, minute: number) => void }) {
  const { spacing } = useTheme();
  const clock24h = useSettings((s) => s.settings.clock24h);
  const value = timeOfDay(hour, minute, clock24h);
  return (
    <View style={{ gap: spacing.sm }}>
      <Stepper
        label={t('reminder.time')}
        value={value}
        stepText={t('reminder.hourStep')}
        minusLabel={t('reminder.hourLess')}
        plusLabel={t('reminder.hourMore')}
        onMinus={() => { const n = shiftTime(hour, minute, -60); onChange(n.hour, n.minute); }}
        onPlus={() => { const n = shiftTime(hour, minute, 60); onChange(n.hour, n.minute); }}
      />
      <Stepper
        label={t('reminder.time')}
        value={value}
        stepText={t('reminder.minuteStep')}
        minusLabel={t('reminder.minuteLess')}
        plusLabel={t('reminder.minuteMore')}
        onMinus={() => { const n = shiftTime(hour, minute, -15); onChange(n.hour, n.minute); }}
        onPlus={() => { const n = shiftTime(hour, minute, 15); onChange(n.hour, n.minute); }}
      />
    </View>
  );
}
