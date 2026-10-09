import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { toggleNight, useIsNight } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';

/** Plan §5.1: night-mode toggle, partner toggle, history icon. Three buttons, no menu. */
/**
 * `hideTools` is Partner mode while a contraction runs: the three buttons give way to one "Exit partner mode" chip, so a
 * thumb cannot land on the wrong thing (plan §4: the tab bar is hidden then too).
 */
export function TimerHeader({ hideTools }: { hideTools?: boolean }) {
  const { colors, type, spacing } = useTheme();
  const night = useIsNight();
  const partner = useSettings((s) => s.settings.partnerMode);
  if (hideTools) {
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('timer.exitPartner')}
          onPress={() => useSettings.getState().update({ partnerMode: false })}
          style={{ minHeight: 56, paddingHorizontal: spacing.lg, borderRadius: 999, borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('timer.exitPartner')}</AppText>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <AppText accessibilityRole="header" style={[type.headline, { color: colors.text, fontWeight: '700', flex: 1 }]}>
        {t('timer.title')}
      </AppText>
      <IconButton icon="weather-night" label={t(night ? 'timer.nightModeOn' : 'timer.nightMode')} selected={night} onPress={() => toggleNight()} />
      <IconButton
        icon="account-multiple"
        label={t('timer.partnerMode')}
        selected={partner}
        onPress={() => useSettings.getState().update({ partnerMode: !useSettings.getState().settings.partnerMode })}
      />
      <IconButton icon="history" label={t('timer.history')} onPress={() => router.push('/timer/history')} />
    </View>
  );
}
