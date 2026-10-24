import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import BellOff from 'lucide-react-native/icons/bell-off';
import BellRing from 'lucide-react-native/icons/bell-ring';
import Settings from 'lucide-react-native/icons/settings';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import { Button } from '@shared/ui';
import { changeKickReminderTime, disableKickReminder, enableKickReminder, type EnableResult } from '@/notifications/kickReminder';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { Sheet } from '@/ui/Sheet';

/**
 * The daily kick reminder (plan F18). It explains what it does first; the phone's own permission question
 * appears only after "Turn on", never before. Turning it off, or changing its time, needs no permission.
 * The time is picked on the shared wheels and shown in the clock style chosen in Settings.
 */
export function KickReminderSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, type, spacing } = useTheme();
  const saved = useSettings((s) => s.settings.kickReminder);
  const [time, setTime] = useState({ hour: saved.hour, minute: saved.minute });
  const [result, setResult] = useState<EnableResult | null>(null);

  useEffect(() => {
    if (visible) {
      setTime({ hour: saved.hour, minute: saved.minute });
      setResult(null);
    }
    // only when the sheet opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const change = (hhmm: string) => {
    const { hour, minute } = fromHHMM(hhmm);
    setTime({ hour, minute });
    if (saved.enabled) void changeKickReminderTime(hour, minute);
  };
  const turnOn = async () => {
    const outcome = await enableKickReminder(time.hour, time.minute);
    if (outcome === 'enabled') onClose();
    else setResult(outcome);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('reminder.title')}>
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('reminder.body')}</AppText>
      <View style={[styles.row, { gap: spacing.md }]}>
        <AppText style={[type.bodyLarge, styles.flex, { color: colors.textMuted, fontWeight: '600' }]}>{t('reminder.time')}</AppText>
        <TimeField label={t('reminder.time')} value={toHHMM(time.hour, time.minute)} onChange={change} />
      </View>
      {result ? (
        <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>
          {t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}
        </AppText>
      ) : null}
      {result === 'blocked' ? <Button variant="secondary" icon={Settings} label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} /> : null}
      {saved.enabled ? (
        <>
          <Button label={t('common.done')} onPress={onClose} />
          <Button
            variant="secondary"
            icon={BellOff}
            label={t('reminder.turnOff')}
            onPress={() => {
              void disableKickReminder();
              onClose();
            }}
          />
        </>
      ) : (
        <>
          <Button icon={BellRing} label={t('reminder.turnOn')} onPress={() => void turnOn()} />
          <Button variant="secondary" label={t('reminder.notNow')} onPress={onClose} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, flexBasis: 120 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
});
