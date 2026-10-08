import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@shared/theme';

/** A bottom message with one action (the 5 second "Undo" after logging a drink). */
export function Snackbar({ message, actionLabel, onAction }: { message: string; actionLabel: string; onAction: () => void }) {
  const { colors, mode, radius, spacing, type, touchTarget } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.bar, { backgroundColor: colors.text, borderRadius: radius.md, paddingLeft: spacing.lg, paddingRight: spacing.sm, minHeight: touchTarget }]}
    >
      <Text style={[type.body, { color: colors.background, flex: 1 }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={{ minHeight: touchTarget, minWidth: touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md }}
      >
        <Text style={[type.body, { color: mode === 'light' ? '#7FD1F7' : '#1572B6', fontWeight: '800' }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ bar: { flexDirection: 'row', alignItems: 'center' } });
