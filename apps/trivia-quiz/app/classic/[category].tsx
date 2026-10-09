import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { getBank } from '@/content/bank';
import { categoryInfo, isCategory } from '@/domain/categories';
import { classicCompletion, currentLevel, hasHearts, isUnlocked, levelCount, levelDifficulty } from '@/domain/classic';
import { defaultClassic } from '@/domain/defaults';
import { openRound } from '@/features/play/navigation';
import { startClassic } from '@/features/play/start';
import { useClassic } from '@/store/stores';
import { useAdScreen } from '@/ads/guard';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { BigButton } from '@/ui/BigButton';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { StarRow } from '@/ui/StarRow';
import { Toast } from '@/ui/Toast';

function usePulse() {
  const reduced = useReducedMotion();
  const v = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    v.value = withRepeat(withSequence(withTiming(1.04, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [reduced, v]);
  return useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
}

/** One category's 30 levels as a vertical path (plan §5): locked, current (pulsing) and completed (stars). */
export default function ClassicMap() {
  useAdScreen('classic');
  const { category } = useLocalSearchParams<{ category: string }>();
  const { colors, spacing, radius } = useTheme();
  const progressAll = useClassic((s) => s.value);
  const [toast, setToast] = useState<string | null>(null);
  const pulse = usePulse();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);
  if (!isCategory(category)) return <Redirect href="/classic" />;
  const bank = getBank();
  const info = categoryInfo(category);
  const progress = progressAll[category] ?? defaultClassic();
  const total = levelCount(bank, category);
  const current = currentLevel(progress, total);
  const pct = Math.round(classicCompletion(progress, total) * 100);

  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t(`categories.${category}`)}</AppText>
      <View accessible accessibilityLabel={t('classic.complete', { percent: pct })} style={{ gap: spacing.xs }}>
        <ProgressBar fraction={pct / 100} color={info.strong} />
        <AppText variant="caption" style={{ color: colors.textMuted }}>{t('classic.complete', { percent: pct })}</AppText>
      </View>
      {toast && <Toast message={toast} />}
      {Array.from({ length: total }, (_, i) => i + 1).map((level) => {
        const unlocked = isUnlocked(progress, level);
        const stars = progress.stars[level] ?? 0;
        const isCurrent = level === current && unlocked;
        const d = levelDifficulty(bank, category, level) ?? 1;
        const label = !unlocked
          ? t('classic.levelLocked', { level })
          : t('classic.levelLabel', { level, difficulty: t(`difficulty.${d}`), stars });
        const row = (
          <Pressable
            key={level}
            testID={`level-${level}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: false }}
            onPress={() => (unlocked ? openRound(startClassic(category, level)) : setToast(t('classic.getStar', { level: level - 1 })))}
            style={{
              minHeight: 64,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              borderWidth: isCurrent ? 3 : 1,
              borderColor: isCurrent ? colors.primary : colors.border,
              opacity: unlocked ? 1 : 0.6,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: unlocked ? info.strong : colors.surfaceAlt }}>
              {unlocked ? <AppText variant="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>{String(level)}</AppText> : <MaterialCommunityIcons name="lock" size={22} color={colors.textMuted} />}
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body" style={{ fontWeight: '700' }}>{t('classic.levelName', { level })}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>
                {t(`difficulty.${d}`)}
                {hasHearts(level) ? ` · ${t('classic.hearts')}` : ''}
              </AppText>
            </View>
            {unlocked ? <StarRow stars={stars} size={22} /> : null}
          </Pressable>
        );
        return isCurrent ? <Animated.View key={level} style={pulse}>{row}</Animated.View> : row;
      })}
      <BigButton variant="secondary" label={t('common.back')} onPress={() => router.back()} />
    </Screen>
  );
}
