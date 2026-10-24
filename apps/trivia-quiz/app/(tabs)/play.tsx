import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Star from 'lucide-react-native/icons/star';
import Trophy from 'lucide-react-native/icons/trophy';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { CATEGORY_LIST, categoryInfo } from '@/domain/categories';
import { totalStars } from '@/domain/classic';
import { openRound } from '@/features/play/navigation';
import { startBlitz } from '@/features/play/start';
import { useClassic, useStats } from '@/store/stores';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { modeIcons } from '@/ui/icons';
import { Screen } from '@/ui/Screen';

/** Plan §5 Modes: one card per mode with a line about it and the personal best. v1.1 modes are hidden, not "coming soon". */
export default function Play() {
  useAdScreen('play');
  const { colors, spacing, radius, shadow, mode } = useTheme();
  const x = extraColorsFor(mode);
  const classic = useClassic((s) => s.value);
  const best = useStats((s) => s.value.blitzBest);
  const stars = CATEGORY_LIST.reduce((n, c) => n + totalStars(classic[c]), 0);
  const card = (Icon: IconComponent, accent: string, title: string, detail: string, extra: { icon: IconComponent; text: string } | null, onPress: () => void, label: string) => (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.card, { gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface }, shadow(1)]}
    >
      <View style={[styles.square, { backgroundColor: accent }]}>
        <Icon size={28} color="#FFFFFF" strokeWidth={2.2} />
      </View>
      <View style={[styles.flex, { gap: 4 }]}>
        <AppText variant="h2">{title}</AppText>
        <AppText variant="body" style={{ color: colors.textMuted }}>
          {detail}
        </AppText>
        {extra ? (
          <View style={[styles.pill, { backgroundColor: x.goldSoft, borderRadius: radius.pill }]}>
            <extra.icon size={13} color={colors.accent} strokeWidth={2.6} />
            <AppText variant="caption" style={{ color: colors.text, fontWeight: '700' }}>
              {extra.text}
            </AppText>
          </View>
        ) : null}
      </View>
      <ChevronRight size={22} color={colors.textMuted} strokeWidth={2.4} />
    </PressableScale>
  );
  return (
    <Screen title={t('play.title')} footer={<BannerSlot placement="menu" />}>
      {card(modeIcons.classic, categoryInfo('general').strong, t('modes.classic'), t('modes.classicDetail'), stars > 0 ? { icon: Star, text: t('modes.classicStars', { count: stars }) } : null, () => router.push('/classic'), t('modes.classicLabel'))}
      {card(modeIcons.category, categoryInfo('science').strong, t('modes.category'), t('modes.categoryDetail'), null, () => router.push('/category'), t('modes.categoryLabel'))}
      {card(modeIcons.blitz, categoryInfo('sports').strong, t('modes.blitz'), t('modes.blitzDescription'), best > 0 ? { icon: Trophy, text: t('modes.blitzBest', { count: best }) } : null, () => openRound(startBlitz()), t('modes.blitzLabel'))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 96, flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  square: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
});
