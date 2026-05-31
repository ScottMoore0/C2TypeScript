// PC-8: Network stub — placeholder for fetch/WebSocket.
// v0.1.0: returns canned responses for testing.
// Browser version would use fetch() and WebSocket.

import type { NetworkAdapter } from "../adapters.js";

export class NetworkStub implements NetworkAdapter {
  private responses = new Map<string, { status: number; body: Uint8Array }>();

  /** Register a canned response for a URL (for testing). */
  setResponse(url: string, status: number, body: string | Uint8Array): void {
    const bytes = typeof body === "string" ? new TextEncoder().encode(body) : body;
    this.responses.set(url, { status, body: bytes });
  }

  async httpGet(url: string, _headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }> {
    const canned = this.responses.get(url);
    if (canned) return { status: canned.status, body: canned.body.slice() };
    return { status: 404, body: new TextEncoder().encode("Not Found") };
  }

  async httpPost(url: string, _body: Uint8Array, _headers?: Record<string, string>): Promise<{ status: number; body: Uint8Array }> {
    const canned = this.responses.get(url);
    if (canned) return { status: canned.status, body: canned.body.slice() };
    return { status: 404, body: new TextEncoder().encode("Not Found") };
  }
}
