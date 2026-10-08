import React, { useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { sharedStore } from '../storage';
import { t } from '../i18n';
import { useTheme } from '../theme';
import { playStoreUrl, promoIds, type PromoAppId } from './catalog';

export { promoIds, type PromoAppId } from './catalog';

let configuredApp: PromoAppId | null = null;

/** Call once at startup so house ads never promote the app to itself. */
export function setCurrentApp(id: PromoAppId): void {
  configuredApp = id;
}

export interface HouseAdCardProps {
  /** Overrides the app set with `setCurrentApp`. */
  currentApp?: PromoAppId;
}

/** Picks the next promo in rotation, skipping the current app. Advances once per mount. */
function useNextPromo(currentApp: PromoAppId | null): PromoAppId {
  const picked = useRef<PromoAppId | null>(null);
  if (picked.current === null) {
    const others = promoIds.filter((id) => id !== currentApp);
    const cursor = sharedStore.get('crosspromo.cursor') ?? 0;
    picked.current = others[cursor % others.length];
    sharedStore.set('crosspromo.cursor', cursor + 1);
  }
  return picked.current;
}

/**
 * Free house ad for the other 4 apps. Only render this where a native ad failed to fill
 * (`<NativeAdCard>` does that for you). Styled like the native card, with a badge.
 */
export function HouseAdCard({ currentApp = configuredApp ?? undefined }: HouseAdCardProps) {
  const { colors, spacing, radius, type, touchTarget } = useTheme();
  const id = useNextPromo(currentApp ?? null);
  const name = t(`shared.crosspromo.apps.${id}.name`);
  const tagline = t(`shared.crosspromo.apps.${id}.tagline`);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${name}. ${tagline}. ${t('shared.crosspromo.install')}`}
      onPress={() => Linking.openURL(playStoreUrl(id)).catch(() => undefined)}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.lg,
          minHeight: touchTarget,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors.border, borderRadius: radius.sm }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{t('shared.crosspromo.badge')}</Text>
      </View>
      <Text style={[type.title, { color: colors.text, marginTop: spacing.sm }]}>{name}</Text>
      <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.xs }]}>{tagline}</Text>
      <View
        style={[
          styles.cta,
          { backgroundColor: colors.primary, borderRadius: radius.pill, minHeight: touchTarget, marginTop: spacing.md },
        ]}
      >
        <Text style={[type.body, { color: colors.onPrimary, fontWeight: '600' }]}>
          {t('shared.crosspromo.install')}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cta: { alignSelf: 'flex-start', paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
});
