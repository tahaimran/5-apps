import HeartHandshake from 'lucide-react-native/icons/heart-handshake';
import Share2 from 'lucide-react-native/icons/share-2';
import { t } from '@shared/i18n';
import { Button } from '@shared/ui';
import { RULE_PRESETS } from '@/domain/defaults';
import type { PatternRule } from '@/domain/types';
import { AlertCard } from '@/ui/AlertCard';

export const ruleName = (rule: PatternRule): string | null => (rule.preset === 'custom' ? null : { '511': '5-1-1', '411': '4-1-1', '311': '3-1-1' }[rule.preset]);

/**
 * Plan §5.1 "Pattern matched": a soft amber card (never a dialog) saying the recent contractions match the
 * rule the person chose, and that it may be time to call their provider. It does not say anything about labor.
 */
export function PatternBanner({ rule, onShare, onDismiss }: { rule: PatternRule; onShare?: () => void; onDismiss: () => void }) {
  const name = ruleName(rule);
  return (
    <AlertCard
      icon={HeartHandshake}
      actions={
        <>
          {onShare ? <Button icon={Share2} label={t('pattern.share')} onPress={onShare} style={{ flexGrow: 1 }} /> : null}
          <Button variant="secondary" label={t('pattern.dismiss')} onPress={onDismiss} style={{ flexGrow: 1 }} />
        </>
      }
    >
      {name ? t('pattern.banner', { rule: name }) : t('pattern.bannerCustom')}
    </AlertCard>
  );
}

export { RULE_PRESETS };
