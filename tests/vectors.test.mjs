// Julian Day Number reference test vectors.
import {
  dateToJulianDay, julianDayToDate,
  jsDateToJulianDay, julianDayToJsDate,
  dayOfWeek, daysBetween, addDays,
  JDN_J2000, JDN_UNIX_EPOCH, JDN_MJD_EPOCH,
} from '../dist/index.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`ok ${name} → ${JSON.stringify(got)}`); pass++; }
  else { console.log(`not ok ${name}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); fail++; }
}

// Canonical reference JDNs
check('2000-01-01 (J2000.0)',      dateToJulianDay(2000, 1, 1),  2451545);
check('1970-01-01 (Unix epoch)',   dateToJulianDay(1970, 1, 1),  2440588);
check('1858-11-17 (MJD epoch)',    dateToJulianDay(1858, 11, 17), 2400001);
check('0001-01-01 (proleptic)',    dateToJulianDay(1, 1, 1),     1721426);
check('2024-01-01',                dateToJulianDay(2024, 1, 1),  2460311);
check('2024-12-31',                dateToJulianDay(2024, 12, 31),2460676);

// Constants match
check('JDN_J2000 constant',        JDN_J2000,       2451545);
check('JDN_UNIX_EPOCH constant',   JDN_UNIX_EPOCH,  2440588);
check('JDN_MJD_EPOCH constant',    JDN_MJD_EPOCH,   2400001);

// Reverse mapping
check('JDN 2451545 → 2000-01-01',  julianDayToDate(2451545),       { year: 2000, month: 1, day: 1 });
check('JDN 2440588 → 1970-01-01',  julianDayToDate(2440588),       { year: 1970, month: 1, day: 1 });
check('JDN 2460676 → 2024-12-31',  julianDayToDate(2460676),       { year: 2024, month: 12, day: 31 });

// Round-trip on many dates
{
  const dates = [
    [1970, 1, 1], [1999, 12, 31], [2000, 1, 1], [2000, 2, 29],
    [2024, 6, 15], [1900, 3, 1], [1582, 10, 15],  // post-Gregorian
  ];
  let allOk = true;
  for (const [y, m, d] of dates) {
    const jd = dateToJulianDay(y, m, d);
    const back = julianDayToDate(jd);
    if (back.year !== y || back.month !== m || back.day !== d) { allOk = false; break; }
  }
  check('round-trip many dates', allOk, true);
}

// daysBetween
check('daysBetween 2024-01-01 and 2024-12-31 = 365',
  daysBetween(2024, 1, 1, 2024, 12, 31), 365);   // 2024 is leap
check('daysBetween 2023-01-01 and 2023-12-31 = 364',
  daysBetween(2023, 1, 1, 2023, 12, 31), 364);   // 2023 is non-leap
check('daysBetween 1970 epoch and 2024-01-01 = 19723',
  daysBetween(1970, 1, 1, 2024, 1, 1), 19723);
check('negative daysBetween reverse direction',
  daysBetween(2024, 1, 1, 1970, 1, 1), -19723);

// addDays
check('addDays 2024-01-01 + 31 = 2024-02-01',
  addDays(2024, 1, 1, 31), { year: 2024, month: 2, day: 1 });
check('addDays 2024-02-28 + 1 = 2024-02-29 (leap)',
  addDays(2024, 2, 28, 1), { year: 2024, month: 2, day: 29 });
check('addDays 2023-02-28 + 1 = 2023-03-01 (non-leap)',
  addDays(2023, 2, 28, 1), { year: 2023, month: 3, day: 1 });
check('addDays 2024-01-01 + 365 = 2024-12-31',
  addDays(2024, 1, 1, 365), { year: 2024, month: 12, day: 31 });

// dayOfWeek (ISO: 0=Mon..6=Sun)
// 2024-01-01 was a Monday; 2024-01-07 was a Sunday
{
  const dow0 = dayOfWeek(2024, 1, 1);
  const dow6 = dayOfWeek(2024, 1, 7);
  check('dayOfWeek 2024-01-01 (Monday) = 0', dow0, 0);
  check('dayOfWeek 2024-01-07 (Sunday) = 6', dow6, 6);
}

// JS Date interop
{
  const d = new Date(Date.UTC(2024, 0, 1));  // 2024-01-01 UTC
  check('jsDateToJulianDay(2024-01-01 UTC)', jsDateToJulianDay(d), 2460311);
  const back = julianDayToJsDate(2460311);
  check('julianDayToJsDate(2460311) is 2024-01-01 UTC',
    back.toISOString().slice(0, 10), '2024-01-01');
}

// Validation
{
  let threw = false;
  try { dateToJulianDay(2024, 13, 1); } catch { threw = true; }
  check('rejects month=13', threw, true);
}
{
  let threw = false;
  try { dateToJulianDay(2024.5, 1, 1); } catch { threw = true; }
  check('rejects non-integer year', threw, true);
}

console.log(`\n${pass}/${pass + fail} pass`);
process.exit(fail === 0 ? 0 : 1);
