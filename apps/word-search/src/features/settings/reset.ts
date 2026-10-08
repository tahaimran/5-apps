import { Alert } from 'react-native';
import { t } from '@shared/i18n';
import { useDaily } from '@/store/daily';
import { useGame } from '@/store/game';
import { useHints } from '@/store/hints';
import { useProgress } from '@/store/progress';
import { useResult } from '@/store/result';
import { useStats } from '@/store/stats';

/** Erases levels, stars, streaks, hints, stats and the puzzle in progress. Settings, onboarding and the ad frequency counters stay. */
export function resetProgress(): void {
  useGame.getState().discard();
  useProgress.getState().reset();
  useDaily.getState().reset();
  useHints.getState().reset();
  useStats.getState().reset();
  useResult.getState().set(null);
}

/** Plan F12: two steps, so one slip of a finger can never erase everything. */
export function confirmReset(onDone?: () => void): void {
  Alert.alert(t('settings.resetTitle'), t('settings.resetBody'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('settings.resetContinue'),
      style: 'destructive',
      onPress: () =>
        Alert.alert(t('settings.resetSureTitle'), t('settings.resetSureBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.resetConfirm'),
            style: 'destructive',
            onPress: () => {
              resetProgress();
              onDone?.();
            },
          },
        ]),
    },
  ]);
}
