import { router, Stack } from 'expo-router';
import Droplet from 'lucide-react-native/icons/droplet';
import { t } from '@shared/i18n';
import { showToast } from '@shared/ui';
import { atMinute, localDateKey, minuteOfDay } from '@/domain/dayKey';
import { EntryForm, type EntryValues } from '@/features/log/EntryForm';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useWater } from '@/store/water';
import { volume } from '@/ui/format';
import { Screen } from '@/ui/Screen';

export { parseAmount } from '@/features/log/EntryForm';

export default function LogCustom() {
  const feedback = useFeedback();
  const unit = useSettings((s) => s.goal.unit);

  const submit = ({ beverage, volumeMl, minute }: EntryValues) => {
    const now = new Date();
    let ts = atMinute(localDateKey(now), minute).getTime();
    if (ts > now.getTime()) ts -= 86_400_000; // a later time of day means last night
    feedback.add();
    useWater.getState().logDrink({ volumeMl, beverage, ts, source: 'app' });
    showToast({ message: t('today.added', { amount: volume(volumeMl, unit) }), icon: Droplet });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('logCustom.title'), headerShown: true }} />
      <EntryForm initial={{ beverage: 'water', volumeMl: 250, minute: minuteOfDay(new Date()) }} submitLabel={t('logCustom.add')} onSubmit={submit} />
    </Screen>
  );
}
