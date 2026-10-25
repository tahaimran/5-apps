import { Alert } from 'react-native';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import { t } from '@shared/i18n';
import { useTheme } from '@shared/theme';
import { Button } from '@shared/ui';
import { useGame } from '@/store/game';
import { useSettings } from '@/store/settings';
import { AppText } from '@/ui/AppText';
import { GameButton } from '@/ui/GameButton';
import { Sheet } from '@/ui/Sheet';
import { TextSizePicker } from './TextSizePicker';
import { ThemePicker } from './ThemePicker';

/** The play screen's overflow menu (plan §5.3): letter size, colors and restart. Size and colors apply at once. */
export function MenuSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors, type } = useTheme();
  const textSize = useSettings((s) => s.settings.textSize);
  const update = useSettings((s) => s.update);
  const restart = () =>
    Alert.alert(t('menu.restartTitle'), t('menu.restartBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menu.restart'),
        style: 'destructive',
        onPress: () => {
          useGame.getState().restart();
          onClose();
        },
      },
    ]);
  const heading = (key: string) => (
    <AppText accessibilityRole="header" style={[type.bodyLarge, { color: colors.text, fontWeight: '800' }]}>
      {t(key)}
    </AppText>
  );
  return (
    <Sheet visible={visible} onClose={onClose} title={t('game.menu')}>
      {heading('menu.textSize')}
      <TextSizePicker value={textSize} onChange={(size) => update({ textSize: size })} showSample={false} />
      <AppText style={[type.body, { color: colors.textMuted }]}>{t('menu.textSizeNote')}</AppText>
      {heading('menu.theme')}
      <ThemePicker />
      <Button variant="secondary" icon={RotateCcw} label={t('menu.restart')} onPress={restart} block />
      <GameButton label={t('common.done')} onPress={onClose} />
    </Sheet>
  );
}
