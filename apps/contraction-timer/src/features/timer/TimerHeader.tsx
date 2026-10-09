import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useSettings } from '@/store/settings';
import { toggleNight, useIsNight } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { IconButton } from '@/ui/IconButton';

/** Plan §5.1: night-mode toggle, partner toggle, history icon. Three buttons, no menu. */
export function TimerHeader() {
  const { colors, type, spacing } = useTheme();
  const night = useIsNight();
  const partner = useSettings((s) => s.settings.partnerMode);
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
