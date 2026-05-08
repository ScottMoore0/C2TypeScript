# ts-fastlz

A zero-dependency TypeScript port of [FastLZ](https://github.com/ariya/FastLZ), a lightning-fast lossless compression library based on LZ77.

## Installation

```
npm install ts-fastlz
```

## Usage

```typescript
import {
  fastlz_compress,
  fastlz_compress_level,
  fastlz_decompress,
} from 'ts-fastlz';

// Pointers are passed as { buf: Uint8Array, off: number }
const ptr = (data: Uint8Array) => ({ buf: data, off: 0 });

const input = new TextEncoder().encode(
  'FastLZ roundtrip: the same text repeated. '.repeat(12),
);

// Allocate a worst-case output buffer (FastLZ recommends >= max(66, 1.05 * input)).
const compressed = new Uint8Array(Math.max(66, input.length * 2 + 16));
const compressedLen = fastlz_compress(ptr(input), input.length, ptr(compressed));

// Decompress back into a buffer of the original size.
const output = new Uint8Array(input.length + 16);
const outputLen = fastlz_decompress(
  ptr(compressed),
  compressedLen,
  ptr(output),
  output.length,
);

const recovered = new TextDecoder().decode(output.subarray(0, outputLen));
console.log(recovered === new TextDecoder().decode(input)); // true
```

To choose an explicit compression level, use `fastlz_compress_level`:

```typescript
const compressedLen = fastlz_compress_level(2, ptr(input), input.length, ptr(compressed));
```

## API

### `fastlz_compress(input, length, output): number`

Compresses `length` bytes from `input` into `output`. The level is chosen automatically based on input size (level 1 for smaller inputs, level 2 for larger). Returns the size of the compressed payload.

### `fastlz_compress_level(level, input, length, output): number`

Like `fastlz_compress` but with explicit `level`. Accepts `1` (faster, less aggressive) or `2` (slower, better ratio).

### `fastlz_decompress(input, length, output, maxout): number`

Decompresses `length` bytes of compressed data from `input` into `output`, writing at most `maxout` bytes. Returns the number of bytes written, or `0` if the payload is malformed or would exceed `maxout`.

## Pointer convention

All `input` and `output` parameters are CPtr objects of the shape `{ buf: Uint8Array, off: number }`, mirroring C pointer semantics. Use `off` to point past a buffer prefix without copying. Allocate output buffers conservatively: FastLZ requires the destination to be at least `max(66, ceil(1.05 * input_length))` bytes.

## License

MIT. See [LICENSE](LICENSE).

Original C library by Ariya Hidayat. TypeScript translation by Scott Moore.
