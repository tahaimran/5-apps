import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Flame from 'lucide-react-native/icons/flame';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { ProgressRing } from '@shared/ui';
import { extraColorsFor } from '@/theme/tokens';

export interface TodayHeroProps {
  done: number;
  total: number;
  /** Longest current streak among the habits (0 hides the chip). */
  streak: number;
  /** Viewing a past day: the copy talks about that day instead of "today". */
  past: boolean;
}

const RING = 104;

function headlineKey(done: number, total: number, past: boolean) {
  if (done === total) return 'today.allDoneTitle';
  if (past) return 'today.hero.past';
  if (done === 0) return 'today.hero.start';
  return done / total >= 0.66 ? 'today.hero.almost' : 'today.hero.going';
}

/**
 * The one loud element on Today: a violet gradient card with the day's ring. Everything else on the
 * screen stays on quiet white cards so this reads first.
 */
export function TodayHero({ done, total, streak, past }: TodayHeroProps) {
  const { colors, radius, spacing, type, mode, shadow, fonts } = useTheme();
  const extra = extraColorsFor(mode);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const headline = t(headlineKey(done, total, past));
  const perfect = total > 0 && done === total;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${headline}. ${t('today.ringLabel', { done, total })}${streak > 0 ? `. ${t('today.hero.streak', { count: streak })}` : ''}`}
      style={[{ borderRadius: radius.xl }, shadow(3)]}
    >
      <LinearGradient
        colors={perfect ? extra.heroDone : extra.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg }]}
      >
        <View style={styles.copy}>
          <Text style={[type.title, styles.white, { fontWeight: '800' }]}>{headline}</Text>
          <Text style={[type.body, styles.soft]}>{t('today.hero.progress', { done, total })}</Text>
          {streak > 0 && (
            // White text on orange fails contrast, so the chip is frosted white and only the flame is ember.
            <View style={[styles.chip, { borderRadius: radius.pill }]}>
              <Flame size={16} color={extra.ember[0]} fill={extra.ember[0]} strokeWidth={2} />
              <Text style={[type.caption, styles.white, { fontWeight: '700' }]}>{t('today.hero.streak', { count: streak })}</Text>
            </View>
          )}
        </View>
        <ProgressRing size={RING} strokeWidth={10} progress={total === 0 ? 0 : done / total} color="#FFFFFF" trackColor="#FFFFFF33">
          {perfect ? (
            <PartyPopper size={40} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <Text style={[styles.white, styles.pct, { fontFamily: fonts.display }]}>
              {pct}
              <Text style={styles.pctSign}>%</Text>
            </Text>
          )}
        </ProgressRing>
      </LinearGradient>
      {/* Keeps the hero legible if the gradient ever fails to draw. */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius.xl, backgroundColor: perfect ? extra.heroDone[1] : colors.primary, zIndex: -1 }]} />
    </View>
  );
}

// White on the violet gradient: both stops are dark enough for 4.5:1 with white text.
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  copy: { flex: 1, gap: 6, alignItems: 'flex-start' },
  white: { color: '#FFFFFF' },
  soft: { color: '#FFFFFFD9' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, marginTop: 6, backgroundColor: '#FFFFFF2E' },
  pct: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
  pctSign: { fontSize: 16, fontWeight: '600' },
});
