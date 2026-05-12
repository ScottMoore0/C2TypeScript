/**
 * ts-splitmix64 — TypeScript port of Sebastiano Vigna's SplitMix64.
 *
 * Upstream: https://github.com/jj1bdx/xorshiftplus-c/blob/master/splitmix64.c (CC0)
 *
 * SplitMix64 is the simplest high-quality 64-bit PRNG. It is the
 * canonical seeder for the xoshiro/xoroshiro family — its purpose is to
 * stretch a 64-bit input seed into independent random words. Passes
 * BigCrush. Algorithm by Stafford via Vigna; same generator as Java 8's
 * `SplittableRandom`.
 *
 * Outputs are 64-bit; returned as BigInt in JS.
 */
import {
  splitmix64_seed,
  splitmix64_next,
  splitmix64_get_state,
} from './splitmix64.js';

function asU64(v: number | bigint): bigint {
  return BigInt.asUintN(64, typeof v === 'bigint' ? v : BigInt(v));
}

/**
 * SplitMix64 PRNG instance. State is stored on the instance; the C
 * module-level state is swapped in/out around each operation so
 * multiple instances coexist independently.
 */
export class Splitmix64 {
  private state: bigint;

  /** Seed with any 64-bit value (including 0). */
  constructor(seed: bigint | number = 0n) {
    this.state = asU64(seed);
  }

  /** Return the next 64-bit unsigned random value. State advances. */
  next(): bigint {
    splitmix64_seed(this.state as unknown as number);
    const v = asU64(splitmix64_next());
    this.state = asU64(splitmix64_get_state());
    return v;
  }

  /** Return next as a 32-bit unsigned number (low 32 bits). */
  nextUint32(): number {
    return Number(this.next() & 0xffffffffn);
  }

  /** Return a float in [0, 1) with 53 bits of precision. */
  nextFloat(): number {
    // Take 53 high bits → divide by 2^53
    return Number(this.next() >> 11n) / 0x20_0000_0000_0000;
  }

  /** Current internal state (read-only snapshot). */
  getState(): bigint { return this.state; }

  /** Replace the internal state. */
  setState(s: bigint | number): void { this.state = asU64(s); }
}

/**
 * One-shot convenience: from `seed`, derive `count` independent
 * 64-bit values via SplitMix64. Useful for seeding other PRNGs.
 */
export function generate(seed: bigint | number, count: number): bigint[] {
  const r = new Splitmix64(seed);
  const out: bigint[] = [];
  for (let i = 0; i < count; i++) out.push(r.next());
  return out;
}
