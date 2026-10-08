// Builds store/demo-backup.json: believable data for store screenshots (import it through
// Settings → Backup & restore on a clean install). The history ends on --end (default: today).
//   node scripts/make-demo-backup.mjs [--end 2026-10-08]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv.indexOf('--end');
const end = arg > -1 ? process.argv[arg + 1] : new Date().toISOString().slice(0, 10);

const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const [y, m, dd] = end.split('-').map(Number);
const endDate = new Date(y, m - 1, dd);
const day = (back) => key(new Date(y, m - 1, dd - back));

// back = days before `end`. A tiny deterministic generator keeps the file reproducible.
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const habits = [
  { id: 'demo-bed', name: 'Make my bed', icon: 'bed', color: '#7C5CFF', type: 'boolean', target: 1, schedule: { kind: 'daily' }, category: 'productivity', start: 80 },
  { id: 'demo-water', name: 'Drink water', icon: 'cup-water', color: '#0EA5E9', type: 'count', target: 8, unit: 'glasses', schedule: { kind: 'daily' }, category: 'health', start: 80 },
  { id: 'demo-read', name: 'Read', icon: 'book-open-variant', color: '#F97316', type: 'count', target: 10, unit: 'pages', schedule: { kind: 'daily' }, category: 'learning', start: 70 },
  { id: 'demo-study', name: 'Study', icon: 'school-outline', color: '#14B8A6', type: 'timer', target: 25, unit: 'min', schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, category: 'learning', start: 60 },
  { id: 'demo-gym', name: 'Strength workout', icon: 'dumbbell', color: '#EF4444', type: 'boolean', target: 1, schedule: { kind: 'perWeek', times: 3 }, category: 'fitness', start: 60 },
];

const entries = {};
for (const h of habits) {
  entries[h.id] = {};
  for (let back = h.start; back >= 0; back--) {
    const date = new Date(y, m - 1, dd - back);
    const weekday = date.getDay();
    const scheduled = h.schedule.kind !== 'weekdays' || h.schedule.days.includes(weekday);
    let value = 0;
    // A 12-day streak that ends today for the bed, water and reading habits; misses before that.
    const inStreak = back <= 11 && h.id !== 'demo-study' && h.id !== 'demo-gym';
    if (inStreak) value = h.type === 'count' ? (back === 0 ? Math.floor(h.target * 0.6) : h.target) : 1;
    else if (back === 0) value = 0;
    else if (scheduled && rnd() < 0.78) {
      if (h.type === 'count') value = rnd() < 0.8 ? h.target : Math.ceil(h.target * 0.5);
      else if (h.type === 'timer') value = Math.round((rnd() < 0.8 ? h.target : h.target * 0.7) * 60);
      else value = 1;
    } else if (h.schedule.kind === 'perWeek' && rnd() < 0.4) value = 1;
    if (h.id === 'demo-bed' && back === 12) value = 0; // the miss that started this streak
    if (h.id === 'demo-water' && back === 12) value = 0;
    if (h.id === 'demo-read' && back === 12) value = 0;
    if (value > 0) entries[h.id][day(back)] = { value, updatedAt: endDate.getTime() };
  }
}
// Today: study done at 18 of 25 minutes (a timer ring in progress).
entries['demo-study'][day(0)] = { value: 18 * 60, updatedAt: endDate.getTime() };
if (endDate.getDay() === 0 || endDate.getDay() === 6) delete entries['demo-study'][day(0)];

const backup = {
  app: 'habit-tracker',
  schemaVersion: 1,
  exportedAt: new Date(y, m - 1, dd, 8, 0).toISOString(),
  habits: habits.map(({ start, ...h }) => ({ ...h, reminders: [{ time: '19:00', notifIds: [] }], createdAt: day(start) })),
  habitOrder: habits.map((h) => h.id),
  entries,
  notes: {
    [day(1)]: { text: 'Felt great after the morning walk.', mood: 5, updatedAt: endDate.getTime() },
    [day(3)]: { text: 'Busy day, still kept the streak.', mood: 4, updatedAt: endDate.getTime() },
  },
  freezes: { count: 1, log: [{ day: day(20), source: 'ad' }] },
  settings: {
    theme: 'system', weekStartsOn: 1, dayEndsAtHour: 0, haptics: true,
    dailySummary: { enabled: false, time: '08:00' }, eveningNudge: { enabled: true, time: '20:30' },
  },
};

writeFileSync(resolve(root, 'store/demo-backup.json'), JSON.stringify(backup, null, 2) + '\n');
console.log(`wrote store/demo-backup.json (history ends ${end})`);
