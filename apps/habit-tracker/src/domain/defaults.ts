import type { Settings } from './types';

export const defaultSettings: Settings = {
  theme: 'system',
  weekStartsOn: 1,
  dayEndsAtHour: 0,
  haptics: true,
  dailySummary: { enabled: false, time: '08:00' },
  eveningNudge: { enabled: true, time: '20:30' },
};
