/**
 * Jalali (Persian) Date utilities for Parkway Kala settled cases
 */

// Today's system reference date: 1405/07/07
export const TODAY_JALALI = '1405/07/07';

// Convert Persian digits to English digits
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
}

// Convert Jalali date string (e.g. "1405/07/07", "1405/7/7", "1405-07-07") to approximate absolute day number
export function jalaliToDayNumber(jalaliStr: string): number {
  if (!jalaliStr) return 0;
  const clean = toEnglishDigits(jalaliStr).replace(/[-.]/g, '/');
  const parts = clean.split('/').map(p => parseInt(p, 10));
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }

  const [year, month, day] = parts;

  // Days before this year (baseline from year 1400)
  let totalDays = (year - 1400) * 365 + Math.floor((year - 1400) / 4);

  // Month days: 1-6 have 31 days, 7-11 have 30 days, 12 has 29 days
  for (let m = 1; m < month; m++) {
    if (m <= 6) {
      totalDays += 31;
    } else if (m <= 11) {
      totalDays += 30;
    } else {
      totalDays += 29;
    }
  }

  totalDays += day;
  return totalDays;
}

/**
 * Checks if a given settlement date falls within the last `maxDays` (default 10 days)
 * relative to the reference date (default: TODAY_JALALI = 1405/07/07).
 */
export function isWithinLastDays(dateStr: string, refDateStr: string = TODAY_JALALI, maxDays: number = 10): boolean {
  const caseDay = jalaliToDayNumber(dateStr);
  const refDay = jalaliToDayNumber(refDateStr);

  if (caseDay === 0 || refDay === 0) return true;

  const diff = refDay - caseDay;
  return diff >= 0 && diff <= maxDays;
}

/**
 * Compare two Jalali dates descending (newest date first)
 */
export function compareJalaliDatesDesc(dateA: string, dateB: string): number {
  return jalaliToDayNumber(dateB) - jalaliToDayNumber(dateA);
}

/**
 * Finds the latest settlement date string in an array of cases or returns TODAY_JALALI.
 */
export function getLatestSettlementDate(dates: string[]): string {
  let maxDay = jalaliToDayNumber(TODAY_JALALI);
  let maxDate = TODAY_JALALI;

  for (const d of dates) {
    const day = jalaliToDayNumber(d);
    if (day > maxDay) {
      maxDay = day;
      maxDate = d;
    }
  }

  return maxDate;
}
