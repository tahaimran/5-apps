// TEMPORARY (store screenshots via web, do not commit): the real Today widget, light and dark, for the home-screen slide.
import { View } from 'react-native';
import { currentSnapshot } from '@/widget/render';
import { TodayWidget, widgetColors } from '@/widget/TodayWidget';

export default function ShotsWidget() {
  const snap = currentSnapshot();
  return (
    <View style={{ flex: 1, backgroundColor: '#FF00FF', padding: 16, gap: 24 }}>
      {(['light', 'dark'] as const).map((m) => (
        <View key={m} style={{ width: 360, height: 280 }}>
          <TodayWidget snapshot={{ ...snap, theme: m }} colors={widgetColors(m)} maxRows={5} />
        </View>
      ))}
    </View>
  );
}
