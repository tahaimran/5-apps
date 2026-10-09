import { View } from 'react-native';
import { router } from 'expo-router';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

/** A title with a Back button (the stack headers are off so every control is big and labelled by the app). */
export function ScreenHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <IconButton icon="arrow-left" label={t('common.back')} onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} />
      <AppText accessibilityRole="header" numberOfLines={2} style={[type.headline, { color: colors.text, fontWeight: '700', flex: 1 }]}>
        {title}
      </AppText>
    </View>
  );
}
