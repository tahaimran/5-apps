import { forwardRef } from 'react';
import { View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { AppText } from '@/ui/AppText';

/** The picture that is shared (plan §5: a card captured as an image). Fixed colours so it looks the same in light and dark. */
export const ShareCard = forwardRef<View, { date: string; score: number; streak: number }>(function ShareCard({ date, score, streak }, ref) {
  return (
    <View ref={ref} collapsable={false}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 320, padding: 24, borderRadius: 24, backgroundColor: '#4F46E5', alignItems: 'center', gap: 8 }}>
        <AppText variant="overline" style={{ color: '#E0E7FF', fontWeight: '700' }}>{t('share.cardTitle', { date }).toUpperCase()}</AppText>
        <AppText variant="display" style={{ color: '#FFFFFF' }}>{`${score}/10`}</AppText>
        {streak > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="fire" size={28} color="#FDBA74" />
            <AppText variant="h2" style={{ color: '#FFFFFF' }}>{t('home.streak', { count: streak })}</AppText>
          </View>
        )}
        <AppText variant="caption" style={{ color: '#E0E7FF' }}>{t('share.cardFooter')}</AppText>
      </View>
    </View>
  );
});
