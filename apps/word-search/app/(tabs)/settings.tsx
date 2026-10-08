import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import Constants from 'expo-constants';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { TextSizePicker } from '@/components/TextSizePicker';
import { ThemePicker } from '@/components/ThemePicker';
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
      <SwitchRow label={t('settings.haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />

      {section('settings.game')}
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {DIFFICULTIES.map((d) => (
          <OptionCard key={d} label={t(`onboarding.level.${d}`)} detail={t(`onboarding.level.${d}Detail`)} selected={settings.difficulty === d} onPress={() => update({ difficulty: d })} />
        ))}
      </View>
      <SwitchRow label={t('settings.timer')} hint={t('settings.timerHint')} value={settings.showTimer} onChange={(showTimer) => update({ showTimer })} />

      {section('settings.privacy')}
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.privacyNote')}</AppText>
      {privacyRequired && <BigButton variant="secondary" label={t('settings.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
      {policyUrl ? <BigButton variant="secondary" label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(policyUrl)} /> : null}

      {section('settings.about')}
      <View style={{ minHeight: 64, justifyContent: 'center' }}>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('settings.version', { version: Constants.expoConfig?.version ?? '' })}</AppText>
      </View>

      {__DEV__ && <BigButton variant="secondary" label={t('settings.adDebug')} onPress={() => router.push('/debug-ads')} />}

      {section('settings.reset')}
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.resetHint')}</AppText>
      <BigButton variant="secondary" label={t('settings.resetButton')} onPress={() => confirmReset()} />
    </Screen>
  );
}
