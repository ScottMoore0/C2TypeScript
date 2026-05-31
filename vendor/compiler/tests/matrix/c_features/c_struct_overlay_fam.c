/* C17 §6.7.2.1 p18 — flexible array member access through a struct overlay
 * laid on top of a byte buffer. The FAM contributes 0 to sizeof, but its
 * effective storage extends from the end of the fixed members to the end
 * of the allocation. `sh->buf[i]` should observe the bytes immediately
 * after the fixed members.
 *
 * This is the canonical Redis-sds / Lua-Udata / varlena layout: header
 * fields followed by a contiguous payload.
 *
 * Item #7 in the overlay coverage list.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) Hdr {
  unsigned char tag;
  int len;
  unsigned char data[];
};

int main(void) {
  unsigned char store[64];
  memset(store, 0, sizeof store);

  struct Hdr *h = (struct Hdr *)store;
  h->tag = 0x77;
  h->len = 4;
  /* Write through FAM at offset 5 (1 + 4). */
  h->data[0] = 'a';
  h->data[1] = 'b';
  h->data[2] = 'c';
  h->data[3] = 'd';

  /* Read back through both views. */
  printf("tag=%u len=%d\n", (unsigned)h->tag, h->len);
  printf("fam=%c%c%c%c\n", h->data[0], h->data[1], h->data[2], h->data[3]);
  printf("raw=%c%c%c%c\n", store[5], store[6], store[7], store[8]);
  return 0;
}
