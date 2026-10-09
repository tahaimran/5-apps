import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { changeKickReminderTime, disableKickReminder, enableKickReminder, type EnableResult } from '@/notifications/kickReminder';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Sheet } from '@/ui/Sheet';
import { TimeStepper } from './TimeStepper';

/**
 * The daily kick reminder (plan F18). It explains what it does first; the phone's own permission question
 * appears only after "Turn on", never before. Turning it off, or changing its time, needs no permission.
 */
export function KickReminderSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, type } = useTheme();
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

  const change = (hour: number, minute: number) => {
    setTime({ hour, minute });
    if (saved.enabled) void changeKickReminderTime(hour, minute);
  };
  const turnOn = async () => {
    const outcome = await enableKickReminder(time.hour, time.minute);
    if (outcome === 'enabled') onClose();
    else setResult(outcome);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('reminder.title')}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('reminder.body')}</AppText>
      <TimeStepper hour={time.hour} minute={time.minute} onChange={change} />
      {result ? (
        <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}</AppText>
      ) : null}
      {result === 'blocked' ? <BigButton variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} /> : null}
      {saved.enabled ? (
        <>
          <BigButton tall label={t('common.done')} onPress={onClose} />
          <BigButton
            variant="secondary"
            label={t('reminder.turnOff')}
            onPress={() => {
              void disableKickReminder();
              onClose();
            }}
          />
        </>
      ) : (
        <>
          <BigButton tall label={t('reminder.turnOn')} onPress={() => void turnOn()} />
          <BigButton variant="secondary" label={t('reminder.notNow')} onPress={onClose} />
        </>
      )}
    </Sheet>
  );
}
