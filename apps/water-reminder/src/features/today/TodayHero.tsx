import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { cubicBezier, FadeInDown, FadeOut, useReducedMotion } from 'react-native-reanimated';
import Bell from 'lucide-react-native/icons/bell';
import Flame from 'lucide-react-native/icons/flame';
import Plus from 'lucide-react-native/icons/plus';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { EASE_OUT, IconButton, PressableScale, ProgressRing } from '@shared/ui';
import { Plant } from '@/components/Plant';
import type { Mood } from '@/domain/plant';
import type { PlantStage, Unit } from '@/domain/types';
import { formatAmount } from '@/domain/units';
import { extraColorsFor } from '@/theme/tokens';
import { spokenVolume, volume } from '@/ui/format';
import { cupIcon } from '@/ui/icons';
import { Waves } from './Waves';

const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);
const RING = 188;

/** A quick squash-and-settle; two copies so changing the name replays it on every drink. */
const bounce = (peak: number) => ({
  '0%': { transform: [{ scale: 1 }] },
  '40%': { transform: [{ scale: peak }] },
  '100%': { transform: [{ scale: 1 }] },
});
const BOUNCE = [bounce(1.06), bounce(1.0601)] as const;

export interface TodayHeroProps {
  effectiveMl: number;
  goalMl: number;
  unit: Unit;
  percent: number;
  reached: boolean;
  mood: Mood;
  stage: PlantStage;
  skin: string;
  streak: number;
  /** "2:30 PM", or null when no reminder is coming. */
  nextReminder: string | null;
  nextIsTomorrow: boolean;
  /** One line under the numbers: empty, over-150% or goal-reached note. */
  note: string | null;
  usualCup: { ml: number; icon: string };
  /** Bumps on every logged drink (plays the plant bounce and the floating amount). */
  addCount: number;
  lastAddedMl: number;
  onDrink: () => void;
  onChooseCup: () => void;
}

/**
 * The one loud element on Today: a deep-water card that fills like a glass as the day goes on,
 * with the plant inside its ring and the usual cup one tap away. Everything else stays quiet.
 */
