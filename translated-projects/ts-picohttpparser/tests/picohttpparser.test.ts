/**
 * ts-picohttpparser reference-vector tests.
 *
 * Each test pins a specific protocol behaviour from RFC 7230 (HTTP/1.1
 * message syntax and routing) against the upstream picohttpparser's
 * documented contract. The expected values come from the C reference's
 * own test.c (h2o/picohttpparser test.c) plus first-principles RFC
 * reading — not from running the translation against itself.
 *
 * The picohttpparser API uses C-style out-parameters everywhere
 * (`int *minor_version`, `const char **method`, etc.). In the
 * translated TypeScript these become single-field box objects of the
 * form `{ value: T }`, and the parser writes back via `.value = X`.
 * Tests construct the boxes explicitly to make the calling convention
 * visible.
 */
import { test } from "node:test";
import { strictEqual, ok } from "node:assert";
import {
  phr_parse_request,
  phr_parse_response,
  phr_parse_headers,
  phr_decode_chunked,
  phr_decode_chunked_is_in_data,
  phr_chunked_decoder,
} from "../dist/index.js";

// Pack a JS string into the CPtr the parser consumes: { buf, off }.
function cptr(s: string): { buf: Uint8Array; off: number } {
  const buf = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return { buf, off: 0 };
}

// Read N bytes starting at the offset of a returned CPtr / sub-pointer.
function readN(c: any, n: number): string {
  if (c == null || n <= 0) return "";
  if (typeof c === "string") return c.slice(0, n);
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(c.buf[c.off + i]);
  return String.fromCharCode(...out);
}

// Allocate the headers array the parser writes into.
function makeHeaderSlots(n: number): any[] {
  const a: any[] = [];
  for (let i = 0; i < n; i++) {
    a.push({ name: null, name_len: 0, value: null, value_len: 0 });
  }
  return a;
}

