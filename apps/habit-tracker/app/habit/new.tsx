import { Pressable, Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { templateById } from '@/data/templates';
import { blankDraft, draftFromTemplate } from '@/features/habit-editor/drafts';
import { HabitForm } from '@/features/habit-editor/HabitForm';
import { useHabits } from '@/store/habits';
import { useToday } from '@/store/today';

export default function NewHabit() {
  const { colors, type, spacing, radius, touchTarget } = useTheme();
  const { template } = useLocalSearchParams<{ template?: string }>();
  const today = useToday((s) => s.today);
  const addHabit = useHabits((s) => s.addHabit);
  const chosen = template ? templateById(template) : undefined;
  const initial = chosen ? draftFromTemplate(chosen, today) : blankDraft(today);

  return (
    <>
      <Stack.Screen options={{ title: t('editor.titleNew'), headerShown: true }} />
      <HabitForm
        key={template ?? 'blank'}
        initial={initial}
        today={today}
        submitLabel={t('editor.create')}
        onSubmit={(draft) => {
          addHabit(draft);
          router.back();
        }}
        header={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('editor.fromTemplate')}
            onPress={() => router.push('/templates')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              minHeight: touchTarget + 8,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <MaterialCommunityIcons name="lightning-bolt-outline" size={22} color={colors.primary} />
            <Text style={[type.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>{t('editor.fromTemplate')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        }
      />
    </>
  );
}
