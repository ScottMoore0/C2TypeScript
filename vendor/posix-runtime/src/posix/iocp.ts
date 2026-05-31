// Mirage Windows IOCP — I/O Completion Ports surface.
//
// Spec sources
// ------------
//   * Microsoft Win32 docs:
//       https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports
//       CreateIoCompletionPort, GetQueuedCompletionStatus,
//       PostQueuedCompletionStatus, GetQueuedCompletionStatusEx.
//
//   IOCP is the Windows analog of epoll/kqueue and is used by libuv's
//   Windows backend (uv_poll_t / uv_tcp_t / uv_udp_t). Mirage's epoll and
//   kqueue modules cover Linux+BSD; this module exposes the IOCP shape so
//   translated Windows-specific code at least compiles and links — actual
//   Windows-overlapped-I/O semantics are forwarded to the same internal
//   notify mechanism used by epoll/kqueue, which is sufficient to drive a
//   single-process event loop in JS.
//
// Surface (subset, sized to libuv's usage):
//   HANDLE CreateIoCompletionPort      (HANDLE FileHandle, HANDLE ExistingPort,
//                                       ULONG_PTR CompletionKey,
//                                       DWORD NumberOfConcurrentThreads);
//   BOOL   GetQueuedCompletionStatus   (HANDLE Port, LPDWORD BytesXferred,
//                                       PULONG_PTR Key, LPOVERLAPPED *Overlapped,
//                                       DWORD Timeout);
//   BOOL   GetQueuedCompletionStatusEx (HANDLE Port,
//                                       LPOVERLAPPED_ENTRY Entries,
//                                       ULONG Count, PULONG Removed,
//                                       DWORD Timeout, BOOL fAlertable);
//   BOOL   PostQueuedCompletionStatus  (HANDLE Port, DWORD BytesXferred,
//                                       ULONG_PTR Key, LPOVERLAPPED Overlapped);
//   BOOL   CloseHandle                 (HANDLE Port);    // for the IOCP handle
//
// Status: BRIDGE: posix-iocp — minimal but functional in-process queue. A full
// Windows-overlapped-I/O integration (FILE_FLAG_OVERLAPPED + ReadFileEx +
// completion-key dispatch) is out of scope for the pure-JS runtime; Linux +
// BSD parity is the primary target for translated server code, and IOCP is
// here for shape compatibility plus an in-process work-queue useful to
// translated tools that drive their own completion routines.

// ---------------------------------------------------------------------------
// Win32 boolean / sentinel constants.
// ---------------------------------------------------------------------------

/** Windows TRUE. */
export const WINBOOL_TRUE  = 1;
/** Windows FALSE. */
export const WINBOOL_FALSE = 0;

/** INVALID_HANDLE_VALUE — Win32 sentinel for an invalid HANDLE. */
export const INVALID_HANDLE_VALUE = -1;

/** Wait timeout sentinel (DWORD). */
export const INFINITE = 0xffffffff;

// ---------------------------------------------------------------------------
// errno-like lastError. Win32 calls set GetLastError(); we expose a module-
// level numeric mirror.
// ---------------------------------------------------------------------------

/** Win32 ERROR_INVALID_HANDLE. */
export const ERROR_INVALID_HANDLE  = 6;
/** Win32 ERROR_INVALID_PARAMETER. */
export const ERROR_INVALID_PARAMETER = 87;
/** Win32 WAIT_TIMEOUT. */
export const WAIT_TIMEOUT          = 258;
/** Win32 ERROR_ABANDONED_WAIT_0. */
export const ERROR_ABANDONED_WAIT_0 = 735;

let _lastError: number = 0;

/** Win32 GetLastError() shim. */
export function GetLastError(): number { return _lastError; }
/** Test helper to set the last-error mirror. */
export function _setLastError(v: number): void { _lastError = v; }

// ---------------------------------------------------------------------------
// OVERLAPPED + completion-entry shapes.
// ---------------------------------------------------------------------------

/** Win32 OVERLAPPED — partial; we expose the user-visible fields. */
export interface OVERLAPPED {
  Internal:     bigint;
  InternalHigh: bigint;
  Offset:       number;
  OffsetHigh:   number;
  hEvent:       number;
  /** User payload — Mirage convenience to round-trip arbitrary data. */
  user?:        unknown;
}

