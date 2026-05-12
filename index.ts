/**
 * ts-julianday — TypeScript port of hcnn/julianday.
 *
 * Upstream: https://github.com/hcnn/julianday (MIT)
 *
 * Bidirectional conversion between Gregorian calendar dates and Julian
 * Day Numbers (JDN). JDN is the integer count of days since the start of
 * the Julian period (January 1, 4713 BCE proleptic Julian, or November
 * 24, 4714 BCE proleptic Gregorian).
 *
 * Standard reference dates:
 *   J2000.0 epoch    2000-01-01 = JDN 2451545
 *   Unix epoch       1970-01-01 = JDN 2440588
 *   MJD epoch        1858-11-17 = JDN 2400001
 *   Gregorian start  0001-01-01 = JDN 1721426
 */
import { date_to_jd, jd_to_date } from './julianday.js';

/**
 * Convert a Gregorian date to a Julian Day Number.
 *
 * Uses the proleptic Gregorian calendar — dates before 1582-10-15 are
 * computed by extending the Gregorian rules backwards (not the historic
 * Julian calendar).
 */
export function dateToJulianDay(year: number, month: number, day: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new TypeError('year, month, day must be integers');
  }
  if (month < 1 || month > 12) throw new RangeError('month must be 1..12');
  if (day < 1 || day > 31) throw new RangeError('day must be 1..31');
  return date_to_jd(year, month, day);
}

/**
 * Convert a Julian Day Number back to a Gregorian date.
 * Returns `{ year, month, day }`.
 */
export function julianDayToDate(jd: number): { year: number; month: number; day: number } {
  if (!Number.isInteger(jd)) throw new TypeError('jd must be an integer');
  const yOut = { value: 0 };
  const mOut = { value: 0 };
  const dOut = { value: 0 };
  jd_to_date(jd, yOut as any, mOut as any, dOut as any);
  return { year: yOut.value, month: mOut.value, day: dOut.value };
}

/**
 * Convert a JavaScript Date to a Julian Day Number (UTC components).
 */
export function jsDateToJulianDay(d: Date): number {
  return dateToJulianDay(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Convert a Julian Day Number to a JavaScript Date (UTC, time = 00:00:00).
 */
export function julianDayToJsDate(jd: number): Date {
  const { year, month, day } = julianDayToDate(jd);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Day-of-week (0 = Monday, 6 = Sunday — ISO 8601 convention).
 * Derived from `(jdn + 0) % 7`: JDN 0 is a Monday.
 */
export function dayOfWeek(year: number, month: number, day: number): number {
  return ((dateToJulianDay(year, month, day) % 7) + 7) % 7;
}

/**
 * Number of days between two Gregorian dates: `b - a` in days.
 * Negative if `b` is earlier than `a`.
 */
export function daysBetween(
  aYear: number, aMonth: number, aDay: number,
  bYear: number, bMonth: number, bDay: number,
): number {
  return dateToJulianDay(bYear, bMonth, bDay) - dateToJulianDay(aYear, aMonth, aDay);
}

/**
 * Add an integer number of days to a date.
 */
export function addDays(year: number, month: number, day: number, days: number): { year: number; month: number; day: number } {
  return julianDayToDate(dateToJulianDay(year, month, day) + days);
}

export {
  /** J2000.0 epoch — JDN of 2000-01-01. */
  // (Re-exporting at constant so callers can avoid magic numbers.)
};

export const JDN_J2000 = 2451545;
export const JDN_UNIX_EPOCH = 2440588;
export const JDN_MJD_EPOCH = 2400001;
