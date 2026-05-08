# ts-siphash

A zero-dependency TypeScript port of SipHash, a fast keyed pseudorandom function for short messages.

This package wraps the reference C implementation by Jean-Philippe Aumasson and Daniel J. Bernstein, hosted at [veorq/SipHash](https://github.com/veorq/SipHash). It supports SipHash-2-4 with both 64-bit and 128-bit output sizes.

## Installation

```
npm install ts-siphash
```

## Usage

```ts
import { siphash } from 'ts-siphash';

// 16-byte key (must be exactly 16 bytes for SipHash-2-4)
const key = new Uint8Array(16);
for (let i = 0; i < 16; i++) key[i] = i;

// Message bytes
const msg = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

// Output buffer: 8 bytes for SipHash-64, 16 bytes for SipHash-128.
const out = new Uint8Array(8);

const rc = siphash(
  { buf: msg, off: 0 },          // input
  msg.length,                    // input length
  { buf: key, off: 0 },          // 16-byte key
  { buf: out, off: 0 },          // output buffer
  8                              // outlen: 8 (64-bit) or 16 (128-bit)
);

// out now contains the 8-byte SipHash-64 of msg under key.
console.log(Buffer.from(out).toString('hex'));
```

The `{ buf, off }` shape mirrors the C side's `const uint8_t *` semantics. `buf` is a `Uint8Array` and `off` is the starting byte offset (use `0` unless you want to start mid-buffer).

`siphash` returns `0` on success.

## API

```ts
function siphash(
  input: { buf: Uint8Array; off: number },
  inlen: number,
  key: { buf: Uint8Array; off: number },
  output: { buf: Uint8Array; off: number },
  outlen: number
): number;
```

`outlen` must be `8` (SipHash-64) or `16` (SipHash-128). The key must be exactly 16 bytes.

## License

CC0 1.0 Universal (Public Domain Dedication). See [LICENSE](./LICENSE).

This is a mechanical translation of the upstream C reference. Bridge markers (`// BRIDGE: ...`) in the source mark places where C-specific concepts (pointers, sized integers) are modeled in TypeScript.

## Source

- Upstream C: [veorq/SipHash](https://github.com/veorq/SipHash) (CC0)
- This port: TypeScript translation, copyright (c) 2026 Scott Moore (CC0)
