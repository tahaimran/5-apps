import { create } from 'zustand';
import { defaultUnlocks } from '@/domain/defaults';
import { FREE_PDF_THEME, PDF_THEMES, type PdfThemeId } from '@/domain/pdf';
import type { Unlocks } from '@/domain/types';
import { db } from './storage';

interface UnlocksState {
  unlocks: Unlocks;
  /** The look picked for the PDF (falls back to Clean when it is not unlocked). */
  selectedPdfTheme: PdfThemeId;
  selectPdfTheme: (id: PdfThemeId) => void;
  /** A rewarded video was completed: this look is yours for good. */
  unlockPdfTheme: (id: PdfThemeId) => void;
  unlockChecklistTemplate: (id: string) => void;
  reset: () => void;
}

const load = (): Unlocks => ({ ...defaultUnlocks(), ...db.get('unlocks') });

export const isPdfThemeUnlocked = (u: Unlocks, id: PdfThemeId): boolean => PDF_THEMES[id].free || u.pdfThemes.includes(id);

/** Rewarded unlocks (`ct.unlocks`): permanent once earned. "Delete all data" removes them with everything else. */
export const useUnlocks = create<UnlocksState>((set, get) => {
  const save = (unlocks: Unlocks) => {
    db.set('unlocks', unlocks);
    set({ unlocks });
  };
  return {
    unlocks: load(),
    selectedPdfTheme: FREE_PDF_THEME,
    selectPdfTheme: (id) => set({ selectedPdfTheme: isPdfThemeUnlocked(get().unlocks, id) ? id : FREE_PDF_THEME }),
    unlockPdfTheme: (id) => {
      if (!get().unlocks.pdfThemes.includes(id) && !PDF_THEMES[id].free) save({ ...get().unlocks, pdfThemes: [...get().unlocks.pdfThemes, id] });
      set({ selectedPdfTheme: id });
    },
    unlockChecklistTemplate: (id) => {
      if (!get().unlocks.checklistTemplates.includes(id)) save({ ...get().unlocks, checklistTemplates: [...get().unlocks.checklistTemplates, id] });
    },
    reset: () => {
      db.remove('unlocks');
      set({ unlocks: defaultUnlocks(), selectedPdfTheme: FREE_PDF_THEME });
    },
  };
});

/** The PDF look in use: the picked one if it is unlocked, else Clean. */
export function usePdfTheme(): { id: PdfThemeId } {
  const unlocks = useUnlocks((s) => s.unlocks);
  const selected = useUnlocks((s) => s.selectedPdfTheme);
  return { id: isPdfThemeUnlocked(unlocks, selected) ? selected : FREE_PDF_THEME };
}