/** Win32 OVERLAPPED_ENTRY — for GetQueuedCompletionStatusEx. */
export interface OVERLAPPED_ENTRY {
  lpCompletionKey:  bigint | number;
  lpOverlapped:     OVERLAPPED | null;
  Internal:         bigint;
  dwNumberOfBytesTransferred: number;
}

// ---------------------------------------------------------------------------
// Internal queue per IOCP handle.
// ---------------------------------------------------------------------------

interface CompletionPacket {
  bytesTransferred: number;
  key: bigint | number;
  overlapped: OVERLAPPED | null;
}

interface IocpInstance {
  /** FIFO queue of pending completion packets. */
  queue: CompletionPacket[];
  /** Files associated with this port, keyed by their HANDLE. */
  associated: Map<number, { key: bigint | number }>;
  /** SAB-backed wakeup counter for blocking GetQueuedCompletionStatus. */
  wakeup: Int32Array;
  closed: boolean;
}

const _table: Map<number, IocpInstance> = new Map();
const IOCP_HANDLE_BASE = 49152;
let _nextHandle = IOCP_HANDLE_BASE;

/** Test-only — clear the table. */
export function _resetIocp(): void {
  _table.clear();
  _nextHandle = IOCP_HANDLE_BASE;
  _lastError = 0;
}

/** Test-only — number of live IOCP handles. */
export function _iocpCount(): number { return _table.size; }

/** Test-only — number of queued packets in `port`. */
export function _iocpQueueDepth(port: number): number {
  const inst = _table.get(port);
  return inst ? inst.queue.length : 0;
}

/** Identification predicate. */
export function isIocpHandle(h: number): boolean {
  return _table.has(h);
}

// ---------------------------------------------------------------------------
// CreateIoCompletionPort — both create-new and associate-existing modes.
// ---------------------------------------------------------------------------

/** Win32 CreateIoCompletionPort. */
export function CreateIoCompletionPort(
  fileHandle: number,
  existingCompletionPort: number,
  completionKey: bigint | number,
  _numberOfConcurrentThreads: number,
): number {
  // Mode A: create a new port. fileHandle == INVALID_HANDLE_VALUE,
  // existingCompletionPort == 0/null.
  if (fileHandle === INVALID_HANDLE_VALUE && existingCompletionPort === 0) {
    const handle = ++_nextHandle;
    const sab = new SharedArrayBuffer(4);
    _table.set(handle, {
      queue: [],
      associated: new Map(),
      wakeup: new Int32Array(sab),
      closed: false,
    });
    return handle;
  }

  // Mode B: associate fileHandle with existingCompletionPort.
  if (existingCompletionPort > 0 && fileHandle !== INVALID_HANDLE_VALUE) {
    const inst = _table.get(existingCompletionPort);
    if (!inst || inst.closed) {
      _lastError = ERROR_INVALID_HANDLE;
      return 0;
    }
    inst.associated.set(fileHandle, { key: completionKey });
    return existingCompletionPort;
  }

  _lastError = ERROR_INVALID_PARAMETER;
  return 0;
}

/** Win32 CloseHandle for an IOCP handle. */
export function CloseHandle(handle: number): number {
  const inst = _table.get(handle);
  if (!inst) { _lastError = ERROR_INVALID_HANDLE; return WINBOOL_FALSE; }
  inst.closed = true;
  inst.queue.length = 0;
  inst.associated.clear();
  Atomics.store(inst.wakeup, 0, -1);
  Atomics.notify(inst.wakeup, 0);
  _table.delete(handle);
  return WINBOOL_TRUE;
}

// ---------------------------------------------------------------------------
// PostQueuedCompletionStatus — push a completion packet into the queue.
// ---------------------------------------------------------------------------

/** Win32 PostQueuedCompletionStatus. */
export function PostQueuedCompletionStatus(
  port: number,
  bytesTransferred: number,
  completionKey: bigint | number,
  overlapped: OVERLAPPED | null,
): number {
  const inst = _table.get(port);
  if (!inst || inst.closed) {
    _lastError = ERROR_INVALID_HANDLE;
    return WINBOOL_FALSE;
  }
  inst.queue.push({
    bytesTransferred,
    key: completionKey,
    overlapped,
  });
  Atomics.add(inst.wakeup, 0, 1);
  Atomics.notify(inst.wakeup, 0, 1);
  return WINBOOL_TRUE;
}

