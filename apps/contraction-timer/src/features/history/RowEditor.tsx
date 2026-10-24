import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Merge from 'lucide-react-native/icons/merge';
import Trash from 'lucide-react-native/icons/trash';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { fromHHMM, TimeField, toHHMM } from '@shared/time';
import { Button, Stepper } from '@shared/ui';
import { DAY, HOUR, SECOND } from '@/domain/defaults';
import { isIgnored } from '@/domain/stats';
import type { Contraction, ContractionSession, ID, Intensity } from '@/domain/types';
import { useSessions } from '@/store/sessions';
import { AppText } from '@/ui/AppText';
import { ChipRow } from '@/ui/Choice';
import { mmss } from '@/ui/format';
import { RowBlock } from '@/ui/SettingsRow';
import { Sheet } from '@/ui/Sheet';

const LEVELS: Intensity[] = ['mild', 'moderate', 'strong'];
/** Length limits in the editor, in seconds (the store refuses anything over 30 minutes with its own reason). */
const LENGTH = { min: 5, max: 30 * 60, step: 5, coarse: 30, coarseFrom: 120 } as const;

export type EditorTarget = { mode: 'edit'; contraction: Contraction } | { mode: 'add'; startedAt: number };

/**
 * The moment closest to `around` that shows `hhmm` on the clock, keeping its seconds. A contraction at
 * 23:58 moved to "00:03" lands five minutes later (the next day), not almost a day earlier.
 */
export function nearestClockTime(around: number, hhmm: string): number {
  const { hour, minute } = fromHHMM(hhmm);
  const d = new Date(around);
  d.setHours(hour, minute);
  let at = d.getTime();
  if (at - around > 12 * HOUR) at -= DAY;
  if (around - at > 12 * HOUR) at += DAY;
  return at;
}

/**
 * Plan §5.2: change when a contraction began and how long it lasted, tag it, write a note, leave it out of the
 * numbers (or count it again), join it with the next one, delete it, or add one that was missed. The start is
 * picked on the shared clock wheels and the length with a stepper; a change that overlaps another contraction
 * or lies in the future is refused with a reason.
 */
export function RowEditor({
  sessionId,
  target,
  onClose,
  onDeleted,
}: {
  sessionId: ID;
  target: EditorTarget | null;
  onClose: () => void;
  /** Called after a delete with the session as it was just before, so the screen can offer a 5-second undo. */
  onDeleted: (before: ContractionSession) => void;
}) {
  const { colors, spacing, radius, type, fonts } = useTheme();
  const [start, setStart] = useState(0);
  // Kept in ms so saving without touching the length keeps it exactly as timed.
  const [lengthMs, setLengthMs] = useState(60 * SECOND);
  const lengthSec = Math.floor(lengthMs / SECOND);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const edit = target?.mode === 'edit' ? target.contraction : null;

  useEffect(() => {
    setError(null);
    if (!target) return;
    if (target.mode === 'edit') {
      setStart(target.contraction.startedAt);
      setLengthMs((target.contraction.endedAt ?? target.contraction.startedAt) - target.contraction.startedAt);
      setNote(target.contraction.note ?? '');
    } else {
      setStart(target.startedAt);
      setLengthMs(60 * SECOND);
      setNote('');
    }
  }, [target]);

  // Read the latest saved row, so tags, ignore and restore show at once.
  const current = useSessions((s) => {
    const session = s.active?.id === sessionId ? s.active : s.archived[sessionId];
    return edit ? (session?.contractions.find((c) => c.id === edit.id) ?? edit) : null;
  });

  const fail = (reason: string) => setError(t(`edit.errors.${reason}`));
  const save = () => {
    const store = useSessions.getState();
    const result =
      target?.mode === 'edit'
        ? store.editTimes(sessionId, target.contraction.id, { startedAt: start, endedAt: start + lengthMs })
        : store.addContraction(sessionId, start, lengthMs);
    if (!result) return fail('not-found');
    if (!result.ok) return fail(result.reason);
    if (target?.mode === 'edit') store.setNote(sessionId, target.contraction.id, note);
    onClose();
  };

  const startDate = new Date(start);
  return (
    <Sheet visible={target !== null} onClose={onClose} title={t(edit ? 'edit.titleEdit' : 'edit.titleAdd')}>
      <RowBlock label={t('edit.start')}>
        <TimeField label={t('edit.start')} value={toHHMM(startDate.getHours(), startDate.getMinutes())} minuteStep={1} onChange={(hhmm) => setStart((s) => nearestClockTime(s, hhmm))} />
      </RowBlock>
      <RowBlock label={t('edit.length')}>
        <Stepper
          label={t('edit.length')}
          value={lengthSec}
          min={LENGTH.min}
          max={LENGTH.max}
          step={(sec, dir) => (sec > LENGTH.coarseFrom || (sec === LENGTH.coarseFrom && dir > 0) ? LENGTH.coarse : LENGTH.step)}
          format={(sec) => mmss(sec * SECOND)}
          decreaseLabel={t('edit.lengthLess')}
          increaseLabel={t('edit.lengthMore')}
          onChange={(sec) => setLengthMs(sec * SECOND)}
        />
      </RowBlock>

      {edit && current ? (
        <>
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('edit.strength')}</AppText>
          <ChipRow
            options={LEVELS.map((level) => ({ value: level, label: t(`intensity.${level}`) }))}
            value={current.intensity}
            onChange={(level) => useSessions.getState().setIntensity(sessionId, edit.id, level)}
          />
          <TextInput
            accessibilityLabel={t('edit.noteLabel')}
            placeholder={t('edit.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            style={[
              styles.note,
              { padding: spacing.md, borderRadius: radius.md, borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt, fontFamily: fonts.body, fontSize: type.bodyLarge.fontSize },
            ]}
          />
        </>
      ) : null}

      {error ? (
        <AppText accessibilityLiveRegion="assertive" style={[type.bodyLarge, { color: colors.danger, fontWeight: '600' }]}>
          {error}
        </AppText>
      ) : null}

      <Button label={t('edit.save')} onPress={save} />
      {edit && current ? (
        <View style={{ gap: spacing.sm }}>
          <Button
            variant="secondary"
            icon={isIgnored(current) ? Eye : EyeOff}
            label={t(isIgnored(current) ? 'edit.restore' : 'edit.ignore')}
            onPress={() => useSessions.getState().toggleIgnored(sessionId, edit.id)}
          />
          <Button
            variant="secondary"
            icon={Merge}
            label={t('edit.merge')}
            onPress={() => {
              const result = useSessions.getState().mergeWithNext(sessionId, edit.id);
              if (result && !result.ok) fail(result.reason);
              else onClose();
            }}
          />
          <Button
            variant="danger"
            icon={Trash}
            label={t('edit.delete')}
            onPress={() => {
              const before = useSessions.getState().get(sessionId);
              useSessions.getState().deleteContraction(sessionId, edit.id);
              if (before) onDeleted(before);
              onClose();
            }}
          />
        </View>
      ) : null}
      <Button variant="ghost" label={t('common.cancel')} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({ note: { minHeight: 88, borderWidth: 1, textAlignVertical: 'top' } });
