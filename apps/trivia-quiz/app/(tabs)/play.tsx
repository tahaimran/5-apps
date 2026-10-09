import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { totalStars } from '@/domain/classic';
import { CATEGORY_LIST } from '@/domain/categories';
import { openRound } from '@/features/play/navigation';
import { startBlitz } from '@/features/play/start';
import { useClassic, useStats } from '@/store/stores';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';

/** Plan §5 Modes: one card per mode with a line about it and the personal best. v1.1 modes are hidden, not "coming soon". */
export default function Play() {
  const { colors, spacing, radius } = useTheme();
  const classic = useClassic((s) => s.value);
  const best = useStats((s) => s.value.blitzBest);
  const stars = CATEGORY_LIST.reduce((n, c) => n + totalStars(classic[c]), 0);
  const card = (icon: string, title: string, detail: string, extra: string | null, onPress: () => void, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
    >
      <MaterialCommunityIcons name={icon as 'earth'} size={32} color={colors.primary} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="h2">{title}</AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>{detail}</AppText>
        {extra ? <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '700' }}>{extra}</AppText> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={26} color={colors.textMuted} />
    </Pressable>
  );
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('play.title')}</AppText>
      {card('map-marker-path', t('modes.classic'), t('modes.classicDetail'), stars > 0 ? t('modes.classicStars', { count: stars }) : null, () => router.push('/classic'), t('modes.classicLabel'))}
      {card('shape-outline', t('modes.category'), t('modes.categoryDetail'), null, () => router.push('/category'), t('modes.categoryLabel'))}
      {card('lightning-bolt', t('modes.blitz'), t('modes.blitzDescription'), best > 0 ? t('modes.blitzBest', { count: best }) : null, () => openRound(startBlitz()), t('modes.blitzLabel'))}
    </Screen>
  );
}
