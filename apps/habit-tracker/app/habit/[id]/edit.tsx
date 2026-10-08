import { Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { showInterstitial } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { draftFromHabit } from '@/features/habit-editor/drafts';
import { HabitForm } from '@/features/habit-editor/HabitForm';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';

export default function EditHabit() {
  const { colors, type, spacing } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useHabits((s) => s.habits[id]);
  const updateHabit = useHabits((s) => s.updateHabit);
  const today = useToday((s) => s.today);

  if (!habit) {
    return (
      <>
        <Stack.Screen options={{ title: t('editor.titleEdit'), headerShown: true }} />
        <Text style={[type.body, { color: colors.textMuted, padding: spacing.lg }]}>{t('editor.notFound')}</Text>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('editor.titleEdit'), headerShown: true }} />
      <HabitForm
        initial={draftFromHabit(habit)}
        today={today}
        submitLabel={t('editor.saveChanges')}
        onSubmit={(draft) => {
          updateHabit(id, draft);
          router.back();
          // Natural break (plan §12): after saving an edit, once the modal has closed.
          showInterstitial('after_edit').catch(() => undefined);
        }}
      />
    </>
  );
}
