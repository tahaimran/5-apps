import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import Constants from 'expo-constants';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { TimeStepper } from '@/components/TimeStepper';
import { TextSizePicker } from '@/components/TextSizePicker';
import { ThemePicker } from '@/components/ThemePicker';
import { changeReminderTime, disableReminder, enableReminder, type EnableResult } from '@/notifications/reminder';
import { formatTime } from '@/ui/format';
import { confirmReset } from '@/features/settings/reset';
import type { Difficulty, SelectionMode } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';
import { SwitchRow } from '@/ui/SwitchRow';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const MODES: SelectionMode[] = ['both', 'tapOnly'];

/** Plan §5.6. Every row is at least 64dp and every switch says On or Off in words. */
export default function Settings() {
  const { colors, spacing, type } = useTheme();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  useAdScreen('settings');
  const [privacyRequired, setPrivacyRequired] = useState(false);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setPrivacyRequired).catch(() => setPrivacyRequired(false));
  }, []);
  // Literal env reference so Expo inlines it at build time.
  const policyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  const [reminderResult, setReminderResult] = useState<EnableResult | null>(null);
  const reminder = settings.reminder;
  const version = Constants.expoConfig?.version ?? '';
  const packageId = Constants.expoConfig?.android?.package;
  const section = (key: string) => (
    <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.lg }]}>
      {t(key)}
    </AppText>
  );
  return (
    <Screen>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700' }]}>{t('settings.title')}</AppText>

      {section('settings.display')}
      <TextSizePicker value={settings.textSize} onChange={(textSize) => update({ textSize })} />
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('settings.selection')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {MODES.map((mode) => (
          <OptionCard key={mode} label={t(`settings.mode.${mode}`)} detail={t(`settings.mode.${mode}Detail`)} selected={settings.selectionMode === mode} onPress={() => update({ selectionMode: mode })} />
        ))}
      </View>
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('settings.colors')}</AppText>
      <ThemePicker />

      {section('settings.touch')}
      <SwitchRow label={t('settings.sounds')} value={settings.sounds} onChange={(sounds) => update({ sounds })} />
      <SwitchRow label={t('settings.haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />

      {section('settings.reminderSection')}
      <SwitchRow
        label={t('settings.reminderSwitch')}
        value={reminder.enabled}
        onChange={(on) => {
          setReminderResult(null);
          if (on) void enableReminder(reminder.hour, reminder.minute).then((r) => setReminderResult(r === 'enabled' ? null : r));
          else void disableReminder();
        }}
      />
      {reminder.enabled && (
        <>
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('settings.reminderTime', { time: formatTime(reminder.hour, reminder.minute) })}</AppText>
          <TimeStepper hour={reminder.hour} minute={reminder.minute} onChange={(h, m) => void changeReminderTime(h, m)} />
        </>
      )}
      {reminderResult && <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t(reminderResult === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}</AppText>}
      {reminderResult === 'blocked' && <BigButton variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}

      {section('settings.game')}
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {DIFFICULTIES.map((d) => (
          <OptionCard key={d} label={t(`onboarding.level.${d}`)} detail={t(`onboarding.level.${d}Detail`)} selected={settings.difficulty === d} onPress={() => update({ difficulty: d })} />
        ))}
      </View>
      <SwitchRow label={t('settings.timer')} hint={t('settings.timerHint')} value={settings.showTimer} onChange={(showTimer) => update({ showTimer })} />

      {section('settings.privacy')}
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.privacyNote')}</AppText>
      <BigButton variant="secondary" label={t('settings.privacyInfo')} onPress={() => router.push('/privacy')} />
      {privacyRequired && <BigButton variant="secondary" label={t('settings.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
      {policyUrl ? <BigButton variant="secondary" label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(policyUrl)} /> : null}

      {section('settings.about')}
      <View style={{ minHeight: 64, justifyContent: 'center' }}>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('settings.version', { version })}</AppText>
      </View>
      {packageId ? <BigButton variant="secondary" label={t('settings.rate')} onPress={() => void Linking.openURL(`market://details?id=${packageId}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`))} /> : null}
      {contactEmail ? (
        <BigButton
          variant="secondary"
          label={t('settings.feedback')}
          onPress={() => void Linking.openURL(`mailto:${contactEmail}?subject=${encodeURIComponent(t('settings.feedbackSubject'))}&body=${encodeURIComponent(t('settings.feedbackBody', { version, android: String(Platform.Version) }))}`)}
        />
      ) : null}

      {__DEV__ && <BigButton variant="secondary" label={t('settings.adDebug')} onPress={() => router.push('/debug-ads')} />}

      {section('settings.reset')}
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.resetHint')}</AppText>
      <BigButton variant="secondary" label={t('settings.resetButton')} onPress={() => confirmReset()} />
    </Screen>
  );
}
