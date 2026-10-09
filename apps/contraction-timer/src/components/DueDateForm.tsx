import { Pressable, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { addDays, addMonths, addYears } from '@/domain/dateKey';
import { CYCLE_LIMITS, eddFrom, gestationOn, validateDue, type DueError } from '@/domain/dueDate';
import type { DateKey, DateMode } from '@/domain/types';
import { AppText } from '@/ui/AppText';
import { dayMonth, fullDate } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';
import { Stepper } from '@/ui/Stepper';

export interface DueDraft {
  mode: DateMode;
  date: DateKey;
  cycleLength: number;
  ivfEmbryoDay: 3 | 5;
}

/** A sensible starting date for each way of entering it, so the first screen already shows a plausible answer. */
export function defaultDraft(mode: DateMode, today: DateKey): DueDraft {
  const date = mode === 'edd' ? addDays(today, 60) : mode === 'lmp' ? addDays(today, -84) : mode === 'conception' ? addDays(today, -70) : addDays(today, -56);
  return { mode, date, cycleLength: CYCLE_LIMITS.default, ivfEmbryoDay: 5 };
}

export const draftError = (d: DueDraft, today: DateKey): DueError | null => validateDue({ mode: d.mode, date: d.date, cycleLength: d.cycleLength, ivfEmbryoDay: d.ivfEmbryoDay }, today);
export const draftEdd = (d: DueDraft): DateKey => eddFrom({ mode: d.mode, date: d.date, cycleLength: d.cycleLength, ivfEmbryoDay: d.ivfEmbryoDay });

const FIELD: Record<DateMode, string> = { edd: 'due.fieldEdd', lmp: 'due.fieldLmp', conception: 'due.fieldConception', ivf: 'due.fieldIvf' };
const MODE: Record<DateMode, string> = { edd: 'due.modeEdd', lmp: 'due.modeLmp', conception: 'due.modeConception', ivf: 'due.modeIvf' };

/** "36 weeks and 4 days" with the right singulars. */
export const weeksAndDays = (weeks: number, days: number): string =>
  `${t(weeks === 1 ? 'due.week' : 'due.weeks', { n: weeks })} and ${t(days === 1 ? 'due.dayUnit' : 'due.days', { n: days })}`;

/** The live sentence under the form: "You're about 36 weeks and 4 days. Due around 12 November." */
export function resultSentence(d: DueDraft, today: DateKey): string {
  const g = gestationOn(draftEdd(d), today);
  return t('due.result', { weeks: t(g.weeks === 1 ? 'due.week' : 'due.weeks', { n: g.weeks }), days: t(g.day === 1 ? 'due.dayUnit' : 'due.days', { n: g.day }), date: dayMonth(draftEdd(d)) });
}

function DateStepper({ label, value, onChange }: { label: string; value: DateKey; onChange: (v: DateKey) => void }) {
  const { colors, type, spacing } = useTheme();
  const [y, m, d] = value.split('-').map(Number);
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText accessibilityLiveRegion="polite" style={[type.title, { color: colors.text, fontWeight: '700' }]}>
        {`${label}: ${fullDate(value)}`}
      </AppText>
      <Stepper label={t('due.day')} value={String(d)} minusLabel={t('due.dayLess', { field: label })} plusLabel={t('due.dayMore', { field: label })} onMinus={() => onChange(addDays(value, -1))} onPlus={() => onChange(addDays(value, 1))} />
      <Stepper label={t('due.month')} value={t(`date.monthLong.${m - 1}`)} minusLabel={t('due.monthLess', { field: label })} plusLabel={t('due.monthMore', { field: label })} onMinus={() => onChange(addMonths(value, -1))} onPlus={() => onChange(addMonths(value, 1))} />
      <Stepper label={t('due.year')} value={String(y)} minusLabel={t('due.yearLess', { field: label })} plusLabel={t('due.yearMore', { field: label })} onMinus={() => onChange(addYears(value, -1))} onPlus={() => onChange(addYears(value, 1))} />
    </View>
  );
}

