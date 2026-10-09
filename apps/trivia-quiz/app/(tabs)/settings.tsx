import { t } from '@shared/i18n';
import { useAdScreen } from '@/ads/guard';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';

export default function Tab() {
  useAdScreen('settings');
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('settings.title')}</AppText>
    </Screen>
  );
}
