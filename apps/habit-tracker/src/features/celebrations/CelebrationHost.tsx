import { useCallback, useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion, ZoomIn } from 'react-native-reanimated';
import Flame from 'lucide-react-native/icons/flame';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import Snowflake from 'lucide-react-native/icons/snowflake';
import Trophy from 'lucide-react-native/icons/trophy';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { EASE_OUT } from '@shared/ui';
import { useCelebration } from '@/store/celebrations';
import { useFeedback } from '@/store/feedback';
import { useHabits } from '@/store/habits';
import { extraColorsFor } from '@/theme/tokens';
import { Confetti } from './Confetti';

const TOAST_MS = 3200;

/** Overlay for confetti and the celebration card. It never intercepts touches. */
export function CelebrationHost() {
  const { colors, spacing, radius, type, shadow, mode } = useTheme();
  const reduced = useReducedMotion();
  const feedback = useFeedback();
  const current = useCelebration((s) => s.current);
  const dismiss = useCelebration((s) => s.dismiss);
  const habit = useHabits((s) => (current?.kind === 'milestone' ? s.habits[current.habitId] : undefined));

  const message = !current
    ? null
    : current.kind === 'first'
      ? t('celebrate.first')
      : current.kind === 'perfectDay'
        ? t('celebrate.perfectDay')
        : current.kind === 'freezeUsed'
          ? t('celebrate.freezeUsed')
          : t(habit?.schedule.kind === 'perWeek' ? 'celebrate.milestoneWeeks' : 'celebrate.milestoneDays', {
            count: current.milestone,
            name: habit?.name ?? '',
          });

  useEffect(() => {
    if (!current || !message) return;
    AccessibilityInfo.announceForAccessibility(message);
    // The check-off already played its own sound; the fanfare is for the rare wins only.
    if (current.kind !== 'freezeUsed') feedback.celebrate();
    const timer = setTimeout(dismiss, TOAST_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per celebration
  }, [current?.id]);

  const onConfettiDone = useCallback(() => undefined, []);

  if (!current || !message) return null;
  const Icon = current.kind === 'freezeUsed' ? Snowflake : current.kind === 'perfectDay' ? PartyPopper : current.kind === 'first' ? Flame : Trophy;
  const tint = current.kind === 'freezeUsed' ? extraColorsFor(mode).frozen : current.kind === 'perfectDay' ? colors.primary : colors.accent;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {!reduced && current.kind !== 'freezeUsed' && <Confetti key={current.id} onDone={onConfettiDone} />}
      <Animated.View
        key={`toast-${current.id}`}
        entering={reduced ? undefined : FadeInUp.duration(280).easing(EASE_OUT)}
        exiting={reduced ? undefined : FadeOutUp.duration(180)}
        style={[
          styles.toast,
          { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, top: spacing.lg, gap: spacing.md },
          shadow(3),
        ]}
      >
        <Animated.View
          entering={reduced ? undefined : ZoomIn.springify().duration(500).dampingRatio(0.5)}
          style={[styles.badge, { backgroundColor: tint + '26' }]}
        >
          <Icon size={26} color={tint} fill={current.kind === 'first' ? tint : 'none'} strokeWidth={2.25} />
        </Animated.View>
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '700', flex: 1 }]}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
