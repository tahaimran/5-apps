import { Alert, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { atMinute, localDateKey, minuteOfDay } from '@/domain/dayKey';
import { EntryForm, type EntryValues } from '@/features/log/EntryForm';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useDayLogs, useWater } from '@/store/water';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';
import { TextButton } from '@/ui/controls';

/** Edit or delete a logged drink (plan §5.2). The id carries its month: `YYYY-MM-DD_xxxxxx`. */
export default function EditEntry() {
  const { colors, type } = useTheme();
  const feedback = useFeedback();
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = useSettings((s) => s.goal.unit);
  const entry = useDayLogs((id ?? '').slice(0, 10)).find((l) => l.id === id);

  if (!entry) {
    return (
      <Screen>
        <Stack.Screen options={{ title: t('edit.title'), headerShown: true }} />
        <Text accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text }]}>
          {t('edit.missing')}
        </Text>
        <TextButton label={t('common.back')} onPress={() => router.back()} />
      </Screen>
    );
  }

  const save = ({ beverage, volumeMl, minute }: EntryValues) => {
    const ts = atMinute(localDateKey(new Date(entry.ts)), minute).getTime();
    const patch: { beverage?: typeof beverage; volumeMl?: number; ts?: number } = {};
    if (beverage !== entry.beverage) patch.beverage = beverage;
    if (volumeMl !== entry.volumeMl) patch.volumeMl = volumeMl;
    if (ts !== entry.ts && minute !== minuteOfDay(new Date(entry.ts))) patch.ts = ts;
    feedback.tap();
    useWater.getState().updateEntry(entry.id, patch);
    router.back();
  };

  const remove = () =>
    Alert.alert(t('edit.deleteTitle'), t('edit.deleteBody', { amount: volume(entry.volumeMl, unit) }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          feedback.warning();
          useWater.getState().deleteEntry(entry.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen>
      <Stack.Screen options={{ title: t('edit.title'), headerShown: true }} />
      <EntryForm
        initial={{ beverage: entry.beverage, volumeMl: entry.volumeMl, minute: minuteOfDay(new Date(entry.ts)) }}
        submitLabel={t('common.save')}
        onSubmit={save}
        footer={<TextButton label={t('edit.delete')} onPress={remove} danger />}
      />
    </Screen>
  );
}
