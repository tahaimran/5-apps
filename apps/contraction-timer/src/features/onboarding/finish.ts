import { dateKeyFor } from '@/domain/dateKey';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { resolveAnswers, type ResolvedSetup } from './answers';

/**
 * Saves what the setup collected (plan §6). `today` is read here, when the flow ends. Returns the resolved choices so the
 * caller knows where to land. The kick reminder is not saved here: it is turned on (and the phone's permission asked
 * for) at the moment the switch is flipped on screen 5, and saved by then.
 */
export function applyOnboardingAnswers(answers: Record<string, unknown>, now: Date = new Date()): ResolvedSetup {
  const setup = resolveAnswers(answers, dateKeyFor(now));
  const meta = useMeta.getState();
  if (setup.acknowledged) meta.acknowledgeDisclaimer(now.getTime());
  meta.update({ onboardingCompletedAt: now.getTime(), onboardingDay: dateKeyFor(now) });
  const profile = useProfile.getState();
  if (setup.due) profile.setDue(setup.due);
  profile.update({ firstBaby: setup.firstBaby, needs: setup.needs });
  if (setup.partnerMode) useSettings.getState().update({ partnerMode: true });
  return setup;
}

export const clearOnboardingResume = () => db.remove('onboarding.resume');
