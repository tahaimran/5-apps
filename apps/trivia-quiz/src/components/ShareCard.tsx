import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Flame from 'lucide-react-native/icons/flame';
import { t } from '@shared/i18n';
import { extraColors } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

const LIGHT = extraColors.light;

/** The picture that is shared (plan §5: a card captured as an image). Fixed colors so it looks the same in light and dark. */
export const ShareCard = forwardRef<View, { date: string; score: number; streak: number }>(function ShareCard({ date, score, streak }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.shell}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.card}>
        <LinearGradient colors={LIGHT.stage} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
        <AppText variant="overline" style={styles.soft}>
          {t('share.cardTitle', { date }).toUpperCase()}
        </AppText>
        <AppText variant="display" style={styles.score}>{`${score}/10`}</AppText>
        {streak > 0 && (
          <View style={styles.streak}>
            <Flame size={26} color={LIGHT.gold} fill={LIGHT.gold} strokeWidth={2} />
            <AppText variant="h2" style={styles.white}>
              {t('home.streak', { count: streak })}
            </AppText>
          </View>
        )}
        <AppText variant="caption" style={styles.soft}>
          {t('share.cardFooter')}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { alignSelf: 'center' },
  card: { width: 320, padding: 24, borderRadius: 28, alignItems: 'center', gap: 8, overflow: 'hidden' },
  soft: { color: '#E9E4FF', fontWeight: '700' },
  white: { color: '#FFFFFF' },
  score: { color: '#FFFFFF', fontSize: 56, lineHeight: 62 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
