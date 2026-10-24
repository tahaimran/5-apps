import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Moon from 'lucide-react-native/icons/moon';
import RotateCcwClock from 'lucide-react-native/icons/rotate-ccw-clock';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, IconButton } from '@shared/ui';
import { useSettings } from '@/store/settings';
import { toggleNight, useIsNight } from '@/theme/mode';
import { AppText } from '@/ui/AppText';

/**
 * Plan §5.1: night-mode toggle, partner toggle, history. Three round buttons, no menu; the two toggles
 * are drawn solid and announced as selected while on. `hideTools` is Partner mode while a contraction
 * runs: the buttons give way to one "Exit partner mode" pill, so a thumb cannot land on the wrong thing
 * (plan §4: the tab bar is hidden then too).
 */
export function TimerHeader({ hideTools }: { hideTools?: boolean }) {
  const { colors, type, spacing } = useTheme();
  const night = useIsNight();
  const partner = useSettings((s) => s.settings.partnerMode);
  if (hideTools) {
    return (
      <View style={styles.end}>
        <Button variant="secondary" block={false} icon={X} label={t('timer.exitPartner')} onPress={() => useSettings.getState().update({ partnerMode: false })} />
      </View>
    );
  }
  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      <AppText accessibilityRole="header" style={[type.headline, styles.flex, { color: colors.text, fontWeight: '800' }]}>
        {t('timer.title')}
      </AppText>
      <IconButton icon={Moon} variant="tonal" selected={night} label={t(night ? 'timer.nightModeOn' : 'timer.nightMode')} onPress={() => toggleNight()} />
      <IconButton
        icon={Users}
        variant="tonal"
        selected={partner}
        label={t('timer.partnerMode')}
        onPress={() => useSettings.getState().update({ partnerMode: !useSettings.getState().settings.partnerMode })}
      />
      <IconButton icon={RotateCcwClock} variant="tonal" label={t('timer.history')} onPress={() => router.push('/timer/history')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, flexBasis: 120 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  end: { alignItems: 'flex-end' },
});
