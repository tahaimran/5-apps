import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { KickReminderSheet } from '@/components/KickReminderSheet';
import { KICK_TARGET_LIMITS } from '@/domain/defaults';
import { clampTarget } from '@/domain/kicks';
import { ruleText } from '@/domain/summary';
import type { ThemePref } from '@/domain/types';
import { setWeeklyCards } from '@/notifications/weekly';
import { useSettings } from '@/store/settings';
import { useThemePref } from '@/theme/mode';
import { THEME_PREFS } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { timeOfDay } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Stepper } from '@/ui/Stepper';
import { SwitchRow } from '@/ui/SwitchRow';

const THEME_LABEL: Record<ThemePref, string> = { system: 'settings.themeSystem', light: 'settings.themeLight', dark: 'settings.themeDark', night: 'settings.themeNight' };

/** Plan §5.5: the pattern rule, colors, Partner mode, vibration, clock, units, kick target and reminders. */
export default function Settings() {
  const { colors, spacing, type } = useTheme();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [pref, setPref] = useThemePref();
  const [sheet, setSheet] = useState(false);
  const section = (key: string) => (
    <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700', marginTop: spacing.md }]}>{t(key)}</AppText>
  );
  const reminder = settings.kickReminder;
  const reminderState = reminder.enabled ? t('kicks.reminderOn', { time: timeOfDay(reminder.hour, reminder.minute, settings.clock24h) }) : t('kicks.reminderOff');

  return (
    <Screen>
      <ScreenHeader title={t('settings.title')} />

      {section('settings.alertsSection')}
      <SwitchRow label={t('settings.alerts')} hint={t('settings.alertsHint')} value={settings.patternAlerts} onChange={(patternAlerts) => update({ patternAlerts })} />
      <BigButton variant="secondary" label={t('settings.rule', { rule: ruleText(settings.rule) })} accessibilityHint={t('settings.ruleHint')} onPress={() => router.push('/modals/alert-rule')} />

      {section('settings.lookSection')}
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('settings.theme')}</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {THEME_PREFS.map((p) => (
          <OptionCard key={p} label={t(THEME_LABEL[p])} selected={pref === p} onPress={() => setPref(p)} />
        ))}
      </View>
      <SwitchRow label={t('settings.partner')} hint={t('settings.partnerHint')} value={settings.partnerMode} onChange={(partnerMode) => update({ partnerMode })} />

      {section('settings.feelSection')}
      <SwitchRow label={t('settings.haptics')} hint={t('settings.hapticsHint')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
      <SwitchRow label={t('settings.clock24h')} value={settings.clock24h} onChange={(clock24h) => update({ clock24h })} />
      <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('settings.units')}</AppText>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        <OptionCard label={t('settings.unitsMetric')} selected={settings.units === 'metric'} onPress={() => update({ units: 'metric' })} />
        <OptionCard label={t('settings.unitsImperial')} selected={settings.units === 'imperial'} onPress={() => update({ units: 'imperial' })} />
      </View>

      {section('settings.kicksSection')}
      <Stepper
        label={t('settings.kickTarget')}
        value={t('settings.kickTargetValue', { n: settings.kickTarget })}
        minusLabel={t('settings.kickTargetLess')}
        plusLabel={t('settings.kickTargetMore')}
        minusDisabled={settings.kickTarget <= KICK_TARGET_LIMITS.min}
        plusDisabled={settings.kickTarget >= KICK_TARGET_LIMITS.max}
        onMinus={() => update({ kickTarget: clampTarget(settings.kickTarget - 1) })}
        onPlus={() => update({ kickTarget: clampTarget(settings.kickTarget + 1) })}
      />
      <BigButton variant="secondary" label={t('settings.kickReminder')} accessibilityHint={reminderState} onPress={() => setSheet(true)} />
      <AppText style={[type.body, { color: colors.textMuted }]}>{reminderState}</AppText>
      <SwitchRow label={t('settings.weekly')} hint={t('settings.weeklyHint')} value={settings.weeklyCardNotif} onChange={(on) => void setWeeklyCards(on)} />

      <KickReminderSheet visible={sheet} onClose={() => setSheet(false)} />
    </Screen>
  );
}
