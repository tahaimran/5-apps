import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { defaultDraft, draftEdd, draftError, draftSavable, DueDateForm, type DueDraft } from '@/components/DueDateForm';
import { gestationOn } from '@/domain/dueDate';
import { usePregnancy } from '@/hooks/usePregnancy';
import { useProfile } from '@/store/profile';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { fullDate } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Toast } from '@/ui/Toast';

/** Plan F11: from a due date, the last period, conception or an IVF transfer: the due date, week, trimester and days to go. */
export default function DueDate() {
  const { colors, spacing, radius, type } = useTheme();
  const { today, edd } = usePregnancy();
  const profile = useProfile((s) => s.profile);
  const [draft, setDraft] = useState<DueDraft>(() =>
    profile.dateMode && profile.inputDate
      ? { mode: profile.dateMode, date: profile.inputDate, cycleLength: profile.cycleLength ?? 28, ivfEmbryoDay: profile.ivfEmbryoDay ?? 5, touched: true }
      : defaultDraft('edd', today),
  );
  const [saved, setSaved] = useState(false);
  const error = draftError(draft, today);
  const savable = draftSavable(draft, today);
  const result = error || !draft.touched ? null : { edd: draftEdd(draft), g: gestationOn(draftEdd(draft), today) };

  const save = () => {
    if (!savable) return;
    useProfile.getState().setDue({ mode: draft.mode, date: draft.date, cycleLength: draft.cycleLength, ivfEmbryoDay: draft.ivfEmbryoDay });
    setSaved(true);
  };
  const remove = () =>
    Alert.alert(t('due.removeTitle'), t('due.removeBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('due.removeConfirm'),
        style: 'destructive',
        onPress: () => {
          useProfile.getState().clearDue();
          router.back();
        },
      },
    ]);

  const stat = (label: string, value: string) => (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, minWidth: 140, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <AppText style={[type.caption, { color: colors.textMuted }]}>{label}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '700' }]}>{value}</AppText>
    </View>
  );

  return (
    <Screen>
      <ScreenHeader title={t('due.title')} />
      <DueDateForm draft={draft} onChange={(d) => { setDraft(d); setSaved(false); }} today={today} />
      {result ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {stat(t('due.summaryEdd'), fullDate(result.edd))}
          {stat(t('pregnancy.header', { weeks: result.g.weeks, days: result.g.day }), t('due.trimester', { n: result.g.trimester }))}
          {stat(t('due.daysToGo'), String(result.g.daysToGo))}
        </View>
      ) : null}
      {saved ? <Toast message={t('due.saved')} /> : null}
      <BigButton tall label={t('due.save')} disabled={!savable} onPress={save} />
      {edd ? <BigButton variant="secondary" label={t('due.remove')} onPress={remove} /> : null}
    </Screen>
  );
}
