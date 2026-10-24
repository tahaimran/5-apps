import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { Redirect, useLocalSearchParams } from 'expo-router';
import Heart from 'lucide-react-native/icons/heart';
import Lock from 'lucide-react-native/icons/lock';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, showToast } from '@shared/ui';
import { useAdScreen } from '@/ads/guard';
import { getBank } from '@/content/bank';
import { categoryInfo, isCategory } from '@/domain/categories';
import { classicCompletion, currentLevel, hasHearts, isUnlocked, levelCount, levelDifficulty } from '@/domain/classic';
import { defaultClassic } from '@/domain/defaults';
import { openRound } from '@/features/play/navigation';
import { startClassic } from '@/features/play/start';
import { useClassic } from '@/store/stores';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { categoryTone } from '@/ui/categoryTone';
import { categoryIcons } from '@/ui/icons';
import { CSS_EASE_OUT, PING, PING_MS } from '@/ui/motion';
import { ProgressBar } from '@/ui/ProgressBar';
import { Screen } from '@/ui/Screen';
import { StarRow } from '@/ui/StarRow';

/** Horizontal offsets of the winding path, repeating every eight levels. */
const WIND = [0, 0.55, 0.85, 0.55, 0, -0.55, -0.85, -0.55];
const NODE = 68;
const GAP = 34;

/**
 * One category's 30 levels as a winding path (plan §5): locked levels show a lock (a tap explains how
 * to open them), the current one has a gold halo that pings, finished ones show their stars.
 */
export default function ClassicMap() {
  useAdScreen('classic');
  const { category } = useLocalSearchParams<{ category: string }>();
  const { colors, spacing, radius, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  const reduced = useReducedMotion();
  const progressAll = useClassic((s) => s.value);
  const window = useWindowDimensions();
  // The screen's content width until the first layout reports the real one.
  const [width, setWidth] = useState(window.width - 2 * spacing.lg);
  if (!isCategory(category)) return <Redirect href="/classic" />;
  const bank = getBank();
  const info = categoryInfo(category);
  const tone = categoryTone(category, mode);
  const Icon = categoryIcons[category];
  const progress = progressAll[category] ?? defaultClassic();
  const total = levelCount(bank, category);
  const current = currentLevel(progress, total);
  const pct = Math.round(classicCompletion(progress, total) * 100);
  const swing = Math.max(0, (width - NODE) / 2 - 12);
  const centerOf = (level: number) => width / 2 + WIND[(level - 1) % WIND.length] * swing;

  return (
    <Screen stack title={t(`categories.${category}`)} footer={<BannerSlot placement="menu" />}>
      <View accessible accessibilityLabel={t('classic.complete', { percent: pct })} style={[styles.header, { gap: spacing.md, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: info.strong }, shadow(2)]}>
        <View style={[styles.headIcon, { backgroundColor: '#FFFFFF2E' }]}>
          <Icon size={28} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={[styles.flex, { gap: spacing.sm }]}>
          <AppText variant="h2" style={styles.white}>
            {t('classic.complete', { percent: pct })}
          </AppText>
          <ProgressBar fraction={pct / 100} color="#FFFFFF" track="#FFFFFF38" height={8} />
        </View>
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ paddingVertical: spacing.md }}>
        {width > 0 &&
          Array.from({ length: total }, (_, i) => i + 1).map((level) => {
            const unlocked = isUnlocked(progress, level);
            const stars = progress.stars[level] ?? 0;
            const isCurrent = level === current && unlocked;
            const d = levelDifficulty(bank, category, level) ?? 1;
            const label = !unlocked ? t('classic.levelLocked', { level }) : t('classic.levelLabel', { level, difficulty: t(`difficulty.${d}`), stars });
            const cx = centerOf(level);
            const fill = unlocked ? tone.fill : mode === 'light' ? colors.surfaceAlt : colors.surface;
            return (
              <View key={level}>
                {level > 1 && (
                  <Svg width={width} height={GAP} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Line x1={centerOf(level - 1)} y1={0} x2={cx} y2={GAP} stroke={unlocked ? tone.icon : colors.border} strokeWidth={4} strokeDasharray="2 9" strokeLinecap="round" />
                  </Svg>
                )}
                <View style={[styles.nodeRow, { left: cx - NODE / 2 }]}>
                  {isCurrent && !reduced && (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.halo,
                        { borderColor: x.gold, animationName: PING, animationDuration: `${PING_MS}ms`, animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT },
                      ]}
                    />
                  )}
                  <PressableScale
                    testID={`level-${level}`}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() =>
                      unlocked ? openRound(startClassic(category, level)) : showToast({ message: t('classic.getStar', { level: level - 1 }), icon: Lock })
                    }
                    scaleTo={0.92}
                    style={[
                      styles.node,
                      { backgroundColor: fill, borderColor: isCurrent ? x.gold : 'transparent' },
                      unlocked ? shadow(2) : null,
                    ]}
                  >
                    {unlocked ? (
                      <AppText variant="h1" style={styles.white}>
                        {String(level)}
                      </AppText>
                    ) : (
                      <Lock size={22} color={colors.textMuted} strokeWidth={2.4} />
                    )}
                  </PressableScale>
                  <View style={styles.under}>
                    {unlocked && stars > 0 ? <StarRow stars={stars} size={16} /> : null}
                    {hasHearts(level) && (stars === 0 || !unlocked) ? (
                      <View style={[styles.row, { gap: 3 }]} importantForAccessibility="no-hide-descendants">
                        <Heart size={12} color={colors.danger} fill={colors.danger} strokeWidth={2} />
                        <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '600' }}>
                          {t('classic.hearts')}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  headIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  white: { color: '#FFFFFF' },
  nodeRow: { width: NODE, alignItems: 'center' },
  node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  halo: { position: 'absolute', top: 0, width: NODE, height: NODE, borderRadius: NODE / 2, borderWidth: 4 },
  under: { minHeight: 20, alignItems: 'center', justifyContent: 'center', marginTop: 4, width: 120 },
});