// ---------------------------------------------------------------------------
// GetQueuedCompletionStatus — drain one packet, optionally blocking.
// ---------------------------------------------------------------------------

/** Mirage convenience return value for GetQueuedCompletionStatus, since JS
 *  cannot pass-by-pointer. The translator emits one of these per call site
 *  and reads the fields out. */
export interface GqcsResult {
  ok: boolean;
  bytesTransferred: number;
  completionKey: bigint | number;
  overlapped: OVERLAPPED | null;
}

/** Win32 GetQueuedCompletionStatus. `timeoutMs == INFINITE` blocks. */
export function GetQueuedCompletionStatus(
  port: number,
  timeoutMs: number,
): GqcsResult {
  const inst = _table.get(port);
  if (!inst || inst.closed) {
    _lastError = ERROR_INVALID_HANDLE;
    return { ok: false, bytesTransferred: 0, completionKey: 0, overlapped: null };
  }

  const deadline = (timeoutMs === INFINITE)
    ? Infinity
    : Date.now() + timeoutMs;

  while (inst.queue.length === 0 && Date.now() < deadline && !inst.closed) {
    const remaining = (deadline === Infinity)
      ? Infinity
      : Math.max(0, deadline - Date.now());
    const expected = Atomics.load(inst.wakeup, 0);
    Atomics.wait(inst.wakeup, 0, expected, remaining);
  }

  if (inst.queue.length === 0) {
    _lastError = WAIT_TIMEOUT;
    return { ok: false, bytesTransferred: 0, completionKey: 0, overlapped: null };
  }

  Atomics.store(inst.wakeup, 0, 0);
  const pkt = inst.queue.shift()!;
  return {
    ok: true,
    bytesTransferred: pkt.bytesTransferred,
    completionKey: pkt.key,
    overlapped: pkt.overlapped,
  };
}

// ---------------------------------------------------------------------------
// GetQueuedCompletionStatusEx — drain N packets in one call.
// ---------------------------------------------------------------------------

/** Mirage convenience return value for GetQueuedCompletionStatusEx. */
export interface GqcsExResult {
  ok: boolean;
  removed: number;
  entries: OVERLAPPED_ENTRY[];
}

/** Win32 GetQueuedCompletionStatusEx. */
export function GetQueuedCompletionStatusEx(
  port: number,
  count: number,
  timeoutMs: number,
  _fAlertable: number,
): GqcsExResult {
  const inst = _table.get(port);
  if (!inst || inst.closed) {
    _lastError = ERROR_INVALID_HANDLE;
    return { ok: false, removed: 0, entries: [] };
  }
  if (count <= 0) {
    _lastError = ERROR_INVALID_PARAMETER;
    return { ok: false, removed: 0, entries: [] };
  }

  const deadline = (timeoutMs === INFINITE) ? Infinity : Date.now() + timeoutMs;
  while (inst.queue.length === 0 && Date.now() < deadline && !inst.closed) {
    const remaining = (deadline === Infinity)
      ? Infinity
      : Math.max(0, deadline - Date.now());
    const expected = Atomics.load(inst.wakeup, 0);
    Atomics.wait(inst.wakeup, 0, expected, remaining);
  }

  if (inst.queue.length === 0) {
    _lastError = WAIT_TIMEOUT;
    return { ok: false, removed: 0, entries: [] };
  }

  Atomics.store(inst.wakeup, 0, 0);
  const out: OVERLAPPED_ENTRY[] = [];
  let n = 0;
  while (n < count && inst.queue.length > 0) {
    const pkt = inst.queue.shift()!;
    out.push({
      lpCompletionKey: pkt.key,
      lpOverlapped: pkt.overlapped,
      Internal: 0n,
      dwNumberOfBytesTransferred: pkt.bytesTransferred,
    });
    n++;
  }
  return { ok: true, removed: n, entries: out };
}
