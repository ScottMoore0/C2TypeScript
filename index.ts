/**
 * ts-md2 — TypeScript port of Brad Conte's MD2 reference (RFC 1319).
 *
 * Upstream: https://github.com/B-Con/crypto-algorithms (public domain)
 *
 * MD2 is OBSOLETE and cryptographically broken (RFC 6149 deprecated it
 * in 2011). This package exists for interop with archived data formats,
 * old PKCS#1 v1.5 signatures, and legacy systems.
 */
import { MD2_CTX, md2_init, md2_update, md2_final } from './md2.js';

const MD2_DIGEST_SIZE = 16;

function toBytes(input: Uint8Array | string): Uint8Array {
  return typeof input === 'string' ? new TextEncoder().encode(input) : input;
}

/** One-shot MD2 — returns the 16-byte digest. */
export function md2(input: Uint8Array | string): Uint8Array {
  const data = toBytes(input);
  const ctx = new MD2_CTX();
  md2_init(ctx);
  if (data.length > 0) md2_update(ctx, { buf: data, off: 0 }, data.length);
  const out = new Uint8Array(MD2_DIGEST_SIZE);
  md2_final(ctx, { buf: out, off: 0 });
  return out;
}

/** MD2 as a 32-char lowercase hex string. */
export function md2Hex(input: Uint8Array | string): string {
  const bytes = md2(input);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

/** Streaming API. Create a new `Md2` per message. */
export class Md2 {
  private ctx = new MD2_CTX();
  private finalized = false;
  constructor() { md2_init(this.ctx); }
  update(chunk: Uint8Array | string): this {
    if (this.finalized) throw new Error('Md2 already finalized');
    const data = toBytes(chunk);
    if (data.length > 0) md2_update(this.ctx, { buf: data, off: 0 }, data.length);
    return this;
  }
  digest(): Uint8Array {
    if (this.finalized) throw new Error('Md2 already finalized');
    this.finalized = true;
    const out = new Uint8Array(MD2_DIGEST_SIZE);
    md2_final(this.ctx, { buf: out, off: 0 });
    return out;
  }
  hexDigest(): string {
    const bytes = this.digest();
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
    return s;
  }
}

export { MD2_DIGEST_SIZE };
