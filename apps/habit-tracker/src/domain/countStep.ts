/** Round numbers a step can take, smallest first. */
const NICE = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

/** Taps it should take to reach the target with the + button, roughly. */
const TAPS_TO_TARGET = 16;

/**
 * How much one tap of + adds to a count habit. Small targets count one by one (8 glasses); large
 * ones move in round chunks so 8,000 steps is +500, not eight thousand taps.
 */
export function countStep(target: number): number {
  if (!Number.isFinite(target) || target <= 20) return 1;
  const raw = target / TAPS_TO_TARGET;
  return NICE.find((n) => n >= raw) ?? NICE[NICE.length - 1];
}

/** The step as a short button label: 500 → "500", 1000 → "1k", 2500 → "2.5k". */
export function stepLabel(step: number): string {
  return step >= 1000 ? `${step / 1000}k` : String(step);
}
