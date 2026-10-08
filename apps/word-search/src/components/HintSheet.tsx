import { useEffect, useState } from 'react';
import { isRewardedReady, showRewarded } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { REWARD_HINTS } from '@/domain/hints';
import { useHints } from '@/store/hints';
import { AppText } from '@/ui/AppText';
import { BigButton } from '@/ui/BigButton';
import { Sheet } from '@/ui/Sheet';

export const HINT_REWARDED_PLACEMENT = 'hint_refill';

type Stage = 'offer' | 'loading' | 'earned' | 'noVideo' | 'notEarned';

/**
 * "Out of hints" (plan §8.5). Offers a short video for 2 more hints. The reward is granted only
 * when the SDK reports it earned. With no video ready, says so and gives one courtesy hint a day,
 * so a missing ad never leaves the player stuck.
 */
export function HintSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, spacing, type } = useTheme();
  const [stage, setStage] = useState<Stage>('offer');
  const [courtesy, setCourtesy] = useState(false);

  useEffect(() => {
    if (visible) {
      setStage('offer');
      setCourtesy(false);
    }
  }, [visible]);

  const watch = async () => {
    if (!isRewardedReady(HINT_REWARDED_PLACEMENT)) {
      // Nothing to show: no waiting, no spinner. One courtesy hint a day instead.
      setCourtesy(useHints.getState().courtesy());
      setStage('noVideo');
      return;
    }
    setStage('loading');
    const { rewarded } = await showRewarded(HINT_REWARDED_PLACEMENT);
    if (rewarded) {
      useHints.getState().reward();
      setStage('earned');
    } else {
      setStage('notEarned');
    }
  };

  const body: Record<Stage, string> = {
    offer: t('hints.offer', { count: REWARD_HINTS }),
    loading: t('hints.loading'),
    earned: t('hints.earned', { count: REWARD_HINTS }),
    noVideo: courtesy ? t('hints.noVideoCourtesy') : t('hints.noVideo'),
    notEarned: t('hints.notEarned'),
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <AppText accessibilityRole="header" style={[type.title, { color: colors.text, fontWeight: '700' }]}>{t('hints.outTitle')}</AppText>
      <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.textMuted, marginBottom: spacing.sm }]}>{body[stage]}</AppText>
      {stage === 'offer' ? (
        <>
          <BigButton tall label={t('hints.watch')} onPress={watch} />
          <BigButton variant="secondary" label={t('hints.noThanks')} onPress={onClose} />
        </>
      ) : stage === 'loading' ? null : (
        <BigButton tall label={t('common.done')} onPress={onClose} />
      )}
    </Sheet>
  );
}
