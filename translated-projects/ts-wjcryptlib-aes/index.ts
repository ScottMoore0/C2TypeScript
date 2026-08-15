/**
 * ts-wjcryptlib-aes — TypeScript port of WjCryptLib's AES (Rijndael).
 *
 * Upstream: https://github.com/WaterJuice/WjCryptLib (Unlicense)
 * Spec: FIPS 197 (AES, 128/192/256-bit key).
 *
 * Supports all three FIPS 197 key sizes. The ECB primitive is exposed;
 * mode-of-operation wrappers (CBC, CTR, OFB) are separate packages
 * built on top of this core.
 */
import { AesContext, AesInitialise, AesEncrypt, AesDecrypt, AesEncryptInPlace, AesDecryptInPlace } from './aes.js';

const AES_BLOCK_SIZE = 16;
const AES_KEY_SIZE_128 = 16;
const AES_KEY_SIZE_192 = 24;
const AES_KEY_SIZE_256 = 32;

/**
 * AES cipher instance. Holds the expanded key schedule.
 */
export class Aes {
  private ctx: AesContext;

  /** Construct an AES instance with a 16-, 24-, or 32-byte key. */
  constructor(key: Uint8Array) {
    if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
      throw new RangeError('AES key must be 16, 24, or 32 bytes (AES-128, AES-192, AES-256)');
    }
    this.ctx = new AesContext();
    const rc = AesInitialise(this.ctx, { buf: key, off: 0 }, key.length);
    if (rc !== 0) throw new Error(`AesInitialise failed (rc=${rc})`);
  }

  /** Encrypt a single 16-byte block (ECB). Returns a fresh Uint8Array. */
  encryptBlock(plaintext: Uint8Array): Uint8Array {
    if (plaintext.length !== AES_BLOCK_SIZE) {
      throw new RangeError(`AES block size is ${AES_BLOCK_SIZE} bytes`);
    }
    const out = new Uint8Array(AES_BLOCK_SIZE);
    AesEncrypt(this.ctx, { buf: plaintext, off: 0 }, { buf: out, off: 0 });
    return out;
  }

  /** Decrypt a single 16-byte block (ECB). */
  decryptBlock(ciphertext: Uint8Array): Uint8Array {
    if (ciphertext.length !== AES_BLOCK_SIZE) {
      throw new RangeError(`AES block size is ${AES_BLOCK_SIZE} bytes`);
    }
    const out = new Uint8Array(AES_BLOCK_SIZE);
    AesDecrypt(this.ctx, { buf: ciphertext, off: 0 }, { buf: out, off: 0 });
    return out;
  }

  /** In-place encrypt of a single 16-byte block. Mutates `block`. */
  encryptInPlace(block: Uint8Array): void {
    if (block.length !== AES_BLOCK_SIZE) throw new RangeError('block must be 16 bytes');
    AesEncryptInPlace(this.ctx, { buf: block, off: 0 });
  }

  /** In-place decrypt. */
  decryptInPlace(block: Uint8Array): void {
    if (block.length !== AES_BLOCK_SIZE) throw new RangeError('block must be 16 bytes');
    AesDecryptInPlace(this.ctx, { buf: block, off: 0 });
  }
}

export { AES_BLOCK_SIZE, AES_KEY_SIZE_128, AES_KEY_SIZE_192, AES_KEY_SIZE_256 };
