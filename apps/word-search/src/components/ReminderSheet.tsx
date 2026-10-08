import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { TIME_CHOICES } from '@/domain/reminder';
import { enableReminder, type EnableResult } from '@/notifications/reminder';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { formatTime } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { Sheet } from '@/ui/Sheet';
import { TimeStepper } from './TimeStepper';

/**
 * The pre-prompt of plan §10: explains the reminder and lets the player choose a time before the
 * system permission dialog appears. "Not now" never nags: the caller records the ask.
 */
export function ReminderSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, type } = useTheme();
  const [choice, setChoice] = useState<number>(0); // index in TIME_CHOICES, or -1 for "Choose time"
  const [custom, setCustom] = useState({ hour: 9, minute: 0 });
  const [result, setResult] = useState<EnableResult | null>(null);

  useEffect(() => {
    if (visible) {
      setChoice(0);
      setResult(null);
    }
  }, [visible]);

  const time = choice >= 0 ? TIME_CHOICES[choice] : custom;
  const yes = async () => {
    const outcome = await enableReminder(time.hour, time.minute);
    if (outcome === 'enabled') onClose();
    else setResult(outcome);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('reminder.promptTitle')}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('reminder.promptBody')}</AppText>
      {TIME_CHOICES.map((c, i) => (
        <OptionCard key={c.hour} label={formatTime(c.hour, c.minute)} selected={choice === i} onPress={() => setChoice(i)} />
      ))}
      <OptionCard label={t('reminder.chooseTime')} detail={choice === -1 ? formatTime(custom.hour, custom.minute) : undefined} selected={choice === -1} onPress={() => setChoice(-1)} />
      {choice === -1 && <TimeStepper hour={custom.hour} minute={custom.minute} onChange={(hour, minute) => setCustom({ hour, minute })} />}
      {result && <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}</AppText>}
      {result === 'blocked' && <BigButton variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}
      <BigButton tall label={t('reminder.yes')} onPress={() => void yes()} />
      <BigButton variant="secondary" label={t('reminder.notNow')} onPress={onClose} />
    </Sheet>
  );
}
