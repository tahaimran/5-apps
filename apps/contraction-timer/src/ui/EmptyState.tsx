import { StyleSheet } from 'react-native';
import { useTheme } from '@shared/theme';
import { Card, type IconComponent } from '@shared/ui';
import { AppText } from './AppText';
import { IconCircle } from './SettingsRow';

/** A calm empty list: an icon on a soft circle and one sentence. */
export function EmptyState({ icon, text }: { icon: IconComponent; text: string }) {
  const { colors, spacing, type } = useTheme();
  return (
    <Card style={[styles.card, { gap: spacing.md, paddingVertical: spacing.xl }]}>
      <IconCircle icon={icon} size={56} />
      <AppText style={[type.bodyLarge, { color: colors.text, textAlign: 'center' }]}>{text}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({ card: { alignItems: 'center' } });
