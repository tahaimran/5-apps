import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import Bell from 'lucide-react-native/icons/bell';
import Check from 'lucide-react-native/icons/check';
import Crown from 'lucide-react-native/icons/crown';
import Flame from 'lucide-react-native/icons/flame';
import Sprout from 'lucide-react-native/icons/sprout';
import { t } from '@shared/i18n';
import type { OnboardingStep, StepContext } from '@shared/onboarding';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import type { IconComponent } from '@shared/ui';
import { CategoryChips } from '@/components/CategoryChips';
import { categoryInfo } from '@/domain/categories';
import { DEFAULT_REMINDER } from '@/domain/reminder';
import type { CategoryId, Difficulty } from '@/domain/types';
import { extraColorsFor } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { categoryIcons } from '@/ui/icons';
import { OptionCard } from '@/ui/OptionCard';
import { IconCircle } from '@/ui/SettingsRow';
import { DEFAULT_DIFFICULTY, DEFAULT_PICKS, MIN_CATEGORIES, warmupVerdict } from './answers';

const LEVELS: Difficulty[] = [1, 2, 3];
const LEVEL_ICONS: Record<Difficulty, IconComponent> = { 1: Sprout, 2: Flame, 3: Crown };

/** A category bubble floating around the welcome mark. */
function Orbit({ id, style }: { id: CategoryId; style: object }) {
  const Icon = categoryIcons[id];
  return (
    <View style={[styles.orbit, { backgroundColor: categoryInfo(id).strong }, style]}>
      <Icon size={20} color="#FFFFFF" strokeWidth={2.3} />
    </View>
  );
}

/**
 * O1 illustration: the app's mark (a speech bubble with a "?" whose dot is a gold bulb) on the violet
 * stage, with three category bubbles around it. Decorative, hidden from screen readers.
 */
function WelcomeArt() {
  const { mode } = useTheme();
  const x = extraColorsFor(mode);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.art}>
      <View style={styles.artBox}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <Defs>
            <LinearGradient id="stage" x1="0" y1="0" x2="0.6" y2="1">
              <Stop offset="0" stopColor={x.stage[0]} />
              <Stop offset="1" stopColor={x.stage[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="14" y="14" width="152" height="152" rx="44" fill="url(#stage)" />
          <Path d="M64 50 H116 Q136 50 136 70 V104 Q136 124 116 124 H92 L70 142 L74 124 H64 Q44 124 44 104 V70 Q44 50 64 50 Z" fill="#FFFFFF" />
          <Path d="M78 78 Q78 64 90 64 Q102 64 102 76 Q102 84 95 88 Q90 91 90 98" stroke={x.stage[0]} strokeWidth={10} strokeLinecap="round" fill="none" />
          <Circle cx="90" cy="111" r="6.5" fill={x.gold} />
          <Path d="M146 26 Q148 34 156 36 Q148 38 146 46 Q144 38 136 36 Q144 34 146 26 Z" fill={x.gold} />
        </Svg>
        <Orbit id="geography" style={{ left: -18, top: 34 }} />
        <Orbit id="science" style={{ right: -20, top: 92 }} />
        <Orbit id="movies" style={{ left: 6, bottom: -6 }} />
      </View>
    </View>
  );
}

function CategoriesStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing } = useTheme();
  const value = (ctx.value as CategoryId[] | undefined) ?? DEFAULT_PICKS;
  return (
    <View style={{ gap: spacing.md }}>
      <CategoryChips value={value} onChange={(next) => ctx.setValue(next)} />
      <AppText accessibilityLiveRegion="polite" variant="body" style={{ color: value.length >= MIN_CATEGORIES ? colors.success : colors.textMuted, fontWeight: '700' }}>
        {value.length >= MIN_CATEGORIES ? t('onboarding.pickedEnough', { count: value.length }) : t('onboarding.pickedCount', { count: value.length, need: MIN_CATEGORIES })}
      </AppText>
    </View>
  );
}

function DifficultyStep({ ctx }: { ctx: StepContext }) {
  const { colors, spacing, mode } = useTheme();
  const x = extraColorsFor(mode);
  const value = (ctx.value as Difficulty | undefined) ?? DEFAULT_DIFFICULTY;
  const tones: Record<Difficulty, { tint: string; bg: string }> = {
    1: { tint: colors.success, bg: x.successSoft },
    2: { tint: x.streak, bg: x.streakSoft },
    3: { tint: colors.primary, bg: colors.primarySoft },
  };
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
      {LEVELS.map((d) => (
        <OptionCard
          key={d}
          icon={LEVEL_ICONS[d]}
          tint={tones[d].tint}
          bg={tones[d].bg}
          label={t(`difficulty.${d}`)}
          detail={t(`onboarding.difficultyDetail.${d}`)}
          selected={value === d}
          onPress={() => ctx.setValue(d)}
        />
      ))}
      <AppText variant="body" style={{ color: colors.textMuted, marginTop: spacing.sm }}>
        {t('onboarding.difficultyFooter')}
      </AppText>
    </View>
  );
}

