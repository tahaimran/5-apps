import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Archive from 'lucide-react-native/icons/archive';
import BellRing from 'lucide-react-native/icons/bell-ring';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import DatabaseBackup from 'lucide-react-native/icons/database-backup';
import FileText from 'lucide-react-native/icons/file-text';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import Moon from 'lucide-react-native/icons/moon';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Star from 'lucide-react-native/icons/star';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import { requestPinWidget } from 'react-native-android-widget';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { promoPackages } from '@shared/crosspromo/catalog';
import { t } from '@shared/i18n';
import { ensureNotificationPermission, getNotificationPermission, type PermissionState } from '@shared/notify';
import { playSound } from '@shared/sound';
import { useTheme, type ThemePreference } from '@shared/theme';
import { Button, Card, type IconComponent } from '@shared/ui';
import { useSettings } from '@/store/settings';
import { Screen } from '@/ui/Screen';
import { useFreezeReward } from '@/features/freeze/useFreezeReward';
import { invalidateNotificationPlan, rescheduleNotifications } from '@/notifications/scheduler';
import { extraColorsFor } from '@/theme/tokens';
import { WIDGET_NAME } from '@/widget/render';
import { Field, Segmented, Stepper, Toggle } from '@/ui/controls';
import { TimeField } from '@/ui/TimePicker';
import { useTimeFormat } from '@/store/timeFormat';

type Choice = 'system' | 'light' | 'dark';

