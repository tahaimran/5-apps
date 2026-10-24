import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import Bell from 'lucide-react-native/icons/bell';
import Bug from 'lucide-react-native/icons/bug';
import Clock from 'lucide-react-native/icons/clock';
import Coffee from 'lucide-react-native/icons/coffee';
import FileText from 'lucide-react-native/icons/file-text';
import Info from 'lucide-react-native/icons/info';
import Mail from 'lucide-react-native/icons/mail';
import Settings2 from 'lucide-react-native/icons/settings-2';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Star from 'lucide-react-native/icons/star';
import Trash from 'lucide-react-native/icons/trash';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import { Button, Segmented } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { contentVersion } from '@/content/bank';
import type { TextScale, TimeFormatChoice } from '@/domain/types';
import { confirmReset } from '@/features/settings/reset';
import { changeReminderTime, disableReminder, enableReminder, type EnableResult } from '@/notifications/reminder';
import { useSettings } from '@/store/settings';
import { extraColorsFor, TEXT_SCALES } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';
import { ControlRow, IconCircle, NavRow, RowBlock, SettingsGroup, SwitchRow } from '@/ui/SettingsRow';

const SIZE_KEY: Record<TextScale, string> = { 0.9: 'small', 1: 'medium', 1.15: 'large', 1.3: 'xlarge' };
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];
type Clock = 'phone' | TimeFormatChoice;

/** Plan F11 and §5: sound, haptics, text size, theme, clock, relaxed mode, reminder, privacy, about, reset. */
export default function Settings() {
  const { colors, spacing, preference, setPreference, mode } = useTheme();
  const x = extraColorsFor(mode);
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
  const label = (key: string) => (
    <AppText variant="body" style={styles.label}>
      {t(key)}
    </AppText>
  );

  return (
    <Screen title={t('settings.title')} footer={<BannerSlot placement="menu" />}>
      <SettingsGroup title={t('settings.soundSection')}>
        <SwitchRow icon={Volume2} label={t('settings.sound')} value={settings.sound} onChange={(sound) => update({ sound })} />
        <SwitchRow icon={Vibrate} label={t('settings.haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.displaySection')}>
        <RowBlock>
          {label('settings.textSize')}
          <Segmented
            options={TEXT_SCALES.map((scale) => ({ value: String(scale), label: t(`settings.sizeShort.${SIZE_KEY[scale]}`), accessibilityLabel: t(`settings.size.${SIZE_KEY[scale]}`) }))}
            value={String(settings.textScale)}
            onChange={(v) => update({ textScale: Number(v) as TextScale })}
          />
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('settings.sizeNote')}
          </AppText>
        </RowBlock>
        <RowBlock>
          {label('settings.theme')}
          <Segmented
            options={THEMES.map((choice) => ({ value: choice, label: t(`settings.themes.${choice}`) }))}
            value={preference === 'high-contrast' ? 'system' : preference}
            onChange={(choice) => {
              setPreference(choice);
              update({ theme: choice as 'system' | 'light' | 'dark' });
            }}
          />
        </RowBlock>
        <RowBlock>
          {label('settings.clock')}
          <Segmented<Clock>
            options={[
              { value: 'phone', label: t('settings.clockPhone') },
              { value: '12h', label: t('settings.clock12') },
              { value: '24h', label: t('settings.clock24') },
            ]}
            value={settings.timeFormat ?? 'phone'}
            onChange={(v) => update({ timeFormat: v === 'phone' ? undefined : v })}
          />
        </RowBlock>
      </SettingsGroup>

      <SettingsGroup title={t('settings.playSection')}>
        <SwitchRow icon={Coffee} tint={colors.accent} bg={x.goldSoft} label={t('settings.relaxed')} hint={t('settings.relaxedHint')} value={settings.relaxedMode} onChange={(relaxedMode) => update({ relaxedMode })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.reminderSection')}>
        <SwitchRow
          icon={Bell}
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
          <ControlRow icon={Clock} label={t('settings.reminderTimeLabel')}>
            <TimeField
              label={t('settings.reminderTimeLabel')}
              value={toHHMM(reminder.hour, reminder.minute)}
              onChange={(hhmm) => {
                const { hour, minute } = fromHHMM(hhmm);
                void changeReminderTime(hour, minute);
              }}
            />
          </ControlRow>
        )}
      </SettingsGroup>
      {reminderResult && (
        <View style={{ gap: spacing.sm }}>
          <AppText accessibilityLiveRegion="polite" variant="body" style={styles.label}>
            {t(reminderResult === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}
          </AppText>
          {reminderResult === 'blocked' && <Button variant="secondary" block icon={Settings2} label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} />}
        </View>
      )}

      <SettingsGroup title={t('settings.privacy')}>
        <NavRow icon={ShieldCheck} tint={colors.success} bg={x.successSoft} label={t('settings.privacyInfo')} onPress={() => router.push('/privacy')} />
        {privacyRequired && <NavRow icon={Settings2} label={t('settings.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
        {policyUrl ? <NavRow icon={FileText} label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(policyUrl)} /> : null}
      </SettingsGroup>
      <AppText variant="caption" style={{ color: colors.textMuted, marginHorizontal: spacing.xs, marginTop: -spacing.xs }}>
        {t('settings.privacyNote')}
      </AppText>

      <SettingsGroup title={t('settings.about')}>
        <View accessible accessibilityLabel={`${t('settings.version', { version })}. ${t('settings.bank', { version: contentVersion() })}`} style={[styles.about, { padding: spacing.lg, gap: spacing.md }]}>
          <IconCircle icon={Info} />
          <View style={styles.flex}>
            <AppText variant="body" style={styles.label}>
              {t('settings.version', { version })}
            </AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>
              {t('settings.bank', { version: contentVersion() })}
            </AppText>
          </View>
        </View>
        {packageId ? (
          <NavRow
            icon={Star}
            tint={colors.accent}
            bg={x.goldSoft}
            label={t('settings.rate')}
            onPress={() => void Linking.openURL(`market://details?id=${packageId}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`))}
          />
        ) : null}
        {contactEmail ? (
          <NavRow
            icon={Mail}
            label={t('settings.feedback')}
            onPress={() =>
              void Linking.openURL(
                `mailto:${contactEmail}?subject=${encodeURIComponent(t('settings.feedbackSubject'))}&body=${encodeURIComponent(t('settings.feedbackBody', { version, android: String(Platform.Version) }))}`,
              )
            }
          />
        ) : null}
        {__DEV__ ? <NavRow icon={Bug} label={t('settings.adDebug')} onPress={() => router.push('/debug-ads')} /> : null}
      </SettingsGroup>

      <SettingsGroup title={t('settings.reset')}>
        <NavRow icon={Trash} tint={colors.danger} bg={x.dangerSoft} label={t('settings.resetButton')} onPress={() => confirmReset()} />
      </SettingsGroup>
      <AppText variant="caption" style={{ color: colors.textMuted, marginHorizontal: spacing.xs, marginTop: -spacing.xs }}>
        {t('settings.resetHint')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontWeight: '600' },
  about: { flexDirection: 'row', alignItems: 'center' },
});
