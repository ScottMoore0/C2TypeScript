# ts-inih

A zero-dependency TypeScript port of [inih](https://github.com/benhoyt/inih), a simple INI file parser written in C by Ben Hoyt.

## Installation

```
npm install ts-inih
```

## Usage

`ts-inih` exposes the inih C API in TypeScript. The primary entry point is `ini_parse_string`, which parses an INI document and invokes a handler callback for each `(section, name, value)` triple.

```typescript
import { ini_parse_string } from 'ts-inih';

const encoder = new TextEncoder();
function cstr(s: string) {
  const data = encoder.encode(s);
  const buf = new Uint8Array(data.length + 1);
  buf.set(data);
  return { buf, off: 0 };
}

function read(ptr: any): string {
  if (ptr == null) return '';
  if (typeof ptr === 'string') return ptr;
  let end = ptr.off;
  while (end < ptr.buf.length && ptr.buf[end] !== 0) end++;
  return String.fromCharCode(...ptr.buf.slice(ptr.off, end));
}

const records: string[] = [];
const handler = (_user: any, section: any, name: any, value: any): number => {
  records.push(`${read(section)}.${read(name)}=${read(value)}`);
  return 1;
};

const ini = [
  '; example INI file',
  '[owner]',
  'name = Alice',
  'email: alice@example.com',
  '',
  '[database]',
  'port = 5432',
  'enabled = true',
  '',
].join('\n');

const result = ini_parse_string(cstr(ini), handler, null);
console.log('parse result:', result); // 0 on success
console.log(records);
// [
//   'owner.name=Alice',
//   'owner.email=alice@example.com',
//   'database.port=5432',
//   'database.enabled=true'
// ]
```

## API

The package exports the inih public surface:

- `ini_parse_string(string, handler, user)` - parse an INI string. Returns 0 on success, the line number of the first error otherwise.
- `ini_parse_string_length(string, length, handler, user)` - parse a length-bounded INI string.
- `ini_parse_stream(reader, stream, handler, user)` - parse via a custom reader callback that mimics `fgets`.
- `ini_parse_file(file, handler, user)` - parse from an open file handle.
- `ini_parse(filename, handler, user)` - parse from a filename (opens the file internally).
- `ini_parse_string_ctx` - context class used by the string-stream reader.

The handler signature is `(user, section, name, value) => number`. Return non-zero to continue parsing, zero to stop with an error.

Section, name, and value are passed as C-style pointers (`{ buf: Uint8Array, off: number }`). Decode them with the `read` helper shown above, or use `TextDecoder` directly.

## Origin

This is a TypeScript translation of [benhoyt/inih](https://github.com/benhoyt/inih), produced automatically from the C source. The translation preserves the original C structure, including pointer-style argument passing, so the API surface mirrors the C API closely. `// BRIDGE:` comments in the source mark places where C concepts (struct layout, pointer arithmetic, etc.) are bridged into TypeScript.

## License

BSD-3-Clause. The original C inih is copyright (c) 2009 Ben Hoyt. The TypeScript translation is copyright (c) 2026 Scott Moore. See the [LICENSE](LICENSE) file for the full text.
