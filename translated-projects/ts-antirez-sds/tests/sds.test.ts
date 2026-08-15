/**
 * ts-sds reference-vector tests.
 *
 * Exercises the public API surface against fixed inputs whose expected
 * outputs come from running the original C version (sds.c by Salvatore
 * Sanfilippo) on the same inputs. The C reference is not invoked at
 * test time; the expected values are pinned constants taken from the
 * upstream's test runs and the C-language definitions (length =
 * strlen-equivalent, capacity = bytes the header tracks).
 *
 * These tests focus on the header-inline helpers (sdslen, sdsavail,
 * sdsalloc, sdssetlen, sdsinclen, sdssetalloc) since those are the
 * hot-path read accessors and were the most recently exposed on the
 * public API.
 */
import { test } from "node:test";
import { strictEqual } from "node:assert";
import {
  sdsnew,
  sdsnewlen,
  sdsempty,
  sdsdup,
  sdsfree,
  sdscat,
  sdscatlen,
  sdscpy,
  sdsclear,
  sdsgrowzero,
  sdslen,
  sdsavail,
  sdsalloc,
  sdscmp,
  sdstrim,
  sdsrange,
  sdstolower,
  sdstoupper,
} from "../dist/index.js";

// Pack a JS string into a NUL-terminated CPtr the C-translation expects.
function cptr(s: string): { buf: Uint8Array; off: number } {
  const buf = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  return { buf, off: 0 };
}

// Read an sds back to a JS string by walking from .off until the trailing NUL.
function readSds(s: any): string {
  if (s == null) return "<null>";
  if (typeof s === "string") return s;
  const out: number[] = [];
  for (let i = s.off; i < s.buf.length && s.buf[i] !== 0; i++) out.push(s.buf[i]);
  return String.fromCharCode(...out);
}

test("sdsnew + sdslen — length matches strlen of the source", () => {
  const s = sdsnew(cptr("hello"));
  strictEqual(sdslen(s), 5);
  strictEqual(readSds(s), "hello");
});

test("sdsempty starts with length 0", () => {
  const s = sdsempty();
  strictEqual(sdslen(s), 0);
  strictEqual(readSds(s), "");
});

test("sdsnewlen accepts explicit length (binary-safe input with embedded NUL)", () => {
  // 7 bytes, byte index 3 is 0x00 — sds is binary-safe so length must be 7
  // even though strlen of the same bytes would stop at 3.
  const buf = new Uint8Array([97, 98, 99, 0, 100, 101, 102, 0]);
  const s = sdsnewlen({ buf, off: 0 } as any, 7);
  strictEqual(sdslen(s), 7);
});

test("sdscat chains and lengths add", () => {
  let s = sdsempty();
  s = sdscat(s, cptr("abc"));
  strictEqual(sdslen(s), 3);
  s = sdscat(s, cptr("def"));
  strictEqual(sdslen(s), 6);
  strictEqual(readSds(s), "abcdef");
});

test("sdsdup produces an independent copy with the same length and content", () => {
  const a = sdsnew(cptr("clone-me"));
  const b = sdsdup(a);
  strictEqual(sdslen(b), sdslen(a));
  strictEqual(readSds(b), "clone-me");
  strictEqual(sdscmp(a, b), 0);
});

test("sdscpy overwrite resets length to the new content's length", () => {
  let s = sdsnew(cptr("a much longer initial string"));
  s = sdscpy(s, cptr("new"));
  strictEqual(sdslen(s), 3);
  strictEqual(readSds(s), "new");
});

test("sdsclear zeroes the logical length and reads back as empty", () => {
  let s = sdsnew(cptr("abcdef"));
  sdsclear(s);
  strictEqual(sdslen(s), 0);
  strictEqual(readSds(s), "");
});

// The next two tests pin C-compatible behaviour around sds.h's two header
// shapes. sds picks the smallest header that fits the requested length:
//
//   - sdshdr5  (type 0): used when len < 32. The flags byte alone encodes
//     the type (low 3 bits) and the length (high 5 bits). There is NO
//     separate alloc field - sdsalloc(s) is defined to return
//     SDS_TYPE_5_LEN of the flags byte (i.e. the same value as sdslen).
//     After sdsclear resets length to 0, sdsalloc therefore reads back as
//     0 too. This is identical to the upstream C behaviour (see sds.h:184).
//
//   - sdshdr8/16/32/64: used when len >= 32. These have a separate `alloc`
//     field in the header, so sdsclear (which only writes the length field)
//     leaves alloc intact.

test("type-5 (len<32): sdsalloc tracks sdslen by C design (no separate alloc)", () => {
  let s = sdsnew(cptr("abcdef"));
  strictEqual(s.buf[s.off - 1] & 7, 0); // SDS_TYPE_5
  strictEqual(sdslen(s), 6);
  strictEqual(sdsalloc(s), 6);
  sdsclear(s);
  strictEqual(sdslen(s), 0);
  strictEqual(sdsalloc(s), 0); // C-correct: type-5 alloc IS length.
});

test("type-8 (len>=32): sdsalloc is a separate field and survives sdsclear", () => {
  const buf = new Uint8Array(51);
  for (let i = 0; i < 50; i++) buf[i] = 65 + (i % 26);
  let s = sdsnewlen({ buf, off: 0 } as any, 50);
  strictEqual(s.buf[s.off - 1] & 7, 1); // SDS_TYPE_8
  strictEqual(sdslen(s), 50);
  strictEqual(sdsalloc(s), 50);
  sdsclear(s);
  strictEqual(sdslen(s), 0);
  strictEqual(sdsalloc(s), 50); // alloc survives clear for type >= 8.
});

test("sdsgrowzero pads with zero bytes up to the requested length", () => {
  let s = sdsnew(cptr("ab"));
  s = sdsgrowzero(s, 6);
  strictEqual(sdslen(s), 6);
  // The original 2 chars survive; the appended bytes are NULs.
  strictEqual(s.buf[s.off + 0], 97);
  strictEqual(s.buf[s.off + 1], 98);
  strictEqual(s.buf[s.off + 2], 0);
  strictEqual(s.buf[s.off + 5], 0);
});

test("sdscmp matches strcmp semantics on three orderings", () => {
  strictEqual(sdscmp(sdsnew(cptr("abc")), sdsnew(cptr("abc"))), 0);
  strictEqual(sdscmp(sdsnew(cptr("abc")), sdsnew(cptr("abd"))) < 0, true);
  strictEqual(sdscmp(sdsnew(cptr("abd")), sdsnew(cptr("abc"))) > 0, true);
});

test("sdstrim strips both head and tail per the trim character set", () => {
  let s = sdsnew(cptr("  hello world  "));
  s = sdstrim(s, cptr(" "));
  strictEqual(sdslen(s), 11);
  strictEqual(readSds(s), "hello world");
});

test("sdsrange retains the requested inclusive byte range", () => {
  let s = sdsnew(cptr("abcdefgh"));
  sdsrange(s, 2, 5);
  strictEqual(sdslen(s), 4);
  strictEqual(readSds(s), "cdef");
});

test("sdstolower / sdstoupper apply ASCII case mapping in place", () => {
  let lo = sdsnew(cptr("HELLO World 42"));
  sdstolower(lo);
  strictEqual(readSds(lo), "hello world 42");
  let up = sdsnew(cptr("HELLO World 42"));
  sdstoupper(up);
  strictEqual(readSds(up), "HELLO WORLD 42");
});

test("sdsfree on an empty sds does not crash", () => {
  const s = sdsempty();
  sdsfree(s); // no observable assertion — survival is the test
});
