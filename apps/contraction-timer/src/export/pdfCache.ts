import { File } from 'expo-file-system';
import { DAY } from '@/domain/defaults';
import { db } from '@/store/storage';

/** Plan §11: PDFs are written to the cache and deleted after 24 hours. Nothing is uploaded. */
export const PDF_KEEP_MS = DAY;

export function rememberPdf(uri: string, now: number = Date.now()): void {
  const kept = (db.get('pdfCache') ?? []).filter((p) => p.uri !== uri);
  db.set('pdfCache', [...kept, { uri, at: now }]);
}

/** Deletes the PDFs made more than a day ago (cold start, and after each new one). Never throws. */
export function cleanPdfCache(now: number = Date.now()): number {
  const all = db.get('pdfCache') ?? [];
  const keep: typeof all = [];
  let removed = 0;
  for (const p of all) {
    // A clock set back makes `at` look like the future: keep those until the day really passes.
    if (now - p.at < PDF_KEEP_MS) {
      keep.push(p);
      continue;
    }
    try {
      const file = new File(p.uri);
      if (file.exists) file.delete();
      removed++;
    } catch {
      keep.push(p); // could not delete it this time; try again at the next launch
    }
  }
  if (keep.length !== all.length) db.set('pdfCache', keep);
  return removed;
}
