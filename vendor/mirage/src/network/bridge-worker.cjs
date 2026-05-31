/*
 * Node worker thread hosting real BSD-sockets for Mirage's node-sync bridge.
 *
 * Runs in a worker_threads Worker and communicates with the main thread via
 * a shared control block (SharedArrayBuffer) + Atomics.wait/notify. The main
 * thread writes a request, stores state=REQUESTED, calls notify + wait-on-DONE;
 * this worker reads the request, drives the async Node `net` / `dgram` APIs,
 * writes the result back, stores state=DONE, notifies. That lets blocking
 * POSIX-style recv()/accept()/connect() in translated C appear synchronous
 * even though Node sockets are fundamentally async.
 *
 * Protocol: see ./node-bridge.ts — all offsets are i32 indices into the SAB
 * viewed as an Int32Array.
 */
"use strict";

const { parentPort, workerData } = require("node:worker_threads");
const net = require("node:net");
const dgram = require("node:dgram");

// --- Protocol constants (must match node-bridge.ts exactly) ---
// State word values.
const S_IDLE       = 0;
const S_REQUESTED  = 1;
const S_DONE       = 2;
const S_SHUTDOWN   = 3;

// Opcodes.
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

// Header indices (Int32).
const I_STATE   = 0;
const I_OPCODE  = 1;
const I_FD      = 2;
const I_ARG0    = 3;  // int arg (e.g. backlog, family, type, protocol)
const I_ARG1    = 4;  // int arg
const I_ARG2    = 5;  // int arg
const I_ARG3    = 6;  // int arg
const I_RET     = 7;  // integer return
const I_ERR     = 8;  // errno on failure
const I_DATALEN = 9;  // bytes present in data region
const I_PORT    = 10; // sockaddr port
const I_FAMILY  = 11; // sockaddr family
// I_ADDR_LEN = 12: bytes of address string in data region, addr starts at
// DATA_OFFSET; buffer bytes follow.
const I_ADDR_LEN = 12;
const HEADER_I32S = 16;
const HEADER_BYTES = HEADER_I32S * 4;

// Errno constants (Linux ABI; match network.ts).
const EBADF        = 9;
const EAGAIN       = 11;
const EINVAL       = 22;
const ENOTCONN     = 107;
const ECONNREFUSED = 111;
const EADDRINUSE   = 98;

const sab = workerData.sab;
const i32 = new Int32Array(sab);
const u8  = new Uint8Array(sab);

/** Sockets registry keyed by fd. Each entry: { kind, socket, rxBuf, eof,
 *  peer (string), server, listeningQueue, bound, acceptQueue }. */
const sockets = new Map();
let nextFd = 10000;

function newFd() { return nextFd++; }

function writeAddr(family, addr, port) {
  const bytes = Buffer.from(addr, "utf8");
  const n = Math.min(bytes.length, sab.byteLength - HEADER_BYTES - 1);
  u8.set(bytes.subarray(0, n), HEADER_BYTES);
  i32[I_ADDR_LEN] = n;
  i32[I_FAMILY] = family;
  i32[I_PORT] = port;
}

function respond(ret, err) {
  i32[I_RET] = ret;
  i32[I_ERR] = err | 0;
  Atomics.store(i32, I_STATE, S_DONE);
  Atomics.notify(i32, I_STATE);
}

function pullRxBytes(entry, n) {
  // Concatenate pending chunks; pull up to n bytes.
  let total = 0;
  for (const c of entry.rxBuf) total += c.length;
  if (total === 0) return Buffer.alloc(0);
  const want = Math.min(n, total);
  const out = Buffer.alloc(want);
  let off = 0;
  while (off < want && entry.rxBuf.length > 0) {
    const head = entry.rxBuf[0];
    const take = Math.min(head.length, want - off);
    head.copy(out, off, 0, take);
    if (take === head.length) entry.rxBuf.shift();
    else entry.rxBuf[0] = head.subarray(take);
    off += take;
  }
  return out;
}

/** Node `net` error.code → POSIX errno (best-effort). */
function errnoFor(err) {
  if (!err) return EINVAL;
  const c = err.code || "";
  if (c === "ECONNREFUSED") return ECONNREFUSED;
  if (c === "EADDRINUSE")   return EADDRINUSE;
  if (c === "ENOTCONN")     return ENOTCONN;
  if (c === "EBADF")        return EBADF;
  return EINVAL;
}

// --- Per-op handlers ----------------------------------------------------

function opCreateTcp() {
  const fd = newFd();
  sockets.set(fd, {
    kind: "tcp",
    socket: null,           // net.Socket once connected/accepted
    server: null,           // net.Server for listeners
    rxBuf: [],
    eof: false,
    bound: null,            // { addr, port }
    acceptQueue: [],        // pending Socket instances (accepted, not yet taken)
    acceptWaiters: [],      // if accept called before conn arrives
    peer: null,
    error: null,
  });
  respond(fd, 0);
}

