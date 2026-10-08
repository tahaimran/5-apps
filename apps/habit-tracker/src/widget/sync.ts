import { requestWidgetUpdate } from 'react-native-android-widget';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { useToday } from '@/store/today';
import { persistSnapshot, widgetRepresentation, WIDGET_NAME } from './render';

/** Writes the snapshot and redraws every placed widget. Safe to call when none is placed. */
export async function refreshWidget(): Promise<void> {
  try {
    persistSnapshot();
    await requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: (info) => widgetRepresentation(info) });
  } catch {
    // No widget host (tests, other platforms): nothing to update.
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
const schedule = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void refreshWidget(), 150);
};

/** Redraws the widget shortly after any change that affects it. Mount once at app start. */
export function startWidgetSync(): () => void {
  const unsubscribe = [useHabits.subscribe(schedule), useSettings.subscribe(schedule), useToday.subscribe(schedule)];
  schedule();
  return () => {
    unsubscribe.forEach((u) => u());
    if (timer) clearTimeout(timer);
  };
}
