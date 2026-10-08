import { addSeconds, elapsedSeconds, formatClock, isRunning, MAX_TIMER_CREDIT_SECONDS, pauseTimer, startTimer } from '../timer';
import { isComplete } from '../completion';
import { entry, habit } from '../testHelpers';

describe('timer', () => {
  it('starts from nothing', () => {
    const e = startTimer(undefined, 1000);
    expect(e).toMatchObject({ value: 0, timerStartedAt: 1000 });
    expect(isRunning(e)).toBe(true);
  });
  it('elapsed includes the running time', () => {
    const e = startTimer(entry(120), 1000);
    expect(elapsedSeconds(e, 1000 + 30_000)).toBe(150);
  });
  it('survives backgrounding because it is timestamp based', () => {
    const e = startTimer(undefined, 0);
    expect(elapsedSeconds(e, 600_000)).toBe(600); // app was away for 10 minutes
  });
  it('pausing folds the running time into the value', () => {
    const e = pauseTimer(startTimer(entry(60), 0), 90_000)!;
    expect(e.value).toBe(150);
    expect(isRunning(e)).toBe(false);
  });
  it('pausing a stopped timer changes nothing', () => {
    const e = entry(10);
    expect(pauseTimer(e, 5000)).toBe(e);
    expect(pauseTimer(undefined, 5000)).toBeUndefined();
  });
  it('starting a running timer is a no-op', () => {
    const e = startTimer(undefined, 0);
    expect(startTimer(e, 5000)).toBe(e);
  });
  it('caps credit for a forgotten timer', () => {
    const e = startTimer(undefined, 0);
    expect(elapsedSeconds(e, 100 * 3600 * 1000)).toBe(MAX_TIMER_CREDIT_SECONDS);
  });
  it('ignores a clock that moved backwards', () => {
    expect(elapsedSeconds(startTimer(undefined, 10_000), 5_000)).toBe(0);
  });
  it('adds and removes manual minutes without going below zero', () => {
    expect(addSeconds(undefined, 300, 1).value).toBe(300);
    expect(addSeconds(entry(100), -300, 1).value).toBe(0);
  });
  it('manual minutes keep a running timer running', () => {
    const e = addSeconds(startTimer(entry(60), 0), 300, 1);
    expect(isRunning(e)).toBe(true);
    expect(e.value).toBe(360);
  });
  it('completion counts a running timer only when asked', () => {
    const h = habit({ type: 'timer', target: 10 });
    const e = startTimer(entry(0), 0);
    expect(isComplete(h, e)).toBe(false);
    expect(isComplete(h, e, 10 * 60_000)).toBe(true);
    expect(isComplete(h, e, 5 * 60_000)).toBe(false);
  });
  it('formats clock text', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
  });
});
