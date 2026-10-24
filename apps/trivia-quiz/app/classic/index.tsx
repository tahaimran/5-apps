import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useAdScreen } from '@/ads/guard';
import { getBank } from '@/content/bank';
import { CATEGORIES } from '@/domain/categories';
import { classicCompletion, levelCount } from '@/domain/classic';
import { useClassic } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { categoryTone } from '@/ui/categoryTone';
import { categoryIcons } from '@/ui/icons';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { Tile } from '@/ui/Tile';

/** Pick a category to open its level map (plan §4: `classic/[category]`), each with its completion. */
export default function ClassicCategories() {
  useAdScreen('classic');
  const { colors, spacing, mode } = useTheme();
  const progress = useClassic((s) => s.value);
  const bank = getBank();
  const rows: (typeof CATEGORIES)[number][][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) rows.push(CATEGORIES.slice(i, i + 2));
  return (
    <Screen stack title={t('classic.title')} footer={<BannerSlot placement="menu" />}>
      <AppText variant="body" style={{ color: colors.textMuted }}>
        {t('classic.intro')}
      </AppText>
      {rows.map((row) => (
        <View key={row[0].id} style={[styles.row, { gap: spacing.md }]}>
          {row.map((c) => {
            const pct = Math.round(classicCompletion(progress[c.id], levelCount(bank, c.id)) * 100);
            const tone = categoryTone(c.id, mode);
            return (
              <Tile
                key={c.id}
                icon={categoryIcons[c.id]}
                title={t(`categories.${c.id}`)}
                detail={t('classic.complete', { percent: pct })}
                accent={c.strong}
                accessibilityLabel={t('classic.tileLabel', { category: t(`categories.${c.id}`), percent: pct })}
                onPress={() => router.push({ pathname: '/classic/[category]', params: { category: c.id } })}
                footer={<ProgressBar fraction={pct / 100} color={tone.icon} track={tone.soft} height={6} />}
              />
            );
          })}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'stretch' } });
