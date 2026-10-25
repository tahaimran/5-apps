import { StyleSheet, View } from 'react-native';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleDashed from 'lucide-react-native/icons/circle-dashed';
import CircleDot from 'lucide-react-native/icons/circle-dot';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { DayStatus as Status } from '@/domain/daily';
import { AppText } from './AppText';

const ICONS = { notStarted: CircleDashed, inProgress: CircleDot, done: CircleCheck } as const;

/**
 * Today's puzzle status as a quiet line (an icon and a word), not a pill that looks like a button.
 * The icon shape differs per state, so it never rests on color alone.
 */
export function DayStatus({ status }: { status: Status }) {
  const { colors, spacing, type } = useTheme();
  const Icon = ICONS[status];
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Icon size={22} color={status === 'done' ? colors.success : colors.primary} strokeWidth={2.5} />
      <AppText accessibilityLiveRegion="polite" style={[type.body, styles.flex, { color: colors.text, fontWeight: '700' }]}>
        {t(`daily.status.${status}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flexShrink: 1 },
});
