import { Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import LayoutTemplate from 'lucide-react-native/icons/layout-template';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, showToast } from '@shared/ui';
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
          // Straight to Today, even through New habit → Templates → Edit first (two editors stacked).
          router.dismissAll();
          showToast({ message: t('editor.added', { name: draft.name.trim() }), icon: CircleCheck, tone: 'success' });
        }}
        header={
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={t('editor.fromTemplate')}
            onPress={() => router.push('/templates')}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              minHeight: touchTarget + 12,
              padding: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.primarySoft,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={20} color={colors.primary} strokeWidth={2.25} />
            </View>
            <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '600', flex: 1 }]}>{t('editor.fromTemplate')}</Text>
            <ChevronRight size={20} color={colors.primary} />
          </PressableScale>
        }
      />
    </>
  );
}
