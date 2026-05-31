// FC-1: printf/sprintf/snprintf/fprintf format engine.
// C17 §7.21.6: Formatted input/output functions.

/** Format a printf-style string. Returns the formatted result. */
export function formatPrintf(fmt: string, args: unknown[]): string {
  let result = "";
  let argIdx = 0;
  let i = 0;

  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      i++;
      // Flags
      let flags = "";
      while (i < fmt.length && "-+ 0#".includes(fmt[i]!)) flags += fmt[i++];

      // Width
      let width = 0;
      if (fmt[i] === "*") { width = Number(args[argIdx++]) || 0; i++; }
      else { while (i < fmt.length && fmt[i]! >= "0" && fmt[i]! <= "9") { width = width * 10 + (fmt.charCodeAt(i) - 48); i++; } }

      // Precision
      let prec = -1;
      if (fmt[i] === ".") {
        i++;
        prec = 0;
        if (fmt[i] === "*") { prec = Number(args[argIdx++]) || 0; i++; }
        else { while (i < fmt.length && fmt[i]! >= "0" && fmt[i]! <= "9") { prec = prec * 10 + (fmt.charCodeAt(i) - 48); i++; } }
      }

      // Length modifier (captured — needed for BigInt 64-bit dispatch).
      // C17 §7.21.6.1 recognises h, hh, l, ll, L, z, j, t. The Microsoft
      // extension `I64` (Windows) is also accepted for 64-bit integer widths.
      let lenMod = "";
      while (i < fmt.length && "hlLzjt".includes(fmt[i]!)) {
        if (fmt[i] === fmt[i + 1]) { lenMod += fmt[i]!; i++; } // ll, hh
        lenMod += fmt[i]!;
        i++;
      }
      // Microsoft `%I64d` etc.
      if (fmt.substr(i, 3) === "I64") { lenMod = "ll"; i += 3; }
      const is64 = lenMod === "ll" || lenMod === "j" || lenMod === "z" || lenMod === "L";

      const spec = fmt[i++];
      const a = args[argIdx++];
      let s: string;

      // Helper: stringify an integer arg under a given radix, honoring BigInt
      // values correctly for the `ll*` / `I64*` length modifiers.
      const unsignedToString = (v: unknown, radix: number, upper: boolean): string => {
        if (typeof v === "bigint") {
          const r = BigInt.asUintN(is64 ? 64 : 32, v).toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        const n = Number(v);
        if (is64 && n < 0) {
          const big = BigInt.asUintN(64, BigInt(Math.trunc(n)));
          const r = big.toString(radix);
          return upper ? r.toUpperCase() : r;
        }
        const r = (Math.trunc(n) >>> 0).toString(radix);
        return upper ? r.toUpperCase() : r;
      };

      switch (spec) {
        case "d": case "i": {
          if (typeof a === "bigint") {
            const signed = is64 ? BigInt.asIntN(64, a) : a;
            s = signed.toString();
            if (flags.includes("+") && signed >= 0n) s = "+" + s;
            else if (flags.includes(" ") && signed >= 0n) s = " " + s;
            break;
          }
          s = String(Math.trunc(Number(a)));
          if (flags.includes("+") && Number(a) >= 0) s = "+" + s;
          else if (flags.includes(" ") && Number(a) >= 0) s = " " + s;
          break;
        }
        case "u":
          s = unsignedToString(a, 10, false);
          break;
        case "x":
          s = unsignedToString(a, 16, false);
          if (flags.includes("#") && s !== "0") s = "0x" + s;
          break;
        case "X":
          s = unsignedToString(a, 16, true);
          if (flags.includes("#") && s !== "0") s = "0X" + s;
          break;
        case "o":
          s = unsignedToString(a, 8, false);
          if (flags.includes("#") && s[0] !== "0") s = "0" + s;
          break;
        case "f": case "F":
          s = Number(a).toFixed(prec >= 0 ? prec : 6);
          if (flags.includes("+") && Number(a) >= 0) s = "+" + s;
          break;
        case "e":
          s = Number(a).toExponential(prec >= 0 ? prec : 6);
          s = s.replace(/e([+-])(\d)$/, "e$10$2");
          break;
        case "E":
          s = Number(a).toExponential(prec >= 0 ? prec : 6).toUpperCase();
          s = s.replace(/E([+-])(\d)$/, "E$10$2");
          break;
        case "g": case "G": {
          const v = Number(a);
          const p = (prec >= 0 ? prec : 6) || 1;
          // C17: use %e if exponent < -4 or >= precision, else %f style.
          const exp = v !== 0 ? Math.floor(Math.log10(Math.abs(v))) : 0;
          if (exp < -4 || exp >= p) {
            s = v.toExponential(p - 1);
            s = s.replace(/e([+-])(\d)$/, "e$10$2");
          } else {
            s = v.toPrecision(p);
          }
          if (!flags.includes("#")) {
            // Strip trailing zeros, handling exponential notation.
            const eIdx = s.indexOf("e");
            if (eIdx >= 0) {
              const mantissa = s.substring(0, eIdx).replace(/\.?0+$/, "");
              s = mantissa + s.substring(eIdx);
            } else {
              s = s.replace(/\.?0+$/, "");
            }
          }
          if (spec === "G") s = s.toUpperCase();
          break;
        }
        case "s": {
          s = stringArg(a);
          if (prec >= 0) s = s.slice(0, prec);
          break;
        }
        case "c":
          s = typeof a === "string" ? a.charAt(0) : String.fromCharCode(Number(a));
          break;
        case "p":
          s = "0x" + (Number(a) >>> 0).toString(16);
          break;
        case "n":
          argIdx--; // %n doesn't consume an arg in our model
          s = "";
          break;
        case "%":
          argIdx--; // %% doesn't consume an arg
          s = "%";
          break;
        default:
          argIdx--;
          s = "%" + (spec ?? "");
      }

      // Width padding
      if (width > s.length) {
        const padChar = flags.includes("0") && !flags.includes("-") ? "0" : " ";
        const pad = padChar.repeat(width - s.length);
        s = flags.includes("-") ? s + pad : pad + s;
      }

      result += s;
    } else {
      result += fmt[i++];
    }
  }
  return result;
}

