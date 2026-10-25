import { useMemo } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Play from 'lucide-react-native/icons/play';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, PressableScale } from '@shared/ui';
import { startLevel } from '@/features/play/navigation';
import { packStars } from '@/features/home/stars';
import { PackTile } from '@/features/packs/PackArt';
import { getPack } from '@/domain/packs';
import type { Difficulty } from '@/domain/types';
import { trackOf, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { useAdScreen } from '@/ads/guard';
import { useAppColors, useIsHighContrast } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { ChoiceGroup } from '@/ui/Choice';
import { GameButton } from '@/ui/GameButton';
import { StackHeader } from '@/ui/Screen';
import { SkyBackdrop } from '@/ui/SkyBackdrop';
import { StarRow, StarShape } from '@/ui/StarRow';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const BADGE = 48;

/** A level number in a fixed round badge: it keeps its drawn size at any font scale (the row's label says it). */
function LevelBadge({ level, current }: { level: number; current?: boolean }) {
  const { colors, fonts } = useTheme();
  const app = useAppColors();
  const hc = useIsHighContrast();
  const { fontScale } = useWindowDimensions();
  const size = level >= 100 ? 15 : 18;
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          backgroundColor: hc ? colors.background : current ? app.go[1] : colors.primarySoft,
          borderWidth: hc || current ? 3 : 0,
          borderColor: hc ? colors.primary : app.goLip,
        },
      ]}
    >
      <AppText style={{ fontSize: size / fontScale, lineHeight: (size + 4) / fontScale, color: hc ? colors.primary : current ? app.onGo : colors.primary, fontWeight: '800', fontFamily: fonts.display }}>
        {level}
      </AppText>
    </View>
  );
}

/** Plan §5.2: the levels of one pack at the chosen difficulty; the current one is emphasized, one "Next up" follows it. */
export default function PackScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const pack = getPack(String(packId));
  useAdScreen('packs');
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
  const hc = useIsHighContrast();
  const difficulty = useSettings((s) => s.settings.difficulty);
  const update = useSettings((s) => s.update);
  const packs = useProgress((s) => s.packs);

  const track = pack ? trackOf(packs, pack.id, difficulty) : null;
  const done = useMemo(() => {
    if (!track) return [];
    return Array.from({ length: track.currentLevel - 1 }, (_, i) => track.currentLevel - 1 - i);
  }, [track]);

  if (!pack || !track) {
    // Corrupt or missing pack: say so and offer the way out (plan §5.2 empty/error state).
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <SkyBackdrop />
        <StackHeader />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800' }]}>{t('packs.errorTitle')}</AppText>
          <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('packs.error')}</AppText>
          <GameButton label={t('packs.backToPacks')} onPress={() => router.replace('/(tabs)')} />
        </View>
      </SafeAreaView>
    );
  }

  const card = [{ borderRadius: radius.lg, backgroundColor: colors.surface }, hc ? { borderWidth: 2, borderColor: colors.border } : shadow(1)];
  const stars = packStars(packs[pack.id]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <SkyBackdrop />
      <StackHeader title={pack.name} />
      <FlatList
        style={styles.clip}
        data={done}
        keyExtractor={(level) => String(level)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <View style={[styles.hero, { gap: spacing.md, padding: spacing.md }, ...card]}>
              <PackTile packId={pack.id} px={88} />
              <View style={styles.flex}>
                <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{t('packs.level', { level: track.currentLevel })}</AppText>
                <View style={[styles.row, { gap: spacing.xs }]}>
                  <StarShape size={20} filled={stars > 0} />
                  <AppText style={[type.body, { color: colors.textMuted }]}>{t('packs.stars', { count: stars })}</AppText>
                </View>
              </View>
            </View>
            <ChoiceGroup options={DIFFICULTIES.map((d) => ({ value: d, label: t(`difficulty.${d}`) }))} value={difficulty} onChange={(d) => update({ difficulty: d })} />
            <View style={[{ padding: spacing.md, gap: spacing.md }, ...card, { borderWidth: 3, borderColor: colors.primary }]}>
              <View style={[styles.row, { gap: spacing.md }]}>
                <LevelBadge level={track.currentLevel} current />
                <AppText style={[type.title, styles.flex, { color: colors.text, fontWeight: '800' }]}>{t('packs.level', { level: track.currentLevel })}</AppText>
              </View>
              <GameButton
                icon={Play}
                label={t('packs.play')}
                accessibilityHint={t('packs.playHint', { level: track.currentLevel })}
                onPress={() => startLevel(pack.id, difficulty, track.currentLevel)}
              />
            </View>
            <View style={[styles.row, { gap: spacing.md, padding: spacing.md, minHeight: touchTarget + 8 }, ...card]} accessible accessibilityLabel={t('packs.nextUpLabel', { level: track.currentLevel + 1 })}>
              <LevelBadge level={track.currentLevel + 1} />
              <AppText style={[type.bodyLarge, styles.flex, { color: colors.textMuted }]}>{t('packs.level', { level: track.currentLevel + 1 })}</AppText>
              <AppText style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>{t('packs.nextUp')}</AppText>
            </View>
          </View>
        }
        renderItem={({ item: level }) => {
          const s = track.stars[level] ?? 0;
          return (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('packs.replayLabel', { level, count: s })}
              onPress={() => startLevel(pack.id, difficulty, level)}
              scaleTo={0.98}
              style={[styles.row, { gap: spacing.md, padding: spacing.md, minHeight: touchTarget + 8 }, ...card]}
            >
              <LevelBadge level={level} />
              <AppText style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '700' }]}>{t('packs.level', { level })}</AppText>
              <StarRow stars={s} size={22} />
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2.25} />
            </PressableScale>
          );
        }}
        ListFooterComponent={done.length === 0 ? null : <Button variant="ghost" label={t('packs.backToPacks')} onPress={() => router.back()} />}
      />
      <BannerSlot placement="packs_banner" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  hero: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: BADGE, height: BADGE, borderRadius: BADGE / 2, alignItems: 'center', justifyContent: 'center' },
});
