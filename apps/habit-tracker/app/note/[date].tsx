import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { parseDayKey } from '@/domain/dayKey';
import type { DayKey, DayNote } from '@/domain/types';
import { NOTE_MAX, useNotes } from '@/store/notes';
import { PrimaryButton } from '@/ui/controls';

const MOODS: { value: 1 | 2 | 3 | 4 | 5; emoji: string }[] = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];

export default function NoteScreen() {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
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
        <Text accessibilityRole="header" style={[type.title, { color: colors.text }]}>{title}</Text>

        <View style={{ gap: spacing.sm }}>
          <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }]}>{t('note.mood')}</Text>
          <View style={styles.moods}>
            {MOODS.map((m) => {
              const selected = mood === m.value;
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole="button"
                  accessibilityLabel={t(`note.moods.${m.value}`)}
                  accessibilityState={{ selected }}
                  onPress={() => setMood(selected ? undefined : m.value)}
                  style={[
                    styles.mood,
                    {
                      width: touchTarget + 8,
                      height: touchTarget + 8,
                      borderRadius: radius.md,
                      backgroundColor: selected ? colors.primary + '26' : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                </Pressable>
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
                borderRadius: radius.md,
                padding: spacing.md,
                minHeight: 140,
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
  mood: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
