import { Linking } from 'react-native';
import { router, Stack } from 'expo-router';
import Constants from 'expo-constants';
import { Text } from 'react-native';
import { promoPackages } from '@shared/crosspromo/catalog';
import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { formatClock } from '@/domain/dayKey';
import { reminderCount } from '@/domain/schedule';
import { preferredCup, useSettings } from '@/store/settings';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { NavRow, SwitchRow } from '@/ui/SettingsRow';
import { Field, MinuteStepper, Segmented } from '@/ui/controls';

type Choice = 'system' | 'light' | 'dark';

export default function Settings() {
  const { colors, type, preference, setPreference } = useTheme();
  const { goal, reminders, cups, prefs, setGoal, setReminders, setPrefs } = useSettings();
  const unit = goal.unit;

  const rate = () => {
    const id = promoPackages['water-reminder'];
    Linking.openURL(`market://details?id=${id}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`));
  };
  // Literal env reference so Expo inlines it at build time.
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

  const perDay = reminderCount(reminders, goal.goalMl, preferredCup({ cups, prefs }).ml);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('settings.title'), headerShown: true }} />

      <NavRow icon="target" label={t('settings.goal')} value={volume(goal.goalMl, unit)} onPress={() => router.push('/settings/goal')} />

      <Field label={t('settings.units')}>
        <Segmented<'ml' | 'floz'>
          value={unit}
          onChange={(u) => setGoal({ unit: u })}
          options={[
            { value: 'ml', label: t('units.ml') },
            { value: 'floz', label: t('units.floz') },
          ]}
        />
      </Field>

      <Field label={t('settings.wake')}>
        <MinuteStepper label={t('settings.wake')} value={reminders.wakeMin} onChange={(wakeMin) => setReminders({ wakeMin })} />
      </Field>
      <Field label={t('settings.bed')}>
        <MinuteStepper label={t('settings.bed')} value={reminders.bedMin} onChange={(bedMin) => setReminders({ bedMin })} />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('settings.scheduleHint', { wake: formatClock(reminders.wakeMin) })}</Text>
      </Field>

      <NavRow
        icon="bell-outline"
        label={t('settings.reminders')}
        value={reminders.enabled ? t('settings.remindersOn', { count: perDay }) : t('common.off')}
        onPress={() => router.push('/settings/reminders')}
      />
      <NavRow icon="cup-water" label={t('settings.cups')} value={volume(preferredCup({ cups, prefs }).ml, unit)} onPress={() => router.push('/settings/cups')} />
      <NavRow icon="coffee-outline" label={t('settings.beverages')} onPress={() => router.push('/settings/beverages')} />

      <Field label={t('settings.appearance')}>
        <Segmented<Choice>
          value={preference === 'light' || preference === 'dark' ? preference : 'system'}
          onChange={(v) => setPreference(v as ThemePreference)}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </Field>
      <SwitchRow label={t('settings.largeText')} hint={t('settings.largeTextHint')} value={prefs.largeText} onChange={(largeText) => setPrefs({ largeText })} />
      <SwitchRow label={t('settings.haptics')} value={prefs.haptics} onChange={(haptics) => setPrefs({ haptics })} />

      <NavRow icon="shield-account-outline" label={t('settings.privacy')} onPress={() => router.push('/settings/privacy')} />
      <NavRow icon="battery-heart-outline" label={t('settings.battery')} onPress={() => router.push('/settings/battery-guide')} />
      <NavRow icon="content-save-outline" label={t('settings.backup')} onPress={() => router.push('/settings/backup')} />
      <NavRow icon="star-outline" label={t('settings.rate')} onPress={rate} />
      {privacyPolicyUrl ? <NavRow icon="file-document-outline" label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}

      <Text style={[type.body, { color: colors.textMuted }]}>{t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
    </Screen>
  );
}
