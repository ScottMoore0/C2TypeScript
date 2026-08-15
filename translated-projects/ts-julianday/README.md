# ts-julianday

A direct TypeScript port of [hcnn/julianday](https://github.com/hcnn/julianday) — bidirectional conversion between Gregorian dates and Julian Day Numbers.

If you find this project useful, you can support this and further ports at [ko-fi.com/scottmoore0](https://ko-fi.com/scottmoore0).

## Upstream provenance

Direct port of hcnn/julianday (`julianday.c`, `julianday.h`), MIT License. The C reference uses Fliegel & Van Flandern's published algorithm — exact integer arithmetic, no floating point, no system calls.

The translated output is validated against canonical reference dates (J2000.0, Unix epoch, MJD epoch, Gregorian start) and against round-trip identity for many dates.

## Why this exists

Julian Day Numbers are the integer count of days since November 24, 4714 BCE (proleptic Gregorian) — used as the canonical timestamp in astronomy, calendar conversion, day-difference arithmetic, and historical date computation. They're the right primitive when you need:

- **Day-difference between any two dates** in O(1) integer subtraction
- **Adding N days to a date** without worrying about month/year boundaries
- **Day-of-week** computation
- **Interop with astronomical software** (J2000.0 epoch, Modified Julian Day)
- **Pre-1970 dates** that fall outside the Unix epoch
- **Date validation** without going through `Date` parsing quirks

`ts-julianday` is a direct mechanical translation from a 25-line C reference via the [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) translator, so its relationship to the spec is inspectable.

## Install

```bash
npm install ts-julianday
```

## Usage

```typescript
import {
  dateToJulianDay, julianDayToDate,
  daysBetween, addDays, dayOfWeek,
  jsDateToJulianDay, julianDayToJsDate,
  JDN_J2000, JDN_UNIX_EPOCH, JDN_MJD_EPOCH,
} from 'ts-julianday';

// Date → JDN
dateToJulianDay(2024, 1, 1);          // 2460311
dateToJulianDay(2000, 1, 1);          // 2451545 (= JDN_J2000)

// JDN → Date
julianDayToDate(2460311);             // { year: 2024, month: 1, day: 1 }

// Date arithmetic
daysBetween(1970, 1, 1, 2024, 1, 1);  // 19723
addDays(2024, 2, 28, 1);              // { year: 2024, month: 2, day: 29 } (leap)
addDays(2023, 2, 28, 1);              // { year: 2023, month: 3, day: 1 } (non-leap)

// Day of week (0 = Monday, 6 = Sunday — ISO 8601)
dayOfWeek(2024, 1, 1);                // 0 (Monday)

// JS Date interop (UTC)
jsDateToJulianDay(new Date('2024-01-01T00:00:00Z'));   // 2460311
julianDayToJsDate(2460311);                            // Date for 2024-01-01 UTC
```

## API surface

- `dateToJulianDay(year, month, day): number` — convert Gregorian date to JDN.
- `julianDayToDate(jd): { year, month, day }` — reverse mapping.
- `jsDateToJulianDay(d: Date): number` — UTC components of a JS Date to JDN.
- `julianDayToJsDate(jd): Date` — JDN to a UTC midnight JS Date.
- `daysBetween(aY, aM, aD, bY, bM, bD): number` — `b - a` in days, negative if reversed.
- `addDays(y, m, d, days): { year, month, day }` — add an integer number of days.
- `dayOfWeek(y, m, d): number` — ISO weekday (0=Monday … 6=Sunday).
- `JDN_J2000 = 2451545`, `JDN_UNIX_EPOCH = 2440588`, `JDN_MJD_EPOCH = 2400001` — exported constants.

## Reference values

| Date | JDN |
|---|---|
| 0001-01-01 (proleptic) | 1721426 |
| 1858-11-17 (MJD epoch) | 2400001 |
| 1970-01-01 (Unix epoch) | 2440588 |
| 2000-01-01 (J2000.0) | 2451545 |
| 2024-01-01 | 2460311 |
| 2024-12-31 | 2460676 |

Run:
```bash
npm test
```

## Caveats

- **Proleptic Gregorian only.** Dates before 1582-10-15 are computed by extending Gregorian rules backwards, not by switching to the Julian calendar. If you need historic Julian dates for genealogy / pre-1582 events, you'll need to adjust by the appropriate offset (10 days at switch, growing further back).
- **Time-of-day not handled.** This is integer JDN only. For fractional-day astronomical JD (which incorporates time), multiply or convert separately.
- **No leap-second support.** Days are integer days; not relevant for JDN but a caveat if you're computing intervals across UTC leap seconds.
- **Validates basic input ranges** (month 1..12, day 1..31, integer Y/M/D) but does not validate e.g. that Feb 30 is invalid — the algorithm will accept it and produce an offset JDN.

## License

MIT. Original C by hcnn under MIT.

## See also

- [cpp-to-ts](https://github.com/ScottMoore0/cpp-to-ts) — the translator that produced this package
