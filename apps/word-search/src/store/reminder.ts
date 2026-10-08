import { create } from 'zustand';
import { defaultReminderPrompt } from '@/domain/defaults';
import type { ReminderPrompt } from '@/domain/types';
import { db } from './storage';

interface PromptState {
  prompt: ReminderPrompt;
  /** A real puzzle was finished. */
  recordCompletion: () => void;
  /** The pre-prompt was shown (counts as one ask whatever the answer). */
  recordAsk: (now?: number) => void;
  reset: () => void;
}

/** What the reminder pre-prompt remembers (`ws.reminderPrompt`). */
export const useReminderPrompt = create<PromptState>((set, get) => {
  const save = (prompt: ReminderPrompt) => {
    db.set('reminderPrompt', prompt);
    set({ prompt });
  };
  return {
    prompt: { ...defaultReminderPrompt(), ...db.get('reminderPrompt') },
    recordCompletion: () => save({ ...get().prompt, completions: get().prompt.completions + 1 }),
    recordAsk: (now = Date.now()) => save({ ...get().prompt, askCount: get().prompt.askCount + 1, askedAt: now }),
    reset: () => {
      db.remove('reminderPrompt');
      set({ prompt: defaultReminderPrompt() });
    },
  };
});