function Chips<T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const { colors, spacing, radius, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, minWidth: 120, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: selected ? 3 : 1, borderColor: selected ? colors.text : colors.border, backgroundColor: selected ? colors.surfaceAlt : colors.surface }}
          >
            <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: selected ? '700' : '500' }]}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The due-date form (plan F11 and onboarding screen 3): how the date is known, the date, the cycle length or the
 * embryo day where they matter, and the live result. With `grouped` the last two ways are one choice, "Conception or
 * IVF date", as onboarding words it.
 */
export function DueDateForm({ draft, onChange, today, grouped }: { draft: DueDraft; onChange: (d: DueDraft) => void; today: DateKey; grouped?: boolean }) {
  const { colors, spacing, type } = useTheme();
  const error = draftError(draft, today);
  const change = (patch: Partial<DueDraft>) => onChange({ ...draft, ...patch });
  const switchMode = (mode: DateMode) => onChange({ ...defaultDraft(mode, today), cycleLength: draft.cycleLength, ivfEmbryoDay: draft.ivfEmbryoDay });
  const modes: DateMode[] = grouped ? ['edd', 'lmp', 'conception'] : ['edd', 'lmp', 'conception', 'ivf'];
  const g = error ? null : gestationOn(draftEdd(draft), today);
  const inGroup = draft.mode === 'conception' || draft.mode === 'ivf';

  return (
    <View style={{ gap: spacing.md }}>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        {modes.map((m) => {
          const selected = grouped && m === 'conception' ? inGroup : draft.mode === m;
          return <OptionCard key={m} label={t(grouped && m === 'conception' ? 'due.modeConceptionOrIvf' : MODE[m])} selected={selected} onPress={() => switchMode(m)} />;
        })}
      </View>
      {grouped && inGroup ? (
        <Chips
          options={[
            { value: 'conception' as DateMode, label: t('due.subConception') },
            { value: 'ivf' as DateMode, label: t('due.subIvf') },
          ]}
          value={draft.mode}
          onChange={switchMode}
        />
      ) : null}

      <DateStepper label={t(FIELD[draft.mode])} value={draft.date} onChange={(date) => change({ date })} />

      {draft.mode === 'lmp' ? (
        <View style={{ gap: spacing.xs }}>
          <Stepper
            label={t('due.cycle')}
            value={t('due.cycleValue', { n: draft.cycleLength })}
            minusLabel={t('due.cycleLess')}
            plusLabel={t('due.cycleMore')}
            minusDisabled={draft.cycleLength <= CYCLE_LIMITS.min}
            plusDisabled={draft.cycleLength >= CYCLE_LIMITS.max}
            onMinus={() => change({ cycleLength: Math.max(CYCLE_LIMITS.min, draft.cycleLength - 1) })}
            onPlus={() => change({ cycleLength: Math.min(CYCLE_LIMITS.max, draft.cycleLength + 1) })}
          />
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('due.cycleNote')}</AppText>
        </View>
      ) : null}
      {draft.mode === 'ivf' ? (
        <View style={{ gap: spacing.sm }}>
          <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('due.transfer')}</AppText>
          <Chips options={[{ value: 3 as const, label: t('due.day3') }, { value: 5 as const, label: t('due.day5') }]} value={draft.ivfEmbryoDay} onChange={(ivfEmbryoDay) => change({ ivfEmbryoDay })} />
        </View>
      ) : null}

      {error ? (
        <AppText accessibilityLiveRegion="assertive" style={[type.bodyLarge, { color: colors.danger, fontWeight: '600' }]}>{t(`due.errors.${error}`)}</AppText>
      ) : (
        <View accessibilityLiveRegion="polite" style={{ gap: spacing.xs }}>
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{resultSentence(draft, today)}</AppText>
          {g?.pastDue ? <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('pregnancy.pastDue')}</AppText> : null}
        </View>
      )}
    </View>
  );
}
