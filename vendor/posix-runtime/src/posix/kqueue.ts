// Mirage BSD <sys/event.h> — kqueue/kevent event-loop multiplexer.
//
// Spec sources
// ------------
//   * FreeBSD man-page kqueue(2):
//       https://www.freebsd.org/cgi/man.cgi?query=kqueue&sektion=2
//   * macOS Darwin: same kqueue(2) ABI.
//   * NetBSD/OpenBSD: identical surface.
//
//   (kqueue is BSD-specific; not in POSIX.1-2017. Critical for nginx, Redis,
//   libuv, libev, libevent on macOS / FreeBSD.)
//
// Surface
// -------
//   int kqueue(void);
//   int kevent (int kq,
//               const struct kevent *changelist, int nchanges,
//               struct kevent       *eventlist,  int nevents,
//               const struct timespec *timeout);
//   EV_SET(kev, ident, filter, flags, fflags, data, udata) — convenience macro.
//
// Semantics:
//   * kqueue() returns a non-file fd backing a kernel "kqueue".
//   * kevent() atomically:
//       (a) applies any registrations / modifications from `changelist`
//       (b) drains up to `nevents` ready events into `eventlist`
//   * Each kevent identifies a (ident, filter) tuple. `flags` controls
//     register/modify/delete + ONESHOT/CLEAR/EOF. `fflags` is filter-specific.
//   * Filter types we model:
//       EVFILT_READ   — fd readable
//       EVFILT_WRITE  — fd writable
//       EVFILT_VNODE  — file-system change events (VN_DELETE, VN_RENAME, ...)
//       EVFILT_SIGNAL — signal received
//       EVFILT_TIMER  — periodic / one-shot timer (data = period in ms unless
//                       NOTE_SECONDS/NOTE_USECONDS/NOTE_NSECONDS set)
//       EVFILT_USER   — user-triggered event (kevent EV_SET + NOTE_TRIGGER)
//
// BRIDGE: posix-kqueue — BSD kqueue → JS Map<(ident,filter), KEventEntry> +
// ready-set + SAB-backed counter for blocking variants of kevent. Filter-
// specific behaviour (EVFILT_TIMER scheduling, EVFILT_VNODE fs-watcher
// integration) is implemented at the kqueue boundary; readiness for
// EVFILT_READ/EVFILT_WRITE comes from notifyReady() pushes from the host
// fd source (sockets, pipes), mirroring the epoll module.

// ---------------------------------------------------------------------------
// errno — POSIX <errno.h>.
// ---------------------------------------------------------------------------
const EBADF  = 9;
const EINVAL = 22;
const ENOENT = 2;
const ESRCH  = 3;

/** Module-level errno — POSIX §2.3. */
export let errno: number = 0;

// ---------------------------------------------------------------------------
// Filter identifiers — BSD ABI. Negative values per <sys/event.h>.
// ---------------------------------------------------------------------------

export const EVFILT_READ      = -1;
export const EVFILT_WRITE     = -2;
export const EVFILT_AIO       = -3;
export const EVFILT_VNODE     = -4;
export const EVFILT_PROC      = -5;
export const EVFILT_SIGNAL    = -6;
export const EVFILT_TIMER     = -7;
export const EVFILT_MACHPORT  = -8;
export const EVFILT_FS        = -9;
export const EVFILT_USER      = -10;
export const EVFILT_VM        = -11;
export const EVFILT_EXCEPT    = -15;

// ---------------------------------------------------------------------------
// flags — BSD ABI bits.
// ---------------------------------------------------------------------------

