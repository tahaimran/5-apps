import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useTheme } from '@shared/theme';
import { PressableScale, Toggle, type IconComponent } from '@shared/ui';

/** An icon on a soft tinted circle (list rows, stat tiles). */
export function IconCircle({ icon: Icon, tint, bg, size = 36 }: { icon: IconComponent; tint?: string; bg?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? colors.primarySoft }]}>
      <Icon size={Math.round(size * 0.5)} color={tint ?? colors.primary} strokeWidth={2.25} />
    </View>
  );
}

/** A titled card of rows separated by hairlines (settings sections). */
export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  const { colors, radius, spacing, type, shadow } = useTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ gap: spacing.sm }}>
      {title ? (
        <Text accessibilityRole="header" style={[type.caption, { color: colors.textMuted, fontWeight: '700', marginLeft: spacing.xs, letterSpacing: 0.4 }]}>
          {title.toUpperCase()}
        </Text>
      ) : null}
      <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' }, shadow(1)]}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border, marginLeft: spacing.lg + 36 + spacing.md }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

/** A tappable row: icon, label, optional value and a chevron. */
export function NavRow({ icon, label, value, onPress, tint, bg }: { icon: IconComponent; label: string; value?: string; onPress: () => void; tint?: string; bg?: string }) {
  const { colors, spacing, type, touchTarget } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.row, { minHeight: touchTarget + 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}
    >
      <IconCircle icon={icon} tint={tint} bg={bg} />
      <Text style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '500' }]}>{label}</Text>
      {value ? (
        <Text style={[type.body, { color: colors.textMuted, maxWidth: '45%' }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={20} color={colors.textMuted} strokeWidth={2.25} />
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
    <View style={[styles.row, { minHeight: touchTarget + 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}>
      {icon ? <IconCircle icon={icon} tint={tint} bg={bg} /> : null}
      <View style={styles.flex}>
        <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '500' }]}>{label}</Text>
        {hint ? <Text style={[type.caption, { color: colors.textMuted }]}>{hint}</Text> : null}
      </View>
      <Toggle label={label} value={value} onValueChange={onChange} />
    </View>
  );
}

/** A label on the left and a control (a time field) on the right. */
export function ControlRow({ label, icon, tint, bg, children }: { label: string; icon?: IconComponent; tint?: string; bg?: string; children: ReactNode }) {
  const { colors, spacing, type, touchTarget } = useTheme();
  return (
    <View style={[styles.row, { minHeight: touchTarget + 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md }]}>
      {icon ? <IconCircle icon={icon} tint={tint} bg={bg} /> : null}
      <Text style={[type.bodyLarge, styles.flex, { color: colors.text, fontWeight: '500' }]}>{label}</Text>
      {children}
    </View>
  );
}

/** Any custom content laid out like a row (a segmented control, a time field). */
export function RowBlock({ children }: { children: ReactNode }) {
  const { spacing } = useTheme();
  return <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm }}>{children}</View>;
}

/** A small stat: icon circle, a big value and a label (Garden, History, Settings summary). */
export function StatTile({ icon, value, label, tint, bg, onPress }: { icon: IconComponent; value: string; label: string; tint?: string; bg?: string; onPress?: () => void }) {
  const { colors, radius, spacing, type, shadow, fonts } = useTheme();
  const body = (
    <>
      <IconCircle icon={icon} tint={tint} bg={bg} size={34} />
      <Text style={[type.bodyLarge, { color: colors.text, fontWeight: '800', fontFamily: fonts.display }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]} numberOfLines={2}>
        {label}
      </Text>
    </>
  );
  const style = [styles.tile, { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs }, shadow(1)];
  return onPress ? (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${label}: ${value}`} onPress={onPress} scaleTo={0.97} style={style}>
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
  divider: { height: StyleSheet.hairlineWidth },
  tile: { flex: 1, minWidth: 96 },
});
