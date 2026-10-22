import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import ArchiveIcon from 'lucide-react-native/icons/archive';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useHabits } from '@/store/habits';
import { Screen } from '@/ui/Screen';
import { TextButton } from '@/ui/controls';
import { HabitIcon } from '@/ui/icons';

export default function Archive() {
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
  const habits = useHabits((s) => s.habits);
  const { unarchiveHabit, deleteHabit } = useHabits.getState();
  const archived = Object.values(habits).filter((h) => h.archivedAt);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('archive.title'), headerShown: true }} />
      {archived.length === 0 && (
        <View style={[styles.empty, { gap: spacing.md }]}>
          <View style={[styles.emptyArt, { backgroundColor: colors.surfaceAlt }]}>
            <ArchiveIcon size={30} color={colors.textMuted} strokeWidth={2} />
          </View>
          <Text style={[type.bodyLarge, { color: colors.textMuted, textAlign: 'center' }]}>{t('archive.empty')}</Text>
        </View>
      )}
      {archived.map((h) => (
        <View key={h.id} style={[styles.row, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md }, shadow(1)]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={h.name}
            onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
            style={[styles.main, { minHeight: touchTarget }]}
          >
            <View style={[styles.tile, { backgroundColor: h.color + '1F', borderRadius: radius.md }]}>
              <HabitIcon name={h.icon} size={22} color={h.color} />
            </View>
            <Text style={[type.bodyLarge, { color: colors.text, flex: 1 }]} numberOfLines={2}>{h.name}</Text>
          </Pressable>
          <TextButton label={t('detail.unarchive')} onPress={() => unarchiveHabit(h.id)} />
          <TextButton
            label={t('detail.delete')}
            danger
            onPress={() =>
              Alert.alert(t('detail.deleteTitle'), t('detail.deleteBody', { name: h.name }), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('common.delete'), style: 'destructive', onPress: () => deleteHabit(h.id) },
              ])
            }
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12, flexBasis: '100%' },
  tile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 48 },
  emptyArt: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
