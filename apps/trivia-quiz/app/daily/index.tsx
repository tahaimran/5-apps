import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { currentDateKey } from '@/store/today';
import { startDaily } from '@/features/play/start';
import { useDaily } from '@/store/stores';
import { useRound } from '@/store/round';

/**
 * `quizora://daily` (the reminder tap) and Home's button land here. If today's Daily is already played
 * it shows the result; otherwise it starts it. The date is read at this moment, never taken from a
 * notification, so a reminder opened after midnight starts the new day's challenge.
 */
export default function DailyEntry() {
  const played = useDaily((s) => s.value.lastPlayedDate) === currentDateKey();
  useEffect(() => {
    if (played) return;
    const id = startDaily();
    if (id) router.replace({ pathname: '/quiz/[sessionId]', params: { sessionId: id } });
    else router.replace('/(tabs)');
  }, [played]);
  useRound((s) => s.sessionId);
  return played ? <Redirect href="/daily/result" /> : null;
}
