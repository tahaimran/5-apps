import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { SessionCard } from '@/features/history/SessionCard';
import { useSessions } from '@/store/sessions';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { ScreenHeader } from '@/ui/ScreenHeader';

/** Plan §5.2: every session on this phone, newest first; the one being timed (if any) is on top. */
export default function History() {
  const { colors, spacing, radius, type } = useTheme();
  useAdScreen('timerHistory');
  const active = useSessions((s) => s.active);
  const index = useSessions((s) => s.index);
  const archived = useSessions((s) => s.archived);
  const items = [...(active ? [{ s: active, open: true }] : []), ...index.filter((id) => archived[id]).map((id) => ({ s: archived[id], open: false }))];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.s.id}
        contentContainerStyle={{ padding: spacing.xl - 4, gap: spacing.md, flexGrow: 1 }}
        ListHeaderComponent={<ScreenHeader title={t('history.title')} />}
        ListEmptyComponent={
          <View style={{ padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('history.empty')}</AppText>
          </View>
        }
        renderItem={({ item }) => <SessionCard session={item.s} active={item.open} onPress={() => router.push({ pathname: '/timer/session/[id]', params: { id: item.s.id } })} />}
      />
      <BannerSlot placement="history_banner" />
    </SafeAreaView>
  );
}
