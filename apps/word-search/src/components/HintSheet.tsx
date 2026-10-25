import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Lightbulb from 'lucide-react-native/icons/lightbulb';
import { isRewardedReady, showRewarded } from '@shared/ads';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button } from '@shared/ui';
import { REWARD_HINTS } from '@/domain/hints';
import { useHints } from '@/store/hints';
import { useAppColors } from '@/theme/mode';
import { AppText } from '@/ui/AppText';
import { GameButton } from '@/ui/GameButton';
import { Sheet } from '@/ui/Sheet';

export const HINT_REWARDED_PLACEMENT = 'hint_refill';

type Stage = 'offer' | 'loading' | 'earned' | 'noVideo' | 'notEarned';

/**
 * "Out of hints" (plan §8.5). Offers a short video for 2 more hints. The reward is granted only
 * when the SDK reports it earned. With no video ready, says so and gives one courtesy hint a day,
 * so a missing ad never leaves the player stuck.
 */
export function HintSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, type } = useTheme();
  const app = useAppColors();
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
    <Sheet visible={visible} onClose={onClose} title={t('hints.outTitle')}>
      <View style={[styles.bulb, { backgroundColor: app.gold, borderColor: app.goldEdge }]} importantForAccessibility="no-hide-descendants">
        <Lightbulb size={34} color={app.onGold} strokeWidth={2.4} />
      </View>
      <AppText accessibilityLiveRegion="polite" style={[type.bodyLarge, { color: colors.text }]}>
        {body[stage]}
      </AppText>
      {stage === 'offer' ? (
        <>
          <GameButton label={t('hints.watch')} onPress={() => void watch()} />
          <Button variant="ghost" label={t('hints.noThanks')} onPress={onClose} />
        </>
      ) : stage === 'loading' ? null : (
        <GameButton label={t('common.done')} onPress={onClose} />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  bulb: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
});
