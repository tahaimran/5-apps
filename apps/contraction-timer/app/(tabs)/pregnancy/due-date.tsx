import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import CalendarCheck from 'lucide-react-native/icons/calendar-check';
import CalendarHeart from 'lucide-react-native/icons/calendar-heart';
import Hourglass from 'lucide-react-native/icons/hourglass';
import Milestone from 'lucide-react-native/icons/milestone';
import Trash from 'lucide-react-native/icons/trash';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, showToast } from '@shared/ui';
import { defaultDraft, draftEdd, draftError, draftSavable, DueDateForm, type DueDraft } from '@/components/DueDateForm';
import { gestationOn } from '@/domain/dueDate';
import { usePregnancy } from '@/hooks/usePregnancy';
import { useProfile } from '@/store/profile';
import { fullDate } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { StatTile } from '@/ui/SettingsRow';

/** Plan F11: from a due date, the last period, conception or an IVF transfer: the due date, week, trimester and days to go. */
export default function DueDate() {
  const { colors, spacing } = useTheme();
  const { today, edd } = usePregnancy();
  const profile = useProfile((s) => s.profile);
  const [draft, setDraft] = useState<DueDraft>(() =>
    profile.dateMode && profile.inputDate
      ? { mode: profile.dateMode, date: profile.inputDate, cycleLength: profile.cycleLength ?? 28, ivfEmbryoDay: profile.ivfEmbryoDay ?? 5, touched: true }
      : defaultDraft('edd', today),
  );
  const error = draftError(draft, today);
  const savable = draftSavable(draft, today);
  const result = error || !draft.touched ? null : { edd: draftEdd(draft), g: gestationOn(draftEdd(draft), today) };

  const save = () => {
    if (!savable) return;
    useProfile.getState().setDue({ mode: draft.mode, date: draft.date, cycleLength: draft.cycleLength, ivfEmbryoDay: draft.ivfEmbryoDay });
    showToast({ message: t('due.saved'), icon: CalendarCheck, tone: 'success' });
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

  return (
    <Screen stack title={t('due.title')}>
      <DueDateForm draft={draft} onChange={setDraft} today={today} />
      {result ? (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <StatTile icon={CalendarHeart} label={t('due.summaryEdd')} value={fullDate(result.edd)} />
          <StatTile icon={Milestone} label={t('pregnancy.header', { weeks: result.g.weeks, days: result.g.day })} value={t('due.trimester', { n: result.g.trimester })} tint={colors.accent} bg={colors.surfaceAlt} />
          <StatTile icon={Hourglass} label={t('due.daysToGo')} value={String(result.g.daysToGo)} />
        </View>
      ) : null}
      <Button icon={CalendarCheck} label={t('due.save')} disabled={!savable} onPress={save} />
      {edd ? <Button variant="danger" icon={Trash} label={t('due.remove')} onPress={remove} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap' } });
