import { t } from '@shared/i18n';
import type { Schedule } from '@/domain/types';

export function scheduleLabel(schedule: Schedule): string {
  switch (schedule.kind) {
    case 'daily':
      return t('schedule.daily');
    case 'weekdays':
      return t('schedule.weekdays', { count: schedule.days.length });
    case 'perWeek':
      return t('schedule.perWeek', { count: schedule.times });
  }
}
