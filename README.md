# ts-parson

A zero-dependency TypeScript port of [parson](https://github.com/kgabis/parson), a lightweight JSON parser and serializer in C by Krzysztof Gabis.

parson reads JSON text into an in-memory tree of values (object, array, string, number, boolean, null) and provides a small accessor API for reading or mutating that tree, plus a serializer for emitting JSON text. Unlike a tokenizer (e.g. jsmn), parson owns the parsed values and frees them when you call `json_value_free`.

## Installation

```
npm install ts-parson
```

## Usage

```ts
import {
  json_parse_string,
  json_value_get_type,
  json_value_get_object,
  json_object_get_string,
  json_object_get_number,
  json_object_get_boolean,
  json_value_free,
  JSONObject,
} from 'ts-parson';

const src = '{"name": "parson", "version": 42, "ok": true}';
const root = json_parse_string(src);

if (root != null && json_value_get_type(root) === JSONObject) {
  const obj = json_value_get_object(root);

  // Strings come back as a CPtr-backed byte view. Convert to a JS string.
  const namePtr = json_object_get_string(obj, 'name');
  const name = readCString(namePtr);
  const version = json_object_get_number(obj, 'version');
  const ok = json_object_get_boolean(obj, 'ok');

  console.log(name, version, ok); // parson 42 1
}

// parson owns the value tree. Free it when you are done.
json_value_free(root);

// Helper: read a parson C-string view as a JS string.
function readCString(p: any): string {
  if (p == null) return '';
  if (typeof p === 'string') return p;
  if (p.buf) {
    const bytes: number[] = [];
    for (let i = p.off; i < p.buf.length && p.buf[i] !== 0; i++) bytes.push(p.buf[i]);
    return String.fromCharCode(...bytes);
  }
  return String(p);
}
```

### Building and serializing

```ts
import {
  json_value_init_object,
  json_value_get_object,
  json_object_set_string,
  json_object_set_number,
  json_serialize_to_string,
  json_value_free,
} from 'ts-parson';

const rootV = json_value_init_object();
const root  = json_value_get_object(rootV);
json_object_set_string(root, 'name', 'parson');
json_object_set_number(root, 'count', 7);

const out = json_serialize_to_string(rootV); // CPtr view of JSON text
// ... convert to a JS string with the same readCString helper above
json_value_free(rootV);
```

### Dotted accessors

parson supports dotted path access for reading nested objects:

```ts
const v = json_parse_string('{"outer":{"inner":{"deep":123}}}');
const root = json_value_get_object(v);
json_object_dotget_number(root, 'outer.inner.deep'); // 123
json_value_free(v);
```

## API

The package re-exports parson's full public surface (~110 symbols). The most common entry points:

```ts
// Parsing
function json_parse_string(src: any): JSON_Value | null;
function json_parse_string_with_comments(src: any): JSON_Value | null;
function json_parse_file(path: any): JSON_Value | null;
function json_parse_file_with_comments(path: any): JSON_Value | null;

// Type discrimination
function json_value_get_type(v: JSON_Value | null): number;
const JSONError = -1, JSONNull = 1, JSONString = 2, JSONNumber = 3,
      JSONObject = 4, JSONArray = 5, JSONBoolean = 6;

// Down-casts
function json_value_get_object(v: JSON_Value | null): JSON_Object | null;
function json_value_get_array(v:  JSON_Value | null): JSON_Array  | null;
function json_value_get_string(v: JSON_Value | null): any;  // CPtr view
function json_value_get_number(v: JSON_Value | null): number;
function json_value_get_boolean(v: JSON_Value | null): number;

// Object accessors (read)
function json_object_get_value(o: JSON_Object | null, name: any): JSON_Value | null;
function json_object_get_string(o: JSON_Object | null, name: any): any;
function json_object_get_number(o: JSON_Object | null, name: any): number;
function json_object_get_boolean(o: JSON_Object | null, name: any): number;
function json_object_get_object(o: JSON_Object | null, name: any): JSON_Object | null;
function json_object_get_array(o: JSON_Object | null, name: any): JSON_Array | null;
function json_object_get_count(o: JSON_Object | null): number;
function json_object_get_name(o: JSON_Object | null, idx: number): any;
// ... plus json_object_dotget_*, json_object_has_value, json_object_has_value_of_type

// Array accessors (read)
function json_array_get_value(a: JSON_Array | null, i: number): JSON_Value | null;
function json_array_get_string(a: JSON_Array | null, i: number): any;
function json_array_get_number(a: JSON_Array | null, i: number): number;
function json_array_get_boolean(a: JSON_Array | null, i: number): number;
function json_array_get_object(a: JSON_Array | null, i: number): JSON_Object | null;
function json_array_get_array(a: JSON_Array | null, i: number): JSON_Array | null;
function json_array_get_count(a: JSON_Array | null): number;

// Constructors
function json_value_init_object(): JSON_Value | null;
function json_value_init_array():  JSON_Value | null;
function json_value_init_string(s: any): JSON_Value | null;
function json_value_init_number(n: number): JSON_Value | null;
function json_value_init_boolean(b: number): JSON_Value | null;
function json_value_init_null():   JSON_Value | null;

// Mutators
function json_object_set_value(o, name, v): number;
function json_object_set_string(o, name, s): number;
function json_object_set_number(o, name, n): number;
function json_object_set_boolean(o, name, b): number;
function json_object_set_null(o, name): number;
function json_object_remove(o, name): number;
function json_object_clear(o): number;
function json_array_append_value(a, v): number;
function json_array_append_string(a, s): number;
function json_array_append_number(a, n): number;
function json_array_append_boolean(a, b): number;
function json_array_append_null(a): number;
function json_array_remove(a, i): number;
function json_array_clear(a): number;
// ... plus json_array_replace_*, json_object_dotset_*, json_object_dotremove

// Serialization (returns CPtr text or writes to buffer/file)
function json_serialize_to_string(v: JSON_Value | null): any;
function json_serialize_to_string_pretty(v: JSON_Value | null): any;
function json_serialize_to_buffer(v, buf, size): number;
function json_serialize_to_file(v, path): number;
function json_serialization_size(v): number;

// Lifetime
function json_value_free(v: JSON_Value | null): void;
function json_value_deep_copy(v: JSON_Value | null): JSON_Value | null;
function json_value_equals(a, b): number;
function json_validate(schema, value): number;
```

The `JSONSuccess` (0) and `JSONFailure` (-1) status codes are also exported, along with library-wide configuration hooks (`json_set_allocation_functions`, `json_set_escape_slashes`, `json_set_float_serialization_format`, `json_set_number_serialization_function`).

## Notes on the translation

- **Strings as CPtr views.** parson hands back a `{buf, off}` view into the parsed bytes for string fields, mirroring C's `const char *`. JS callers convert with a small helper (see `readCString` above).
- **Numbers as JS numbers.** parson uses C `double` for all JSON numbers; this is a natural match for JS.
- **Booleans as 0/1.** parson's C API returns `int`, not `bool`. The translation preserves that.
- **Manual lifetime.** parson allocates value trees on its own heap and frees them in `json_value_free`. The translation preserves that contract.

## License

MIT. See [LICENSE](./LICENSE).

This is a mechanical translation of the upstream C reference. Bridge markers (`// BRIDGE: ...`) in the source mark places where C-specific concepts (pointers, struct layout, manual allocation) are modeled in TypeScript.

## Source

- Upstream C: [kgabis/parson](https://github.com/kgabis/parson) (MIT)
- This port: TypeScript translation, copyright (c) 2026 Scott Moore (MIT)
