import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';

/** Step 5 of onboarding: points at the first habit until it is checked off or dismissed. */
export function CoachMark({ onDismiss }: { onDismiss: () => void }) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}
    >
      <MaterialCommunityIcons name="gesture-tap" size={24} color={colors.onPrimary} />
      <Text style={[type.body, { color: colors.onPrimary, flex: 1, fontWeight: '600' }]}>{t('coach.checkIt')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('coach.gotIt')}
        onPress={onDismiss}
        style={{ minHeight: touchTarget, minWidth: touchTarget, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={[type.body, { color: colors.onPrimary, fontWeight: '700' }]}>{t('coach.gotIt')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center' },
});
