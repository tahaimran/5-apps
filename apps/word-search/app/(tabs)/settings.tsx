import { useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import BellRing from 'lucide-react-native/icons/bell-ring';
import Bug from 'lucide-react-native/icons/bug';
import Clock from 'lucide-react-native/icons/clock';
import Gauge from 'lucide-react-native/icons/gauge';
import Hand from 'lucide-react-native/icons/hand';
import Info from 'lucide-react-native/icons/info';
import Mail from 'lucide-react-native/icons/mail';
import Palette from 'lucide-react-native/icons/palette';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Shield from 'lucide-react-native/icons/shield';
import Star from 'lucide-react-native/icons/star';
import Timer from 'lucide-react-native/icons/timer';
import Type from 'lucide-react-native/icons/type';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import { isPrivacyOptionsRequired, openPrivacyOptions } from '@shared/consent';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { deviceTimeFormat, fromHHMM, TimeField, toHHMM } from '@shared/time';
import { Button } from '@shared/ui';
import { TextSizePicker } from '@/components/TextSizePicker';
import { ThemePicker } from '@/components/ThemePicker';
import { changeReminderTime, disableReminder, enableReminder, type EnableResult } from '@/notifications/reminder';
import { confirmReset } from '@/features/settings/reset';
import type { Difficulty, SelectionMode } from '@/domain/types';
import { useSettings } from '@/store/settings';
import { useAdScreen } from '@/ads/guard';
import { AppText } from '@/ui/AppText';
import { ChoiceGroup } from '@/ui/Choice';
import { OptionCard } from '@/ui/OptionCard';
import { Screen } from '@/ui/Screen';
import { NavRow, RowBlock, SettingsGroup, SwitchRow } from '@/ui/SettingsRow';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const MODES: SelectionMode[] = ['both', 'tapOnly'];
type ClockChoice = 'phone' | '12h' | '24h';

/** Plan §5.6. Every row is at least 64dp and every switch is a labelled toggle. */
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
  const phoneClock = t(deviceTimeFormat() === '24h' ? 'settings.clock24' : 'settings.clock12');
  return (
    <Screen title={t('settings.title')}>
      <SettingsGroup title={t('settings.display')}>
        <RowBlock icon={Type} label={t('menu.textSize')}>
          <TextSizePicker value={settings.textSize} onChange={(textSize) => update({ textSize })} />
        </RowBlock>
        <RowBlock icon={Palette} label={t('settings.colors')}>
          <ThemePicker />
        </RowBlock>
        <RowBlock icon={Hand} label={t('settings.selection')}>
          <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
            {MODES.map((mode) => (
              <OptionCard key={mode} label={t(`settings.mode.${mode}`)} detail={t(`settings.mode.${mode}Detail`)} selected={settings.selectionMode === mode} onPress={() => update({ selectionMode: mode })} />
            ))}
          </View>
        </RowBlock>
      </SettingsGroup>

      <SettingsGroup title={t('settings.touch')}>
        <SwitchRow icon={Volume2} label={t('settings.sounds')} hint={t('settings.soundsHint')} value={settings.sounds} onChange={(sounds) => update({ sounds })} />
        <SwitchRow icon={Vibrate} label={t('settings.haptics')} value={settings.haptics} onChange={(haptics) => update({ haptics })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.reminderSection')}>
        <SwitchRow
          icon={BellRing}
          label={t('settings.reminderSwitch')}
          value={reminder.enabled}
          onChange={(on) => {
            setReminderResult(null);
            if (on) void enableReminder(reminder.hour, reminder.minute).then((r) => setReminderResult(r === 'enabled' ? null : r));
            else void disableReminder();
          }}
        />
        {reminder.enabled && (
          <RowBlock label={t('settings.reminderTime')}>
            <TimeField
              label={t('settings.reminderTime')}
              value={toHHMM(reminder.hour, reminder.minute)}
              onChange={(hhmm) => {
                const { hour, minute } = fromHHMM(hhmm);
                void changeReminderTime(hour, minute);
              }}
            />
          </RowBlock>
        )}
        <RowBlock icon={Clock} label={t('settings.clock')}>
          <ChoiceGroup<ClockChoice>
            options={[
              { value: 'phone', label: t('settings.clockPhone'), accessibilityLabel: t('settings.clockPhoneLabel', { format: phoneClock }) },
              { value: '12h', label: t('settings.clock12') },
              { value: '24h', label: t('settings.clock24') },
            ]}
            value={settings.timeFormat ?? 'phone'}
            onChange={(v) => update({ timeFormat: v === 'phone' ? undefined : v })}
          />
        </RowBlock>
      </SettingsGroup>
      {reminderResult && (
        <AppText accessibilityLiveRegion="polite" style={[type.body, { color: colors.text, fontWeight: '700' }]}>
          {t(reminderResult === 'blocked' ? 'reminder.blocked' : 'reminder.denied')}
        </AppText>
      )}
      {reminderResult === 'blocked' && <Button variant="secondary" label={t('reminder.openSettings')} onPress={() => void Linking.openSettings()} block />}

      <SettingsGroup title={t('settings.game')}>
        <RowBlock icon={Gauge} label={t('settings.difficulty')}>
          <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
            {DIFFICULTIES.map((d) => (
              <OptionCard key={d} label={t(`onboarding.level.${d}`)} detail={t(`onboarding.level.${d}Detail`)} selected={settings.difficulty === d} onPress={() => update({ difficulty: d })} />
            ))}
          </View>
        </RowBlock>
        <SwitchRow icon={Timer} label={t('settings.timer')} hint={t('settings.timerHint')} value={settings.showTimer} onChange={(showTimer) => update({ showTimer })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.privacy')}>
        <NavRow icon={Shield} label={t('settings.privacyInfo')} onPress={() => router.push('/privacy')} />
        {privacyRequired && <NavRow icon={Shield} label={t('settings.privacyChoices')} onPress={() => void openPrivacyOptions().catch(() => undefined)} />}
        {policyUrl ? <NavRow icon={Info} label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(policyUrl)} /> : null}
      </SettingsGroup>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.privacyNote')}</AppText>

      <SettingsGroup title={t('settings.about')}>
        {packageId ? (
          <NavRow
            icon={Star}
            label={t('settings.rate')}
            onPress={() => void Linking.openURL(`market://details?id=${packageId}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${packageId}`))}
          />
        ) : null}
        {contactEmail ? (
          <NavRow
            icon={Mail}
            label={t('settings.feedback')}
            onPress={() => void Linking.openURL(`mailto:${contactEmail}?subject=${encodeURIComponent(t('settings.feedbackSubject'))}&body=${encodeURIComponent(t('settings.feedbackBody', { version, android: String(Platform.Version) }))}`)}
          />
        ) : null}
        {__DEV__ ? <NavRow icon={Bug} label={t('settings.adDebug')} onPress={() => router.push('/debug-ads')} /> : null}
        <NavRow icon={RotateCcw} tone="danger" label={t('settings.resetButton')} accessibilityHint={t('settings.resetHint')} onPress={() => confirmReset()} />
      </SettingsGroup>
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.resetHint')}</AppText>
      <AppText style={[type.body, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg }]}>{t('settings.version', { version })}</AppText>
    </Screen>
  );
}
