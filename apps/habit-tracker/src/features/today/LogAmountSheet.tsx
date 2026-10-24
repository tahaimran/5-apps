import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button, PressableScale } from '@shared/ui';
import { countStep, stepLabel } from '@/domain/countStep';
import { COUNT_MAX } from '@/domain/validate';
import type { Habit } from '@/domain/types';
import { readableOn } from '@/theme/contrast';
import { HabitIcon } from '@/ui/icons';

export interface LogAmountSheetProps {
  /** The count habit being logged, or null when closed. */
  habit: Habit | null;
  /** Today's value so far. */
  value: number;
  onSave: (value: number) => void;
  onClose: () => void;
}

const parse = (text: string) => {
  const n = Number(text.replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? Math.min(COUNT_MAX, n) : 0;
};

/** Type the day's total for a count habit (8,240 steps), or add a few round chunks. */
export function LogAmountSheet({ habit, value, onSave, onClose }: LogAmountSheetProps) {
  const { colors, spacing, radius, type, touchTarget, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  useEffect(() => {
    if (habit) setText(value > 0 ? String(value) : '');
  }, [habit, value]);

  if (!habit) return null;
  const step = countStep(habit.target);
  const current = parse(text);
  const add = (n: number) => setText(String(Math.min(COUNT_MAX, current + n)));
  const save = () => {
    onSave(current);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <Pressable accessibilityLabel={t('common.close')} style={styles.scrim} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, paddingBottom: spacing.xl + insets.bottom, gap: spacing.lg },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          <View style={styles.head}>
            <View style={[styles.tile, { backgroundColor: habit.color, borderRadius: radius.md }]}>
              <HabitIcon name={habit.icon} size={22} color={readableOn(habit.color)} />
            </View>
            <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '800', flex: 1 }]} numberOfLines={2}>
              {t('today.log.title', { name: habit.name })}
            </Text>
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: spacing.lg }]}>
            <TextInput
              value={text}
              onChangeText={(v) => setText(v.replace(/[^\d]/g, '').slice(0, 6))}
              accessibilityLabel={t('today.log.label', { unit: habit.unit ?? '' })}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={save}
              cursorColor={colors.primary}
              style={[styles.input, { color: colors.text, fontFamily: fonts.display, minHeight: touchTarget + 24 }]}
            />
            <Text style={[type.bodyLarge, { color: colors.textMuted, fontWeight: '600' }]}>
              {t('today.log.ofTarget', { target: habit.target.toLocaleString(), unit: habit.unit ?? '' })}
            </Text>
          </View>

          <View style={styles.chips}>
            {[step, step * 2, step * 5].map((n) => (
              <PressableScale
                key={n}
                accessibilityRole="button"
                accessibilityLabel={t('today.increaseBy', { step: n.toLocaleString() })}
                onPress={() => add(n)}
                scaleTo={0.92}
                style={[styles.chip, { backgroundColor: colors.primarySoft, borderRadius: radius.pill, minHeight: touchTarget }]}
              >
                <Text style={[type.body, { color: colors.primary, fontWeight: '700' }]}>+{stepLabel(n)}</Text>
              </PressableScale>
            ))}
          </View>

          <Button label={t('common.save')} onPress={save} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrim: { flex: 1, backgroundColor: '#0000007A' },
  sheet: {},
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: -8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 40, fontWeight: '800', paddingVertical: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
});
