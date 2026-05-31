/* C17 §6.5 p7 — multiple struct overlays on the same byte region.
 * Two separate (struct *) views of the same buffer must observe each
 * other's writes, since they share underlying storage. This is the
 * dual-view pattern used by network-packet parsers (e.g. read header
 * via one struct, payload via another) and by union-of-views
 * implementations.
 *
 * Item #9 in the overlay coverage list.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) ViewA {
  unsigned char a0;
  unsigned char a1;
  int payload;
};

struct __attribute__((packed)) ViewB {
  unsigned short hdr;   /* covers a0 + a1 */
  unsigned char p0;     /* covers payload byte 0 */
  unsigned char p1;     /* covers payload byte 1 */
  unsigned char p2;     /* covers payload byte 2 */
  unsigned char p3;     /* covers payload byte 3 */
};

int main(void) {
  unsigned char buf[16];
  memset(buf, 0, sizeof buf);

  struct ViewA *a = (struct ViewA *)buf;
  struct ViewB *b = (struct ViewB *)buf;

  /* Write through A; observe through B. */
  a->a0 = 0x10;
  a->a1 = 0x20;
  a->payload = 0xDEADBEEF;

  printf("via-B hdr=0x%x p0=%u p1=%u p2=%u p3=%u\n",
         (unsigned)b->hdr & 0xFFFF,
         (unsigned)b->p0, (unsigned)b->p1, (unsigned)b->p2, (unsigned)b->p3);

  /* Write through B; observe through A. */
  b->hdr = 0xCAFE;
  b->p0 = 0x11; b->p1 = 0x22; b->p2 = 0x33; b->p3 = 0x44;

  printf("via-A a0=%u a1=%u payload=0x%x\n",
         (unsigned)a->a0, (unsigned)a->a1, (unsigned)a->payload);
  return 0;
}