function opCreateUdp() {
  const fd = newFd();
  sockets.set(fd, {
    kind: "udp",
    socket: null,
    rxDatagrams: [],        // { from: {addr,port}, data: Buffer }
    bound: null,
    error: null,
  });
  respond(fd, 0);
}

function opBind(fd, family, port, addrLen) {
  const e = sockets.get(fd);
  if (!e) return respond(-1, EBADF);
  const addr = Buffer.from(u8.subarray(HEADER_BYTES, HEADER_BYTES + addrLen)).toString("utf8");
  if (e.kind === "udp") {
    const s = dgram.createSocket(family === 10 ? "udp6" : "udp4");
    s.on("message", (msg, rinfo) => {
      e.rxDatagrams.push({
        data: Buffer.from(msg),
        from: { addr: rinfo.address, port: rinfo.port, family: rinfo.family === "IPv6" ? 10 : 2 },
      });
    });
    s.on("error", (err) => { e.error = err; });
    s.bind(port, addr || undefined, () => {
      try {
        const ad = s.address();
        e.bound = { addr: ad.address, port: ad.port };
        e.socket = s;
        respond(0, 0);
      } catch (err) { respond(-1, errnoFor(err)); }
    });
    return;
  }
  // TCP: defer actual binding until listen(); record desired address.
  e.bound = { addr, port };
  respond(0, 0);
}

function opListen(fd, backlog) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "tcp") return respond(-1, EBADF);
  const server = net.createServer();
  server.on("connection", (sock) => {
    const childFd = newFd();
    const child = {
      kind: "tcp",
      socket: sock,
      server: null,
      rxBuf: [],
      eof: false,
      bound: { addr: sock.localAddress, port: sock.localPort },
      peer: { addr: sock.remoteAddress, port: sock.remotePort },
      error: null,
    };
    sock.on("data", (chunk) => {
      child.rxBuf.push(Buffer.from(chunk));
      // Wake any pending recv on this child via main-thread retry loop.
    });
    sock.on("end", () => { child.eof = true; });
    sock.on("error", (err) => { child.error = err; child.eof = true; });
    sock.on("close", () => { child.eof = true; });
    sockets.set(childFd, child);
    e.acceptQueue.push(childFd);
    const w = e.acceptWaiters.shift();
    if (w) w();
  });
  server.on("error", (err) => { e.error = err; });
  const host = (e.bound && e.bound.addr) || "127.0.0.1";
  const port = (e.bound && e.bound.port) || 0;
  server.listen(port, host, () => {
    const ad = server.address();
    if (ad && typeof ad === "object") {
      e.bound = { addr: ad.address, port: ad.port };
    }
    e.server = server;
    respond(0, 0);
  });
}

function opAccept(fd) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "tcp" || !e.server) return respond(-1, EBADF);
  const complete = () => {
    const childFd = e.acceptQueue.shift();
    const child = sockets.get(childFd);
    if (child && child.peer) {
      writeAddr(e.bound && e.bound.addr && e.bound.addr.indexOf(":") >= 0 ? 10 : 2,
                child.peer.addr || "", child.peer.port || 0);
    }
    respond(childFd, 0);
  };
  if (e.acceptQueue.length > 0) return complete();
  // Wait until a connection arrives.
  e.acceptWaiters.push(complete);
}

function opConnect(fd, family, port, addrLen) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "tcp") return respond(-1, EBADF);
  const addr = Buffer.from(u8.subarray(HEADER_BYTES, HEADER_BYTES + addrLen)).toString("utf8");
  const sock = net.createConnection({ host: addr, port, family: family === 10 ? 6 : 4 });
  e.socket = sock;
  e.peer = { addr, port };
  sock.on("data", (chunk) => { e.rxBuf.push(Buffer.from(chunk)); });
  sock.on("end", () => { e.eof = true; });
  sock.on("error", (err) => { e.error = err; e.eof = true; });
  sock.on("close", () => { e.eof = true; });
  sock.once("connect", () => {
    e.bound = { addr: sock.localAddress, port: sock.localPort };
    respond(0, 0);
  });
  sock.once("error", (err) => {
    // If connect fails (before 'connect' fires), surface the error once.
    if (!e.bound) respond(-1, errnoFor(err));
  });
}

function opSend(fd, len) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "tcp" || !e.socket) return respond(-1, ENOTCONN);
  const data = Buffer.from(u8.subarray(HEADER_BYTES, HEADER_BYTES + len));
  e.socket.write(data, (err) => {
    if (err) respond(-1, errnoFor(err));
    else respond(len, 0);
  });
}

