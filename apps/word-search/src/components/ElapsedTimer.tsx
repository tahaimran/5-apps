import { useEffect, useState } from 'react';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Digits } from '@shared/ui';
import { useGame } from '@/store/game';

export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The optional timer (Settings → Show timer). Display only: stars never depend on time. Fixed-width digits, so it never shifts. */
export function ElapsedTimer() {
  const { colors, type } = useTheme();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const { current, activeSince } = useGame.getState();
  const ms = (current?.elapsedMs ?? 0) + (activeSince ? Date.now() - activeSince : 0);
  return <Digits value={formatClock(ms)} size={type.body.fontSize} color={colors.textMuted} fontWeight="700" accessibilityLabel={t('game.timerLabel', { time: formatClock(ms) })} />;
}
