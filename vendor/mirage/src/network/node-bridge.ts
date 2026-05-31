// MC-L7-Network.NodeSyncBridge — BSD-sockets bridge using a Node worker
// thread + SharedArrayBuffer + Atomics.wait to make real TCP/UDP I/O appear
// synchronous to the translated-C caller.
//
// Why this exists
// ---------------
// POSIX.1-2017 BSD sockets (<sys/socket.h>) are blocking by default: recv(),
// accept(), connect(), send() all block the calling thread until the kernel
// completes the operation. Node's `net` and `dgram` modules are async (they
// schedule callbacks on the event loop). Translated C programs can't await
// and can't yield to an event loop — they expect synchronous return values.
//
// ECMAScript §25.4 Atomics.wait provides the escape hatch: the main thread
// posts a request into a SharedArrayBuffer and blocks on `Atomics.wait` until
// a worker thread (which IS running Node's event loop) completes the I/O and
// writes the result back. The main thread sees the call as synchronous.
//
// One worker, one SAB, serialized RPC
// -----------------------------------
// We keep a single worker and a single 64 KiB SAB per NodeSyncBridge (one per
// NetworkStack). All ops are serialised through that one channel. Sockets
// are addressed by an integer fd minted by the worker. For the expected
// one-caller-at-a-time translated-C model this serialisation is fine;
// multi-threaded callers would need per-thread bridges (SP-9 concurrency
// integration, deferred).
//
// SAB layout (all indices are Int32):
//   [0]  state     — S_IDLE / S_REQUESTED / S_DONE / S_SHUTDOWN
//   [1]  opcode
//   [2]  fd
//   [3]  arg0 (backlog / flags / recv-size / how)
//   [4]  arg1
//   [5]  arg2
//   [6]  arg3
//   [7]  ret       — integer return value (bytes, fd, 0)
//   [8]  err       — errno on failure (positive)
//   [9]  dataLen   — bytes in data region (for send/recv payloads)
//   [10] port
//   [11] family    — AF_INET(2) / AF_INET6(10)
//   [12] addrLen   — bytes of address string at offset HEADER_BYTES
//   [13..15] reserved
// Data region starts at HEADER_BYTES = 64. For sendto/recvfrom the layout is
// [addrString][payload] so the worker can read both.

const HEADER_I32S  = 16;
const HEADER_BYTES = HEADER_I32S * 4;
// Total SAB size: 64 KiB covers both ends of one RPC. Larger recv() calls
// are clamped to (SAB_BYTES - HEADER_BYTES) by the main-thread helper.
const SAB_BYTES    = 64 * 1024;

// State word values.
const S_IDLE       = 0;
const S_REQUESTED  = 1;
const S_DONE       = 2;
const S_SHUTDOWN   = 3;

// Opcodes (must match bridge-worker.cjs).
const OP_CREATE_TCP   = 1;
const OP_CREATE_UDP   = 2;
const OP_BIND         = 3;
const OP_LISTEN       = 4;
const OP_ACCEPT       = 5;
const OP_CONNECT      = 6;
const OP_SEND         = 7;
const OP_RECV         = 8;
const OP_CLOSE        = 9;
const OP_SENDTO       = 10;
const OP_RECVFROM     = 11;
const OP_SHUTDOWN     = 12;

// Header indices.
const I_STATE    = 0;
const I_OPCODE   = 1;
const I_FD       = 2;
const I_ARG0     = 3;
const I_RET      = 7;
const I_ERR      = 8;
const I_DATALEN  = 9;
const I_PORT     = 10;
const I_FAMILY   = 11;
const I_ADDR_LEN = 12;

import type { SockAddr } from "./network.js";

/**
 * Returned struct for bridge ops — positive return value or -1 with errno.
 */
export interface BridgeResult {
  ret: number;
  err?: number;
  data?: Uint8Array;
  from?: SockAddr;
}

/**
 * Per-process Node bridge to a worker thread hosting real sockets.
 * Use `getDefaultBridge()` to obtain the shared instance; bring-your-own
 * `new NodeSyncBridge()` is allowed for tests.
 */
export class NodeSyncBridge {
  private sab: SharedArrayBuffer;
  private i32: Int32Array;
  private u8: Uint8Array;
  private worker: any; // worker_threads.Worker
  private closed = false;

