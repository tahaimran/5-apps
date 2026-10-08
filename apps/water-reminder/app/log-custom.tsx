import { router, Stack } from 'expo-router';
import { t } from '@shared/i18n';
import { atMinute, localDateKey, minuteOfDay } from '@/domain/dayKey';
import { EntryForm, type EntryValues } from '@/features/log/EntryForm';
import { useFeedback } from '@/store/feedback';
import { useWater } from '@/store/water';
import { Screen } from '@/ui/Screen';

export { parseAmount } from '@/features/log/EntryForm';

export default function LogCustom() {
  const feedback = useFeedback();

  const submit = ({ beverage, volumeMl, minute }: EntryValues) => {
    const now = new Date();
    let ts = atMinute(localDateKey(now), minute).getTime();
    if (ts > now.getTime()) ts -= 86_400_000; // a later time of day means last night
    feedback.tap();
    useWater.getState().logDrink({ volumeMl, beverage, ts, source: 'app' });
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: t('logCustom.title'), headerShown: true }} />
      <EntryForm initial={{ beverage: 'water', volumeMl: 250, minute: minuteOfDay(new Date()) }} submitLabel={t('logCustom.add')} onSubmit={submit} />
    </Screen>
  );
}
