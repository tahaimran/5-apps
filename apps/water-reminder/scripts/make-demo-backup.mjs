// Builds store/demo-backup.json: believable data for store screenshots (restore it through
// Settings → Backup and restore on a clean install). The history ends on --end (default: today).
//   node scripts/make-demo-backup.mjs [--end 2026-10-08]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv.indexOf('--end');
const end = arg > -1 ? process.argv[arg + 1] : new Date().toISOString().slice(0, 10);
const [y, m, dd] = end.split('-').map(Number);
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const date = (back) => new Date(y, m - 1, dd - back);

const GOAL = 2300;
const FACTOR = { water: 1, coffee: 0.8, tea: 0.9 };
// A tiny deterministic generator keeps the file reproducible.
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

// [hour, minute, beverage, ml] for a normal day, and for today (53% of the goal at 13:20).
const FULL = [[7, 45, 'water', 250], [9, 0, 'coffee', 250], [10, 30, 'water', 300], [12, 30, 'water', 250], [15, 0, 'tea', 250], [16, 30, 'water', 350], [18, 30, 'water', 250], [20, 0, 'water', 500]];
const TODAY = [[7, 50, 'water', 300], [9, 15, 'coffee', 250], [11, 0, 'water', 250], [12, 30, 'tea', 250], [13, 20, 'water', 250]];

const logs = {};
const summaries = {};
let goalDays = 0;
let streak = 0;
let best = 0;
let run = 0;
const DAYS = 44;

for (let back = DAYS; back >= 0; back--) {
  const day = key(date(back));
  // today: the fixed list; yesterday back to 6 days ago: reached (a 6-day streak); 7 days ago missed;
  // 8-16 days ago reached (the best streak, 9); older days mix.
  const reached = back === 0 ? false : back <= 6 || (back >= 8 && back <= 16) || (back > 17 && rnd() > 0.35);
  let plan = back === 0 ? TODAY : reached ? FULL : FULL.slice(0, 3 + Math.floor(rnd() * 3));
  const entries = plan.map(([h, mi, beverage, base], i) => {
    const ml = back === 0 || !reached ? base : Math.round((base * (0.95 + rnd() * 0.15)) / 10) * 10;
    const effective = Math.round(ml * FACTOR[beverage]);
    return { id: `${day}_d${String(i).padStart(2, '0')}`, ts: new Date(y, m - 1, dd - back, h, mi).getTime(), dayKey: day, beverage, volumeMl: ml, effectiveMl: effective, source: i === 3 && back % 3 === 0 ? 'notification' : 'app' };
  });
  let total = entries.reduce((s, e) => s + e.effectiveMl, 0);
  if (reached && total < GOAL + 20) {
    const extra = Math.ceil((GOAL + 20 - total) / 10) * 10;
    entries.push({ id: `${day}_d${String(entries.length).padStart(2, '0')}`, ts: new Date(y, m - 1, dd - back, 21, 15).getTime(), dayKey: day, beverage: 'water', volumeMl: extra, effectiveMl: extra, source: 'app' });
    total += extra;
  }
  (logs[day.slice(0, 7)] ??= []).push(...entries);
  summaries[day] = { dayKey: day, effectiveMl: total, goalMl: GOAL, count: entries.length, reached: total >= GOAL };
  if (back >= 1) {
    if (summaries[day].reached) {
      goalDays++;
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
}
streak = run; // days up to yesterday

const stage = goalDays >= 21 ? 4 : goalDays >= 10 ? 3 : goalDays >= 4 ? 2 : goalDays >= 1 ? 1 : 0;
const backup = {
  app: 'water-reminder',
  schemaVersion: 1,
  exportedAt: new Date(y, m - 1, dd, 9, 41).toISOString(),
  profile: { sex: 'female', weightKg: 62, weightUnit: 'kg', activity: 'light', climate: 'mild', mode: 'standard' },
  goal: { goalMl: GOAL, source: 'calculated', unit: 'ml', updatedAt: new Date(y, m - 1, dd - DAYS).getTime() },
  reminders: { enabled: true, wakeMin: 420, bedMin: 1380, frequency: 'smart', intervalMin: 120, style: 'normal', snoozeMin: 15, skipWindowMin: 30, quietBlocks: [], activeWeekdays: [0, 1, 2, 3, 4, 5, 6] },
  cups: [
    { id: 'cup-150', ml: 150, label: 'small', icon: 'cup-water' },
    { id: 'cup-250', ml: 250, label: 'glass', icon: 'cup-water' },
    { id: 'cup-350', ml: 350, label: 'mug', icon: 'coffee-outline' },
    { id: 'cup-500', ml: 500, label: 'bottle', icon: 'bottle-tonic-outline' },
  ],
  beverages: [
    { id: 'water', factor: 1 },
    { id: 'sparkling', factor: 1 },
    { id: 'tea', factor: 0.9 },
    { id: 'milk', factor: 0.9 },
    { id: 'juice', factor: 0.85 },
    { id: 'coffee', factor: 0.8 },
  ],
  prefs: { preferredCupId: 'cup-250', largeText: false, haptics: true },
  logs,
  daySummaries: summaries,
  progress: { goalDays, stage, streak, bestStreak: best, streakFreezes: 1, lastEvaluatedDay: key(date(1)), activeSkin: 'classic', activeCupTheme: 'classic', unlocked: ['classic', 'skin:berry'] },
};
writeFileSync(resolve(root, 'store/demo-backup.json'), JSON.stringify(backup, null, 1));
console.log(`wrote store/demo-backup.json: ${Object.values(logs).flat().length} drinks, streak ${streak}, best ${best}, goal days ${goalDays}, stage ${stage}`);
