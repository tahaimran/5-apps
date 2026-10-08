import { create } from 'zustand';
import type { DayKey, DayNote } from '@/domain/types';
import { db } from './storage';

export const NOTE_MAX = 1000;

interface NotesState {
  notes: Record<DayKey, DayNote>;
  /** Saves the day's note. An empty note with no mood removes it. */
  setNote: (day: DayKey, text: string, mood?: DayNote['mood']) => void;
  /** Replaces all notes (restore from backup). */
  replaceAll: (notes: Record<DayKey, DayNote>) => void;
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: db.get('notes') ?? {},
  replaceAll: (notes) => {
    db.set('notes', notes);
    set({ notes });
  },
  setNote: (day, text, mood) => {
    const notes = { ...get().notes };
    const trimmed = text.trim().slice(0, NOTE_MAX);
    if (trimmed === '' && mood === undefined) delete notes[day];
    else notes[day] = { text: trimmed, mood, updatedAt: Date.now() };
    db.set('notes', notes);
    set({ notes });
  },
}));
