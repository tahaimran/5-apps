import React from 'react';
import type { WidgetInfo, WidgetRepresentation } from 'react-native-android-widget';
import { sharedStore } from '@shared/storage';
import { buildSnapshot } from '@/domain/widgetSnapshot';
import type { WidgetSnapshot } from '@/domain/types';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { db } from '@/store/storage';
import { useToday } from '@/store/today';
import { dayKeyFor } from '@/domain/dayKey';
import { rowsFor, TodayWidget, widgetColors } from './TodayWidget';

export const WIDGET_NAME = 'TodayWidget';

/** Builds the snapshot from the live stores (fresh day key, so a stale widget rolls over). */
export function currentSnapshot(theme: 'light' | 'dark' = 'light'): WidgetSnapshot {
  const { dayEndsAtHour, weekStartsOn } = useSettings.getState().settings;
  const { habits, habitOrder, entries } = useHabits.getState();
  const day = dayKeyFor(new Date(), dayEndsAtHour);
  if (useToday.getState().today !== day) useToday.getState().refresh();
  return buildSnapshot({ habits, habitOrder, entries, day, weekStartsOn, theme, now: Date.now() });
}

/** Follows the app's theme setting; with "System" the launcher picks light or dark. */
export function widgetRepresentation(info?: Pick<WidgetInfo, 'height'>): WidgetRepresentation {
  const snapshot = currentSnapshot();
  const rows = rowsFor(info?.height ?? 110);
  const element = (mode: 'light' | 'dark') => (
    <TodayWidget snapshot={{ ...snapshot, theme: mode }} colors={widgetColors(mode)} maxRows={rows} />
  );
  const preference = sharedStore.get('theme.mode');
  if (preference === 'light' || preference === 'dark') return element(preference);
  return { light: element('light'), dark: element('dark') };
}

/** Persists the compact snapshot (`widget:snapshot`) the plan's data contract describes. */
export function persistSnapshot(): WidgetSnapshot {
  const snapshot = currentSnapshot();
  db.set('widget:snapshot', snapshot);
  return snapshot;
}
