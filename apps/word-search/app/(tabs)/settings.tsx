import { View } from 'react-native';
import Constants from 'expo-constants';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
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

      {section('settings.about')}
      <View style={{ minHeight: 64, justifyContent: 'center' }}>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('settings.version', { version: Constants.expoConfig?.version ?? '' })}</AppText>
      </View>

      {section('settings.reset')}
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('settings.resetHint')}</AppText>
      <BigButton variant="secondary" label={t('settings.resetButton')} onPress={() => confirmReset()} />
    </Screen>
  );
}
