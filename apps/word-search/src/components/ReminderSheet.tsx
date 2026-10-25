import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM, useTimeFormat } from '@shared/time';
import { Button, PressableScale } from '@shared/ui';
import { TIME_CHOICES } from '@/domain/reminder';
import { enableReminder, type EnableResult } from '@/notifications/reminder';
import { AppText } from '@/ui/AppText';
import { GameButton } from '@/ui/GameButton';
import { CSS_EASE_OUT, STATE_MS } from '@/ui/motion';
import { Sheet } from '@/ui/Sheet';

/**
 * The pre-prompt of plan §10: explains the reminder and lets the player choose a time before the
 * system permission dialog appears: three time chips and "Choose time" (the shared wheel). "Not now"
 * never nags: the caller records the ask.
 */
export function ReminderSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  const reduced = useReducedMotion();
  const clock = useTimeFormat();
  const [choice, setChoice] = useState<number>(0); // index in TIME_CHOICES, or -1 for "Choose time"
  const [custom, setCustom] = useState('09:00');
  const [result, setResult] = useState<EnableResult | null>(null);

  useEffect(() => {
    if (visible) {
      setChoice(0);
      setResult(null);
    }
  }, [visible]);

  const time = choice >= 0 ? TIME_CHOICES[choice] : fromHHMM(custom);
  const yes = async () => {
    const outcome = await enableReminder(time.hour, time.minute);
    if (outcome === 'enabled') onClose();
    else setResult(outcome);
  };

  const chip = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <PressableScale key={key} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected, checked: selected }} onPress={onPress} scaleTo={0.95} style={styles.chip}>
      <Animated.View
        style={[
          styles.chipFill,
          {
            minHeight: touchTarget,
            borderRadius: radius.pill,
            paddingHorizontal: spacing.lg,
            borderWidth: 2,
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primary : colors.surface,
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: reduced ? 0 : STATE_MS,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      >
        <AppText style={[type.bodyLarge, { color: selected ? colors.onPrimary : colors.text, fontWeight: '700', textAlign: 'center' }]}>{label}</AppText>
      </Animated.View>
    </PressableScale>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title={t('reminder.promptTitle')}>
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('reminder.promptBody')}</AppText>
      <View accessibilityRole="radiogroup" style={[styles.row, { gap: spacing.sm }]}>
        {TIME_CHOICES.map((c, i) => chip(String(c.hour), clock.time(toHHMM(c.hour, c.minute)), choice === i, () => setChoice(i)))}
        {chip('custom', t('reminder.chooseTime'), choice === -1, () => setChoice(-1))}
      </View>
      {choice === -1 && <TimeField label={t('reminder.chooseTime')} value={custom} onChange={setCustom} minuteStep={5} />}
      {result && (
        <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.text, fontWeight: '700' }]}>
          {t(result === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}
        </AppText>
      )}
      {result === 'blocked' && <Button variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} block />}
      <GameButton label={t('reminder.yes')} onPress={() => void yes()} />
      <Button variant="ghost" label={t('reminder.notNow')} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexGrow: 1, flexBasis: 120 },
  chipFill: { alignItems: 'center', justifyContent: 'center' },
});
