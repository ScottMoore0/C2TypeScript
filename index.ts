/**
 * ts-xoshiro128pp — TypeScript port of xoshiro128++ by David Blackman
 * and Sebastiano Vigna.
 *
 * Upstream: https://prng.di.unimi.it/xoshiro128plusplus.c (CC0)
 *
 * xoshiro128++ is a 32-bit all-purpose, rock-solid generator with a
 * 128-bit state space and a period of 2^128 − 1. Very fast, small state,
 * statistically excellent.
 *
 * This package exposes a class-based API so multiple independent streams
 * can coexist. The upstream module-level `s[4]` is swapped in/out around
 * each operation.
 */
import {
  s as moduleState,
  xoshiro128pp_next,
  xoshiro128pp_seed,
  xoshiro128pp_jump,
  xoshiro128pp_long_jump,
} from './xoshiro128pp.js';

function asU32(v: number): number { return v >>> 0; }

/**
 * A xoshiro128++ generator. State is stored on the instance; the C
 * module-level state is swapped in/out around each operation so
 * multiple instances coexist independently.
 */
export class Xoshiro128pp {
  private state0: number;
  private state1: number;
  private state2: number;
  private state3: number;

  /**
   * @param seed  Four 32-bit unsigned integers. Default `[1, 2, 3, 4]`.
   *              State must not be all-zero (it is a fixed point).
   */
  constructor(seed: [number, number, number, number] | number[] = [1, 2, 3, 4]) {
    if (seed.length !== 4) throw new RangeError('seed must be 4 uint32 values');
    if ((seed[0] | seed[1] | seed[2] | seed[3]) === 0) {
      throw new RangeError('xoshiro128++ state must not be all-zero');
    }
    this.state0 = asU32(seed[0]);
    this.state1 = asU32(seed[1]);
    this.state2 = asU32(seed[2]);
    this.state3 = asU32(seed[3]);
  }

  private loadState(): void {
    xoshiro128pp_seed(this.state0, this.state1, this.state2, this.state3);
  }

  private saveState(): void {
    this.state0 = asU32(moduleState[0]);
    this.state1 = asU32(moduleState[1]);
    this.state2 = asU32(moduleState[2]);
    this.state3 = asU32(moduleState[3]);
  }

  /** Return the next 32-bit unsigned random value. State advances. */
  next(): number {
    this.loadState();
    const v = asU32(xoshiro128pp_next());
    this.saveState();
    return v;
  }

  /** A float in [0, 1) with 32 bits of precision. */
  nextFloat(): number {
    return this.next() / 0x1_0000_0000;
  }

  /** An integer in [0, bound). */
  nextInt(bound: number): number {
    if (!Number.isInteger(bound) || bound <= 0) {
      throw new RangeError('bound must be a positive integer');
    }
    return Math.floor(this.nextFloat() * bound);
  }

  /** Equivalent to 2^64 calls to next(). */
  jump(): this {
    this.loadState();
    xoshiro128pp_jump();
    this.saveState();
    return this;
  }

  /** Equivalent to 2^96 calls to next(). */
  longJump(): this {
    this.loadState();
    xoshiro128pp_long_jump();
    this.saveState();
    return this;
  }

  /** Read-only snapshot of internal state. */
  getState(): [number, number, number, number] {
    return [this.state0, this.state1, this.state2, this.state3];
  }
}

/**
 * One-shot convenience: create a stream and pull `count` uint32 values.
 */
export function generate(
  seed: [number, number, number, number] | number[],
  count: number,
): Uint32Array {
  const r = new Xoshiro128pp(seed);
  const out = new Uint32Array(count);
  for (let i = 0; i < count; i++) out[i] = r.next();
  return out;
}