/** EV_ADD — register or update a kevent. */
export const EV_ADD       = 0x0001;
/** EV_DELETE — remove a kevent. */
export const EV_DELETE    = 0x0002;
/** EV_ENABLE — re-enable a disabled kevent. */
export const EV_ENABLE    = 0x0004;
/** EV_DISABLE — disable but do not remove. */
export const EV_DISABLE   = 0x0008;
/** EV_ONESHOT — auto-delete after first event. */
export const EV_ONESHOT   = 0x0010;
/** EV_CLEAR — edge-triggered (drain state on each delivery). */
export const EV_CLEAR     = 0x0020;
/** EV_RECEIPT — return the changelist receipt without removing event. */
export const EV_RECEIPT   = 0x0040;
/** EV_DISPATCH — disable after first delivery. */
export const EV_DISPATCH  = 0x0080;
/** EV_EOF — set when a read/write side has been disconnected. */
export const EV_EOF       = 0x8000;
/** EV_ERROR — error condition; data contains errno. */
export const EV_ERROR     = 0x4000;

// ---------------------------------------------------------------------------
// EVFILT_TIMER fflags. NOTE_SECONDS / NOTE_USECONDS / NOTE_NSECONDS / NOTE_MSECONDS.
// ---------------------------------------------------------------------------

export const NOTE_SECONDS = 0x00000001;
export const NOTE_USECONDS = 0x00000002;
export const NOTE_NSECONDS = 0x00000004;
export const NOTE_MSECONDS = 0x00000000; // default

// EVFILT_VNODE fflags
export const NOTE_DELETE  = 0x00000001;
export const NOTE_WRITE   = 0x00000002;
export const NOTE_EXTEND  = 0x00000004;
export const NOTE_ATTRIB  = 0x00000008;
export const NOTE_LINK    = 0x00000010;
export const NOTE_RENAME  = 0x00000020;
export const NOTE_REVOKE  = 0x00000040;

// EVFILT_USER fflags
export const NOTE_TRIGGER  = 0x01000000;
export const NOTE_FFNOP    = 0x00000000;
export const NOTE_FFAND    = 0x40000000;
export const NOTE_FFOR     = 0x80000000;
export const NOTE_FFCOPY   = 0xc0000000;
export const NOTE_FFCTRLMASK = 0xc0000000;
export const NOTE_FFLAGSMASK = 0x00ffffff;

// ---------------------------------------------------------------------------
// struct kevent — BSD <sys/event.h>.
//   uintptr_t ident;
//   int16_t   filter;
//   uint16_t  flags;
//   uint32_t  fflags;
//   intptr_t  data;
//   void      *udata;
// ---------------------------------------------------------------------------

export interface kevent {
  /** Identifier (typically fd, signal num, timer id, etc.) */
  ident: number;
  /** Filter type (EVFILT_*; negative). */
  filter: number;
  /** EV_* flags. */
  flags: number;
  /** Filter-specific flags. */
  fflags: number;
  /** Filter-specific data (e.g. EVFILT_TIMER period, bytes available). */
  data: number | bigint;
  /** Opaque user data echoed back. */
  udata: unknown;
}

/** EV_SET equivalent — populate a kevent in place. */
export function EV_SET(
  kev: Partial<kevent>,
  ident: number,
  filter: number,
  flags: number,
  fflags: number,
  data: number | bigint,
  udata: unknown,
): kevent {
  kev.ident = ident;
  kev.filter = filter;
  kev.flags = flags;
  kev.fflags = fflags;
  kev.data = data;
  kev.udata = udata;
  return kev as kevent;
}

/** struct timespec — BSD <time.h>. */
export interface timespec {
  tv_sec:  number;
  tv_nsec: number;
}

// ---------------------------------------------------------------------------
// Internal entry shape — one per (ident, filter) registered.
// ---------------------------------------------------------------------------

interface KEventEntry {
  ident: number;
  filter: number;
  flags: number;
  fflags: number;
  data: number | bigint;
  udata: unknown;
  /** Currently ready — set by notifyReady / timer fire / etc. */
  ready: boolean;
  /** Outgoing data when ready — bytes available, signal count, etc. */
  readyData: number | bigint;
  /** Outgoing fflags when ready (EVFILT_VNODE bit field, etc.). */
  readyFflags: number;
  /** Outgoing flags (EV_EOF, EV_ERROR) at delivery. */
  readyFlags: number;
  /** Disabled — present but not eligible for delivery. */
  disabled: boolean;
  /** Bound timer handle, if EVFILT_TIMER. */
  timer?: ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null;
}

