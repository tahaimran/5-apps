import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { contentVersion } from '@/content/bank';
import { TimeStepper } from '@/components/TimeStepper';
import type { TextScale } from '@/domain/types';
import { confirmReset } from '@/features/settings/reset';
import { changeReminderTime, disableReminder, enableReminder, type EnableResult } from '@/notifications/reminder';
import { useSettings } from '@/store/settings';
import { TEXT_SCALES } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';
import { formatTime } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';
import { SwitchRow } from '@/ui/SwitchRow';

const SIZE_KEY: Record<TextScale, string> = { 0.9: 'small', 1: 'medium', 1.15: 'large', 1.3: 'xlarge' };
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

/** Plan F11 and §5: sound, haptics, text size, theme, relaxed mode, reminder, privacy, about, reset. */
export default function Settings() {
  const { colors, spacing, preference, setPreference } = useTheme();
  useAdScreen('settings');
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const [reminderResult, setReminderResult] = useState<EnableResult | null>(null);
  useEffect(() => {
    isPrivacyOptionsRequired().then(setPrivacyRequired).catch(() => setPrivacyRequired(false));
  }, []);
  // Literal env references so Expo inlines them at build time.
  const policyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const contactEmail = process.env.EXPO_PUBLIC_CONTACT_EMAIL;
  const reminder = settings.reminder;
  const version = Constants.expoConfig?.version ?? '';
  const packageId = Constants.expoConfig?.android?.package;
  const section = (key: string) => (
    <AppText variant="h2" accessibilityRole="header" style={{ marginTop: spacing.lg }}>
      {t(key)}
    </AppText>
  );
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('settings.title')}</AppText>

      {section('settings.soundSection')}
      <SwitchRow label={t('settings.sound')} value={settings.sound} onChange={(sound) => update({ sound })} />
      <SwitchRow label={t('settings.haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />

      {section('settings.displaySection')}
      <AppText variant="body" style={{ fontWeight: '700' }}>{t('settings.textSize')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {TEXT_SCALES.map((scale) => (
          <OptionCard key={scale} label={t(`settings.size.${SIZE_KEY[scale]}`)} selected={settings.textScale === scale} onPress={() => update({ textScale: scale })} />
        ))}
      </View>
      <AppText variant="body" style={{ color: colors.textMuted }}>{t('settings.sizeNote')}</AppText>
      <AppText variant="body" style={{ fontWeight: '700' }}>{t('settings.theme')}</AppText>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {THEMES.map((choice) => (
          <OptionCard
            key={choice}
            label={t(`settings.themes.${choice}`)}
            selected={preference === choice}
            onPress={() => {
              setPreference(choice);
              update({ theme: choice as 'system' | 'light' | 'dark' });
            }}
          />
        ))}
      </View>

      {section('settings.playSection')}
      <SwitchRow label={t('settings.relaxed')} hint={t('settings.relaxedHint')} value={settings.relaxedMode} onChange={(relaxedMode) => update({ relaxedMode })} />

      {section('settings.reminderSection')}
      <SwitchRow
        label={t('settings.reminderSwitch')}
        hint={t('settings.reminderHint')}
        value={reminder.enabled}
        onChange={(on) => {
          setReminderResult(null);
          if (on) void enableReminder(reminder.hour, reminder.minute).then((r) => setReminderResult(r === 'enabled' ? null : r));
          else void disableReminder();
        }}
      />
      {reminder.enabled && (
        <>
          <AppText variant="body" style={{ fontWeight: '700' }}>{t('settings.reminderTime', { time: formatTime(reminder.hour, reminder.minute) })}</AppText>
          <TimeStepper hour={reminder.hour} minute={reminder.minute} onChange={(h, m) => void changeReminderTime(h, m)} />
        </>
      )}
      {reminderResult && <AppText accessibilityLiveRegion="polite" variant="body" style={{ fontWeight: '700' }}>{t(reminderResult === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}</AppText>}
      {reminderResult === 'blocked' && <BigButton variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}

      {section('settings.privacy')}
      <AppText variant="body" style={{ color: colors.textMuted }}>{t('settings.privacyNote')}</AppText>
      <BigButton variant="secondary" label={t('settings.privacyInfo')} onPress={() => router.push('/privacy')} />
      {privacyRequired && <BigButton variant="secondary" label={t('settings.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
      {policyUrl ? <BigButton variant="secondary" label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(policyUrl)} /> : null}

      {section('settings.about')}
      <View accessible accessibilityLabel={`${t('settings.version', { version })}. ${t('settings.bank', { version: contentVersion() })}`} style={{ minHeight: 56, justifyContent: 'center' }}>
        <AppText variant="body" style={{ color: colors.textMuted }}>{t('settings.version', { version })}</AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>{t('settings.bank', { version: contentVersion() })}</AppText>
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
      <AppText variant="body" style={{ color: colors.textMuted }}>{t('settings.resetHint')}</AppText>
      <BigButton variant="secondary" label={t('settings.resetButton')} onPress={() => confirmReset()} />
    </Screen>
  );
}