function stringArg(a: unknown): string {
  if (typeof a === "string") return a;
  if (a && typeof a === "object" && "buf" in a) {
    const ptr = a as { buf: unknown; off: number };
    // Only treat as CPtr if buf is actually a Uint8Array
    if (ptr.buf instanceof Uint8Array) {
      let end = ptr.off ?? 0;
      while (end < ptr.buf.length && ptr.buf[end] !== 0) end++;
      return new TextDecoder().decode(ptr.buf.subarray(ptr.off ?? 0, end));
    }
  }
  // C++ objects with c_str() method (std::string translation pattern)
  if (a && typeof a === "object" && "c_str" in a && typeof (a as any).c_str === "function") {
    return (a as any).c_str();
  }
  // C++ objects with toString()
  if (a && typeof a === "object" && "toString" in a && typeof (a as any).toString === "function") {
    const s = (a as any).toString();
    if (s !== "[object Object]") return s;
  }
  return String(a ?? "");
}

/** sprintf: format into a string, return the string. */
export function sprintf(fmt: string, ...args: unknown[]): string {
  return formatPrintf(fmt, args);
}

/** snprintf: format into a string, return length (truncate to n). */
export function snprintf(n: number, fmt: string, ...args: unknown[]): { result: string; length: number } {
  const full = formatPrintf(fmt, args);
  return { result: full.slice(0, n - 1), length: full.length };
}

/** C17 §7.22.1.3: strfromf — convert float value to string using the given
 *  printf-style conversion specifier (must begin with '%'; no length modifier
 *  other than 'f','e','g','a' and their capitals). Writes up to n-1 chars into
 *  s (as a UTF-8 byte array) and returns the number of chars that would have
 *  been written had n been large enough (like snprintf). */
export function c_strfromf(s: number[], n: number, fmt: string, value: number): number {
  const full = formatPrintf(fmt, [Math.fround(value)]);
  return writeBytes(s, n, full);
}

/** C17 §7.22.1.3: strfromd — same as strfromf but for double precision. */
export function c_strfromd(s: number[], n: number, fmt: string, value: number): number {
  const full = formatPrintf(fmt, [value]);
  return writeBytes(s, n, full);
}

/** C17 §7.22.1.3: strfroml — same as strfromf but for long double (TS has no
 *  long double; uses double). */
export function c_strfroml(s: number[], n: number, fmt: string, value: number): number {
  const full = formatPrintf(fmt, [value]);
  return writeBytes(s, n, full);
}

function writeBytes(s: number[], n: number, full: string): number {
  const bytes = new TextEncoder().encode(full);
  if (n > 0) {
    const writable = Math.min(bytes.length, n - 1);
    for (let i = 0; i < writable; i++) s[i] = bytes[i]!;
    s[writable] = 0; // NUL terminator
  }
  return bytes.length;
}
