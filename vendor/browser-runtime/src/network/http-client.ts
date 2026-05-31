// Prism M.7 — fetch-based HTTP client + SDL_net-style TCP socket stubs.
// In the browser: uses fetch() + WebSocket. In Node: uses global fetch when
// available (Node 18+), otherwise returns an error status.

import type { NetworkAdapter } from "../adapters.js";

function hasFetch(): boolean {
  const G: any = (globalThis as any);
  return typeof G.fetch === "function";
}

async function doFetch(url: string, init: any): Promise<{ status: number; body: Uint8Array; headers: Record<string, string> }> {
  const G: any = (globalThis as any);
  if (!hasFetch()) {
    const G2: any = G;
    if (!G2.__browserRuntimeSuppressFetchWarnings) {
      G2.__browserRuntimeSuppressFetchWarnings = true;
      try { (G.console ?? console).warn("[browser-runtime] FetchNetworkAdapter: fetch() unavailable — returning 0/empty"); } catch { /* ignore */ }
    }
    return { status: 0, body: new Uint8Array(0), headers: {} };
  }
  try {
    const resp = await G.fetch(url, init);
    const ab = await resp.arrayBuffer();
    const headers: Record<string, string> = {};
    // Iterate Headers-like object if present.
    if (resp.headers && typeof resp.headers.forEach === "function") {
      resp.headers.forEach((v: string, k: string) => { headers[k] = v; });
    }
    return { status: resp.status ?? 0, body: new Uint8Array(ab), headers };
  } catch {
    return { status: 0, body: new Uint8Array(0), headers: {} };
  }
}

/**
 * FetchNetworkAdapter — HTTP client backed by the Fetch API.
 * Spec: https://fetch.spec.whatwg.org/
 */
export class FetchNetworkAdapter implements NetworkAdapter {
  async httpGet(url: string, headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }> {
    const r = await doFetch(url, { method: "GET", headers });
    return { status: r.status, body: r.body };
  }
  async httpPost(url: string, body: Uint8Array, headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }> {
    const r = await doFetch(url, { method: "POST", body, headers });
    return { status: r.status, body: r.body };
  }
  async httpRequest(
    method: string, url: string, body?: Uint8Array, headers?: Record<string, string>
  ): Promise<{ status: number; body: Uint8Array; headers: Record<string, string> }> {
    return doFetch(url, { method, body, headers });
  }
}

// --- WebSocket client (SDL_net-equivalent for TCPsocket) ---

export interface WebSocketLike {
  readyState: number;
  send(data: string | ArrayBuffer | Uint8Array): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: string, listener: (ev: any) => void): void;
  removeEventListener(type: string, listener: (ev: any) => void): void;
}

export interface WSClient {
  send(data: string | Uint8Array): void;
  close(code?: number, reason?: string): void;
  onOpen(cb: () => void): void;
  onMessage(cb: (data: string | Uint8Array) => void): void;
  onClose(cb: (code: number, reason: string) => void): void;
  onError(cb: (err: unknown) => void): void;
  readonly readyState: number;
  readonly url: string;
}

/**
 * openWebSocket — browser WebSocket wrapper, or a stub in Node.
 * Spec: https://websockets.spec.whatwg.org/
 */
export function openWebSocket(url: string, protocols?: string | string[]): WSClient {
  const G: any = (globalThis as any);
  if (typeof G.WebSocket !== "function") {
    if (!G.__browserRuntimeSuppressWSWarnings) {
      G.__browserRuntimeSuppressWSWarnings = true;
      try { (G.console ?? console).warn("[browser-runtime] openWebSocket: WebSocket unavailable — returning stub"); } catch { /* ignore */ }
    }
    return makeStubWS(url);
  }
  const ws: WebSocketLike = protocols !== undefined ? new G.WebSocket(url, protocols) : new G.WebSocket(url);
  const listeners = { open: [] as Array<() => void>, message: [] as Array<(d: any) => void>, close: [] as Array<(c: number, r: string) => void>, error: [] as Array<(e: unknown) => void> };
  ws.addEventListener("open", () => listeners.open.forEach(cb => { try { cb(); } catch { /* ignore */ } }));
  ws.addEventListener("message", (ev: any) => {
    let data: string | Uint8Array = "";
    if (typeof ev.data === "string") data = ev.data;
    else if (ev.data instanceof ArrayBuffer) data = new Uint8Array(ev.data);
    else if (ev.data && typeof ev.data.byteLength === "number") data = new Uint8Array(ev.data);
    listeners.message.forEach(cb => { try { cb(data); } catch { /* ignore */ } });
  });
  ws.addEventListener("close", (ev: any) => listeners.close.forEach(cb => { try { cb(ev.code ?? 0, ev.reason ?? ""); } catch { /* ignore */ } }));
  ws.addEventListener("error", (ev: any) => listeners.error.forEach(cb => { try { cb(ev); } catch { /* ignore */ } }));
  return {
    get readyState() { return ws.readyState; },
    url,
    send(data: string | Uint8Array) {
      if (typeof data === "string") ws.send(data);
      else {
        // Copy view to a fresh ArrayBuffer so we never hand a SharedArrayBuffer
        // to WebSocket.send().
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        ws.send(copy.buffer);
      }
    },
    close(code?: number, reason?: string) { ws.close(code, reason); },
    onOpen(cb) { listeners.open.push(cb); },
    onMessage(cb) { listeners.message.push(cb); },
    onClose(cb) { listeners.close.push(cb); },
    onError(cb) { listeners.error.push(cb); },
  };
}

function makeStubWS(url: string): WSClient {
  // Matches WebSocket readyState constants (CONNECTING=0, OPEN=1, CLOSING=2, CLOSED=3).
  let rs = 3;
  return {
    url,
    get readyState() { return rs; },
    send(_d) { /* no-op */ },
    close(_c, _r) { rs = 3; },
    onOpen(_cb) { /* never opens */ },
    onMessage(_cb) { /* never */ },
    onClose(_cb) { /* never */ },
    onError(_cb) { /* never */ },
  };
}
