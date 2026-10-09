import { View } from 'react-native';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { RULE_PRESETS } from '@/domain/defaults';
import type { PatternRule } from '@/domain/types';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';

export const ruleName = (rule: PatternRule): string | null => (rule.preset === 'custom' ? null : { '511': '5-1-1', '411': '4-1-1', '311': '3-1-1' }[rule.preset]);

/**
 * Plan §5.1 "Pattern matched": a soft amber banner (never a dialog) saying the recent contractions match the
 * rule the person chose, and that it may be time to call their provider. It does not say anything about labor.
 */
export function PatternBanner({ rule, onShare, onDismiss }: { rule: PatternRule; onShare?: () => void; onDismiss: () => void }) {
  const { spacing, radius, type } = useTheme();
  const app = useAppColors();
  const name = ruleName(rule);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ padding: spacing.lg, borderRadius: radius.lg, backgroundColor: app.alertBg, gap: spacing.md }}
    >
      <AppText style={[type.bodyLarge, { color: app.alertText, fontWeight: '600' }]}>{name ? t('pattern.banner', { rule: name }) : t('pattern.bannerCustom')}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        {onShare ? <BigButton style={{ flex: 1 }} label={t('pattern.share')} onPress={onShare} /> : null}
        <BigButton style={{ flex: 1 }} variant="secondary" label={t('pattern.dismiss')} onPress={onDismiss} />
      </View>
    </View>
  );
}

export { RULE_PRESETS };
