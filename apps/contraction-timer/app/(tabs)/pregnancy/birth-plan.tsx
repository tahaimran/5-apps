import { t } from '@shared/i18n';
import { ChecklistScreen } from '@/features/checklists/ChecklistScreen';
import { BannerSlot } from '@/ui/BannerSlot';

export default function BirthPlan() {
  return <ChecklistScreen id="birthPlan" share title={t('lists.planTitle')} intro={t('lists.planIntro')} progressText={(p) => t('pregnancy.planProgress', { checked: p.checked, total: p.total })} banner={<BannerSlot placement="checklist_banner" />} />;
}
