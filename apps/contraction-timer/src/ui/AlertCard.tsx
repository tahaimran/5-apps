import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@shared/theme';
import type { IconComponent } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { AppText } from './AppText';
import { CSS_EASE_OUT, RISE_IN, RISE_MS } from './motion';

/**
 * The soft amber card (plan §7): the pattern banner, the long-contraction note, the idle prompt and
 * the kick 2-hour message. Never a dialog and never red. It rises in once when it appears (a one-shot
 * CSS keyframe; with Reduce Motion it is simply there) and is announced politely.
 */
export function AlertCard({ icon: Icon, title, children, actions }: { icon: IconComponent; title?: string; children: ReactNode; actions?: ReactNode }) {
  const { radius, spacing, type } = useTheme();
  const app = useAppColors();
  const reduced = useReducedMotion();
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: app.alertBg, gap: spacing.md },
        reduced ? null : { animationName: RISE_IN, animationDuration: RISE_MS, animationTimingFunction: CSS_EASE_OUT },
      ]}
    >
      <View style={[styles.row, { gap: spacing.md }]}>
        <Icon size={24} color={app.alertIcon} strokeWidth={2.25} />
        <View style={[styles.flex, { gap: spacing.xs }]}>
          {title ? <AppText style={[type.bodyLarge, { color: app.alertText, fontWeight: '700' }]}>{title}</AppText> : null}
          {typeof children === 'string' ? <AppText style={[type.bodyLarge, { color: app.alertText, fontWeight: title ? '400' : '600' }]}>{children}</AppText> : children}
        </View>
      </View>
      {actions ? <View style={[styles.actions, { gap: spacing.sm }]}>{actions}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap' },
});
