const mockCalendars = jest.fn();
jest.mock('expo-localization', () => ({ getCalendars: () => mockCalendars() }));

import { deviceTimeFormat, formatHour, formatTime, fromHHMM, toHHMM } from '../timeFormat';

describe('formatTime', () => {
  it.each([
    ['00:00', '12:00 AM', '00:00'],
    ['08:05', '8:05 AM', '08:05'],
    ['12:00', '12:00 PM', '12:00'],
    ['13:30', '1:30 PM', '13:30'],
    ['23:59', '11:59 PM', '23:59'],
  ])('%s reads %s or %s', (hhmm, twelve, twentyFour) => {
    expect(formatTime(hhmm, '12h')).toBe(twelve);
    expect(formatTime(hhmm, '24h')).toBe(twentyFour);
  });
  it('leaves malformed input alone', () => {
    expect(formatTime('soon', '12h')).toBe('soon');
  });
});

describe('formatHour', () => {
  it('shows midnight and small hours both ways', () => {
    expect(formatHour(0, '12h')).toBe('12 AM');
    expect(formatHour(3, '12h')).toBe('3 AM');
    expect(formatHour(15, '12h')).toBe('3 PM');
    expect(formatHour(0, '24h')).toBe('00:00');
  });
});

describe('HH:mm helpers', () => {
  it('round-trips', () => {
    expect(toHHMM(7, 5)).toBe('07:05');
    expect(fromHHMM('19:45')).toEqual({ hour: 19, minute: 45 });
    expect(fromHHMM('x')).toEqual({ hour: 0, minute: 0 });
  });
});

describe('deviceTimeFormat', () => {
  it('follows the phone clock', () => {
    mockCalendars.mockReturnValueOnce([{ uses24hourClock: false }]);
    expect(deviceTimeFormat()).toBe('12h');
    mockCalendars.mockReturnValueOnce([{ uses24hourClock: true }]);
    expect(deviceTimeFormat()).toBe('24h');
  });
  it('falls back to 24-hour when unknown', () => {
    mockCalendars.mockReturnValueOnce([{ uses24hourClock: null }]);
    expect(deviceTimeFormat()).toBe('24h');
    mockCalendars.mockImplementationOnce(() => {
      throw new Error('no module');
    });
    expect(deviceTimeFormat()).toBe('24h');
  });
});
