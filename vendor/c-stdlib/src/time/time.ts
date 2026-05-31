// FC-7: C time functions.
// C17 §7.27: Date and time.

export const CLOCKS_PER_SEC = 1000000;

export interface CTime {
  sec: number;    // seconds (0-60)
  min: number;    // minutes (0-59)
  hour: number;   // hours (0-23)
  mday: number;   // day of month (1-31)
  mon: number;    // month (0-11)
  year: number;   // years since 1900
  wday: number;   // day of week (0=Sunday)
  yday: number;   // day of year (0-365)
  isdst: number;  // DST flag
}

/** C17 §7.27.2.4: time — seconds since epoch. */
export function c_time(): number {
  return Math.floor(Date.now() / 1000);
}

/** C17 §7.27.2.1: clock — processor time in "ticks". */
export function c_clock(): number {
  return Math.floor(performance.now() * 1000); // microseconds
}

/** C17 §7.27.2.2: difftime — difference in seconds. */
export function c_difftime(t1: number, t0: number): number {
  return t1 - t0;
}

/** C17 §7.27.3.3: localtime — convert epoch to broken-down time. */
export function c_localtime(epochSec: number): CTime {
  const d = new Date(epochSec * 1000);
  return {
    sec: d.getSeconds(),
    min: d.getMinutes(),
    hour: d.getHours(),
    mday: d.getDate(),
    mon: d.getMonth(),
    year: d.getFullYear() - 1900,
    wday: d.getDay(),
    yday: dayOfYear(d),
    isdst: -1 // unknown
  };
}

/** C17 §7.27.3.1: gmtime — convert epoch to UTC broken-down time. */
export function c_gmtime(epochSec: number): CTime {
  const d = new Date(epochSec * 1000);
  return {
    sec: d.getUTCSeconds(),
    min: d.getUTCMinutes(),
    hour: d.getUTCHours(),
    mday: d.getUTCDate(),
    mon: d.getUTCMonth(),
    year: d.getUTCFullYear() - 1900,
    wday: d.getUTCDay(),
    yday: dayOfYear(d, true),
    isdst: 0
  };
}

/** C17 §7.27.2.3: mktime — convert broken-down to epoch. */
export function c_mktime(tm: CTime): number {
  const d = new Date(tm.year + 1900, tm.mon, tm.mday, tm.hour, tm.min, tm.sec);
  return Math.floor(d.getTime() / 1000);
}

/** C17 §7.27.3.5: strftime — format time string (minimal subset). */
export function c_strftime(fmt: string, tm: CTime): string {
  let result = "";
  for (let i = 0; i < fmt.length; i++) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      i++;
      switch (fmt[i]) {
        case "Y": result += String(tm.year + 1900); break;
        case "m": result += String(tm.mon + 1).padStart(2, "0"); break;
        case "d": result += String(tm.mday).padStart(2, "0"); break;
        case "H": result += String(tm.hour).padStart(2, "0"); break;
        case "M": result += String(tm.min).padStart(2, "0"); break;
        case "S": result += String(tm.sec).padStart(2, "0"); break;
        case "j": result += String(tm.yday + 1).padStart(3, "0"); break;
        case "w": result += String(tm.wday); break;
        case "A": result += ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][tm.wday]; break;
        case "a": result += ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][tm.wday]; break;
        case "B": result += ["January","February","March","April","May","June","July","August","September","October","November","December"][tm.mon]; break;
        case "b": result += ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][tm.mon]; break;
        case "%": result += "%"; break;
        case "n": result += "\n"; break;
        case "t": result += "\t"; break;
        default: result += "%" + fmt[i];
      }
    } else {
      result += fmt[i];
    }
  }
  return result;
}

function dayOfYear(d: Date, utc: boolean = false): number {
  const year = utc ? d.getUTCFullYear() : d.getFullYear();
  const start = new Date(year, 0, 1);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

/** C17 §7.27.3.1: asctime — convert struct tm to string. */
export function c_asctime(tm: CTime): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = days[tm.wday] ?? "???";
  const mon = months[tm.mon] ?? "???";
  const date = String(tm.mday).padStart(2, " ");
  const time = `${String(tm.hour).padStart(2, "0")}:${String(tm.min).padStart(2, "0")}:${String(tm.sec).padStart(2, "0")}`;
  return `${day} ${mon} ${date} ${time} ${tm.year + 1900}\n`;
}

/** C17 §7.27.3.2: ctime — convert time_t to string. */
export function c_ctime(epochSec: number): string {
  return c_asctime(c_localtime(epochSec));
}

/** C17 §7.27.2.5: timespec_get — high-resolution clock. */
export function c_timespec_get(ts: { tv_sec: number; tv_nsec: number }, base: number): number {
  const now = Date.now();
  ts.tv_sec = Math.floor(now / 1000);
  ts.tv_nsec = (now % 1000) * 1000000;
  return base; // TIME_UTC = 1
}
