// FC-2: sscanf — parse formatted input from a string.
// C17 §7.21.6.7. Minimal subset: %d, %f, %s, %c, %x, %u.

export interface ScanResult {
  count: number;        // number of items matched
  values: unknown[];    // matched values
}

export function sscanf(input: string, fmt: string): ScanResult {
  const values: unknown[] = [];
  let pos = 0;
  let fi = 0;

  while (fi < fmt.length && pos < input.length) {
    if (fmt[fi] === "%") {
      fi++;
      // Skip width (not fully supported)
      while (fi < fmt.length && fmt[fi]! >= "0" && fmt[fi]! <= "9") fi++;
      // Skip length modifier
      while (fi < fmt.length && "hlLzjt".includes(fmt[fi]!)) fi++;

      const spec = fmt[fi++];
      // Skip whitespace in input
      while (pos < input.length && input[pos] === " ") pos++;

      switch (spec) {
        case "d": case "i": {
          const match = input.slice(pos).match(/^[+-]?\d+/);
          if (!match) return { count: values.length, values };
          values.push(parseInt(match[0], 10));
          pos += match[0].length;
          break;
        }
        case "u": {
          const match = input.slice(pos).match(/^\d+/);
          if (!match) return { count: values.length, values };
          values.push(parseInt(match[0], 10) >>> 0);
          pos += match[0].length;
          break;
        }
        case "x": case "X": {
          const match = input.slice(pos).match(/^(?:0[xX])?[0-9a-fA-F]+/);
          if (!match) return { count: values.length, values };
          values.push(parseInt(match[0], 16));
          pos += match[0].length;
          break;
        }
        case "o": {
          const match = input.slice(pos).match(/^[0-7]+/);
          if (!match) return { count: values.length, values };
          values.push(parseInt(match[0], 8));
          pos += match[0].length;
          break;
        }
        case "f": case "e": case "g": {
          const match = input.slice(pos).match(/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
          if (!match) return { count: values.length, values };
          values.push(parseFloat(match[0]));
          pos += match[0].length;
          break;
        }
        case "s": {
          const match = input.slice(pos).match(/^\S+/);
          if (!match) return { count: values.length, values };
          values.push(match[0]);
          pos += match[0].length;
          break;
        }
        case "c": {
          values.push(input[pos]);
          pos++;
          break;
        }
        case "%": {
          if (input[pos] !== "%") return { count: values.length, values };
          pos++;
          break;
        }
        default:
          return { count: values.length, values };
      }
    } else if (fmt[fi] === " ") {
      fi++;
      while (pos < input.length && input[pos] === " ") pos++;
    } else {
      if (input[pos] !== fmt[fi]) return { count: values.length, values };
      fi++;
      pos++;
    }
  }

  return { count: values.length, values };
}
