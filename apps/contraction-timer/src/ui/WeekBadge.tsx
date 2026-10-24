import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** The week number on a soft disc (the week list's picture; the bundled emoji are not used as icons). */
export function WeekBadge({ week, current, size = 44 }: { week: number; current?: boolean; size?: number }) {
  const { colors, fonts } = useTheme();
  // A fixed disc: the number keeps its drawn size at any font scale (rows and headings say the week).
  const { fontScale } = useWindowDimensions();
  const scale = Math.max(1, fontScale);
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: current ? colors.primary : colors.primarySoft }]}>
      <AppText style={{ fontSize: Math.round((size * 0.4) / scale), lineHeight: Math.round((size * 0.5) / scale), color: current ? colors.onPrimary : colors.primary, fontFamily: fonts.display, fontWeight: '800' }}>{week}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
