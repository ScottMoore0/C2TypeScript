# ts-jsmn

A zero-dependency TypeScript port of [jsmn](https://github.com/zserge/jsmn), a minimal JSON tokenizer in ANSI C by Serge Zaitsev.

jsmn is intentionally tiny. It does not build a parse tree, allocate per-element objects, or copy strings out of the input. Instead, it walks the input once and emits a flat array of tokens, each describing one JSON element by its type and its `[start, end)` byte range in the original buffer. The caller decides how to interpret the tokens.

## Installation

```
npm install ts-jsmn
```

## Usage

```ts
import {
  jsmn_parser,
  jsmntok,
  jsmn_init,
  jsmn_parse,
  JSMN_OBJECT,
  JSMN_ARRAY,
  JSMN_STRING,
  JSMN_PRIMITIVE,
} from 'ts-jsmn';

const json = '{"a":1,"b":[true,null]}';

// Convert the JSON text to the byte-buffer shape jsmn_parse expects.
const bytes = new Uint8Array(json.length);
for (let i = 0; i < json.length; i++) bytes[i] = json.charCodeAt(i);
const js = { buf: bytes, off: 0 };

// Allocate an array of tokens. Pre-size it to a comfortable upper bound
// for your input. jsmn returns JSMN_ERROR_NOMEM if it runs out of room.
const tokens: jsmntok[] = Array.from({ length: 32 }, () => new jsmntok());

const parser = new jsmn_parser();
jsmn_init(parser);

const n = jsmn_parse(parser, js, json.length, tokens, tokens.length);

// n is the number of tokens used (>= 0), or one of:
//   JSMN_ERROR_NOMEM (-1)  not enough tokens
//   JSMN_ERROR_INVAL (-2)  invalid character
//   JSMN_ERROR_PART  (-3)  string ended mid-token
console.log('token count:', n);

for (let i = 0; i < n; i++) {
  const t = tokens[i];
  let kind = 'unknown';
  if (t.type === JSMN_OBJECT)    kind = 'object';
  else if (t.type === JSMN_ARRAY) kind = 'array';
  else if (t.type === JSMN_STRING) kind = 'string';
  else if (t.type === JSMN_PRIMITIVE) kind = 'primitive';
  const slice = json.slice(t.start, t.end);
  console.log(`${i}: ${kind} [${t.start}, ${t.end}) size=${t.size}  -> ${slice}`);
}
```

For the JSON above, jsmn returns 7 tokens:

```
0: object    [0, 23)  size=2   -> {"a":1,"b":[true,null]}
1: string    [2, 3)   size=1   -> a
2: primitive [5, 6)   size=0   -> 1
3: string    [8, 9)   size=1   -> b
4: array     [11, 22) size=2   -> [true,null]
5: primitive [12, 16) size=0   -> true
6: primitive [17, 21) size=0   -> null
```

The `size` field on object and array tokens is the count of immediate children. The `size` field on a string that is an object key is the number of value tokens it owns (always 1 for well-formed JSON). The `size` field on a primitive (number, true, false, null) or value-string is 0.

## API

```ts
// Token shape. Mirrors the C struct jsmntok_t.
class jsmntok {
  type: number;   // JSMN_OBJECT | JSMN_ARRAY | JSMN_STRING | JSMN_PRIMITIVE
  start: number;  // inclusive byte offset of first character
  end: number;    // exclusive byte offset just past the last character
  size: number;   // child count (objects/arrays/keys), 0 otherwise
}

// Parser state. Hold this across multiple jsmn_parse calls if you want
// to feed jsmn a stream of bytes one chunk at a time.
class jsmn_parser {
  pos: number;
  toknext: number;
  toksuper: number;
}

// Reset a parser to its initial state.
function jsmn_init(parser: jsmn_parser): void;

// Parse js (a {buf: Uint8Array, off: number} view of len bytes) into
// the pre-allocated tokens array. Returns the number of tokens used,
// or one of the JSMN_ERROR_* negative codes.
function jsmn_parse(
  parser: jsmn_parser,
  js: { buf: Uint8Array; off: number },
  len: number,
  tokens: jsmntok[],
  num_tokens: number,
): number;

// Token type constants
const JSMN_UNDEFINED: number;  // 0
const JSMN_OBJECT: number;     // 1
const JSMN_ARRAY: number;      // 2
const JSMN_STRING: number;     // 4
const JSMN_PRIMITIVE: number;  // 8

// Error codes
const JSMN_ERROR_NOMEM: number;  // -1, not enough tokens
const JSMN_ERROR_INVAL: number;  // -2, invalid character
const JSMN_ERROR_PART: number;   // -3, partial input (string ran past end)
```

## Why "tokens, not a tree"

jsmn is designed for embedded and constrained environments where allocating a tree is expensive or impossible. Reading a JSON value is a slice of the input by `[start, end)`. Walking nested structures means scanning the next `size` tokens (recursively for objects/arrays). This is the C library's defining trait and ts-jsmn preserves it as-is.

## License

MIT. See [LICENSE](./LICENSE).

This is a mechanical translation of the upstream C reference. Bridge markers (`// BRIDGE: ...`) in the source mark places where C-specific concepts (pointers, struct layout) are modeled in TypeScript.

## Source

- Upstream C: [zserge/jsmn](https://github.com/zserge/jsmn) (MIT)
- This port: TypeScript translation, copyright (c) 2026 Scott Moore (MIT)
