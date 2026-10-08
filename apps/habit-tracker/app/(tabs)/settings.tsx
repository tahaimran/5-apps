import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestPinWidget } from 'react-native-android-widget';
import { t } from '@shared/i18n';
import { ensureNotificationPermission, getNotificationPermission, type PermissionState } from '@shared/notify';
import { useTheme, type ThemePreference } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { Screen } from '@/ui/Screen';
import { invalidateNotificationPlan, rescheduleNotifications } from '@/notifications/scheduler';
import { WIDGET_NAME } from '@/widget/render';
import { Field, PrimaryButton, Segmented, Stepper, TimeStepper } from '@/ui/controls';

type Choice = 'system' | 'light' | 'dark';

export default function Settings() {
  const { colors, spacing, radius, type, touchTarget, preference, setPreference } = useTheme();
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState<PermissionState | null>(null);

  const refreshPermission = useCallback(() => {
    getNotificationPermission().then(setPermission).catch(() => undefined);
  }, []);
  useEffect(() => {
    refreshPermission();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refreshPermission());
    return () => sub.remove();
  }, [refreshPermission]);

  const allowReminders = async () => {
    await ensureNotificationPermission({ title: t('notify.reasonTitle'), message: t('notify.reason') });
    invalidateNotificationPlan();
    refreshPermission();
    void rescheduleNotifications();
  };

  const addWidget = async () => {
    const supported = await requestPinWidget({ widgetName: WIDGET_NAME }).catch(() => false);
    if (!supported) Alert.alert(t('settings.addWidget'), `${t('settings.widgetUnsupported')} ${t('settings.widgetHow')}`);
  };

  const row = (icon: string, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, { minHeight: touchTarget + 8, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, gap: spacing.md }]}
    >
      <MaterialCommunityIcons name={icon as never} size={24} color={colors.textMuted} />
      <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text }]}>{t('settings.title')}</Text>

      <Field label={t('settings.theme')}>
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

      <Field label={t('settings.weekStartsOn')}>
        <Segmented<'1' | '0'>
          value={String(settings.weekStartsOn) as '1' | '0'}
          onChange={(v) => update({ weekStartsOn: Number(v) as 0 | 1 })}
          options={[
            { value: '1', label: t('settings.monday') },
            { value: '0', label: t('settings.sunday') },
          ]}
        />
      </Field>

      <Field label={t('settings.dayEndsAt')}>
        <Stepper
          value={settings.dayEndsAtHour}
          min={0}
          max={4}
          label={t('settings.dayEndsAt')}
          format={(h) => t('settings.hour', { hour: String(h).padStart(2, '0') })}
          onChange={(h) => update({ dayEndsAtHour: h as 0 | 1 | 2 | 3 | 4 })}
          decreaseLabel={t('editor.earlier')}
          increaseLabel={t('editor.later')}
        />
        <Text style={[type.caption, { color: colors.textMuted }]}>{t('settings.dayEndsHint')}</Text>
      </Field>

      <Field label={t('settings.reminders')}>
        {permission && !permission.granted ? (
          <View style={{ gap: spacing.sm }}>
            {!permission.canAskAgain && <Text style={[type.body, { color: colors.textMuted }]}>{t('settings.remindersOff')}</Text>}
            <PrimaryButton
              label={permission.canAskAgain ? t('settings.enableReminders') : t('settings.openSystemSettings')}
              onPress={permission.canAskAgain ? allowReminders : () => void Linking.openSettings()}
            />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={[styles.row, { minHeight: touchTarget }]}>
              <Text style={[type.body, { color: colors.text, flex: 1 }]}>{t('settings.dailySummary')}</Text>
              <Switch
                accessibilityLabel={t('settings.dailySummary')}
                value={settings.dailySummary.enabled}
                onValueChange={(enabled) => update({ dailySummary: { ...settings.dailySummary, enabled } })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            {settings.dailySummary.enabled && (
              <TimeStepper value={settings.dailySummary.time} label={t('settings.dailySummary')} onChange={(time) => update({ dailySummary: { ...settings.dailySummary, time } })} />
            )}
            <View style={[styles.row, { minHeight: touchTarget }]}>
              <Text style={[type.body, { color: colors.text, flex: 1 }]}>{t('settings.eveningNudge')}</Text>
              <Switch
                accessibilityLabel={t('settings.eveningNudge')}
                value={settings.eveningNudge.enabled}
                onValueChange={(enabled) => update({ eveningNudge: { ...settings.eveningNudge, enabled } })}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
            {settings.eveningNudge.enabled && (
              <TimeStepper value={settings.eveningNudge.time} label={t('settings.eveningNudge')} onChange={(time) => update({ eveningNudge: { ...settings.eveningNudge, time } })} />
            )}
          </View>
        )}
      </Field>

      <View style={[styles.row, { minHeight: touchTarget + 8 }]}>
        <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{t('settings.haptics')}</Text>
        <Switch
          accessibilityLabel={t('settings.haptics')}
          value={settings.haptics}
          onValueChange={(haptics) => update({ haptics })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>

      {row('widgets-outline', t('settings.addWidget'), addWidget)}
      {row('archive-outline', t('settings.archive'), () => router.push('/archive'))}

      <Text style={[type.body, { color: colors.textMuted }]}>
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
