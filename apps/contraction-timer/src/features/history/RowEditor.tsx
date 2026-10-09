import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { MINUTE, SECOND } from '@/domain/defaults';
import { isIgnored } from '@/domain/stats';
import type { Contraction, ContractionSession, ID, Intensity } from '@/domain/types';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { clockTime, mmss } from '@/ui/format';
import { Sheet } from '@/ui/Sheet';
import { Stepper } from '@/ui/Stepper';

const LEVELS: Intensity[] = ['mild', 'moderate', 'strong'];

export type EditorTarget = { mode: 'edit'; contraction: Contraction } | { mode: 'add'; startedAt: number };

/**
 * Plan §5.2: change when a contraction began and how long it lasted, tag it, write a note, leave it out of the
 * numbers (or count it again), join it with the next one, delete it, or add one that was missed. The times are
 * changed with plus and minus buttons, and a change that overlaps another contraction or lies in the future is refused with a reason.
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
  const { colors, spacing, type } = useTheme();
  const clock24h = useSettings((s) => s.settings.clock24h);
  const [start, setStart] = useState(0);
  const [length, setLength] = useState(60 * SECOND);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const edit = target?.mode === 'edit' ? target.contraction : null;

  useEffect(() => {
    setError(null);
    if (!target) return;
    if (target.mode === 'edit') {
      setStart(target.contraction.startedAt);
      setLength((target.contraction.endedAt ?? target.contraction.startedAt) - target.contraction.startedAt);
      setNote(target.contraction.note ?? '');
    } else {
      setStart(target.startedAt);
      setLength(60 * SECOND);
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
        ? store.editTimes(sessionId, target.contraction.id, { startedAt: start, endedAt: start + length })
        : store.addContraction(sessionId, start, length);
    if (!result) return fail('not-found');
    if (!result.ok) return fail(result.reason);
    if (target?.mode === 'edit') store.setNote(sessionId, target.contraction.id, note);
    onClose();
  };

  const lengthText = mmss(length);
  return (
    <Sheet visible={target !== null} onClose={onClose}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>
        {t(edit ? 'edit.titleEdit' : 'edit.titleAdd')}
      </AppText>
      <Stepper
        label={t('edit.start')}
        value={clockTime(start, clock24h)}
        stepText={t('edit.step1')}
        minusLabel={t('edit.startEarlier1')}
        plusLabel={t('edit.startLater1')}
        onMinus={() => setStart((s) => s - MINUTE)}
        onPlus={() => setStart((s) => s + MINUTE)}
      />
      <Stepper
        label={t('edit.start')}
        value={clockTime(start, clock24h)}
        stepText={t('edit.step10')}
        minusLabel={t('edit.startEarlier10')}
        plusLabel={t('edit.startLater10')}
        onMinus={() => setStart((s) => s - 10 * MINUTE)}
        onPlus={() => setStart((s) => s + 10 * MINUTE)}
      />
      <Stepper
        label={t('edit.length')}
        value={lengthText}
        stepText={t('edit.step5s')}
        minusLabel={t('edit.lengthLess5')}
        plusLabel={t('edit.lengthMore5')}
        minusDisabled={length <= 5 * SECOND}
        onMinus={() => setLength((l) => Math.max(5 * SECOND, l - 5 * SECOND))}
        onPlus={() => setLength((l) => l + 5 * SECOND)}
      />
      <Stepper
        label={t('edit.length')}
        value={lengthText}
        stepText={t('edit.step30s')}
        minusLabel={t('edit.lengthLess30')}
        plusLabel={t('edit.lengthMore30')}
        minusDisabled={length <= 30 * SECOND}
        onMinus={() => setLength((l) => Math.max(5 * SECOND, l - 30 * SECOND))}
        onPlus={() => setLength((l) => l + 30 * SECOND)}
      />

      {edit && current ? (
        <>
          <AppText style={[type.body, { color: colors.textMuted }]}>{t('edit.strength')}</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {LEVELS.map((level) => {
              const selected = current.intensity === level;
              return (
                <Pressable
                  key={level}
                  accessibilityRole="button"
                  accessibilityLabel={t(`intensity.${level}`)}
                  accessibilityState={{ selected }}
                  onPress={() => useSessions.getState().setIntensity(sessionId, edit.id, selected ? undefined : level)}
                  style={{ flex: 1, minWidth: 96, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: selected ? 3 : 1, borderColor: selected ? colors.text : colors.border, backgroundColor: selected ? colors.surfaceAlt : colors.background }}
                >
                  <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: selected ? '700' : '500' }]}>{t(`intensity.${level}`)}</AppText>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            accessibilityLabel={t('edit.noteLabel')}
            placeholder={t('edit.notePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            style={{ minHeight: 80, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, fontSize: type.bodyLarge.fontSize, textAlignVertical: 'top' }}
          />
        </>
      ) : null}

      {error ? (
        <AppText accessibilityLiveRegion="assertive" style={[type.bodyLarge, { color: colors.danger, fontWeight: '600' }]}>
          {error}
        </AppText>
      ) : null}

      <BigButton tall label={t('edit.save')} onPress={save} />
      {edit && current ? (
        <>
          <BigButton variant="secondary" label={t(isIgnored(current) ? 'edit.restore' : 'edit.ignore')} onPress={() => useSessions.getState().toggleIgnored(sessionId, edit.id)} />
          <BigButton
            variant="secondary"
            label={t('edit.merge')}
            onPress={() => {
              const result = useSessions.getState().mergeWithNext(sessionId, edit.id);
              if (result && !result.ok) fail(result.reason);
              else onClose();
            }}
          />
          <BigButton
            variant="secondary"
            label={t('edit.delete')}
            onPress={() => {
              const before = useSessions.getState().get(sessionId);
              useSessions.getState().deleteContraction(sessionId, edit.id);
              if (before) onDeleted(before);
              onClose();
            }}
          />
        </>
      ) : null}
      <BigButton variant="secondary" label={t('common.cancel')} onPress={onClose} />
    </Sheet>
  );
}
