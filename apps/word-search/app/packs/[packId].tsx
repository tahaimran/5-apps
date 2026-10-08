import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { startLevel } from '@/features/play/navigation';
import { getPack } from '@/domain/packs';
import type { Difficulty } from '@/domain/types';
import { trackOf, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { StarRow } from '@/ui/StarRow';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Plan §5.2: the levels of one pack at the chosen difficulty; the current one is emphasized, one "Next up" follows it. */
export default function PackScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const pack = getPack(String(packId));
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const difficulty = useSettings((s) => s.settings.difficulty);
  const update = useSettings((s) => s.update);
  const packs = useProgress((s) => s.packs);

  const track = pack ? trackOf(packs, pack.id, difficulty) : null;
  const done = useMemo(() => {
    if (!track) return [];
    return Array.from({ length: track.currentLevel - 1 }, (_, i) => track.currentLevel - 1 - i);
  }, [track]);

  const back = (
    <Pressable accessibilityRole="button" accessibilityLabel={t('game.back')} onPress={() => router.back()} style={{ minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
    </Pressable>
  );

  if (!pack || !track) {
    // Corrupt or missing pack: say so and offer the way out (plan §5.2 empty/error state).
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg }}>
        <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('packs.errorTitle')}</AppText>
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('packs.error')}</AppText>
        <BigButton label={t('packs.backToPacks')} onPress={() => router.replace('/(tabs)')} />
      </SafeAreaView>
    );
  }

  const row = { minHeight: touchTarget + 8, borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.surface, borderColor: colors.border };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingHorizontal: spacing.sm, gap: spacing.sm }]}>
        {back}
        <AppText accessibilityRole="header" numberOfLines={1} style={[type.title, { color: colors.text, fontWeight: '700', flex: 1 }]}>{pack.name}</AppText>
      </View>
      <View style={[styles.segment, { paddingHorizontal: spacing.lg, gap: spacing.sm }]}>
        {DIFFICULTIES.map((d) => {
          const selected = d === difficulty;
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={t(`difficulty.${d}`)}
              accessibilityState={{ selected }}
              onPress={() => update({ difficulty: d })}
              style={{ flex: 1, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, backgroundColor: selected ? colors.primary : 'transparent' }}
            >
              <AppText style={[type.body, { color: selected ? colors.onPrimary : colors.primary, fontWeight: '700' }]}>{t(`difficulty.${d}`)}</AppText>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={done}
        keyExtractor={(level) => String(level)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
            <View style={[styles.row, row, { borderWidth: 3, borderColor: colors.primary }]}>
              <AppText style={[type.title, { color: colors.text, fontWeight: '700', flex: 1 }]}>{t('packs.level', { level: track.currentLevel })}</AppText>
              <BigButton label={t('packs.play')} onPress={() => startLevel(pack.id, difficulty, track.currentLevel)} accessibilityHint={t('packs.playHint', { level: track.currentLevel })} style={{ minWidth: 120 }} />
            </View>
            <View style={[styles.row, row, { opacity: 0.7 }]} accessible accessibilityLabel={t('packs.nextUpLabel', { level: track.currentLevel + 1 })}>
              <AppText style={[type.bodyLarge, { color: colors.textMuted, flex: 1 }]}>{t('packs.level', { level: track.currentLevel + 1 })}</AppText>
              <AppText style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>{t('packs.nextUp')}</AppText>
            </View>
          </View>
        }
        renderItem={({ item: level }) => {
          const stars = track.stars[level] ?? 0;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('packs.replayLabel', { level, count: stars })}
              onPress={() => startLevel(pack.id, difficulty, level)}
              style={[styles.row, row, { borderWidth: 1 }]}
            >
              <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{t('packs.level', { level })}</AppText>
              <StarRow stars={stars} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
  segment: { flexDirection: 'row', paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
});