export function TodayHero(p: TodayHeroProps) {
  const { radius, spacing, type, mode, shadow, fonts } = useTheme();
  const reduced = useReducedMotion();
  const extra = extraColorsFor(mode);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const fraction = p.effectiveMl / Math.max(1, p.goalMl);
  const ringLabel = t('today.ringLabel', { amount: spokenVolume(p.effectiveMl, p.unit), goal: spokenVolume(p.goalMl, p.unit), percent: p.percent });
  const headline = t(`today.hero.${p.reached ? 'sparkle' : p.mood}`);
  const CupIcon = cupIcon(p.usualCup.icon);

  return (
    <View style={[{ borderRadius: radius.xl }, shadow(3)]}>
      <View
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        style={[styles.card, { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md }]}
      >
        {/* Two gradients crossfade when the goal is reached (a state change, so a CSS transition). */}
        <LinearGradient colors={extra.hero} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: p.reached ? 1 : 0, transitionProperty: 'opacity', transitionDuration: reduced ? 0 : 280, transitionTimingFunction: CSS_EASE_OUT },
          ]}
        >
          <LinearGradient colors={extra.heroDone} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Waves width={size.width} height={size.height} fraction={fraction} />

        <View style={styles.chips}>
          {p.streak > 0 ? (
            // White on amber fails contrast, so the chip is frosted white and only the flame is amber.
            <View accessible accessibilityLabel={t('today.streak', { count: p.streak })} style={[styles.chip, { borderRadius: radius.pill }]}>
              <Flame size={16} color={extra.sun} fill={extra.sun} strokeWidth={2} />
              <Text style={[type.caption, styles.white, styles.bold]}>{t('today.streakFlame', { count: p.streak })}</Text>
            </View>
          ) : (
            <View />
          )}
          {p.nextReminder && (
            <View
              accessible
              accessibilityLabel={t(p.nextIsTomorrow ? 'today.nextReminderTomorrow' : 'today.nextReminder', { time: p.nextReminder })}
              style={[styles.chip, { borderRadius: radius.pill }]}
            >
              <Bell size={15} color="#FFFFFF" strokeWidth={2.25} />
              <Text style={[type.caption, styles.white, styles.bold]}>
                {p.nextIsTomorrow ? t('today.nextChipTomorrow', { time: p.nextReminder }) : p.nextReminder}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.center}>
          <View accessible accessibilityRole="progressbar" accessibilityLabel={ringLabel} accessibilityValue={{ min: 0, max: 100, now: Math.min(100, p.percent) }}>
            <ProgressRing size={RING} strokeWidth={12} progress={fraction} color="#FFFFFF" trackColor="#FFFFFF2E" duration={280}>
              <View style={[styles.disc, { width: RING - 40, height: RING - 40, borderRadius: (RING - 40) / 2 }]}>
                <Animated.View
                  style={
                    reduced || p.addCount === 0
                      ? null
                      : { animationName: BOUNCE[p.addCount % 2], animationDuration: '250ms', animationTimingFunction: CSS_EASE_OUT }
                  }
                >
                  <Plant stage={p.stage} mood={p.mood} skin={p.skin} size={128} />
                </Animated.View>
              </View>
            </ProgressRing>
          </View>
          {p.addCount > 0 && (
            <Animated.Text
              key={p.addCount}
              entering={reduced ? undefined : FadeInDown.duration(220).easing(EASE_OUT)}
              exiting={reduced ? undefined : FadeOut.duration(200)}
              importantForAccessibility="no"
              style={[type.bodyLarge, styles.white, styles.floater, { fontFamily: fonts.display }]}
            >
              +{volume(p.lastAddedMl, p.unit)}
            </Animated.Text>
          )}
        </View>

        <View style={styles.copy} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Text style={[styles.white, styles.amount, { fontFamily: fonts.display }]}>
            {formatAmount(p.effectiveMl, p.unit)}
            <Text style={[type.bodyLarge, styles.white, styles.of, { fontFamily: fonts.body }]}>
              {' / '}
              {formatAmount(p.goalMl, p.unit)} {t(`units.${p.unit}`)}
              {' · '}
              {t('today.ringPercent', { percent: p.percent })}
            </Text>
          </Text>
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[type.title, styles.white, { fontWeight: '800' }]}>
            {headline}
          </Text>
          {p.note && (
            <Text accessibilityLiveRegion="polite" style={[type.body, styles.white, styles.semi, styles.centerText]}>
              {p.note}
            </Text>
          )}
        </View>

        <View style={[styles.actions, { gap: spacing.sm }]}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('today.drinkLabel', { amount: spokenVolume(p.usualCup.ml, p.unit) })}
            onPress={p.onDrink}
            scaleTo={0.96}
            style={[styles.drink, { borderRadius: radius.pill, gap: spacing.sm, paddingHorizontal: spacing.xl }]}
          >
            <Plus size={20} color={extra.hero[0]} strokeWidth={2.75} />
            <Text style={[type.bodyLarge, styles.bold, { color: extra.hero[0] }]}>{t('today.drink', { amount: volume(p.usualCup.ml, p.unit) })}</Text>
          </PressableScale>
          <IconButton icon={CupIcon} label={t('today.chooseCup')} onPress={p.onChooseCup} color="#FFFFFF" style={styles.frost} />
        </View>
      </View>
    </View>
  );
}

// White on the deep-water gradients: every stop, with both waves over it, is 4.5:1 or better (contrast test).
const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  chips: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFFFFF2E' },
  center: { alignItems: 'center', justifyContent: 'center' },
  disc: { backgroundColor: '#FFFFFF1F', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  floater: { position: 'absolute', top: 6, right: 8, fontWeight: '800' },
  copy: { alignItems: 'center', gap: 2 },
  white: { color: '#FFFFFF' },
  bold: { fontWeight: '700' },
  semi: { fontWeight: '600' },
  centerText: { textAlign: 'center' },
  amount: { fontSize: 44, lineHeight: 50, fontWeight: '800', textAlign: 'center' },
  of: { fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  drink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 54, backgroundColor: '#FFFFFF', flexShrink: 1 },
  frost: { backgroundColor: '#FFFFFF2E', width: 54, height: 54, borderRadius: 27 },
});
