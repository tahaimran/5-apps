import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import CalendarDays from 'lucide-react-native/icons/calendar-days';
import Play from 'lucide-react-native/icons/play';
import Timer from 'lucide-react-native/icons/timer';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, ProgressRing } from '@shared/ui';
import { extraColorsFor, frost } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { GoldButton } from '@/ui/GoldButton';

/** Two tilted question cards and a gold spark: the Daily's mark, drawn so it needs no image file. */
function CardsArt({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x="30" y="14" width="52" height="64" rx="12" fill="#FFFFFF" fillOpacity={0.22} transform="rotate(12 56 46)" />
      <Rect x="16" y="20" width="52" height="64" rx="12" fill="#FFFFFF" transform="rotate(-8 42 52)" />
      <Path d="M35 44 q0 -9 8 -9 q8 0 8 7 q0 5 -5 8 q-3 2 -3 6" stroke="#5B3FE0" strokeWidth={5.5} strokeLinecap="round" fill="none" transform="rotate(-8 42 52)" />
      <Circle cx="44.6" cy="64" r="3.6" fill="#FFC940" transform="rotate(-8 42 52)" />
      <Path d="M80 12 Q81.5 18.5 88 20 Q81.5 21.5 80 28 Q78.5 21.5 72 20 Q78.5 18.5 80 12 Z" fill="#FFC940" />
    </Svg>
  );
}

export interface DailyHeroProps {
  date: string;
  played: boolean;
  score: number;
  streak: number;
  firstDay: boolean;
  /** "7h 12m" until the next challenge (shown once today's is played). */
  backIn: { hours: number; minutes: number };
  onPlay: () => void;
  onResult: () => void;
}

/**
 * The one loud element on Home: the violet stage the quiz itself uses, with today's date, the round's
 * size and the streak, and the gold Play button. Once played it shows today's score in a ring and when
 * the next challenge arrives. White text on the stage is covered by the contrast test.
 */
export function DailyHero(p: DailyHeroProps) {
  const { radius, spacing, mode, shadow } = useTheme();
  const x = extraColorsFor(mode);
  return (
    <View style={[{ borderRadius: radius.xl }, shadow(3)]}>
      <View style={[styles.card, { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md }]}>
        <LinearGradient colors={x.stage} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.top}>
          <View style={[styles.flex, { gap: spacing.xs }]}>
            <View style={[styles.row, { gap: 6 }]}>
              <CalendarDays size={15} color="#FFFFFF" strokeWidth={2.4} />
              <AppText variant="overline" style={styles.white}>
                {t('home.dailyOverline', { date: p.date }).toUpperCase()}
              </AppText>
            </View>
            <AppText variant="h1" accessibilityRole="header" style={styles.white}>
              {t('home.dailyTitle')}
            </AppText>
            {!p.played && (
              <AppText variant="body" style={[styles.white, styles.semi]}>
                {p.firstDay || p.streak === 0 ? t('home.dailyStart') : t('home.dailyKeep', { count: p.streak })}
              </AppText>
            )}
          </View>
          {p.played ? (
            <View accessible accessibilityLabel={t('daily.scoreLabel', { score: p.score })}>
              <ProgressRing size={88} strokeWidth={9} progress={p.score / 10} color={x.gold} trackColor="#FFFFFF2E" duration={280}>
                <AppText variant="h1" style={styles.white}>{`${p.score}/10`}</AppText>
              </ProgressRing>
            </View>
          ) : (
            <CardsArt />
          )}
        </View>

        <View style={[styles.row, styles.wrap, { gap: spacing.sm }]}>
          <View style={[styles.chip, { borderRadius: radius.pill, backgroundColor: frost }]}>
            <Timer size={14} color="#FFFFFF" strokeWidth={2.4} />
            <AppText variant="caption" style={[styles.white, styles.bold]}>
              {t('home.dailyMeta')}
            </AppText>
          </View>
        </View>

        {p.played ? (
          <>
            <AppText variant="body" style={[styles.white, styles.semi]}>
              {t('home.dailyScore', { score: p.score })}. {t('home.dailyBack', { hours: p.backIn.hours, minutes: p.backIn.minutes })}
            </AppText>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('home.dailyResult')}
              onPress={p.onResult}
              scaleTo={0.96}
              style={[styles.frostButton, { borderRadius: radius.pill, backgroundColor: frost }]}
            >
              <AppText variant="body" style={[styles.white, styles.bold]}>
                {t('home.dailyResult')}
              </AppText>
            </PressableScale>
          </>
        ) : (
          <GoldButton label={t('home.dailyPlay')} onPress={p.onPlay} icon={Play} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  white: { color: '#FFFFFF' },
  bold: { fontWeight: '700' },
  semi: { fontWeight: '600' },
  frostButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
});