export default function Settings() {
  const { colors, spacing, radius, type, touchTarget, preference, setPreference, mode } = useTheme();
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [privacyRequired, setPrivacyRequired] = useState(false);
  const freeze = useFreezeReward();
  const clock = useTimeFormat();
  const frozen = extraColorsFor(mode).frozen;

  useEffect(() => {
    isPrivacyOptionsRequired().then(setPrivacyRequired).catch(() => setPrivacyRequired(false));
  }, []);

  const rate = () => {
    const id = promoPackages['habit-tracker'];
    Linking.openURL(`market://details?id=${id}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`));
  };
  // Literal env reference so Expo inlines it at build time.
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

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

  const tile = (Icon: IconComponent, tint: string) => (
    <View style={[styles.tile, { backgroundColor: tint + '22', borderRadius: radius.sm + 2 }]}>
      <Icon size={18} color={tint} strokeWidth={2.25} />
    </View>
  );

  const section = (title: string, children: ReactNode) => (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityRole="header" style={[type.body, { color: colors.textMuted, fontWeight: '700', marginLeft: spacing.xs }]}>
        {title}
      </Text>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  );

  const divider = <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: 64 }]} />;

  const link = (Icon: IconComponent, tint: string, label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      android_ripple={{ color: colors.surfaceAlt }}
      style={({ pressed }) => [styles.row, { minHeight: touchTarget + 12, paddingHorizontal: spacing.lg, gap: spacing.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      {tile(Icon, tint)}
      <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]}>{label}</Text>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );

  const toggle = (Icon: IconComponent, tint: string, label: string, value: boolean, onChange: (v: boolean) => void, hint?: string) => (
    <View style={[styles.row, { minHeight: touchTarget + 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}>
      {tile(Icon, tint)}
      <View style={styles.flex}>
        <Text style={[type.bodyLarge, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[type.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      <Toggle label={label} value={value} onValueChange={onChange} />
    </View>
  );

  const padded = (children: ReactNode) => <View style={{ padding: spacing.lg, gap: spacing.lg }}>{children}</View>;

  return (
    <Screen>
      <Text accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '800' }]}>{t('settings.title')}</Text>

      {section(
        t('settings.sections.appearance'),
        padded(
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
          </Field>,
        ),
      )}

      {section(
        t('settings.timeFormat'),
        padded(
          // Starts on the phone's own clock style; picking one pins it for every time in the app.
          <Segmented<'12h' | '24h'>
            value={clock.format}
            onChange={(timeFormat) => update({ timeFormat })}
            options={[
              { value: '12h', label: t('settings.time12') },
              { value: '24h', label: t('settings.time24') },
            ]}
          />,
        ),
      )}

      {section(
        t('settings.sections.week'),
        padded(
          <>
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
            <Field label={t('settings.dayEndsAt')} hint={t('settings.dayEndsHint')}>
              <Stepper
                value={settings.dayEndsAtHour}
                min={0}
                max={4}
                label={t('settings.dayEndsAt')}
                format={clock.hour}
                onChange={(h) => update({ dayEndsAtHour: h as 0 | 1 | 2 | 3 | 4 })}
                decreaseLabel={t('editor.earlier')}
                increaseLabel={t('editor.later')}
              />
            </Field>
          </>,
        ),
      )}

      {section(
        t('settings.reminders'),
        permission && !permission.granted ? (
          padded(
            <>
              <View style={[styles.row, { gap: spacing.md }]}>
                {tile(BellRing, colors.primary)}
                <Text style={[type.body, { color: colors.textMuted, flex: 1 }]}>
                  {permission.canAskAgain ? t('notify.reason') : t('settings.remindersOff')}
                </Text>
              </View>
              <Button
                label={permission.canAskAgain ? t('settings.enableReminders') : t('settings.openSystemSettings')}
                icon={BellRing}
                onPress={permission.canAskAgain ? allowReminders : () => void Linking.openSettings()}
              />
            </>,
          )
        ) : (
          <>
            {toggle(BellRing, colors.primary, t('settings.dailySummary'), settings.dailySummary.enabled, (enabled) =>
              update({ dailySummary: { ...settings.dailySummary, enabled } }),
            )}
            {settings.dailySummary.enabled && (
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingLeft: 64 }}>
                <TimeField value={settings.dailySummary.time} label={t('settings.dailySummary')} onChange={(time) => update({ dailySummary: { ...settings.dailySummary, time } })} />
              </View>
            )}
            {divider}
            {toggle(Moon, colors.accent, t('settings.eveningNudge'), settings.eveningNudge.enabled, (enabled) =>
              update({ eveningNudge: { ...settings.eveningNudge, enabled } }),
            )}
            {settings.eveningNudge.enabled && (
              <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingLeft: 64 }}>
                <TimeField value={settings.eveningNudge.time} label={t('settings.eveningNudge')} onChange={(time) => update({ eveningNudge: { ...settings.eveningNudge, time } })} />
              </View>
            )}
          </>
        ),
      )}

      {section(
        t('settings.sections.feel'),
        <>
          {toggle(Volume2, colors.primary, t('settings.sounds'), settings.sounds, (sounds) => {
            update({ sounds });
            if (sounds) playSound('check'); // a preview, so the switch shows what it does
          }, t('settings.soundsHint'))}
          {divider}
          {toggle(Vibrate, colors.success, t('settings.haptics'), settings.haptics, (haptics) => update({ haptics }), t('settings.hapticsHint'))}
        </>,
      )}

      {section(
        t('settings.freezes'),
        padded(
          <>
            <View style={[styles.row, { gap: spacing.md }]}>
              <View style={styles.freezeSlots} accessible accessibilityLabel={t('freeze.count', { count: freeze.count })}>
                {[0, 1].map((i) => (
                  <View key={i} style={[styles.slot, { borderRadius: radius.md, backgroundColor: i < freeze.count ? frozen + '33' : colors.surfaceAlt }]}>
                    <Snowflake size={22} color={i < freeze.count ? colors.text : colors.textMuted} strokeWidth={2} />
                  </View>
                ))}
              </View>
              <View style={styles.flex}>
                <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('freeze.count', { count: freeze.count })}</Text>
                <Text style={[type.caption, { color: colors.textMuted }]}>{t('freeze.body')}</Text>
              </View>
            </View>
            <Button label={t('freeze.watch')} variant="secondary" onPress={freeze.earn} disabled={!freeze.can} loading={freeze.busy} />
            {freeze.blockedReason && (
              <Text style={[type.caption, { color: colors.textMuted }]}>{t(freeze.blockedReason === 'full' ? 'freeze.full' : 'freeze.limit')}</Text>
            )}
          </>,
        ),
      )}

      {section(
        t('settings.sections.more'),
        <>
          {link(LayoutGrid, colors.primary, t('settings.addWidget'), addWidget)}
          {divider}
          {link(Archive, colors.textMuted, t('settings.archive'), () => router.push('/archive'))}
          {divider}
          {link(DatabaseBackup, colors.success, t('settings.backup'), () => router.push('/backup'))}
          {privacyRequired && (
            <>
              {divider}
              {link(ShieldCheck, colors.primary, t('settings.privacy'), () => void openPrivacyOptions().catch(() => undefined))}
            </>
          )}
          {divider}
          {link(Star, colors.accent, t('settings.rate'), rate)}
          {privacyPolicyUrl ? (
            <>
              {divider}
              {link(FileText, colors.textMuted, t('settings.privacyPolicy'), () => void Linking.openURL(privacyPolicyUrl))}
            </>
          ) : null}
        </>,
      )}

      <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>
        {t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tile: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth },
  freezeSlots: { flexDirection: 'row', gap: 6 },
  slot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
