import { FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RotateCcwClock from 'lucide-react-native/icons/rotate-ccw-clock';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { SessionCard } from '@/features/history/SessionCard';
import { useSessions } from '@/store/sessions';
import { BannerSlot } from '@/ui/BannerSlot';
import { EmptyState } from '@/ui/EmptyState';
import { StackHeader } from '@/ui/Screen';

/** Plan §5.2: every session on this phone, newest first; the one being timed (if any) is on top. */
export default function History() {
  const { colors, spacing } = useTheme();
  useAdScreen('timerHistory');
  const active = useSessions((s) => s.active);
  const index = useSessions((s) => s.index);
  const archived = useSessions((s) => s.archived);
  const items = [...(active ? [{ s: active, open: true }] : []), ...index.filter((id) => archived[id]).map((id) => ({ s: archived[id], open: false }))];
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <StackHeader title={t('history.title')} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.s.id}
        contentContainerStyle={{ padding: spacing.xl - 4, paddingTop: spacing.xs, gap: spacing.md, flexGrow: 1 }}
        ListEmptyComponent={<EmptyState icon={RotateCcwClock} text={t('history.empty')} />}
        renderItem={({ item }) => <SessionCard session={item.s} active={item.open} onPress={() => router.push({ pathname: '/timer/session/[id]', params: { id: item.s.id } })} />}
      />
      <BannerSlot placement="history_banner" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
