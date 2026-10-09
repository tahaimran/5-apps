import { t } from '@shared/i18n';
import { ChecklistScreen } from '@/features/checklists/ChecklistScreen';

export default function HospitalBag() {
  return <ChecklistScreen id="hospitalBag" title={t('lists.bagTitle')} intro={t('lists.bagIntro')} progressText={(p) => t('pregnancy.bagProgress', { percent: p.percent })} />;
}
