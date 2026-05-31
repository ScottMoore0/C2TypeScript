// MC-7: Clock and timer abstractions.
// POSIX: gettimeofday, clock, time, clock_gettime.

export interface TimeVal {
  sec: number;
  usec: number;
}

export interface TimeSpec {
  sec: number;
  nsec: number;
}

export class Clock {
  private startTime: number;
  private offset: number = 0;

  constructor(startTime?: number) {
    this.startTime = startTime ?? Date.now();
  }

  /** Get current time as milliseconds since epoch. */
  nowMs(): number {
    return Date.now() + this.offset;
  }

  /** Get current time as seconds since epoch (C time()). */
  time(): number {
    return Math.floor(this.nowMs() / 1000);
  }

  /** Get current time as timeval struct (C gettimeofday). */
  gettimeofday(): TimeVal {
    const ms = this.nowMs();
    return {
      sec: Math.floor(ms / 1000),
      usec: (ms % 1000) * 1000
    };
  }

  /** Get monotonic clock time (C clock_gettime CLOCK_MONOTONIC). */
  clockGettime(): TimeSpec {
    const elapsed = performance.now();
    return {
      sec: Math.floor(elapsed / 1000),
      nsec: Math.floor((elapsed % 1000) * 1000000)
    };
  }

  /** Get process CPU time in "clock ticks" (C clock()). */
  clock(): number {
    // CLOCKS_PER_SEC is typically 1000000 on POSIX.
    return Math.floor(performance.now() * 1000);
  }

  /** Advance the virtual clock by ms (for testing). */
  advance(ms: number): void {
    this.offset += ms;
  }

  /** Set the virtual time to a specific timestamp. */
  setTime(ms: number): void {
    this.offset = ms - Date.now();
  }
}