  constructor() {
    // Lazy-require worker_threads so non-Node environments (browser,
    // deno-in-compat-mode) don't blow up at module load. Use createRequire
    // so this also works when compiled to native ESM modules.
    const g: any = globalThis;
    const req: (m: string) => any =
      typeof (g as any).require === "function"
        ? (g as any).require
        : (function () {
            // Dynamic ESM escape hatch: bind a module.createRequire for this file.
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const mod = eval("require")("node:module");
            // import.meta.url is present in ESM; fall back to process.cwd() if not.
            const fromUrl =
              typeof (g as any).__mirage_bridge_import_meta_url__ === "string"
                ? (g as any).__mirage_bridge_import_meta_url__
                : "file://" + process.cwd() + "/";
            return mod.createRequire(fromUrl);
          })();
    const wt = req("node:worker_threads");
    if (typeof (g as any).SharedArrayBuffer === "undefined") {
      throw new Error("NodeSyncBridge requires SharedArrayBuffer (Node >=14)");
    }
    this.sab = new SharedArrayBuffer(SAB_BYTES);
    this.i32 = new Int32Array(this.sab);
    this.u8  = new Uint8Array(this.sab);
    // Resolve worker path adjacent to this module.
    const path = req("node:path");
    const url  = req("node:url");
    // Find the network folder regardless of whether tsx is running the .ts
    // file from source or Node is running the built .js. We resolve the
    // worker script by probing known candidate paths.
    const candidates = [
      // tsx running mirage/src/network/node-bridge.ts
      path.join(process.cwd(), "mirage", "src", "network", "bridge-worker.cjs"),
      path.join(process.cwd(), "..", "mirage", "src", "network", "bridge-worker.cjs"),
      path.join(process.cwd(), "src", "network", "bridge-worker.cjs"),
      // dist layout
      path.join(process.cwd(), "mirage", "dist", "network", "bridge-worker.cjs"),
    ];
    // Try to resolve relative to a caller-provided URL (set by the ESM
    // wrapper if this module is loaded through one). We intentionally do
    // NOT reference import.meta here so this file is safe to compile
    // under both CommonJS and ESM module settings.
    try {
      const metaUrl = (g as any).__mirage_bridge_import_meta_url__;
      if (typeof metaUrl === "string") {
        const here = path.dirname(url.fileURLToPath(metaUrl));
        candidates.unshift(path.join(here, "bridge-worker.cjs"));
      }
    } catch { /* ignore */ }
    // Best-effort: when Node runs ESM, __dirname is undefined but the
    // module system still supports require() via createRequire (handled
    // above) — the path the user sees is the source .ts path, which tsx
    // places at mirage/src/network/. Add that to the candidate list.
    const fs = req("node:fs");
    let workerPath = candidates.find((p: string) => { try { return fs.existsSync(p); } catch { return false; } });
    if (!workerPath) {
      throw new Error("NodeSyncBridge: cannot locate bridge-worker.cjs (searched: " + candidates.join(", ") + ")");
    }
    this.worker = new wt.Worker(workerPath, { workerData: { sab: this.sab } });
    this.worker.on("error", (err: unknown) => {
      // Surface worker crashes as a DONE with errno=EINVAL so a pending
      // wait() doesn't hang forever.
      this.i32[I_RET] = -1;
      this.i32[I_ERR] = 22; // EINVAL
      Atomics.store(this.i32, I_STATE, S_DONE);
      Atomics.notify(this.i32, I_STATE);
      void err;
    });
    // Don't keep the process alive just because of the bridge worker.
    try { this.worker.unref(); } catch { /* non-unref-able in old Node — fine */ }
  }

