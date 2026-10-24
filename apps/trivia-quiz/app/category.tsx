import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Info from 'lucide-react-native/icons/info';
import Play from 'lucide-react-native/icons/play';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, Segmented } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { getBank } from '@/content/bank';
import { poolOf } from '@/domain/bank';
import { CATEGORIES, DIFFICULTIES } from '@/domain/categories';
import { seenShare } from '@/domain/selector';
import type { CategoryId, Difficulty } from '@/domain/types';
import { openRound } from '@/features/play/navigation';
import { startCategory } from '@/features/play/start';
import { useProfile, useSeen, useStats } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { categoryIcons } from '@/ui/icons';
import { Screen } from '@/ui/Screen';
import { Tile } from '@/ui/Tile';

const COLUMNS = 2;

/** Category play (plan F3): 12 category tiles with accuracy, a difficulty control, and Start. */
export default function CategoryPicker() {
  useAdScreen('classic');
  const { colors, spacing, radius } = useTheme();
  const profile = useProfile((s) => s.value);
  const stats = useStats((s) => s.value);
  const seen = useSeen((s) => s.value);
  const [category, setCategory] = useState<CategoryId>(profile.favoriteCategories[0] ?? 'general');
  const [difficulty, setDifficulty] = useState<Difficulty>(profile.preferredDifficulty);
  const bank = getBank();
  const exhausted = seenShare(poolOf(bank, category, difficulty), seen) >= 0.9;
  const rows: (typeof CATEGORIES)[number][][] = [];
  for (let i = 0; i < CATEGORIES.length; i += COLUMNS) rows.push(CATEGORIES.slice(i, i + COLUMNS));
  return (
    <Screen stack title={t('category.title')} footer={<BannerSlot placement="menu" />}>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
        {rows.map((row) => (
          <View key={row[0].id} style={[styles.row, { gap: spacing.md }]}>
            {row.map((c) => {
              const s = stats.byCategory[c.id];
              const detail = s && s.a > 0 ? t('category.accuracy', { percent: Math.round((s.c / s.a) * 100) }) : t('category.noGames');
              return (
                <Tile
                  key={c.id}
                  role="radio"
                  icon={categoryIcons[c.id]}
                  title={t(`categories.${c.id}`)}
                  detail={detail}
                  accent={c.strong}
                  selected={category === c.id}
                  accessibilityLabel={`${t(`categories.${c.id}`)}. ${detail}`}
                  onPress={() => setCategory(c.id)}
                />
              );
            })}
          </View>
        ))}
      </View>
      <AppText variant="h2" accessibilityRole="header" style={{ marginTop: spacing.sm }}>
        {t('category.difficulty')}
      </AppText>
      <Segmented
        options={DIFFICULTIES.map((d) => ({ value: String(d), label: t(`difficulty.${d}`) }))}
        value={String(difficulty)}
        onChange={(v) => setDifficulty(Number(v) as Difficulty)}
      />
      {exhausted && (
        <View accessible accessibilityLiveRegion="polite" style={[styles.row, styles.note, { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft }]}>
          <Info size={20} color={colors.primary} strokeWidth={2.3} />
          <AppText variant="body" style={styles.flex}>
            {t('category.exhausted')}
          </AppText>
        </View>
      )}
      <Button label={t('category.start')} icon={Play} onPress={() => openRound(startCategory(category, difficulty))} style={{ marginTop: spacing.sm }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  note: { alignItems: 'center' },
  flex: { flex: 1 },
});
