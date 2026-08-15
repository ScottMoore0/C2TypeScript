# ts-bos-base64

A pure-TypeScript port of [BabyOS](https://github.com/notrynohigh/BabyOS)'s
`algo_base64.c` — a compact RFC 4648 Base64 encoder/decoder.

- No native dependencies. Browser- and Node-compatible.
- Tested against the RFC 4648 §10 reference vectors and a 0..255 binary
  round-trip.

## Install

```sh
npm install @scott/bos-base64
```

## Usage

```ts
import { encode, decode, decodeToString } from '@scott/bos-base64';

encode('Hello, world!');                 // 'SGVsbG8sIHdvcmxkIQ=='
decodeToString('SGVsbG8sIHdvcmxkIQ==');  // 'Hello, world!'

const bytes = decode('AAECAwQFBgc=');    // Uint8Array of decoded bytes
```

`decode` returns `null` if the input is malformed (length not a multiple of
4, or any illegal character).

## API

- `encode(input: Uint8Array | string): string`
- `decode(input: string): Uint8Array | null`
- `decodeToString(input: string): string | null`

## Upstream

Originally from
[notrynohigh/BabyOS](https://github.com/notrynohigh/BabyOS)
(MIT, copyright 2020 Bean).

## License

MIT — see [LICENSE](LICENSE).
