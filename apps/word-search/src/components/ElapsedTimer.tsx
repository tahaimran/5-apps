import { useEffect, useState } from 'react';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { useGame } from '@/store/game';
import { AppText } from '@/ui/AppText';

export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The optional timer (Settings → Show timer). Display only: stars never depend on time. */
export function ElapsedTimer() {
  const { colors, type } = useTheme();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const { current, activeSince } = useGame.getState();
  const ms = (current?.elapsedMs ?? 0) + (activeSince ? Date.now() - activeSince : 0);
  return (
    <AppText accessibilityLabel={t('game.timerLabel', { time: formatClock(ms) })} style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>
      {formatClock(ms)}
    </AppText>
  );
}
