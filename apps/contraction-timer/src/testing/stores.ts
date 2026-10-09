import './mocks';
import { db } from '@/store/storage';
import { MINUTE, SECOND, series, sessionOf } from './fixtures';
import { defaultMeta, defaultProfile, defaultSettings } from '@/domain/defaults';
import { dateKeyFor } from '@/domain/dateKey';
import { useMeta } from '@/store/meta';
import { useProfile } from '@/store/profile';
import { useAds } from '@/store/ads';
import { useChecklists } from '@/store/checklists';
import { useKicks } from '@/store/kicks';
import { useUnlocks } from '@/store/unlocks';
import { defaultUnlocks } from '@/domain/defaults';
import { useSessions } from '@/store/sessions';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { resetDisk, resetNotifMock } from './mocks';

/** Back to a fresh install between tests (the fake disk and every store). */
export function resetApp(now: Date = new Date()) {
  resetDisk();
  useSettings.setState({ settings: defaultSettings });
  useProfile.setState({ profile: defaultProfile() });
  useMeta.setState({ meta: defaultMeta(now.getTime()) });
  useSessions.setState({ active: null, index: [], archived: {}, restored: false });
  useKicks.setState({ active: null, history: [] });
  useChecklists.setState({ lists: {} });
  useUnlocks.setState({ unlocks: defaultUnlocks(), selectedPdfTheme: 'clean' });
  useAds.setState({ lastFullScreenAt: 0, screen: 'other', keyboardOpen: false, lastExternalOpenAt: 0, articleClosedAt: 0, articleReadMs: 0 });
  useToday.setState({ today: dateKeyFor(now) });
  resetNotifMock();
}

/** A filed session with `n` contractions 5 minutes apart whose last one began 2 minutes before it ended `endsAgo` ms ago. */
export function seedSession(id: string, endsAgo: number, n = 4, extra: Record<string, unknown> = {}, now: number = Date.now()) {
  const cs = series(now - endsAgo, n, 5 * MINUTE, 60 * SECOND, 2 * MINUTE);
  const s = { ...sessionOf(cs, { id, ...extra }), endedAt: now - endsAgo };
  db.set(`session.${id}`, s);
  db.set('sessions.index', [id, ...(db.get('sessions.index') ?? [])]);
  useSessions.setState({ index: [id, ...useSessions.getState().index], archived: { ...useSessions.getState().archived, [id]: s } });
  return s;
}
