import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useHabits } from '@/store/habits';
import { Screen } from '@/ui/Screen';
import { TextButton } from '@/ui/controls';

export default function Archive() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const habits = useHabits((s) => s.habits);
  const { unarchiveHabit, deleteHabit } = useHabits.getState();
  const archived = Object.values(habits).filter((h) => h.archivedAt);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('archive.title'), headerShown: true }} />
      {archived.length === 0 && <Text style={[type.body, { color: colors.textMuted }]}>{t('archive.empty')}</Text>}
      {archived.map((h) => (
        <View key={h.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={h.name}
            onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.id } })}
            style={[styles.main, { minHeight: touchTarget }]}
          >
            <View style={[styles.tile, { backgroundColor: h.color + '26', borderRadius: radius.md }]}>
              <MaterialCommunityIcons name={h.icon as never} size={24} color={h.color} />
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth, flexWrap: 'wrap' },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12, flexBasis: '100%' },
  tile: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