function opRecv(fd, n) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "tcp") return respond(-1, EBADF);
  const deliver = () => {
    if (e.rxBuf.length > 0) {
      const buf = pullRxBytes(e, n);
      u8.set(buf, HEADER_BYTES);
      i32[I_DATALEN] = buf.length;
      respond(buf.length, 0);
      return true;
    }
    if (e.eof) {
      i32[I_DATALEN] = 0;
      respond(0, 0);
      return true;
    }
    return false;
  };
  if (deliver()) return;
  // Wait for data via event loop.
  const onData = () => { if (deliver()) cleanup(); };
  const onEnd  = () => { if (deliver()) cleanup(); };
  const cleanup = () => {
    if (e.socket) {
      e.socket.removeListener("data", onData);
      e.socket.removeListener("end", onEnd);
      e.socket.removeListener("close", onEnd);
      e.socket.removeListener("error", onEnd);
    }
  };
  if (e.socket) {
    e.socket.on("data", onData);
    e.socket.on("end", onEnd);
    e.socket.on("close", onEnd);
    e.socket.on("error", onEnd);
  } else {
    // No socket attached — return EAGAIN.
    respond(-1, EAGAIN);
  }
}

function opSendto(fd, family, port, addrLen, dataLen) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "udp" || !e.socket) return respond(-1, EBADF);
  const addr = Buffer.from(u8.subarray(HEADER_BYTES, HEADER_BYTES + addrLen)).toString("utf8");
  const data = Buffer.from(u8.subarray(HEADER_BYTES + addrLen, HEADER_BYTES + addrLen + dataLen));
  e.socket.send(data, port, addr || undefined, (err) => {
    if (err) respond(-1, errnoFor(err));
    else respond(dataLen, 0);
  });
}

function opRecvfrom(fd, n) {
  const e = sockets.get(fd);
  if (!e || e.kind !== "udp") return respond(-1, EBADF);
  const deliver = () => {
    const dg = e.rxDatagrams.shift();
    if (!dg) return false;
    const take = Math.min(n, dg.data.length);
    u8.set(dg.data.subarray(0, take), HEADER_BYTES);
    i32[I_DATALEN] = take;
    writeAddr(dg.from.family, dg.from.addr, dg.from.port);
    respond(take, 0);
    return true;
  };
  if (deliver()) return;
  // Wait on dgram 'message' (synthetic via polling-free on-event hook).
  const s = e.socket;
  if (!s) return respond(-1, EBADF);
  const tick = () => {
    if (deliver()) {
      s.removeListener("message", tick);
    }
  };
  s.on("message", tick);
}

function opClose(fd) {
  const e = sockets.get(fd);
  if (!e) return respond(-1, EBADF);
  try { if (e.socket) e.socket.destroy && e.socket.destroy(); } catch (_) {}
  try { if (e.server) e.server.close(); } catch (_) {}
  sockets.delete(fd);
  respond(0, 0);
}

function opShutdown(fd, how) {
  const e = sockets.get(fd);
  if (!e) return respond(-1, EBADF);
  if (e.socket && (how === 1 || how === 2)) {
    try { e.socket.end(); } catch (_) {}
  }
  respond(0, 0);
}

// --- Dispatch loop -----------------------------------------------------
// The worker does NOT busy-loop. It waits on parentPort messages from the
// main thread. Main thread sends { kick: true } after setting the SAB
// header. We then read the opcode, dispatch (which may itself be async),
// and eventually call respond() which notifies the main thread.

parentPort.on("message", (msg) => {
  if (msg && msg.shutdown) {
    Atomics.store(i32, I_STATE, S_SHUTDOWN);
    Atomics.notify(i32, I_STATE);
    try { parentPort.close(); } catch (_) {}
    return;
  }
  if (!msg || !msg.kick) return;
  const op = i32[I_OPCODE];
  const fd = i32[I_FD];
  try {
    switch (op) {
      case OP_CREATE_TCP:  return opCreateTcp();
      case OP_CREATE_UDP:  return opCreateUdp();
      case OP_BIND:        return opBind(fd, i32[I_FAMILY], i32[I_PORT], i32[I_ADDR_LEN]);
      case OP_LISTEN:      return opListen(fd, i32[I_ARG0]);
      case OP_ACCEPT:      return opAccept(fd);
      case OP_CONNECT:     return opConnect(fd, i32[I_FAMILY], i32[I_PORT], i32[I_ADDR_LEN]);
      case OP_SEND:        return opSend(fd, i32[I_DATALEN]);
      case OP_RECV:        return opRecv(fd, i32[I_ARG0]);
      case OP_SENDTO:      return opSendto(fd, i32[I_FAMILY], i32[I_PORT], i32[I_ADDR_LEN], i32[I_DATALEN]);
      case OP_RECVFROM:    return opRecvfrom(fd, i32[I_ARG0]);
      case OP_CLOSE:       return opClose(fd);
      case OP_SHUTDOWN:    return opShutdown(fd, i32[I_ARG0]);
      default:             return respond(-1, EINVAL);
    }
  } catch (err) {
    respond(-1, errnoFor(err));
  }
});
