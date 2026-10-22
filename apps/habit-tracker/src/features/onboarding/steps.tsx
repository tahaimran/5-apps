import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Ban from 'lucide-react-native/icons/ban';
import BellRing from 'lucide-react-native/icons/bell-ring';
import Brain from 'lucide-react-native/icons/brain';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import Droplet from 'lucide-react-native/icons/droplet';
import Dumbbell from 'lucide-react-native/icons/dumbbell';
import FlameIcon from 'lucide-react-native/icons/flame';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Moon from 'lucide-react-native/icons/moon';
import MoonStar from 'lucide-react-native/icons/moon-star';
import Sun from 'lucide-react-native/icons/sun';
import Sunrise from 'lucide-react-native/icons/sunrise';
import Zap from 'lucide-react-native/icons/zap';
import { ensureNotificationPermission } from '@shared/notify';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { PressableScale, type IconComponent } from '@shared/ui';
import { goals as goalList, rankTemplates } from '@/data/onboarding';
import type { GoalId } from '@/data/templates';
import { templateById } from '@/data/templates';
import { invalidateNotificationPlan } from '@/notifications/scheduler';
import { extraColorsFor, habitColors } from '@/theme/tokens';
import { readableOn } from '@/theme/contrast';
import { Chip, TimeStepper } from '@/ui/controls';
import { HabitIcon } from '@/ui/icons';

/** Goal chips get line icons (the emoji in data/onboarding.ts are not rendered). */
const GOAL_ICONS: Record<GoalId, IconComponent> = {
  fit: Dumbbell,
  sleep: MoonStar,
  productive: Zap,
  mind: Brain,
  quit: Ban,
  learn: GraduationCap,
  healthier: Droplet,
};

export type ReminderAnswer = { mode: 'suggested' } | { mode: 'preset' | 'custom'; time: string } | { mode: 'none' };

export const MAX_STARTERS = 3;
export const REMINDER_PRESETS = [
  { key: 'morning', icon: Sunrise, time: '08:00' },
  { key: 'afternoon', icon: Sun, time: '13:00' },
  { key: 'evening', icon: Moon, time: '20:00' },
] as const;

const goalsOf = (ctx: Pick<StepContext, 'answers'>) => (ctx.answers.goals as GoalId[] | undefined) ?? [];
const startersOf = (answers: StepContext['answers']) => (answers.starters as string[] | undefined) ?? [];
const reminderOf = (answers: StepContext['answers']) => (answers.reminder as ReminderAnswer | undefined) ?? { mode: 'suggested' };

/** The time shown in the permission step: the chosen one, or the first starter's suggestion. */
export function reminderTimeFor(answers: StepContext['answers']): string {
  const r = reminderOf(answers);
  if (r.mode === 'preset' || r.mode === 'custom') return r.time;
  const first = templateById(startersOf(answers)[0] ?? '');
  return first?.reminder ?? '20:00';
}

/** The welcome illustration: an ember orb that breathes, with a soft halo pulsing behind it. */
function Flame() {
  const reduced = useReducedMotion();
  const { mode } = useTheme();
  const ember = extraColorsFor(mode).ember;
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    breathe.set(withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0, { duration: 1100 })), -1));
  }, [reduced, breathe]);
  const orb = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.get() * 0.06 }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.18 + breathe.get() * 0.22, transform: [{ scale: 1.15 + breathe.get() * 0.2 }] }));
  return (
    <View style={styles.flame} accessible accessibilityLabel={t('onboarding.flame')}>
      <Animated.View style={[styles.halo, { backgroundColor: ember[0] }, halo]} />
      <Animated.View style={orb}>
        <LinearGradient colors={ember} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.orb}>
          <FlameIcon size={64} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.5} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function GoalsStep({ ctx }: { ctx: StepContext }) {
  const chosen = (ctx.value as GoalId[] | undefined) ?? [];
  const toggle = (id: GoalId) => ctx.setValue(chosen.includes(id) ? chosen.filter((g) => g !== id) : [...chosen, id]);
  return (
    <View style={styles.wrap}>
      {goalList.map((g) => (
        <Chip key={g.id} icon={GOAL_ICONS[g.id]} label={t(`onboarding.goals.${g.id}`)} selected={chosen.includes(g.id)} onPress={() => toggle(g.id)} />
      ))}
    </View>
  );
}

