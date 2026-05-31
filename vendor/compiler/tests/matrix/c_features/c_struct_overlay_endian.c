/* C17 §6.2.6.2 (object representation, byte order is implementation-defined).
 *
 * Verifies that multi-byte field overlay reads/writes match the host's
 * endianness. On x86 (little-endian), a 32-bit value 0xAABBCCDD lays down
 * as bytes DD CC BB AA. The TS overlay assumes little-endian (host order
 * on x86); this test locks that down so future changes don't silently
 * break network/file-format parsers that depend on host endianness.
 *
 * Item #8 in the overlay coverage list.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) Multi {
  short s;
  int i;
  long long ll;
};

int main(void) {
  unsigned char buf[32];
  memset(buf, 0, sizeof buf);

  struct Multi *m = (struct Multi *)buf;
  m->s = 0x4321;
  m->i = 0x11223344;
  /* Within 2^52 — JS Number-as-int64 representation is exact. */
  m->ll = 0x000A0B0C0D0E0F00LL;

  /* Read raw bytes — verifies layout is host-endian (little on x86). */
  printf("s: %02x %02x\n", buf[0], buf[1]);
  printf("i: %02x %02x %02x %02x\n", buf[2], buf[3], buf[4], buf[5]);
  printf("ll:%02x %02x %02x %02x %02x %02x %02x %02x\n",
         buf[6], buf[7], buf[8], buf[9], buf[10], buf[11], buf[12], buf[13]);

  /* Read back through the typed view. */
  printf("typed s=0x%x i=0x%x ll=0x%llx\n",
         (unsigned)m->s & 0xFFFF, m->i, (unsigned long long)m->ll);
  return 0;
}
