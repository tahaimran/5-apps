import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { getBank } from '@/content/bank';
import { CATEGORIES, DIFFICULTIES } from '@/domain/categories';
import { poolOf } from '@/domain/bank';
import { seenShare } from '@/domain/selector';
import type { CategoryId, Difficulty } from '@/domain/types';
import { openRound } from '@/features/play/navigation';
import { startCategory } from '@/features/play/start';
import { useProfile, useSeen, useStats } from '@/store/stores';
import { useAdScreen } from '@/ads/guard';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { Tile } from '@/ui/Tile';

/** Category play (plan F3): 12 tiles with accuracy, a difficulty control, and Start. */
export default function CategoryPicker() {
  useAdScreen('classic');
  const { colors, spacing, radius, touchTarget } = useTheme();
  const profile = useProfile((s) => s.value);
  const stats = useStats((s) => s.value);
  const seen = useSeen((s) => s.value);
  const [category, setCategory] = useState<CategoryId>(profile.favoriteCategories[0] ?? 'general');
  const [difficulty, setDifficulty] = useState<Difficulty>(profile.preferredDifficulty);
  const bank = getBank();
  const exhausted = seenShare(poolOf(bank, category, difficulty), seen) >= 0.9;
  const rows: (typeof CATEGORIES)[number][][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) rows.push(CATEGORIES.slice(i, i + 2));
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('category.title')}</AppText>
      {rows.map((row) => (
        <View key={row[0].id} style={{ flexDirection: 'row', gap: spacing.md }}>
          {row.map((c) => {
            const s = stats.byCategory[c.id];
            const detail = s && s.a > 0 ? t('category.accuracy', { percent: Math.round((s.c / s.a) * 100) }) : t('category.noGames');
            return (
              <Tile
                key={c.id}
                role="radio"
                icon={c.icon}
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
      <AppText variant="h2">{t('category.difficulty')}</AppText>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, overflow: 'hidden' }}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            accessibilityRole="radio"
            accessibilityLabel={t(`difficulty.${d}`)}
            accessibilityState={{ selected: difficulty === d, checked: difficulty === d }}
            onPress={() => setDifficulty(d)}
            style={{ flex: 1, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center', backgroundColor: difficulty === d ? colors.primary : colors.surface }}
          >
            <AppText variant="body" style={{ fontWeight: '700', color: difficulty === d ? colors.onPrimary : colors.primary }}>{t(`difficulty.${d}`)}</AppText>
          </Pressable>
        ))}
      </View>
      {exhausted && <AppText accessibilityLiveRegion="polite" variant="body" style={{ color: colors.textMuted }}>{t('category.exhausted')}</AppText>}
      <BigButton tall label={t('category.start')} onPress={() => openRound(startCategory(category, difficulty))} />
      <BigButton variant="secondary" label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}
