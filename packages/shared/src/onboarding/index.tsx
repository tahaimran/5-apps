import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sharedStore } from '../storage';
import { t } from '../i18n';
import { useHaptics, useTheme } from '../theme';

export type Answers = Record<string, unknown>;

export interface StepContext {
  /** Answer collected so far for this step. */
  value: unknown;
  setValue: (value: unknown) => void;
  /** All answers so far, keyed by step key. */
  answers: Answers;
  next: () => void;
}

export interface OnboardingStep {
  key: string;
  title?: string;
  body?: string;
  /** Illustration or any decoration shown above the title. */
  media?: React.ReactNode;
  /** Custom input (pickers, chips, sliders). Reads/writes the step answer through the context. */
  render?: (ctx: StepContext) => React.ReactNode;
  /** Disable "Next" until the step has a valid answer. Default: always allowed. */
  canContinue?: (ctx: Pick<StepContext, 'value' | 'answers'>) => boolean;
}

export interface OnboardingLabels {
  skip: string;
  back: string;
  next: string;
  done: string;
}

export interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onDone: (answers: Answers) => void;
  /** Override the default (translatable) button labels. */
  labels?: Partial<OnboardingLabels>;
  /** Show Skip in the header. Default true. */
  allowSkip?: boolean;
}

export function isOnboardingComplete(): boolean {
  return sharedStore.get('onboarding.completedAt') !== undefined;
}

export function useOnboardingComplete(): boolean {
  const [completedAt] = sharedStore.useStored<'onboarding.completedAt'>('onboarding.completedAt', 0);
  return completedAt > 0;
}

export function OnboardingFlow({ steps, onDone, labels, allowSkip = true }: OnboardingFlowProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const haptics = useHaptics();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const text: OnboardingLabels = {
    skip: labels?.skip ?? t('shared.onboarding.skip'),
    back: labels?.back ?? t('shared.onboarding.back'),
    next: labels?.next ?? t('shared.onboarding.next'),
    done: labels?.done ?? t('shared.onboarding.done'),
  };

  const finish = useCallback(
    (final: Answers) => {
      sharedStore.set('onboarding.completedAt', Date.now());
      onDone(final);
    },
    [onDone],
  );

  const next = () => {
    haptics.tap();
    if (isLast) finish(answers);
    else setIndex((i) => i + 1);
  };
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const setValue = (value: unknown) => setAnswers((a) => ({ ...a, [step.key]: value }));

  if (!step) return null;
  const ctx: StepContext = { value: answers[step.key], setValue, answers, next };
  const allowed = step.canContinue ? step.canContinue({ value: ctx.value, answers }) : true;
  const targetStyle = { minHeight: touchTarget, minWidth: touchTarget, justifyContent: 'center' as const };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
        <View style={[styles.side, targetStyle]}>
          {index > 0 && (
            <Pressable accessibilityRole="button" accessibilityLabel={text.back} onPress={back} style={targetStyle}>
              <Text style={[type.body, { color: colors.primary }]}>{text.back}</Text>
            </Pressable>
          )}
        </View>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={t('shared.onboarding.progress', { current: index + 1, total: steps.length })}
        >
          {steps.map((s, i) => (
            <View
              key={s.key}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.border, width: i === index ? 20 : 8 },
              ]}
            />
          ))}
        </View>
        <View style={[styles.side, targetStyle, { alignItems: 'flex-end' }]}>
          {allowSkip && !isLast && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.skip}
              onPress={() => finish(answers)}
              style={targetStyle}
            >
              <Text style={[type.body, { color: colors.textMuted }]}>{text.skip}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {step.media}
        {step.title && <Text style={[type.headline, { color: colors.text }]} accessibilityRole="header">{step.title}</Text>}
        {step.body && <Text style={[type.bodyLarge, { color: colors.textMuted, marginTop: spacing.md }]}>{step.body}</Text>}
        {step.render && <View style={{ marginTop: spacing.xl }}>{step.render(ctx)}</View>}
      </ScrollView>

      <View style={{ padding: spacing.lg }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? text.done : text.next}
          accessibilityState={{ disabled: !allowed }}
          disabled={!allowed}
          onPress={next}
          style={[
            styles.primary,
            {
              backgroundColor: colors.primary,
              borderRadius: radius.pill,
              minHeight: Math.max(touchTarget, 52),
              opacity: allowed ? 1 : 0.4,
            },
          ]}
        >
          <Text style={[type.bodyLarge, { color: colors.onPrimary, fontWeight: '700' }]}>
            {isLast ? text.done : text.next}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { flex: 1 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  primary: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
});
