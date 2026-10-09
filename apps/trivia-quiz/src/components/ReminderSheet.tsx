import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { DEFAULT_REMINDER } from '@/domain/reminder';
import { enableReminder, type EnableResult } from '@/notifications/reminder';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Sheet } from '@/ui/Sheet';
import { TimeStepper } from './TimeStepper';

/**
 * The reminder ask as a sheet (plan §6 O7, offered again once after the first 3-day streak). It explains
 * the single daily nudge, lets the player pick a time, and only then triggers the system permission dialog.
 */
export function ReminderSheet({ visible, onClose, onAnswered }: { visible: boolean; onClose: () => void; onAnswered?: (accepted: boolean) => void }) {
  const { colors } = useTheme();
  const [time, setTime] = useState<{ hour: number; minute: number }>({ ...DEFAULT_REMINDER });
  const [result, setResult] = useState<EnableResult | null>(null);
  useEffect(() => {
    if (visible) {
      setTime({ ...DEFAULT_REMINDER });
      setResult(null);
    }
  }, [visible]);
  const yes = async () => {
    const outcome = await enableReminder(time.hour, time.minute);
    if (outcome === 'enabled') {
      onAnswered?.(true);
      onClose();
    } else setResult(outcome);
  };
  return (
    <Sheet visible={visible} onClose={() => { onAnswered?.(false); onClose(); }}>
      <AppText variant="h1" accessibilityRole="header">{t('onboarding.reminderTitle')}</AppText>
      <AppText variant="body" style={{ color: colors.textMuted }}>{t('onboarding.reminderBody')}</AppText>
      <TimeStepper hour={time.hour} minute={time.minute} onChange={(hour, minute) => setTime({ hour, minute })} />
      {result && <AppText accessibilityLiveRegion="polite" variant="body" style={{ fontWeight: '700' }}>{t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}</AppText>}
      {result === 'blocked' && <BigButton variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}
      <BigButton tall label={t('onboarding.remindMe')} onPress={() => void yes()} />
      <BigButton variant="secondary" label={t('onboarding.notNow')} onPress={() => { onAnswered?.(false); onClose(); }} />
    </Sheet>
  );
}
