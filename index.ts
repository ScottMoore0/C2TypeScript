/**
 * ts-xtea — TypeScript port of XTEA (eXtended Tiny Encryption Algorithm).
 *
 * Upstream: https://github.com/shixiongfei/xtea (Apache-2.0)
 * Algorithm: Roger Needham & David Wheeler, 1997.
 *
 * XTEA is an 8-byte block cipher with a 128-bit key, designed to be very
 * small. It is suitable for embedded systems and as a teaching/reference
 * cipher, but for new designs prefer AES.
 */
import { xtea_s, xtea_setkey, xtea_encodeecb, xtea_decodeecb,
         xtea_encodecbc, xtea_decodecbc, xtea_enclen, xtea_declen } from './xtea.js';

const XTEA_BLOCK_SIZE = 8;
const XTEA_KEY_SIZE = 16;
const XTEA_IV_SIZE = 8;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/**
 * XTEA cipher instance. Holds an immutable 128-bit key schedule.
 */
export class Xtea {
  private ctx: xtea_s;

  constructor(key: Uint8Array) {
    if (key.length !== XTEA_KEY_SIZE) {
      throw new RangeError(`XTEA key must be ${XTEA_KEY_SIZE} bytes`);
    }
    this.ctx = new xtea_s();
    xtea_setkey(this.ctx, { buf: key, off: 0 });
  }

  /** Encrypt a single 8-byte block (ECB). Returns a fresh Uint8Array. */
  encryptBlock(plaintext: Uint8Array): Uint8Array {
    if (plaintext.length !== XTEA_BLOCK_SIZE) {
      throw new RangeError(`XTEA block size is ${XTEA_BLOCK_SIZE} bytes`);
    }
    const out = new Uint8Array(XTEA_BLOCK_SIZE);
    xtea_encodeecb(this.ctx, { buf: out, off: 0 }, { buf: plaintext, off: 0 });
    return out;
  }

  /** Decrypt a single 8-byte block (ECB). */
  decryptBlock(ciphertext: Uint8Array): Uint8Array {
    if (ciphertext.length !== XTEA_BLOCK_SIZE) {
      throw new RangeError(`XTEA block size is ${XTEA_BLOCK_SIZE} bytes`);
    }
    const out = new Uint8Array(XTEA_BLOCK_SIZE);
    xtea_decodeecb(this.ctx, { buf: out, off: 0 }, { buf: ciphertext, off: 0 });
    return out;
  }

  /**
   * Encrypt a multi-block payload in CBC mode.
   * `data.length` must be a multiple of 8. `iv` is 8 bytes; it is
   * consumed (advanced) in place.
   */
  encryptCbc(data: Uint8Array, iv: Uint8Array): Uint8Array {
    if (data.length % XTEA_BLOCK_SIZE !== 0) {
      throw new RangeError('CBC data length must be a multiple of 8');
    }
    if (iv.length !== XTEA_IV_SIZE) {
      throw new RangeError(`XTEA IV must be ${XTEA_IV_SIZE} bytes`);
    }
    const out = new Uint8Array(data.length);
    xtea_encodecbc(this.ctx,
      { buf: out, off: 0 },
      { buf: data, off: 0 },
      data.length,
      { buf: iv, off: 0 });
    return out;
  }

  /** Decrypt a CBC ciphertext. */
  decryptCbc(data: Uint8Array, iv: Uint8Array): Uint8Array {
    if (data.length % XTEA_BLOCK_SIZE !== 0) {
      throw new RangeError('CBC data length must be a multiple of 8');
    }
    if (iv.length !== XTEA_IV_SIZE) {
      throw new RangeError(`XTEA IV must be ${XTEA_IV_SIZE} bytes`);
    }
    const out = new Uint8Array(data.length);
    xtea_decodecbc(this.ctx,
      { buf: out, off: 0 },
      { buf: data, off: 0 },
      data.length,
      { buf: iv, off: 0 });
    return out;
  }
}

export { XTEA_BLOCK_SIZE, XTEA_KEY_SIZE, XTEA_IV_SIZE };
