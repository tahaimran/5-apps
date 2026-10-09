import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import type { LifelineKind } from '@/domain/lifelines';
import { LIFELINES } from '@/domain/lifelines';
import { AppText } from '@/ui/AppText';

const ICONS: Record<LifelineKind, string> = { fifty: 'format-list-checks', skip: 'skip-next-outline', time: 'timer-plus-outline' };

export interface LifelineBarProps {
  counts: Record<LifelineKind, number>;
  /** Whether each lifeline can be used right now. */
  enabled: Record<LifelineKind, boolean>;
  /** Lifelines not available in this mode at all (Daily, warm-up) are left out. */
  shown: Record<LifelineKind, boolean>;
  /** A rewarded video can grant one more of this lifeline (shows a play icon instead of the count). */
  offer?: Partial<Record<LifelineKind, boolean>>;
  onUse: (kind: LifelineKind) => void;
  onOffer?: (kind: LifelineKind) => void;
}

/** The lifeline row (plan §5): used ones are greyed, an empty one with a video on offer shows a play icon. */
export function LifelineBar({ counts, enabled, shown, offer, onUse, onOffer }: LifelineBarProps) {
  const { colors, radius, spacing, touchTarget } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {LIFELINES.filter((k) => shown[k]).map((kind) => {
        const offered = !!offer?.[kind] && counts[kind] === 0;
        const usable = enabled[kind] || offered;
        const name = t(`quiz.lifeline.${kind}`);
        const label = offered ? t('quiz.lifelineOffer', { name }) : counts[kind] > 0 ? t('quiz.lifelineLeft', { name, count: counts[kind] }) : t('quiz.lifelineUsed', { name });
        return (
          <Pressable
            key={kind}
            testID={`lifeline-${kind}`}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: !usable }}
            disabled={!usable}
            onPress={() => (offered ? onOffer?.(kind) : onUse(kind))}
            style={{
              flex: 1,
              minHeight: touchTarget,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: usable ? colors.primary : colors.border,
              backgroundColor: colors.surface,
              opacity: usable ? 1 : 0.45,
            }}
          >
            <MaterialCommunityIcons name={ICONS[kind] as 'timer-plus-outline'} size={20} color={usable ? colors.primary : colors.textMuted} />
            <AppText variant="caption" style={{ color: usable ? colors.primary : colors.textMuted, fontWeight: '700' }}>{name}</AppText>
            {offered ? <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.primary} /> : <AppText variant="caption" style={{ color: colors.textMuted, fontWeight: '700' }}>{String(counts[kind])}</AppText>}
          </Pressable>
        );
      })}
    </View>
  );
}
