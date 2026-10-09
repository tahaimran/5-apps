import { Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { t } from '@shared/i18n';
import { cleanPdfCache, rememberPdf } from './pdfCache';

/** Opens the system share sheet with plain text (works offline; the person picks where it goes). */
export async function shareText(text: string): Promise<boolean> {
  try {
    const result = await Share.share({ message: text, title: t('summary.shareTitle') });
    return result.action !== Share.dismissedAction;
  } catch {
    return false;
  }
}

export type PdfResult = 'shared' | 'unavailable' | 'error';

/** Makes the PDF on the phone with expo-print, then hands the file to the share sheet. */
export async function sharePdf(html: string): Promise<PdfResult> {
  try {
    const { uri } = await Print.printToFileAsync({ html });
    rememberPdf(uri);
    cleanPdfCache();
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: t('summary.shareDialog'), UTI: 'com.adobe.pdf' });
    return 'shared';
  } catch {
    return 'error';
  }
}
