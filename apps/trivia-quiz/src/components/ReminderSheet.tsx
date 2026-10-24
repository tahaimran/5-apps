import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Bell from 'lucide-react-native/icons/bell';
import Settings2 from 'lucide-react-native/icons/settings-2';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import { Button } from '@shared/ui';
import { DEFAULT_REMINDER } from '@/domain/reminder';
import { enableReminder, type EnableResult } from '@/notifications/reminder';
import { AppText } from '@/ui/AppText';
import { IconCircle } from '@/ui/SettingsRow';
import { Sheet } from '@/ui/Sheet';

/**
 * The reminder ask as a sheet (plan §6 O7, offered again once after the first 3-day streak). It explains
 * the single daily nudge, lets the player pick a time on the wheel picker (12- or 24-hour, as set), and
 * only then triggers the system permission dialog.
 */
export function ReminderSheet({ visible, onClose, onAnswered }: { visible: boolean; onClose: () => void; onAnswered?: (accepted: boolean) => void }) {
  const { colors, spacing } = useTheme();
  const [time, setTime] = useState(toHHMM(DEFAULT_REMINDER.hour, DEFAULT_REMINDER.minute));
  const [result, setResult] = useState<EnableResult | null>(null);
  useEffect(() => {
    if (visible) {
      setTime(toHHMM(DEFAULT_REMINDER.hour, DEFAULT_REMINDER.minute));
      setResult(null);
    }
  }, [visible]);
  const yes = async () => {
    const { hour, minute } = fromHHMM(time);
    const outcome = await enableReminder(hour, minute);
    if (outcome === 'enabled') {
      onAnswered?.(true);
      onClose();
    } else setResult(outcome);
  };
  const no = () => {
    onAnswered?.(false);
    onClose();
  };
  return (
    <Sheet visible={visible} onClose={no}>
      <IconCircle icon={Bell} size={52} />
      <AppText variant="h1" accessibilityRole="header">
        {t('onboarding.reminderTitle')}
      </AppText>
      <AppText variant="body" style={{ color: colors.textMuted }}>
        {t('onboarding.reminderBody')}
      </AppText>
      <View style={[styles.row, { gap: spacing.md }]}>
        <AppText variant="body" style={[styles.flex, styles.bold]}>
          {t('settings.reminderTimeLabel')}
        </AppText>
        <TimeField label={t('settings.reminderTimeLabel')} value={time} onChange={setTime} />
      </View>
      {result && (
        <AppText accessibilityLiveRegion="polite" variant="body" style={styles.bold}>
          {t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}
        </AppText>
      )}
      {result === 'blocked' && <Button variant="secondary" block icon={Settings2} label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}
      <Button label={t('onboarding.remindMe')} icon={Bell} onPress={() => void yes()} />
      <Button variant="ghost" label={t('onboarding.notNow')} onPress={no} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
});
