import { Alert } from 'react-native';
import { t } from '@shared/i18n';
import { defaultDaily, defaultStats, defaultStreak } from '@/domain/defaults';
import { useResult } from '@/store/result';
import { useRound } from '@/store/round';
import { db } from '@/store/storage';
import { useClassic, useDaily, useProfile, useSeen, useStats, useStreak } from '@/store/stores';

/**
 * Erases levels, stars, XP, the seen questions, the Daily history, the streak and the stats. The settings,
 * the chosen categories and difficulty, the onboarding flags, the reminder and the ad frequency counters
 * stay (a reset must not bring back the first-session ad grace or ask to set everything up again).
 */
export function resetProgress(): void {
  const stats = useStats.getState().value;
  useRound.getState().clear();
  useResult.getState().set(null);
  useClassic.getState().set({});
  useSeen.getState().set({});
  useDaily.getState().set(defaultDaily());
  useStreak.getState().set(defaultStreak());
  // Keep what the ad and review rules read about the installation itself.
  useStats.getState().set({ ...defaultStats(stats.firstOpenAt), sessions: stats.sessions, firstOpenAt: stats.firstOpenAt });
  useProfile.getState().update({ xp: 0, level: 1 });
  db.remove('classic.last');
}

/** Two steps, so one slip of a finger can never erase everything. */
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
