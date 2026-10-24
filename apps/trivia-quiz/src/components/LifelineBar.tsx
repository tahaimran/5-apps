import { StyleSheet, View } from 'react-native';
import Play from 'lucide-react-native/icons/play';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale } from '@shared/ui';
import type { LifelineKind } from '@/domain/lifelines';
import { LIFELINES } from '@/domain/lifelines';
import { extraColorsFor, frost } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { lifelineIcons } from '@/ui/icons';

export interface LifelineBarProps {
  counts: Record<LifelineKind, number>;
  /** Whether each lifeline can be used right now. */
  enabled: Record<LifelineKind, boolean>;
  /** Lifelines not available in this mode at all (Daily, warm-up) are left out. */
  shown: Record<LifelineKind, boolean>;
  /** A rewarded video can grant one more of this lifeline (shows a play badge instead of the count). */
  offer?: Partial<Record<LifelineKind, boolean>>;
  onUse: (kind: LifelineKind) => void;
  onOffer?: (kind: LifelineKind) => void;
}

/**
 * The lifeline row on the quiz stage (plan §5): frosted pills with an icon, the name and a gold count
 * badge. A spent one fades; an empty one with a video on offer shows a play badge instead of 0.
 */
export function LifelineBar({ counts, enabled, shown, offer, onUse, onOffer }: LifelineBarProps) {
  const { radius, spacing, touchTarget, mode } = useTheme();
  const x = extraColorsFor(mode);
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {LIFELINES.filter((k) => shown[k]).map((kind) => {
        const offered = !!offer?.[kind] && counts[kind] === 0;
        const usable = enabled[kind] || offered;
        const name = t(`quiz.lifeline.${kind}`);
        const label = offered ? t('quiz.lifelineOffer', { name }) : counts[kind] > 0 ? t('quiz.lifelineLeft', { name, count: counts[kind] }) : t('quiz.lifelineUsed', { name });
        const Icon = lifelineIcons[kind];
        return (
          <PressableScale
            key={kind}
            testID={`lifeline-${kind}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: !usable }}
            disabled={!usable}
            onPress={() => (offered ? onOffer?.(kind) : onUse(kind))}
            scaleTo={0.94}
            style={[styles.pill, { minHeight: touchTarget + 4, borderRadius: radius.pill, gap: spacing.xs, backgroundColor: frost, opacity: usable ? 1 : 0.45 }]}
          >
            <Icon size={18} color="#FFFFFF" strokeWidth={2.4} />
            <AppText variant="caption" style={styles.name} numberOfLines={1}>
              {name}
            </AppText>
            <View style={[styles.badge, { backgroundColor: usable ? x.gold : '#FFFFFF40' }]}>
              {offered ? (
                <Play size={11} color={x.onGold} fill={x.onGold} strokeWidth={2.5} />
              ) : (
                <AppText variant="caption" style={[styles.count, { color: usable ? x.onGold : '#FFFFFF' }]}>
                  {String(counts[kind])}
                </AppText>
              )}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

// White on the frosted stage is checked by the contrast test (the lightest stage stop under FROST).
const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  name: { color: '#FFFFFF', fontWeight: '700', flexShrink: 1 },
  badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  count: { fontWeight: '800', fontSize: 12, lineHeight: 16 },
});
