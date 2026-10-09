import { t } from '@shared/i18n';
import { AppText } from '@/ui/AppText';
import { BannerSlot } from '@/ui/BannerSlot';
import { Screen } from '@/ui/Screen';

export default function Tab() {
  return (
    <Screen footer={<BannerSlot placement="menu" />}>
      <AppText variant="h1" accessibilityRole="header">{t('settings.title')}</AppText>
    </Screen>
  );
}
