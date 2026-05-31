/* C17 §6.7.2.1 p16 + §6.5.2.3 p3 + footnote 95 — union overlaid on bytes.
 * All members of a union share the same starting address. Writing one
 * member and reading another (or the same) re-interprets the same bytes
 * via different types. Common in network/file decoders that need to
 * read a multi-byte primitive AND its individual byte representation.
 *
 * Item #3 in the overlay coverage list.
 */
#include <stdio.h>
#include <string.h>

union __attribute__((packed)) U {
  int i;
  unsigned char b[4];
};

int main(void) {
  unsigned char buf[8];
  memset(buf, 0, sizeof buf);

  union U *u = (union U *)buf;
  u->i = 0x11223344;

  /* Read back via the byte-array member — same bytes, different view. */
  printf("via-b: %u %u %u %u\n",
         (unsigned)u->b[0], (unsigned)u->b[1],
         (unsigned)u->b[2], (unsigned)u->b[3]);

  /* Write via the byte view; read via int. */
  u->b[0] = 0xDD; u->b[1] = 0xCC; u->b[2] = 0xBB; u->b[3] = 0xAA;
  printf("via-i: 0x%x\n", (unsigned)u->i);

  /* Confirm raw buf observes both writes. */
  printf("raw: %u %u %u %u\n",
         (unsigned)buf[0], (unsigned)buf[1],
         (unsigned)buf[2], (unsigned)buf[3]);
  return 0;
}
