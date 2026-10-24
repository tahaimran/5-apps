import { Linking, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Constants from 'expo-constants';
import BatteryCharging from 'lucide-react-native/icons/battery-charging';
import Bell from 'lucide-react-native/icons/bell';
import Coffee from 'lucide-react-native/icons/coffee';
import FileText from 'lucide-react-native/icons/file-text';
import GlassWater from 'lucide-react-native/icons/glass-water';
import Moon from 'lucide-react-native/icons/moon';
import Save from 'lucide-react-native/icons/save';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import Star from 'lucide-react-native/icons/star';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Target from 'lucide-react-native/icons/target';
import Type from 'lucide-react-native/icons/type';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import { promoPackages } from '@shared/crosspromo/catalog';
import { t } from '@shared/i18n';
import { useTheme, type ThemePreference } from '@shared/theme';
import { useTimeFormat } from '@shared/time';
import { formatClock } from '@/domain/dayKey';
import { reminderCount } from '@/domain/schedule';
import { preferredCup, useSettings } from '@/store/settings';
import { extraColorsFor } from '@/theme/tokens';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { ControlRow, NavRow, RowBlock, SettingsGroup, StatTile, SwitchRow } from '@/ui/SettingsRow';
import { MinuteField, Segmented } from '@/ui/controls';

type Choice = 'system' | 'light' | 'dark';
type Clock = 'system' | '12h' | '24h';

export default function Settings() {
  const { colors, spacing, type, mode, preference, setPreference } = useTheme();
  const clock = useTimeFormat();
  const { goal, reminders, cups, prefs, setGoal, setReminders, setPrefs } = useSettings();
  const unit = goal.unit;
  const extra = extraColorsFor(mode);

  const rate = () => {
    const id = promoPackages['water-reminder'];
    Linking.openURL(`market://details?id=${id}`).catch(() => Linking.openURL(`https://play.google.com/store/apps/details?id=${id}`));
  };
  // Literal env reference so Expo inlines it at build time.
  const privacyPolicyUrl = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;

  const perDay = reminderCount(reminders, goal.goalMl, preferredCup({ cups, prefs }).ml);
  const leaf = { tint: colors.success, bg: extra.leafSoft };
  const sun = { tint: colors.accent, bg: extra.sunSoft };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('settings.title'), headerShown: true }} />

      <View style={[styles.tiles, { gap: spacing.md }]}>
        <StatTile icon={Target} label={t('settings.goal')} value={volume(goal.goalMl, unit)} onPress={() => router.push('/settings/goal')} />
        <StatTile
          icon={Bell}
          label={t('settings.reminders')}
          value={reminders.enabled ? t('settings.remindersOn', { count: perDay }) : t('common.off')}
          onPress={() => router.push('/settings/reminders')}
        />
      </View>

      <SettingsGroup title={t('settings.yourDay')}>
        <ControlRow label={t('settings.wake')} icon={Sunrise} {...sun}>
          <MinuteField label={t('settings.wake')} value={reminders.wakeMin} onChange={(wakeMin) => setReminders({ wakeMin })} />
        </ControlRow>
        <ControlRow label={t('settings.bed')} icon={Moon}>
          <MinuteField label={t('settings.bed')} value={reminders.bedMin} onChange={(bedMin) => setReminders({ bedMin })} />
        </ControlRow>
        <RowBlock>
          <Text style={[type.caption, { color: colors.textMuted }]}>{t('settings.scheduleHint', { wake: clock.time(formatClock(reminders.wakeMin)) })}</Text>
        </RowBlock>
      </SettingsGroup>

      <SettingsGroup title={t('settings.drinks')}>
        <NavRow icon={GlassWater} label={t('settings.cups')} value={volume(preferredCup({ cups, prefs }).ml, unit)} onPress={() => router.push('/settings/cups')} />
        <NavRow icon={Coffee} label={t('settings.beverages')} onPress={() => router.push('/settings/beverages')} />
        <RowBlock>
          <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>{t('settings.units')}</Text>
          <Segmented<'ml' | 'floz'>
            value={unit}
            onChange={(u) => setGoal({ unit: u })}
            options={[
              { value: 'ml', label: t('units.ml') },
              { value: 'floz', label: t('units.floz') },
            ]}
          />
        </RowBlock>
      </SettingsGroup>

      <SettingsGroup title={t('settings.appearance')}>
        <RowBlock>
          <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>{t('settings.theme')}</Text>
          <Segmented<Choice>
            value={preference === 'light' || preference === 'dark' ? preference : 'system'}
            onChange={(v) => setPreference(v as ThemePreference)}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </RowBlock>
        <RowBlock>
          <Text style={[type.body, { color: colors.text, fontWeight: '600' }]}>{t('settings.timeFormat')}</Text>
          <Segmented<Clock>
            value={prefs.timeFormat ?? 'system'}
            onChange={(v) => setPrefs({ timeFormat: v === 'system' ? undefined : v })}
            options={[
              { value: 'system', label: t('settings.timeSystem') },
              { value: '12h', label: t('settings.time12') },
              { value: '24h', label: t('settings.time24') },
            ]}
          />
        </RowBlock>
        <SwitchRow icon={Type} label={t('settings.largeText')} hint={t('settings.largeTextHint')} value={prefs.largeText} onChange={(largeText) => setPrefs({ largeText })} />
        <SwitchRow icon={Volume2} label={t('settings.sounds')} hint={t('settings.soundsHint')} value={prefs.sounds} onChange={(sounds) => setPrefs({ sounds })} />
        <SwitchRow icon={Vibrate} label={t('settings.haptics')} value={prefs.haptics} onChange={(haptics) => setPrefs({ haptics })} />
      </SettingsGroup>

      <SettingsGroup title={t('settings.help')}>
        <NavRow icon={ShieldCheck} label={t('settings.privacy')} {...leaf} onPress={() => router.push('/settings/privacy')} />
        <NavRow icon={BatteryCharging} label={t('settings.battery')} {...sun} onPress={() => router.push('/settings/battery-guide')} />
        <NavRow icon={Save} label={t('settings.backup')} onPress={() => router.push('/settings/backup')} />
        <NavRow icon={Star} label={t('settings.rate')} {...sun} onPress={rate} />
        {privacyPolicyUrl ? <NavRow icon={FileText} label={t('settings.privacyPolicy')} onPress={() => void Linking.openURL(privacyPolicyUrl)} /> : null}
      </SettingsGroup>

      <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>{t('settings.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ tiles: { flexDirection: 'row' } });