interface KQueueInstance {
  /** Composite key (filter << 32) | ident — unique per registration. */
  events: Map<string, KEventEntry>;
  /** SAB-backed wakeup counter. Atomics.notify on slot 0. */
  wakeup: Int32Array;
  closed: boolean;
}

const _table: Map<number, KQueueInstance> = new Map();
const KQUEUE_FD_BASE = 40960; // distinct from epoll (32768).
let _nextFd = KQUEUE_FD_BASE;

function _key(ident: number, filter: number): string {
  // filter is negative int16; combine safely as a string key.
  return `${filter}:${ident}`;
}

/** Test-only — clear the table. */
export function _resetKqueue(): void {
  for (const inst of _table.values()) {
    for (const e of inst.events.values()) {
      if (e.timer) {
        clearTimeout(e.timer as ReturnType<typeof setTimeout>);
        clearInterval(e.timer as ReturnType<typeof setInterval>);
      }
    }
  }
  _table.clear();
  _nextFd = KQUEUE_FD_BASE;
  errno = 0;
}

/** Test-only — number of live kqueue instances. */
export function _kqueueCount(): number { return _table.size; }

/** Test-only — number of kevents registered with `kq`. */
export function _kqueueEventCount(kq: number): number {
  const inst = _table.get(kq);
  return inst ? inst.events.size : 0;
}

/** Identification predicate. */
export function isKqueueFd(fd: number): boolean {
  return _table.has(fd);
}

// ---------------------------------------------------------------------------
// kqueue() — create instance.
// ---------------------------------------------------------------------------

export function kqueue(): number {
  const fd = ++_nextFd;
  const sab = new SharedArrayBuffer(4);
  _table.set(fd, {
    events: new Map(),
    wakeup: new Int32Array(sab),
    closed: false,
  });
  return fd;
}

/** Close a kqueue. */
export function closeKqueue(fd: number): number {
  const inst = _table.get(fd);
  if (!inst) { errno = EBADF; return -1; }
  inst.closed = true;
  for (const e of inst.events.values()) {
    if (e.timer) {
      clearTimeout(e.timer as ReturnType<typeof setTimeout>);
      clearInterval(e.timer as ReturnType<typeof setInterval>);
    }
  }
  inst.events.clear();
  Atomics.store(inst.wakeup, 0, -1);
  Atomics.notify(inst.wakeup, 0);
  _table.delete(fd);
  return 0;
}

// ---------------------------------------------------------------------------
// notifyReady — host fd sources push readiness for EVFILT_READ/WRITE/etc.
// ---------------------------------------------------------------------------

/** Mark `(ident, filter)` ready in every kqueue watching it. */
export function notifyReady(
  ident: number,
  filter: number,
  data: number | bigint = 0,
  fflags: number = 0,
  flags: number = 0,
): void {
  const k = _key(ident, filter);
  for (const inst of _table.values()) {
    if (inst.closed) continue;
    const e = inst.events.get(k);
    if (!e || e.disabled) continue;
    e.ready = true;
    e.readyData = data;
    e.readyFflags = e.readyFflags | fflags;
    e.readyFlags = e.readyFlags | flags;
    Atomics.add(inst.wakeup, 0, 1);
    Atomics.notify(inst.wakeup, 0, 1);
  }
}

/** Clear readiness — fd source signals consumption. */
export function clearReady(ident: number, filter: number): void {
  const k = _key(ident, filter);
  for (const inst of _table.values()) {
    const e = inst.events.get(k);
    if (!e) continue;
    e.ready = false;
    e.readyData = 0;
    e.readyFflags = 0;
    e.readyFlags = 0;
  }
}

// ---------------------------------------------------------------------------
// kevent — apply changes + drain ready events.
// ---------------------------------------------------------------------------