test("phr_parse_request: minimal HTTP/1.1 GET parses cleanly", () => {
  const req = "GET /path HTTP/1.1\r\nHost: example.com\r\nUser-Agent: test\r\n\r\n";
  const buf = cptr(req);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(8);
  const num_headers = { value: 8 };

  const consumed = phr_parse_request(
    buf, req.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  strictEqual(consumed, req.length);
  strictEqual(readN(method.value, method_len.value), "GET");
  strictEqual(readN(path.value, path_len.value), "/path");
  strictEqual(minor_version.value, 1);
  strictEqual(num_headers.value, 2);
  strictEqual(readN(headers[0].name, headers[0].name_len), "Host");
  strictEqual(readN(headers[0].value, headers[0].value_len), "example.com");
  strictEqual(readN(headers[1].name, headers[1].name_len), "User-Agent");
  strictEqual(readN(headers[1].value, headers[1].value_len), "test");
});

test("phr_parse_request: HTTP/1.0 sets minor_version=0", () => {
  const req = "GET / HTTP/1.0\r\n\r\n";
  const buf = cptr(req);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: -1 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_request(
    buf, req.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  strictEqual(consumed, req.length);
  strictEqual(minor_version.value, 0);
  strictEqual(num_headers.value, 0);
});

test("phr_parse_request: partial input returns -2 (need more bytes)", () => {
  // Missing the terminating CRLFCRLF.
  const partial = "GET /path HTTP/1.1\r\nHost: example.com\r\n";
  const buf = cptr(partial);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_request(
    buf, partial.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  strictEqual(consumed, -2);
});

test("phr_parse_request: malformed (control char in header value) returns -1", () => {
  const bad = "GET /x HTTP/1.1\r\nBad: line\rwith-CR\r\n\r\n";
  const buf = cptr(bad);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_request(
    buf, bad.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  strictEqual(consumed, -1);
});

test("phr_parse_request: 9 headers exceeds num_headers=8 cap and returns -1", () => {
  const lines = [
    "GET / HTTP/1.1",
    "H1: 1", "H2: 2", "H3: 3", "H4: 4", "H5: 5",
    "H6: 6", "H7: 7", "H8: 8", "H9: 9",
    "", "",
  ];
  const req = lines.join("\r\n");
  const buf = cptr(req);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(8);
  const num_headers = { value: 8 };

  const consumed = phr_parse_request(
    buf, req.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  // The exact error code for "too many headers" per the upstream contract is -1.
  strictEqual(consumed, -1);
});

test("phr_parse_request: empty path '/' is accepted", () => {
  const req = "POST / HTTP/1.1\r\nContent-Length: 0\r\n\r\n";
  const buf = cptr(req);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_request(
    buf, req.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );

  strictEqual(consumed, req.length);
  strictEqual(readN(method.value, method_len.value), "POST");
  strictEqual(readN(path.value, path_len.value), "/");
});

test("phr_parse_response: 200 OK with one header parses cleanly", () => {
  const resp = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\n";
  const buf = cptr(resp);
  const minor_version = { value: 0 };
  const status = { value: 0 };
  const msg = { value: null };
  const msg_len = { value: 0 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_response(
    buf, resp.length,
    minor_version, status, msg, msg_len,
    headers, num_headers, 0,
  );

  strictEqual(consumed, resp.length);
  strictEqual(minor_version.value, 1);
  strictEqual(status.value, 200);
  strictEqual(readN(msg.value, msg_len.value), "OK");
  strictEqual(num_headers.value, 1);
  strictEqual(readN(headers[0].name, headers[0].name_len), "Content-Length");
  strictEqual(readN(headers[0].value, headers[0].value_len), "5");
});

test("phr_parse_response: 404 Not Found preserves the reason phrase", () => {
  const resp = "HTTP/1.1 404 Not Found\r\n\r\n";
  const buf = cptr(resp);
  const minor_version = { value: 0 };
  const status = { value: 0 };
  const msg = { value: null };
  const msg_len = { value: 0 };
  const headers = makeHeaderSlots(2);
  const num_headers = { value: 2 };

  const consumed = phr_parse_response(
    buf, resp.length,
    minor_version, status, msg, msg_len,
    headers, num_headers, 0,
  );

  strictEqual(consumed, resp.length);
  strictEqual(status.value, 404);
  strictEqual(readN(msg.value, msg_len.value), "Not Found");
});

test("phr_parse_headers: parses headers without a request line", () => {
  // phr_parse_headers expects raw header lines terminated by CRLFCRLF.
  const block = "Content-Type: text/plain\r\nContent-Length: 42\r\n\r\n";
  const buf = cptr(block);
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };

  const consumed = phr_parse_headers(buf, block.length, headers, num_headers, 0);

  strictEqual(consumed, block.length);
  strictEqual(num_headers.value, 2);
  strictEqual(readN(headers[0].name, headers[0].name_len), "Content-Type");
  strictEqual(readN(headers[0].value, headers[0].value_len), "text/plain");
  strictEqual(readN(headers[1].name, headers[1].name_len), "Content-Length");
  strictEqual(readN(headers[1].value, headers[1].value_len), "42");
});

test("phr_decode_chunked: single-chunk body decodes in place", () => {
  // "5\r\nhello\r\n0\r\n\r\n" -> "hello" + "0\r\n\r\n" trailing
  const enc = "5\r\nhello\r\n0\r\n\r\n";
  const buf = cptr(enc);
  const decoder = new phr_chunked_decoder();
  const bufsz = { value: enc.length };

  const result = phr_decode_chunked(decoder, buf, bufsz);

  // Non-negative result -> success; bufsz.value is the decoded length.
  ok(result >= 0, `expected non-negative decode result, got ${result}`);
  strictEqual(bufsz.value, 5);
  strictEqual(readN(buf, 5), "hello");
});

test("phr_decode_chunked: multi-chunk body is reassembled", () => {
  // "5\r\nhello\r\n6\r\n world\r\n0\r\n\r\n" -> "hello world"
  const enc = "5\r\nhello\r\n6\r\n world\r\n0\r\n\r\n";
  const buf = cptr(enc);
  const decoder = new phr_chunked_decoder();
  const bufsz = { value: enc.length };

  const result = phr_decode_chunked(decoder, buf, bufsz);

  ok(result >= 0, `expected non-negative decode result, got ${result}`);
  strictEqual(bufsz.value, 11);
  strictEqual(readN(buf, 11), "hello world");
});

test("phr_decode_chunked: incomplete input returns -2", () => {
  // Length-line incomplete; missing trailing CRLF after the size.
  const enc = "5\r\nhel";
  const buf = cptr(enc);
  const decoder = new phr_chunked_decoder();
  const bufsz = { value: enc.length };

  const result = phr_decode_chunked(decoder, buf, bufsz);

  strictEqual(result, -2);
});

test("phr_decode_chunked_is_in_data: falsy on a fresh decoder, truthy mid-chunk", () => {
  // The upstream documents the return as "returns if the chunked decoder
  // is in middle of chunked data" — a C-style truthiness flag. We test
  // truthiness, not strict 0/1, because emitted as C's `==`
  // expression as a JS boolean rather than coercing to int. The C
  // truthiness contract is preserved (false is C-zero-equivalent for
  // `if`-style use); only callers doing `=== 0` arithmetic would diverge.
  const decoder = new phr_chunked_decoder();
  ok(!phr_decode_chunked_is_in_data(decoder), "fresh decoder should be falsy");

  const enc = "10\r\nabc";
  const buf = cptr(enc);
  const bufsz = { value: enc.length };
  phr_decode_chunked(decoder, buf, bufsz);

  ok(phr_decode_chunked_is_in_data(decoder), "expected truthy after entering chunk data");
});

test("phr_parse_request: incremental reparse with last_len=0 each time still terminates", () => {
  // The C contract permits calling repeatedly with a growing buffer; passing
  // last_len=0 every time is wasteful but correct (re-scans from start). We
  // verify the partial->complete transition.
  const full = "GET /x HTTP/1.1\r\nHost: a\r\n\r\n";
  for (const prefixLen of [10, 20, full.length - 1]) {
    const buf = cptr(full.slice(0, prefixLen));
    const method = { value: null };
    const method_len = { value: 0 };
    const path = { value: null };
    const path_len = { value: 0 };
    const minor_version = { value: 0 };
    const headers = makeHeaderSlots(4);
    const num_headers = { value: 4 };

    const r = phr_parse_request(
      buf, prefixLen,
      method, method_len, path, path_len,
      minor_version, headers, num_headers, 0,
    );
    strictEqual(r, -2, `prefix len ${prefixLen} should be partial`);
  }
  // Now the full buffer parses.
  const buf = cptr(full);
  const method = { value: null };
  const method_len = { value: 0 };
  const path = { value: null };
  const path_len = { value: 0 };
  const minor_version = { value: 0 };
  const headers = makeHeaderSlots(4);
  const num_headers = { value: 4 };
  const r = phr_parse_request(
    buf, full.length,
    method, method_len, path, path_len,
    minor_version, headers, num_headers, 0,
  );
  strictEqual(r, full.length);
});
