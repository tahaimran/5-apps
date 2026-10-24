import type { ReactNode } from 'react';
import { View } from 'react-native';
import CalendarX from 'lucide-react-native/icons/calendar-x';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Card, Stepper } from '@shared/ui';
import { addDays, addMonths, addYears, dayDiff } from '@/domain/dateKey';
import { CYCLE_LIMITS, eddFrom, gestationOn, validateDue, type DueError } from '@/domain/dueDate';
import type { DateKey, DateMode } from '@/domain/types';
import { AlertCard } from '@/ui/AlertCard';
import { AppText } from '@/ui/AppText';
import { ChoiceGroup } from '@/ui/Choice';
import { dayMonth, fullDate } from '@/ui/format';
import { OptionCard } from '@/ui/OptionCard';

export interface DueDraft {
  mode: DateMode;
  date: DateKey;
  cycleLength: number;
  ivfEmbryoDay: 3 | 5;
  /**
   * The person has set the date (moved it, or it came from what they saved before). A preset starting date is only a
   * place to begin: it is never saved or shared until this is true.
   */
  touched: boolean;
}

/** A sensible starting date for each way of entering it, so the first screen already shows a plausible answer. */
export function defaultDraft(mode: DateMode, today: DateKey): DueDraft {
  const date = mode === 'edd' ? addDays(today, 60) : mode === 'lmp' ? addDays(today, -84) : mode === 'conception' ? addDays(today, -70) : addDays(today, -56);
  return { mode, date, cycleLength: CYCLE_LIMITS.default, ivfEmbryoDay: 5, touched: false };
}

/** True when the draft can be saved: the date was set by the person and it passes the plan's limits. */
export const draftSavable = (d: DueDraft, today: DateKey): boolean => d.touched && draftError(d, today) === null;

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

const EPOCH = '2000-01-01';

/** The date as three shared steppers (day, month, year); each moves the whole date, rolling over months and years. */
function DateStepper({ label, value, onChange }: { label: string; value: DateKey; onChange: (v: DateKey) => void }) {
  const { colors, type, spacing } = useTheme();
  const [y, m] = value.split('-').map(Number);
  const dayIndex = dayDiff(EPOCH, value);
  const monthIndex = y * 12 + (m - 1);
  const row = (caption: string, node: ReactNode) => (
    <View style={{ gap: spacing.xs }}>
      <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{caption}</AppText>
      {node}
    </View>
  );
  return (
    <Card style={{ gap: spacing.md }}>
      <AppText accessibilityLiveRegion="polite" style={[type.title, { color: colors.text, fontWeight: '800' }]}>
        {`${label}: ${fullDate(value)}`}
      </AppText>
      {row(
        t('due.day'),
        <Stepper
          label={t('due.day')}
          value={dayIndex}
          min={0}
          max={100_000}
          format={(v) => String(Number(addDays(EPOCH, v).slice(8)))}
          decreaseLabel={t('due.dayLess', { field: label })}
          increaseLabel={t('due.dayMore', { field: label })}
          onChange={(v) => onChange(addDays(value, v - dayIndex))}
        />,
      )}
      {row(
        t('due.month'),
        <Stepper
          label={t('due.month')}
          value={monthIndex}
          min={0}
          max={12 * 9999}
          format={(v) => t(`date.monthLong.${v % 12}`)}
          decreaseLabel={t('due.monthLess', { field: label })}
          increaseLabel={t('due.monthMore', { field: label })}
          onChange={(v) => onChange(addMonths(value, v - monthIndex))}
        />,
      )}
      {row(
        t('due.year'),
        <Stepper
          label={t('due.year')}
          value={y}
          min={1900}
          max={9999}
          decreaseLabel={t('due.yearLess', { field: label })}
          increaseLabel={t('due.yearMore', { field: label })}
          onChange={(v) => onChange(addYears(value, v - y))}
        />,
      )}
    </Card>
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
        <ChoiceGroup<'conception' | 'ivf'>
          options={[
            { value: 'conception', label: t('due.subConception') },
            { value: 'ivf', label: t('due.subIvf') },
          ]}
          value={draft.mode === 'ivf' ? 'ivf' : 'conception'}
          onChange={switchMode}
        />
      ) : null}

      <DateStepper label={t(FIELD[draft.mode])} value={draft.date} onChange={(date) => change({ date, touched: true })} />

      {draft.mode === 'lmp' ? (
        <Card style={{ gap: spacing.sm }}>
          <AppText style={[type.body, { color: colors.textMuted, fontWeight: '600' }]}>{t('due.cycle')}</AppText>
          <Stepper
            label={t('due.cycle')}
            value={draft.cycleLength}
            min={CYCLE_LIMITS.min}
            max={CYCLE_LIMITS.max}
            format={(n) => t('due.cycleValue', { n })}
            decreaseLabel={t('due.cycleLess')}
            increaseLabel={t('due.cycleMore')}
            onChange={(cycleLength) => change({ cycleLength })}
          />
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('due.cycleNote')}</AppText>
        </Card>
      ) : null}
      {draft.mode === 'ivf' ? (
        <Card style={{ gap: spacing.sm }}>
          <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{t('due.transfer')}</AppText>
          <ChoiceGroup<'3' | '5'>
            options={[
              { value: '3', label: t('due.day3') },
              { value: '5', label: t('due.day5') },
            ]}
            value={draft.ivfEmbryoDay === 3 ? '3' : '5'}
            onChange={(v) => change({ ivfEmbryoDay: v === '3' ? 3 : 5 })}
          />
        </Card>
      ) : null}

      {!draft.touched ? (
        <AppText style={[type.bodyLarge, { color: colors.textMuted }]}>{t('due.setDateHint')}</AppText>
      ) : error ? (
        <AlertCard icon={CalendarX}>{t(`due.errors.${error}`)}</AlertCard>
      ) : (
        <View accessibilityLiveRegion="polite">
          <Card style={{ gap: spacing.xs, backgroundColor: colors.primarySoft }}>
            <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{resultSentence(draft, today)}</AppText>
            {g?.pastDue ? <AppText style={[type.bodyLarge, { color: colors.text }]}>{t('pregnancy.pastDue')}</AppText> : null}
          </Card>
        </View>
      )}
    </View>
  );
}
