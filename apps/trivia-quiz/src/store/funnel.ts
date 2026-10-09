import { db } from './storage';

/** Plan §6: local funnel counters only (no network). `onb_start`, `onb_cat_done`, `onb_done`, ... */
export const logFunnel = (event: string): void => {
  const counters = db.get('funnel') ?? {};
  db.set('funnel', { ...counters, [event]: (counters[event] ?? 0) + 1 });
};
