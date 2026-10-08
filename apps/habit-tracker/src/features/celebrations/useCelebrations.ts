import { useEffect, useRef } from 'react';
import {
  detectCelebration,
  type CelebratedState,
  type CelebrationSnapshot,
} from '@/domain/celebrations';
import { dayProgress } from '@/domain/percent';
import { computeStreaks } from '@/domain/streaks';
import { totalCheckIns } from '@/domain/stats';
import { scheduleReviewAfterMilestone } from '@/features/review/askForReview';
import { useCelebration } from '@/store/celebrations';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';

/**
 * Watches check-ins and fires confetti for the first ever check-in, streak milestones and the
 * first perfect day of each day. What has been celebrated is persisted so undo/redo or a
 * restart never repeats it. Mount once, on the Today screen.
 */
export function useCelebrations() {
  const habits = useHabits((s) => s.habits);
  const habitOrder = useHabits((s) => s.habitOrder);
  const entries = useHabits((s) => s.entries);
  const today = useToday((s) => s.today);
  const weekStartsOn = useSettings((s) => s.settings.weekStartsOn);
  const show = useCelebration((s) => s.show);
  const previous = useRef<CelebrationSnapshot | null>(null);
  const cancelReview = useRef<(() => void) | null>(null);

  useEffect(() => () => cancelReview.current?.(), []);

  useEffect(() => {
    const list = habitOrder.map((id) => habits[id]).filter((h) => h && !h.archivedAt);
    const streaks: CelebrationSnapshot['streaks'] = {};
    let total = 0;
    for (const h of list) {
      const e = entries[h.id] ?? {};
      streaks[h.id] = computeStreaks(h, e, today, weekStartsOn).current;
      total += totalCheckIns(h, e);
    }
    const progress = dayProgress(list, entries, today, weekStartsOn);
    const next: CelebrationSnapshot = {
      day: today,
      streaks,
      totalCheckIns: total,
      allDone: progress.total > 0 && progress.done === progress.total,
    };

    const prev = previous.current;
    previous.current = next;
    if (!prev) return; // first run only records the baseline

    const celebrated: CelebratedState = db.get('celebrated') ?? {};
    const result = detectCelebration(prev, next, celebrated);
    if (result.celebrated !== celebrated) db.set('celebrated', result.celebrated);
    if (result.celebration) {
      show(result.celebration);
      if (result.celebration.kind === 'milestone') {
        const cancel = scheduleReviewAfterMilestone(result.celebration.milestone);
        cancelReview.current?.();
        cancelReview.current = cancel;
      }
    }
  }, [habits, habitOrder, entries, today, weekStartsOn, show]);
}
