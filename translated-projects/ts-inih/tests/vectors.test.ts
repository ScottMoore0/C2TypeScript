/**
 * Authoritative reference vectors for ts-inih (Phase 2).
 *
 * Hand-authored TypeScript vectors against the public ts-inih API.
 * Source for vectors: https://github.com/benhoyt/inih/blob/master/tests/test_ini.c
 */

import { ini_parse_string } from '../index.js';

let pass = 0, fail = 0;
function expect(name: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { console.log(`  [OK]   ${name}`); pass++; }
  else    { console.log(`  [FAIL] ${name}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); fail++; }
}

// inih reads input via a stream-like callback that expects null-terminated
// bytes; the string overload takes a CPtr. We always include a trailing
// NUL so the C-style scanner sees end-of-input.
function cptr(s: string): { buf: Uint8Array; off: number } {
  const buf = new Uint8Array(s.length + 1);
  for (let i = 0; i < s.length; i++) buf[i] = s.charCodeAt(i);
  // buf[s.length] = 0 implicitly
  return { buf, off: 0 };
}

function cstr(c: any): string | null {
  if (c == null) return null;
  if (typeof c === 'string') return c;
  if (c.buf && typeof c.off === 'number') {
    let s = '';
    for (let i = c.off; i < c.buf.length && c.buf[i] !== 0; i++) {
      s += String.fromCharCode(c.buf[i]);
    }
    return s;
  }
  return String(c);
}

type Event = { section: string | null; name: string | null; value: string | null };

function parse(text: string): { rc: number; events: Event[] } {
  const events: Event[] = [];
  const handler = (_user: any, section: any, name: any, value: any): number => {
    events.push({ section: cstr(section), name: cstr(name), value: cstr(value) });
    return 1;
  };
  const rc = ini_parse_string(cptr(text), handler, null);
  return { rc, events };
}

console.log('ts-inih reference vectors\n');

// V1. single section, single key
{
  const { rc, events } = parse('[section]\nkey=value\n');
  expect('V1.rc=0',           rc, 0);
  expect('V1.events count',   events.length, 1);
  expect('V1.event[0]',       events[0], { section: 'section', name: 'key', value: 'value' });
}

// V2. multi-section, multi-key
{
  const text = '[a]\nx=1\ny=2\n[b]\nz=3\n';
  const { rc, events } = parse(text);
  expect('V2.rc=0',         rc, 0);
  expect('V2.events count', events.length, 3);
  expect('V2.events',       events, [
    { section: 'a', name: 'x', value: '1' },
    { section: 'a', name: 'y', value: '2' },
    { section: 'b', name: 'z', value: '3' },
  ]);
}

// V3. comments are ignored
{
  // Comments may be ; or # depending on configuration; semicolons are
  // always supported. Use ; to be safe.
  const text = '; this is a comment\n[s]\nk=v\n';
  const { rc, events } = parse(text);
  expect('V3.rc=0',         rc, 0);
  expect('V3.events count', events.length, 1);
  expect('V3.event[0]',     events[0], { section: 's', name: 'k', value: 'v' });
}

// V4. trailing whitespace around values is trimmed by inih
{
  const text = '[s]\nkey   =   value with spaces   \n';
  const { rc, events } = parse(text);
  expect('V4.rc=0',         rc, 0);
  expect('V4.events count', events.length, 1);
  expect('V4.name',         events[0].name,    'key');
  expect('V4.value',        events[0].value,   'value with spaces');
}

// V5. key with no section yields empty section name
{
  const text = 'orphan=yes\n';
  const { rc, events } = parse(text);
  expect('V5.rc=0',          rc, 0);
  expect('V5.events count',  events.length, 1);
  expect('V5.section empty', events[0].section, '');
  expect('V5.name',          events[0].name, 'orphan');
  expect('V5.value',         events[0].value, 'yes');
}

console.log(`\nTotal: ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
