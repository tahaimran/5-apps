import { useEffect, useRef } from 'react';
import { liveProgress } from '@/domain/streak';
import { scheduleReviewAfterGoal } from '@/features/review/askForReview';
import { useCelebration } from '@/store/celebrations';
import { useFeedback } from '@/store/feedback';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { useWater } from '@/store/water';

/**
 * Watches today's goal while Today is on screen and, the moment it is reached, plays the
 * confetti once per day (with a success haptic) and then lets the review rules decide about a
 * prompt. Opening the app with the goal already reached, or undo and add again, does not repeat it.
 */
export function useGoalCelebration() {
  const today = useToday((s) => s.today);
  const reached = useWater((s) => s.summaries[today]?.reached ?? false);
  const feedback = useFeedback();
  const previous = useRef<boolean | null>(null);
  const cancelReview = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelReview.current?.(), []);

  useEffect(() => {
    const was = previous.current;
    previous.current = reached;
    if (was === null || was || !reached) return; // first run only records the baseline
    const { prefs, setPrefs } = useSettings.getState();
    if (prefs.celebratedDay === today) return;
    setPrefs({ celebratedDay: today });
    useCelebration.getState().show({ kind: 'goal' });
    feedback.success();

    const water = useWater.getState();
    const last = water.logsForDay(today).at(-1);
    cancelReview.current?.();
    cancelReview.current = scheduleReviewAfterGoal({
      goalDays: liveProgress(water.progress, true).goalDays,
      fromNotification: last?.source === 'notification',
    });
  }, [reached, today, feedback]);
}
