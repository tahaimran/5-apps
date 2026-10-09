import { View } from 'react-native';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';

/** A short message that is read out when it appears. */
export function Toast({ message }: { message: string }) {
  const { colors, radius, spacing, type } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      accessible
      accessibilityLabel={message}
      style={{ backgroundColor: colors.text, borderRadius: radius.md, padding: spacing.md, minHeight: 56, justifyContent: 'center' }}
    >
      <AppText style={[type.bodyLarge, { color: colors.background, fontWeight: '700', textAlign: 'center' }]}>{message}</AppText>
    </View>
  );
}
