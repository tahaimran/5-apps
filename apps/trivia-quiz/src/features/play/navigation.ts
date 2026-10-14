import { router } from 'expo-router';

/** Opens the question screen for a round that was just started (replacing, so Back never returns to a finished round). */
export const openRound = (sessionId: string | null): boolean => {
  if (!sessionId) return false;
  router.push({ pathname: '/quiz/[sessionId]', params: { sessionId } });
  return true;
};

export const replaceWithRound = (sessionId: string | null): boolean => {
  if (!sessionId) return false;
  router.replace({ pathname: '/quiz/[sessionId]', params: { sessionId } });
  return true;
};

/** Back to an existing Home in the stack (replace would stack another tab navigator each round). */
export const goHome = () => router.dismissTo('/(tabs)');
