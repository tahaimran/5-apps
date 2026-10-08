import { create } from 'zustand';
import { defaultReview } from '@/domain/defaults';
import type { ReviewState } from '@/domain/types';
import { db } from './storage';

interface ReviewStore {
  review: ReviewState;
  recordPrompt: (now?: number) => void;
}

/** In-app review gating (`ws.review`). */
export const useReview = create<ReviewStore>((set, get) => ({
  review: { ...defaultReview(), ...db.get('review') },
  recordPrompt: (now = Date.now()) => {
    const review = { ...get().review, lastPromptAt: now, promptCount: get().review.promptCount + 1, positiveMoments: 0 };
    db.set('review', review);
    set({ review });
  },
}));
