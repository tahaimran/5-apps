import { t } from '@shared/i18n';
import { formatAmount } from '@/domain/units';
import type { Unit } from '@/domain/types';

/** "250 ml" / "8.5 fl oz". */
export const volume = (ml: number, unit: Unit): string => `${formatAmount(ml, unit)} ${t(`units.${unit}`)}`;

/** Spoken form for screen readers: "250 millilitres". */
export const spokenVolume = (ml: number, unit: Unit): string => `${formatAmount(ml, unit)} ${t(`units.${unit}Long`)}`;

/** Local clock time, e.g. "2:30 PM" (follows the device's 12/24 hour style). */
export const clockTime = (d: Date): string => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** "Thu, Oct 8". */
export const dayLabel = (d: Date): string => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** "Thursday, Oct 8" for screen readers. */
export const longDayLabel = (d: Date): string => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
