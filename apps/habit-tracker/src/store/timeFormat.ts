import { useMemo } from 'react';
import { t } from '@shared/i18n';
import { deviceTimeFormat, formatHour, formatTime, type TimeFormat } from '@/domain/timeFormat';
import { useSettings } from './settings';

/** The clock style in use (the user's choice, else the phone's) and formatters bound to it. */
export function useTimeFormat() {
  const chosen = useSettings((s) => s.settings.timeFormat);
  return useMemo(() => {
    const format: TimeFormat = chosen ?? deviceTimeFormat();
    const periods = { am: t('time.am'), pm: t('time.pm') };
    return {
      format,
      periods,
      time: (hhmm: string) => formatTime(hhmm, format, periods),
      hour: (hr: number) => formatHour(hr, format, periods),
    };
  }, [chosen]);
}