  /** Close the worker. Idempotent. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    try { this.worker.postMessage({ shutdown: true }); } catch { /* */ }
    try { this.worker.terminate(); } catch { /* */ }
  }

  /** Run one RPC. Reset header, deposit args, kick worker, Atomics.wait, read. */
  private rpc(
    op: number,
    fd: number,
    arg0: number,
    family: number,
    port: number,
    addr: string,
    payload: Uint8Array | null,
  ): BridgeResult {
    // Reset header.
    for (let i = 0; i < HEADER_I32S; i++) this.i32[i] = 0;
    this.i32[I_OPCODE] = op;
    this.i32[I_FD] = fd;
    this.i32[I_ARG0] = arg0;
    this.i32[I_FAMILY] = family;
    this.i32[I_PORT] = port;
    // Lay out [addr][payload] in the data region.
    let off = HEADER_BYTES;
    let addrLen = 0;
    if (addr) {
      const enc = new TextEncoder().encode(addr);
      addrLen = enc.length;
      this.u8.set(enc, off);
      off += addrLen;
    }
    this.i32[I_ADDR_LEN] = addrLen;
    let payloadLen = 0;
    if (payload) {
      payloadLen = Math.min(payload.length, SAB_BYTES - off);
      this.u8.set(payload.subarray(0, payloadLen), off);
    }
    this.i32[I_DATALEN] = payloadLen;
    Atomics.store(this.i32, I_STATE, S_REQUESTED);
    // Kick: message wakes worker's event loop; we block on Atomics.wait.
    this.worker.postMessage({ kick: true });
    // Block until S_DONE. We don't use a timeout here — the translated-C
    // caller expects blocking semantics. A caller that needs a timeout
    // should install one at the C layer (select/poll/SO_RCVTIMEO — not yet
    // wired through this bridge).
    Atomics.wait(this.i32, I_STATE, S_REQUESTED);
    const ret = this.i32[I_RET] | 0;
    const err = this.i32[I_ERR] | 0;
    const dataLen = this.i32[I_DATALEN] | 0;
    const resp: BridgeResult = { ret };
    if (ret < 0) resp.err = err;
    if (dataLen > 0 && ret >= 0) {
      resp.data = this.u8.slice(HEADER_BYTES, HEADER_BYTES + dataLen);
    }
    const replyAddrLen = this.i32[I_ADDR_LEN] | 0;
    if (replyAddrLen > 0) {
      const raddr = new TextDecoder().decode(this.u8.subarray(HEADER_BYTES, HEADER_BYTES + replyAddrLen));
      resp.from = { family: this.i32[I_FAMILY] | 0, addr: raddr, port: this.i32[I_PORT] | 0 };
    }
    return resp;
  }

  // --- Public BSD-sockets surface ---

  createTcp(): BridgeResult { return this.rpc(OP_CREATE_TCP, 0, 0, 0, 0, "", null); }
  createUdp(): BridgeResult { return this.rpc(OP_CREATE_UDP, 0, 0, 0, 0, "", null); }
  bind(fd: number, addr: SockAddr): BridgeResult {
    return this.rpc(OP_BIND, fd, 0, addr.family, addr.port, addr.addr, null);
  }
  listen(fd: number, backlog: number): BridgeResult {
    return this.rpc(OP_LISTEN, fd, backlog, 0, 0, "", null);
  }
  accept(fd: number): BridgeResult { return this.rpc(OP_ACCEPT, fd, 0, 0, 0, "", null); }
  connect(fd: number, addr: SockAddr): BridgeResult {
    return this.rpc(OP_CONNECT, fd, 0, addr.family, addr.port, addr.addr, null);
  }
  send(fd: number, data: Uint8Array): BridgeResult {
    return this.rpc(OP_SEND, fd, 0, 0, 0, "", data);
  }
  recv(fd: number, n: number): BridgeResult {
    const capped = Math.min(n, SAB_BYTES - HEADER_BYTES);
    return this.rpc(OP_RECV, fd, capped, 0, 0, "", null);
  }
  sendto(fd: number, data: Uint8Array, addr: SockAddr): BridgeResult {
    return this.rpc(OP_SENDTO, fd, 0, addr.family, addr.port, addr.addr, data);
  }
  recvfrom(fd: number, n: number): BridgeResult {
    const capped = Math.min(n, SAB_BYTES - HEADER_BYTES);
    return this.rpc(OP_RECVFROM, fd, capped, 0, 0, "", null);
  }
  closeSocket(fd: number): BridgeResult {
    return this.rpc(OP_CLOSE, fd, 0, 0, 0, "", null);
  }
  shutdown(fd: number, how: number): BridgeResult {
    return this.rpc(OP_SHUTDOWN, fd, how, 0, 0, "", null);
  }
}

let _defaultBridge: NodeSyncBridge | null = null;

/**
 * Lazy singleton — constructed on first use, closed on process exit.
 * Tests may substitute by passing `new NodeSyncBridge()` to the consumer.
 */
export function getDefaultBridge(): NodeSyncBridge {
  if (_defaultBridge) return _defaultBridge;
  _defaultBridge = new NodeSyncBridge();
  try {
    // Tear down on exit — worker would otherwise keep the process alive.
    if (typeof process !== "undefined" && typeof process.on === "function") {
      process.on("exit", () => { try { _defaultBridge?.close(); } catch { /* */ } });
    }
  } catch { /* non-Node env */ }
  return _defaultBridge;
}

/** For tests / explicit teardown. */
export function resetDefaultBridge(): void {
  if (_defaultBridge) { _defaultBridge.close(); _defaultBridge = null; }
}

/**
 * Best-effort check: is this address "real" (non-loopback / non-wildcard)?
 * Loopback addresses are handled by the in-process NetworkStack; the bridge
 * is only engaged when we need to reach a real remote or when the caller
 * explicitly opts in via MIRAGE_NET_REAL=1.
 */
export function isRealHost(addr: string): boolean {
  if (!addr) return false;
  if (addr === "127.0.0.1" || addr === "::1") return false;
  if (addr === "0.0.0.0"   || addr === "::")  return false;
  if (addr === "localhost") return false;
  if (addr.startsWith("127."))  return false;
  return true;
}

/** Env-var opt-in for routing even loopback traffic through real Node sockets. */
export function realNetEnabled(): boolean {
  try {
    if (typeof process !== "undefined" && process.env && process.env.MIRAGE_NET_REAL) {
      const v = process.env.MIRAGE_NET_REAL;
      return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
    }
  } catch { /* */ }
  return false;
}
