import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { PressableScale, Toggle, type IconComponent } from '@shared/ui';
import { useAppColors } from '@/theme/mode';
import { AppText } from './AppText';

const CIRCLE = 40;

/** An icon on a soft tinted circle (list rows, stat tiles). */
export function IconCircle({ icon: Icon, tint, bg, size = CIRCLE }: { icon: IconComponent; tint?: string; bg?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? colors.primarySoft }]}>
      <Icon size={Math.round(size * 0.5)} color={tint ?? colors.primary} strokeWidth={2.25} />
    </View>
  );
}

/** A titled card of rows separated by hairlines (settings sections, the More list). */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  const { colors, radius, spacing, type, shadow, mode } = useTheme();
  const app = useAppColors();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? (
        // Capitals by style only, so a screen reader reads the words (not letters) and tests see the real text.
        <AppText accessibilityRole="header" style={[type.caption, { color: colors.textMuted, fontWeight: '700', marginLeft: spacing.xs, letterSpacing: 0.6, textTransform: 'uppercase' }]}>
          {title}
        </AppText>
      ) : null}
      <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }, mode === 'high-contrast' ? { borderWidth: 2, borderColor: colors.border } : shadow(1)]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: app.divider, marginLeft: spacing.lg }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const rowStyle = (touchTarget: number, spacing: { lg: number; sm: number; md: number }) => [
  styles.row,
  { minHeight: touchTarget + 8, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md },
];

/** A tappable row: icon, label (and a detail line), optional value and a chevron. `tone="danger"` for Delete. */
export function NavRow({
  icon,
  label,
  detail,
  value,
  onPress,
  tint,
  bg,
  tone,
  accessibilityHint,
  accessibilityLabel,
}: {
  icon: IconComponent;
  label: string;
  detail?: string;
  value?: string;
  onPress: () => void;
  tint?: string;
  bg?: string;
  tone?: 'danger';
  accessibilityHint?: string;
  /** Spoken instead of "label, detail, value" when that would read awkwardly. */
  accessibilityLabel?: string;
}) {
  const { colors, spacing, type, touchTarget } = useTheme();
  const danger = tone === 'danger';
  const spoken = accessibilityLabel ?? [label, detail, value].filter(Boolean).join(', ');
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={spoken} accessibilityHint={accessibilityHint} onPress={onPress} scaleTo={0.98} style={rowStyle(touchTarget, spacing)}>
      <IconCircle icon={icon} tint={danger ? colors.danger : tint} bg={danger ? colors.surfaceAlt : bg} />
      <View style={styles.label}>
        <AppText style={[type.bodyLarge, { color: danger ? colors.danger : colors.text, fontWeight: '600' }]}>{label}</AppText>
        {detail ? <AppText style={[type.body, { color: colors.textMuted }]}>{detail}</AppText> : null}
      </View>
      {value ? <AppText style={[type.body, styles.value, { color: colors.textMuted }]}>{value}</AppText> : null}
      {danger ? null : <ChevronRight size={20} color={colors.textMuted} strokeWidth={2.25} />}
    </PressableScale>
  );
}

/** A label with a Toggle on the right (and an optional icon and hint). */
export function SwitchRow({
  label,
  value,
  onChange,
  hint,
  icon,
  tint,
  bg,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
  icon?: IconComponent;
  tint?: string;
  bg?: string;
}) {
  const { colors, spacing, type, touchTarget } = useTheme();
  return (
    <View style={rowStyle(touchTarget, spacing)}>
      {icon ? <IconCircle icon={icon} tint={tint} bg={bg} /> : null}
      <View style={styles.flex}>
        <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '600' }]}>{label}</AppText>
        {hint ? <AppText style={[type.body, { color: colors.textMuted }]}>{hint}</AppText> : null}
      </View>
      {/* Plan §5.6: every switch also says On or Off in words. */}
      <AppText style={[type.body, { color: colors.textMuted, fontWeight: '700' }]}>{value ? t('common.on') : t('common.off')}</AppText>
      <Toggle label={label} value={value} onValueChange={onChange} />
    </View>
  );
}

/** Any custom content laid out like a row (a segmented control, a stepper, a time field). */
export function RowBlock({ label, icon, tint, bg, children }: { label?: string; icon?: IconComponent; tint?: string; bg?: string; children: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm }}>
      {label ? (
        <View style={[styles.row, { gap: spacing.md }]}>
          {icon ? <IconCircle icon={icon} tint={tint} bg={bg} /> : null}
          <AppText style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '600' }]}>{label}</AppText>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A small stat: icon circle, a big value and a label. Tappable when it can explain itself. */
export function StatTile({
  icon,
  value,
  label,
  tint,
  bg,
  onPress,
  accessibilityHint,
}: {
  icon: IconComponent;
  value: string;
  label: string;
  tint?: string;
  bg?: string;
  onPress?: () => void;
  accessibilityHint?: string;
}) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const body = (
    <>
      <IconCircle icon={icon} tint={tint} bg={bg} size={34} />
      <AppText style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{label}</AppText>
      <AppText style={[type.bodyLarge, { color: colors.text, fontWeight: '800', fontFamily: fonts.display, fontVariant: ['tabular-nums'] }]}>{value}</AppText>
    </>
  );
  const style = [styles.tile, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs }, shadow(1)];
  return onPress ? (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} accessibilityHint={accessibilityHint} onPress={onPress} scaleTo={0.97} style={style}>
      {body}
    </PressableScale>
  ) : (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={style}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  // The label keeps at least half the row; a long value wraps within the rest instead of squeezing it.
  label: { flex: 1, minWidth: '50%' },
  value: { flexShrink: 1, maxWidth: '45%', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth },
  tile: { flexGrow: 1, flexBasis: 96, minHeight: 56 },
});