function StartersStep({ ctx }: { ctx: StepContext }) {
  const { colors, radius, spacing, type, touchTarget, shadow } = useTheme();
  const chosen = (ctx.value as string[] | undefined) ?? [];
  const options = rankTemplates(goalsOf(ctx));
  const toggle = (id: string) => {
    if (chosen.includes(id)) ctx.setValue(chosen.filter((x) => x !== id));
    else if (chosen.length < MAX_STARTERS) ctx.setValue([...chosen, id]);
  };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted }]}>
        {t('onboarding.startersCount', { count: chosen.length })}
      </Text>
      {options.map((tpl) => {
        const selected = chosen.includes(tpl.id);
        const disabled = !selected && chosen.length >= MAX_STARTERS;
        return (
          <PressableScale
            key={tpl.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled }}
            accessibilityLabel={t(`templates.${tpl.id}.name`)}
            onPress={() => toggle(tpl.id)}
            scaleTo={0.98}
            style={[
              styles.starter,
              {
                minHeight: touchTarget + 8,
                borderRadius: radius.md,
                padding: spacing.md,
                backgroundColor: selected ? colors.primarySoft : colors.surface,
                borderColor: selected ? colors.primary : 'transparent',
                opacity: disabled ? 0.45 : 1,
              },
              selected ? null : shadow(1),
            ]}
          >
            <View style={[styles.tplTile, { backgroundColor: habitColors[tpl.color], borderRadius: radius.md }]}>
              <HabitIcon name={tpl.icon} size={22} color={readableOn(habitColors[tpl.color])} />
            </View>
            <Text style={[type.bodyLarge, { color: colors.text, flex: 1, fontWeight: '600' }]}>{t(`templates.${tpl.id}.name`)}</Text>
            {selected ? (
              <CircleCheck size={24} color={colors.primary} fill={colors.primarySoft} strokeWidth={2.25} />
            ) : (
              <View style={[styles.emptyCheck, { borderColor: colors.border }]} />
            )}
          </PressableScale>
        );
      })}
    </View>
  );
}

function ReminderStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, type } = useTheme();
  const answer = (ctx.value as ReminderAnswer | undefined) ?? { mode: 'suggested' };
  const custom = answer.mode === 'custom';
  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.wrap}>
        {REMINDER_PRESETS.map((p) => (
          <Chip
            key={p.key}
            icon={p.icon}
            label={`${t(`onboarding.${p.key}`)} ${p.time}`}
            selected={answer.mode === 'preset' && answer.time === p.time}
            onPress={() => ctx.setValue({ mode: 'preset', time: p.time })}
          />
        ))}
        <Chip label={t('onboarding.custom')} selected={custom} onPress={() => ctx.setValue({ mode: 'custom', time: custom ? answer.time : '19:00' })} />
      </View>
      {custom && <TimeStepper value={answer.time} label={t('onboarding.custom')} onChange={(time) => ctx.setValue({ mode: 'custom', time })} />}
      {answer.mode === 'suggested' && <Text style={[type.body, { color: colors.textMuted }]}>{t('onboarding.reminderDefault')}</Text>}
    </View>
  );
}

function PermissionStep({ ctx }: { ctx: StepContext }) {
  const { colors, radius, spacing, type, shadow } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }, shadow(2)]}>
      <View style={[styles.bell, { backgroundColor: colors.primarySoft }]}>
        <BellRing size={30} color={colors.primary} strokeWidth={2.25} />
      </View>
      <Text style={[type.bodyLarge, { color: colors.text }]}>{t('onboarding.permissionBody', { time: reminderTimeFor(ctx.answers) })}</Text>
    </View>
  );
}

/** The five steps of DEVELOPMENT_PLAN.md §6; the sixth (first check-in) happens on Today. */
export function buildSteps(onPermission: (granted: boolean) => void): OnboardingStep[] {
  return [
    {
      key: 'welcome',
      title: t('onboarding.welcomeTitle'),
      body: t('onboarding.welcomeBody'),
      media: <Flame />,
      cta: t('onboarding.start'),
      skippable: false,
      secondary: { label: t('onboarding.later'), onPress: (ctx) => ctx.finish() },
    },
    {
      key: 'goals',
      title: t('onboarding.goalsTitle'),
      body: t('onboarding.goalsBody'),
      cta: t('onboarding.continue'),
      render: (ctx) => <GoalsStep ctx={ctx} />,
      canContinue: ({ value }) => ((value as GoalId[] | undefined) ?? []).length >= 1,
    },
    {
      key: 'starters',
      title: t('onboarding.startersTitle'),
      body: t('onboarding.startersBody'),
      cta: t('onboarding.startersAdd'),
      render: (ctx) => <StartersStep ctx={ctx} />,
      canContinue: ({ value }) => {
        const n = ((value as string[] | undefined) ?? []).length;
        return n >= 1 && n <= MAX_STARTERS;
      },
    },
    {
      key: 'reminder',
      title: t('onboarding.reminderTitle'),
      body: t('onboarding.reminderBody'),
      cta: t('onboarding.continue'),
      render: (ctx) => <ReminderStep ctx={ctx} />,
      secondary: {
        label: t('onboarding.noReminders'),
        // The permission step would be hidden, so this ends the flow.
        onPress: (ctx) => ctx.finish({ reminder: { mode: 'none' } satisfies ReminderAnswer }),
      },
    },
    {
      key: 'permission',
      title: t('onboarding.permissionAllow'),
      cta: t('onboarding.permissionAllow'),
      hidden: (answers) => reminderOf(answers).mode === 'none',
      render: (ctx) => <PermissionStep ctx={ctx} />,
      secondary: { label: t('onboarding.permissionNotNow'), onPress: (ctx) => ctx.finish() },
      // Only "Allow" opens the Android 13+ system dialog; the card above is the explanation.
      onContinue: async () => {
        const granted = await ensureNotificationPermission(null);
        invalidateNotificationPlan();
        onPermission(granted);
      },
    },
  ];
}

const styles = StyleSheet.create({
  flame: { alignSelf: 'center', marginTop: 24, marginBottom: 40, width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 150, height: 150, borderRadius: 75 },
  orb: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  tplTile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emptyCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, margin: 1 },
  bell: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  starter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2 },
  card: { alignItems: 'flex-start' },
});
