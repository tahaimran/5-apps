import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** The week number on a soft disc (the week list's picture; the bundled emoji are not used as icons). */
export function WeekBadge({ week, current, size = 44 }: { week: number; current?: boolean; size?: number }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.center, { width: size, height: size, borderRadius: size / 2, backgroundColor: current ? colors.primary : colors.primarySoft }]}>
      <AppText style={{ fontSize: Math.round(size * 0.4), lineHeight: Math.round(size * 0.5), color: current ? colors.onPrimary : colors.primary, fontFamily: fonts.display, fontWeight: '800' }}>{week}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
