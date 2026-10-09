import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { t } from '@shared/i18n';
import { useAds } from '@/store/ads';

/** "Quizora Daily · Oct 8 · 9/10 🔥12" (plan §13). */
export const shareText = (date: string, score: number, streak: number): string =>
  streak > 0 ? t('share.textStreak', { date, score, streak }) : t('share.text', { date, score });

/**
 * Shares the captured card as an image when the system can, and the text line otherwise. Never throws:
 * a failed or cancelled share is not an error worth showing.
 */
export async function shareDaily(capture: () => Promise<string>, text: string): Promise<'image' | 'text' | 'none'> {
  // Returning from the share sheet must not trigger an app-open ad (plan §12).
  useAds.getState().markExternalOpen();
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(await capture(), { mimeType: 'image/png', dialogTitle: t('share.dialogTitle') });
      useAds.getState().markExternalOpen();
      return 'image';
    }
  } catch {
    // fall through to text
  }
  try {
    await Share.share({ message: text });
    useAds.getState().markExternalOpen();
    return 'text';
  } catch {
    return 'none';
  }
}
