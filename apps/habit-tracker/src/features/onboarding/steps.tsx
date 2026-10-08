import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ensureNotificationPermission } from '@shared/notify';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { goals as goalList, rankTemplates } from '@/data/onboarding';
import type { GoalId } from '@/data/templates';
import { templateById } from '@/data/templates';
import { invalidateNotificationPlan } from '@/notifications/scheduler';
import { Chip, TimeStepper } from '@/ui/controls';

export type ReminderAnswer = { mode: 'suggested' } | { mode: 'preset' | 'custom'; time: string } | { mode: 'none' };

export const MAX_STARTERS = 3;
export const REMINDER_PRESETS = [
  { key: 'morning', emoji: '🌅', time: '08:00' },
  { key: 'afternoon', emoji: '☀️', time: '13:00' },
  { key: 'evening', emoji: '🌙', time: '20:00' },
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

function Flame() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    scale.value = withRepeat(withSequence(withTiming(1.18, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { colors } = useTheme();
  return (
    <Animated.View style={[styles.flame, style]} accessible accessibilityLabel={t('onboarding.flame')}>
      <MaterialCommunityIcons name="fire" size={96} color={colors.accent} />
    </Animated.View>
  );
}

function GoalsStep({ ctx }: { ctx: StepContext }) {
  const chosen = (ctx.value as GoalId[] | undefined) ?? [];
  const toggle = (id: GoalId) => ctx.setValue(chosen.includes(id) ? chosen.filter((g) => g !== id) : [...chosen, id]);
  return (
    <View style={styles.wrap}>
      {goalList.map((g) => (
        <Chip key={g.id} label={`${g.emoji} ${t(`onboarding.goals.${g.id}`)}`} selected={chosen.includes(g.id)} onPress={() => toggle(g.id)} />
      ))}
    </View>
  );
}

function StartersStep({ ctx }: { ctx: StepContext }) {
  const { colors, radius, spacing, type, touchTarget } = useTheme();
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
          <Pressable
            key={tpl.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled }}
            accessibilityLabel={t(`templates.${tpl.id}.name`)}
            onPress={() => toggle(tpl.id)}
            style={[
              styles.starter,
              {
                minHeight: touchTarget + 8,
                borderRadius: radius.md,
                padding: spacing.md,
                backgroundColor: selected ? colors.primary + '1A' : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
                opacity: disabled ? 0.45 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons name={tpl.icon as never} size={24} color={colors.text} />
            <Text style={[type.bodyLarge, { color: colors.text, flex: 1, fontWeight: '600' }]}>{t(`templates.${tpl.id}.name`)}</Text>
            {selected && <MaterialCommunityIcons name="check-circle" size={24} color={colors.primary} />}
          </Pressable>
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
            label={`${p.emoji} ${t(`onboarding.${p.key}`)} ${p.time}`}
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
  const { colors, radius, spacing, type } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, padding: spacing.xl, gap: spacing.md }]}>
      <MaterialCommunityIcons name="bell-ring-outline" size={40} color={colors.primary} />
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
  flame: { alignSelf: 'center', marginBottom: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  starter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
});