/** O7: the time on the wheel picker, in the phone's 12- or 24-hour style. */
function ReminderStep({ ctx }: { ctx: StepContext }) {
  const { spacing, radius, colors, shadow } = useTheme();
  const time = (ctx.value as { hour: number; minute: number } | undefined) ?? DEFAULT_REMINDER;
  return (
    <View style={{ gap: spacing.lg, alignItems: 'center' }}>
      <IconCircle icon={Bell} size={72} />
      <View style={[styles.timeRow, { gap: spacing.md, padding: spacing.md, paddingLeft: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface }, shadow(1)]}>
        <AppText variant="body" style={[styles.flex, styles.bold]}>
          {t('settings.reminderTimeLabel')}
        </AppText>
        <TimeField label={t('settings.reminderTimeLabel')} value={toHHMM(time.hour, time.minute)} onChange={(hhmm) => ctx.setValue(fromHHMM(hhmm))} />
      </View>
    </View>
  );
}

/**
 * Plan §6 O1-O3 on the shared flow. Skip on O2 and O3 uses the defaults; "I've played before - skip
 * intro" on O1 finishes with `intro: 'skip'` (the caller then jumps past the warm-up).
 */
export function buildSetupSteps(): OnboardingStep[] {
  return [
    {
      key: 'welcome',
      title: t('onboarding.welcomeTitle'),
      body: t('onboarding.welcomeBody'),
      media: <WelcomeArt />,
      cta: t('onboarding.letsPlay'),
      skippable: false,
      secondary: { label: t('onboarding.skipIntro'), onPress: (ctx) => ctx.finish({ intro: 'skip' }) },
    },
    {
      key: 'categories',
      title: t('onboarding.categoriesTitle'),
      body: t('onboarding.categoriesBody'),
      render: (ctx) => <CategoriesStep ctx={ctx} />,
      canContinue: ({ value }) => ((value as CategoryId[] | undefined) ?? DEFAULT_PICKS).length >= MIN_CATEGORIES,
      cta: t('onboarding.continue'),
    },
    {
      key: 'difficulty',
      title: t('onboarding.difficultyTitle'),
      render: (ctx) => <DifficultyStep ctx={ctx} />,
      cta: t('onboarding.startWarmup'),
    },
  ];
}

export interface FinishOptions {
  /** The warm-up was played (not skipped). */
  warmupScore: number;
  /** Google UMP will show a form here, so the pre-screen is shown (plan §6 O6). */
  consentRequired: boolean;
  onConsent: () => Promise<void>;
  onRemind: (hour: number, minute: number) => Promise<void>;
  onDecline: () => void;
}

/** Plan §6 O5-O7: warm-up result, consent pre-screen (only where a form follows), and the reminder ask. */
export function buildFinishSteps(o: FinishOptions): OnboardingStep[] {
  const verdict = warmupVerdict(Math.max(0, o.warmupScore));
  return [
    {
      key: 'result',
      title: t(`onboarding.result.${verdict}`),
      body: t('onboarding.resultBody'),
      media: <ResultArt score={Math.max(0, o.warmupScore)} />,
      cta: t('onboarding.continue'),
      hidden: () => o.warmupScore < 0,
    },
    {
      key: 'consent',
      title: t('onboarding.consentTitle'),
      body: t('onboarding.consentBody'),
      cta: t('onboarding.ok'),
      skippable: false,
      hidden: () => !o.consentRequired,
      onContinue: o.onConsent,
    },
    {
      key: 'reminder',
      title: t('onboarding.reminderTitle'),
      body: t('onboarding.reminderBody'),
      render: (ctx) => <ReminderStep ctx={ctx} />,
      cta: t('onboarding.remindMe'),
      onContinue: (ctx) => {
        const time = (ctx.value as { hour: number; minute: number } | undefined) ?? DEFAULT_REMINDER;
        return o.onRemind(time.hour, time.minute);
      },
      secondary: {
        label: t('onboarding.notNow'),
        onPress: (ctx) => {
          o.onDecline();
          ctx.finish();
        },
      },
    },
  ];
}

/** O5: the warm-up score as three circles, gold with a check for each right answer; the number is spoken. */
function ResultArt({ score }: { score: number }) {
  const { colors, mode } = useTheme();
  const x = extraColorsFor(mode);
  return (
    <View accessible accessibilityLabel={t('onboarding.resultScore', { score })} style={styles.result}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.resultDot, { backgroundColor: i < score ? x.gold : 'transparent', borderColor: i < score ? x.gold : colors.border }]}>
          {i < score ? <Check size={30} color={x.onGold} strokeWidth={3} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  art: { alignItems: 'center', paddingVertical: 16 },
  artBox: { width: 180, height: 180 },
  orbit: { position: 'absolute', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  timeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  result: { flexDirection: 'row', gap: 14, justifyContent: 'center', paddingVertical: 16 },
  resultDot: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
