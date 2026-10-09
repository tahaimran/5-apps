import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { getBank } from '@/content/bank';
import { CATEGORIES } from '@/domain/categories';
import { classicCompletion, levelCount } from '@/domain/classic';
import { useClassic } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';
import { Screen } from '@/ui/Screen';
import { Tile } from '@/ui/Tile';

/** Pick a category to open its level map (plan §4: `classic/[category]`). */
export default function ClassicCategories() {
  const { spacing } = useTheme();
  const progress = useClassic((s) => s.value);
  const bank = getBank();
  const rows: (typeof CATEGORIES)[number][][] = [];
  for (let i = 0; i < CATEGORIES.length; i += 2) rows.push(CATEGORIES.slice(i, i + 2));
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('classic.title')}</AppText>
      <AppText variant="body">{t('classic.intro')}</AppText>
      {rows.map((row) => (
        <View key={row[0].id} style={{ flexDirection: 'row', gap: spacing.md }}>
          {row.map((c) => {
            const pct = Math.round(classicCompletion(progress[c.id], levelCount(bank, c.id)) * 100);
            return (
              <Tile
                key={c.id}
                icon={c.icon}
                title={t(`categories.${c.id}`)}
                detail={t('classic.complete', { percent: pct })}
                accent={c.strong}
                accessibilityLabel={t('classic.tileLabel', { category: t(`categories.${c.id}`), percent: pct })}
                onPress={() => router.push({ pathname: '/classic/[category]', params: { category: c.id } })}
              />
            );
          })}
        </View>
      ))}
      <BigButton variant="secondary" label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}
