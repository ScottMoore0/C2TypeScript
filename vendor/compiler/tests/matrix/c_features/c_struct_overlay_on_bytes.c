/* C17 §6.7.2.1 (struct layout, alignment, packing) +
 *      §6.5 p7 (effective type / strict aliasing — char* may alias any object) +
 *      §6.3.2.3 p1 (void* convertible to/from any object pointer).
 *
 * Tests the "struct-overlaid-on-bytes" idiom used by Redis sds, Lua GC
 * headers, Postgres varlena, and many byte-buffer parsers. A raw byte
 * region is allocated (here: a sized array, mimicking malloc's storage),
 * a `(struct T *)bytes_ptr` cast is taken, and fields are written/read
 * through `sh->field`. The C program expects the writes to land in the
 * underlying bytes — and reads must observe both the typed-field view
 * AND the raw-byte view.
 *
 * Without overlay support, the translator's class-property model would
 * attach the writes to a JS property on a throwaway pointer wrapper,
 * losing them entirely. Overlay routes through the byte buffer.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) Hdr {
  unsigned char tag;
  int len;
};

int main(void) {
  unsigned char buf[16];
  memset(buf, 0, sizeof buf);

  struct Hdr *h = (struct Hdr *)buf;
  h->tag = 0xAB;
  h->len = 0x01020304;

  /* Read back through the typed view. */
  printf("tag=%u len=%d\n", (unsigned)h->tag, h->len);

  /* Read back the same bytes through the raw byte view — proves the
   * overlay actually wrote to buf. Layout (packed): tag at offset 0
   * (1 byte), len at offset 1 (4 bytes, little-endian on x86). */
  printf("b0=%u b1=%u b2=%u b3=%u b4=%u\n",
         (unsigned)buf[0], (unsigned)buf[1], (unsigned)buf[2],
         (unsigned)buf[3], (unsigned)buf[4]);

  /* Mutate through the byte view and read back through the typed view. */
  buf[1] = 0x10;
  buf[2] = 0x20;
  buf[3] = 0x30;
  buf[4] = 0x40;
  printf("after-byte-write len=%d\n", h->len);
  return 0;
}
