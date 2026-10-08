import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from '@/ui/AppText';
import { formatTime } from '@/ui/format';

const wrap = (n: number, size: number) => ((n % size) + size) % size;

/** Picks a time with big plus and minus buttons (hours by 1, minutes by 15): no tiny wheel to hit. */
export function TimeStepper({ hour, minute, onChange }: { hour: number; minute: number; onChange: (hour: number, minute: number) => void }) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
  const button = (label: string, icon: 'plus' | 'minus', onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary }}
    >
      <MaterialCommunityIcons name={icon} size={28} color={colors.primary} />
    </Pressable>
  );
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText accessibilityLiveRegion="polite" style={[type.headline, { color: colors.text, fontWeight: '700', textAlign: 'center' }]}>{formatTime(hour, minute)}</AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {button(t('reminder.hourDown'), 'minus', () => onChange(wrap(hour - 1, 24), minute))}
          {button(t('reminder.hourUp'), 'plus', () => onChange(wrap(hour + 1, 24), minute))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {button(t('reminder.minuteDown'), 'minus', () => onChange(hour, wrap(minute - 15, 60)))}
          {button(t('reminder.minuteUp'), 'plus', () => onChange(hour, wrap(minute + 15, 60)))}
        </View>
      </View>
    </View>
  );
}
