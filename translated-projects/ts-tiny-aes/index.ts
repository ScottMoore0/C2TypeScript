/**
 * ts-tiny-aes
 *
 * TypeScript port of tiny-AES-c, a small portable AES128/192/256 in C with
 * no external dependencies. Implements ECB, CBC, and CTR modes.
 * Original C version by kokke (https://github.com/kokke/tiny-AES-c),
 * released into the public domain (Unlicense).
 * TypeScript translation copyright (c) 2026 Scott Moore;
 * released under the same public-domain terms (Unlicense) as the upstream.
 */

export {
  AES_ctx,
  AES_init_ctx,
  AES_init_ctx_iv,
  AES_ctx_set_iv,
  AES_ECB_encrypt,
  AES_ECB_decrypt,
  AES_CBC_encrypt_buffer,
  AES_CBC_decrypt_buffer,
  AES_CTR_xcrypt_buffer,
} from './aes.js';
