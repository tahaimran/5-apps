/**
 * Detecting that the phone's clock was changed while the app is open (plan §5.1 "Clock change detected":
 * "uses monotonic delta when app alive"). A tick compares how far the wall clock moved with how far the
 * monotonic clock moved. The monotonic clock stops while the phone sleeps, so callers take a fresh
 * baseline whenever the app returns to the foreground.
 */
export interface ClockSample {
  /** `Date.now()` */
  wall: number;
  /** `performance.now()` */
  mono: number;
}

/** A difference smaller than this is ordinary drift between the two clocks. */
export const CLOCK_JUMP_TOLERANCE_MS = 5000;

/** How far the wall clock moved beyond the monotonic clock between two samples (negative = set back); 0 when within tolerance. */
export function clockJump(prev: ClockSample, next: ClockSample, tolerance = CLOCK_JUMP_TOLERANCE_MS): number {
  const drift = next.wall - prev.wall - (next.mono - prev.mono);
  return Math.abs(drift) > tolerance ? drift : 0;
}

export const sampleClock = (): ClockSample => ({ wall: Date.now(), mono: typeof performance !== 'undefined' ? performance.now() : 0 });
