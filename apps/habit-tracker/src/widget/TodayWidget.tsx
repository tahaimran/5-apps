import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

/** Placeholder; the interactive Today widget (DEVELOPMENT_PLAN.md §11) lands in milestone 5. */
export function TodayWidget() {
  return (
    <FlexWidget
      style={{ height: 'match_parent', width: 'match_parent', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16 }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'habittracker://today' }}
    >
      <TextWidget text="Habits" style={{ fontSize: 16, color: '#1B1D22' }} />
    </FlexWidget>
  );
}
