import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { dayKeyFor } from '@/domain/dayKey';
import type { WidgetAction } from '@/domain/widgetSnapshot';
import { rescheduleNotifications } from '@/notifications/scheduler';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';
import { persistSnapshot, widgetRepresentation } from './render';

/**
 * Runs for widget events. Taps go through the same stores as the app, so when the app is alive
 * its screens update at once, and when it is not the change is written to MMKV for next launch.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { dayEndsAtHour, weekStartsOn } = useSettings.getState().settings;
  const today = dayKeyFor(new Date(), dayEndsAtHour);

  if (props.widgetAction === 'WIDGET_CLICK') {
    const { clickAction, clickActionData } = props;
    if (clickAction === 'TOGGLE' || clickAction === 'INCREMENT') {
      const id = String(clickActionData?.id ?? '');
      // A tap on a row drawn before midnight must not land on the new day.
      if (id && clickActionData?.day === today) {
        useHabits.getState().applyWidgetAction(clickAction as WidgetAction, id, today);
      }
    }
  }

  if (props.widgetAction !== 'WIDGET_DELETED') {
    // Lazy day close (freezes) on every widget refresh, then draw.
    useHabits.getState().closeDays(today, weekStartsOn);
    persistSnapshot();
    props.renderWidget(widgetRepresentation(props.widgetInfo));
    rescheduleNotifications().catch(() => undefined);
  }
}
