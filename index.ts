/**
 * ts-base64-nibble — TypeScript port of chibi-scheme's base64 implementation.
 *
 * Public API:
 *   b64_encode(in, in_len, out)      → encode raw bytes to base64
 *   b64_decode(in, in_len, out)      → decode base64 to raw bytes
 *   b64e_size(in_size)               → output buffer size for encoding
 *   b64d_size(in_size)               → output buffer size for decoding
 *   b64_int(ch)                      → ASCII char → base64 alphabet index
 *   b64_encodef / b64_decodef        → file-stream variants
 *   b64_chr                          → 64-byte alphabet table (CPtr)
 *
 * All buffer functions operate on a CPtr-style pointer model
 * ({ buf: Uint8Array, off: number }).
 */

export {
  b64_encode,
  b64_decode,
  b64e_size,
  b64d_size,
  b64_int,
  b64_encodef,
  b64_decodef,
  b64_chr,
} from './base64.js';
