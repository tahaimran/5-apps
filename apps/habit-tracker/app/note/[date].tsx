import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import { parseDayKey } from '@/domain/dayKey';
import type { DayKey, DayNote } from '@/domain/types';
import { NOTE_MAX, useNotes } from '@/store/notes';
import { PrimaryButton } from '@/ui/controls';
import { MoodIcon } from '@/ui/mood';

const MOODS = [1, 2, 3, 4, 5] as const;

export default function NoteScreen() {
  const { colors, spacing, radius, type, touchTarget, shadow } = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = date as DayKey;
  const existing = useNotes((s) => s.notes[day]);
  const setNote = useNotes((s) => s.setNote);
  const [text, setText] = useState(existing?.text ?? '');
  const [mood, setMood] = useState<DayNote['mood']>(existing?.mood);

  const title = t('note.header', {
    date: parseDayKey(day).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <Stack.Screen options={{ title: t('note.title'), headerShown: true }} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{title}</Text>

        <View style={{ gap: spacing.sm }}>
          <Text style={[type.body, { color: colors.text, fontWeight: '700' }]}>{t('note.mood')}</Text>
          <View style={styles.moods}>
            {MOODS.map((m) => {
              const selected = mood === m;
              return (
                <PressableScale
                  key={m}
                  accessibilityRole="button"
                  accessibilityLabel={t(`note.moods.${m}`)}
                  accessibilityState={{ selected }}
                  onPress={() => setMood(selected ? undefined : m)}
                  scaleTo={0.88}
                  style={[
                    styles.mood,
                    {
                      minWidth: touchTarget,
                      height: touchTarget + 12,
                      borderRadius: radius.lg,
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : 'transparent',
                    },
                    selected ? null : shadow(1),
                  ]}
                >
                  <MoodIcon mood={m} size={28} color={selected ? colors.onPrimary : colors.textMuted} />
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            maxLength={NOTE_MAX}
            accessibilityLabel={t('note.prompt')}
            placeholder={t('note.placeholder')}
            placeholderTextColor={colors.textMuted}
            textAlignVertical="top"
            style={[
              type.body,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                padding: spacing.lg,
                minHeight: 160,
              },
            ]}
          />
          <Text style={[type.caption, { color: colors.textMuted, alignSelf: 'flex-end' }]}>{t('note.count', { count: text.length })}</Text>
        </View>

        <PrimaryButton
          label={t('common.save')}
          onPress={() => {
            setNote(day, text, mood);
            router.back();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  moods: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