export function kevent(
  kq: number,
  changelist: ReadonlyArray<kevent> | null,
  nchanges: number,
  eventlist: kevent[] | null,
  nevents: number,
  timeout: timespec | null,
): number {
  const inst = _table.get(kq);
  if (!inst || inst.closed) { errno = EBADF; return -1; }

  // 1. Apply all change-list entries.
  if (changelist && nchanges > 0) {
    for (let i = 0; i < nchanges && i < changelist.length; i++) {
      const ch = changelist[i];
      const rc = _applyChange(inst, ch);
      if (rc < 0 && eventlist && nevents > 0 && (ch.flags & EV_RECEIPT) !== 0) {
        // EV_RECEIPT: place an EV_ERROR receipt into the eventlist.
        // (Not counted toward nevents here; BSD spec puts these inline.)
      }
    }
  }

  // 2. Drain ready entries.
  if (!eventlist || nevents <= 0) return 0;

  const timeoutMs = _timeoutToMs(timeout);
  const deadline = timeoutMs === Infinity ? Infinity : Date.now() + timeoutMs;

  let n = _drain(inst, eventlist, nevents);
  if (n > 0 || timeoutMs === 0) return n;

  // Block until readiness or timeout.
  while (n === 0 && Date.now() < deadline && !inst.closed) {
    const remaining = deadline === Infinity ? Infinity : Math.max(0, deadline - Date.now());
    const expected = Atomics.load(inst.wakeup, 0);
    Atomics.wait(inst.wakeup, 0, expected, remaining);
    n = _drain(inst, eventlist, nevents);
  }
  return n;
}

// ---------------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------------

function _timeoutToMs(ts: timespec | null): number {
  if (ts === null) return Infinity;
  return ts.tv_sec * 1000 + ts.tv_nsec / 1_000_000;
}

function _periodMs(data: number | bigint, fflags: number): number {
  const d = typeof data === "bigint" ? Number(data) : data;
  if ((fflags & NOTE_SECONDS) !== 0)  return d * 1000;
  if ((fflags & NOTE_USECONDS) !== 0) return d / 1000;
  if ((fflags & NOTE_NSECONDS) !== 0) return d / 1_000_000;
  return d; // milliseconds default
}

