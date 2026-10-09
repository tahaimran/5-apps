import { useMemo } from 'react';
import { displayWeeks, gestationOn, profileEdd, type Gestation } from '@/domain/dueDate';
import { useProfile } from '@/store/profile';
import { useToday } from '@/store/today';

export interface PregnancyView {
  edd: string | null;
  today: string;
  gestation: Gestation | null;
  /** The weeks and days to show (clamped to 44 weeks). */
  shown: { weeks: number; day: number } | null;
}

/** The due date and where the person is in the pregnancy today. `today` is the store's, refreshed at midnight and on resume. */
export function usePregnancy(): PregnancyView {
  const profile = useProfile((s) => s.profile);
  const today = useToday((s) => s.today);
  return useMemo(() => {
    const edd = profileEdd(profile);
    const gestation = edd ? gestationOn(edd, today) : null;
    return { edd, today, gestation, shown: gestation ? displayWeeks(gestation) : null };
  }, [profile, today]);
}