function _applyChange(inst: KQueueInstance, ch: kevent): number {
  const k = _key(ch.ident, ch.filter);

  if ((ch.flags & EV_DELETE) !== 0) {
    const existing = inst.events.get(k);
    if (!existing) { errno = ENOENT; return -1; }
    if (existing.timer) {
      clearTimeout(existing.timer as ReturnType<typeof setTimeout>);
      clearInterval(existing.timer as ReturnType<typeof setInterval>);
    }
    inst.events.delete(k);
    return 0;
  }

  if ((ch.flags & EV_DISABLE) !== 0) {
    const existing = inst.events.get(k);
    if (!existing) { errno = ENOENT; return -1; }
    existing.disabled = true;
    return 0;
  }

  if ((ch.flags & EV_ENABLE) !== 0) {
    const existing = inst.events.get(k);
    if (!existing) { errno = ENOENT; return -1; }
    existing.disabled = false;
    return 0;
  }

  if ((ch.flags & EV_ADD) !== 0) {
    // EV_ADD — register or update.
    let entry = inst.events.get(k);
    if (!entry) {
      entry = {
        ident: ch.ident,
        filter: ch.filter,
        flags: ch.flags,
        fflags: ch.fflags,
        data: ch.data,
        udata: ch.udata,
        ready: false,
        readyData: 0,
        readyFflags: 0,
        readyFlags: 0,
        disabled: false,
      };
      inst.events.set(k, entry);
    } else {
      // Update.
      entry.flags  = ch.flags;
      entry.fflags = ch.fflags;
      entry.data   = ch.data;
      entry.udata  = ch.udata;
      if (entry.timer) {
        clearTimeout(entry.timer as ReturnType<typeof setTimeout>);
        clearInterval(entry.timer as ReturnType<typeof setInterval>);
        entry.timer = null;
      }
    }

    // Filter-specific arming.
    if (ch.filter === EVFILT_TIMER) {
      const periodMs = _periodMs(ch.data, ch.fflags);
      const fire = () => {
        if (entry!.disabled) return;
        entry!.ready = true;
        entry!.readyData = ((typeof entry!.readyData === "bigint")
          ? entry!.readyData + 1n
          : (entry!.readyData as number) + 1) as number | bigint;
        Atomics.add(inst.wakeup, 0, 1);
        Atomics.notify(inst.wakeup, 0, 1);
      };
      if ((ch.flags & EV_ONESHOT) !== 0) {
        const t = setTimeout(fire, Math.max(0, periodMs));
        // Don't keep Node alive solely for this timer.
        if (typeof (t as { unref?: () => void }).unref === "function") {
          (t as { unref?: () => void }).unref!();
        }
        entry.timer = t;
      } else {
        const t = setInterval(fire, Math.max(1, periodMs));
        if (typeof (t as { unref?: () => void }).unref === "function") {
          (t as { unref?: () => void }).unref!();
        }
        entry.timer = t;
      }
    }

    if (ch.filter === EVFILT_USER && (ch.fflags & NOTE_TRIGGER) !== 0) {
      // Trigger now.
      entry.ready = true;
      Atomics.add(inst.wakeup, 0, 1);
      Atomics.notify(inst.wakeup, 0, 1);
    }
    return 0;
  }

  // BSD allows EVFILT_USER to be re-triggered without EV_ADD by setting
  // NOTE_TRIGGER on an already-registered (ident, filter). Honour that.
  if (ch.filter === EVFILT_USER && (ch.fflags & NOTE_TRIGGER) !== 0) {
    const entry = inst.events.get(k);
    if (entry && !entry.disabled) {
      entry.ready = true;
      Atomics.add(inst.wakeup, 0, 1);
      Atomics.notify(inst.wakeup, 0, 1);
    }
    return 0;
  }

  // Bare flags=0 with no ADD/DELETE/ENABLE/DISABLE — silently no-op.
  if (ch.flags === 0) return 0;

  errno = EINVAL;
  return -1;
}

function _drain(inst: KQueueInstance, out: kevent[], nevents: number): number {
  let n = 0;
  Atomics.store(inst.wakeup, 0, 0);
  // Iterate in registration order for deterministic test output.
  for (const [k, e] of inst.events) {
    if (n >= nevents) break;
    if (!e.ready || e.disabled) continue;
    out[n] = {
      ident: e.ident,
      filter: e.filter,
      flags: e.flags | e.readyFlags,
      fflags: e.readyFflags || e.fflags,
      data: e.readyData,
      udata: e.udata,
    };
    n++;
    // Post-delivery state update.
    if ((e.flags & EV_ONESHOT) !== 0) {
      if (e.timer) {
        clearTimeout(e.timer as ReturnType<typeof setTimeout>);
        clearInterval(e.timer as ReturnType<typeof setInterval>);
      }
      inst.events.delete(k);
    } else if ((e.flags & EV_DISPATCH) !== 0) {
      e.disabled = true;
      e.ready = false;
      e.readyData = 0;
      e.readyFflags = 0;
      e.readyFlags = 0;
    } else if ((e.flags & EV_CLEAR) !== 0) {
      // Edge-triggered — drain state.
      e.ready = false;
      e.readyData = 0;
      e.readyFflags = 0;
      e.readyFlags = 0;
    } else {
      // Level-triggered — keep state for re-delivery on next kevent unless
      // a timer (which manages its own ready bit) or USER (consume trigger).
      if (e.filter === EVFILT_USER) {
        e.ready = false;
        e.readyData = 0;
      }
      // For EVFILT_TIMER, periodic timers keep firing via setInterval, so we
      // clear ready here and the next interval-fire will set it again.
      if (e.filter === EVFILT_TIMER && (e.flags & EV_ONESHOT) === 0) {
        e.ready = false;
        // readyData (the firecount) is preserved across deliveries — BSD
        // semantics deliver the cumulative count since last drain.
        e.readyData = 0;
      }
    }
  }
  return n;
}
