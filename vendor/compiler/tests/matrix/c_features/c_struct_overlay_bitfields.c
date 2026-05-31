/* C17 §6.7.2.1 p10–p11 — bit-field overlay on bytes.
 * A struct with bit-fields packs fields into a single storage unit;
 * the overlay must read/write each field via shift+mask on the
 * underlying bytes. GCC/Clang on x86-64 little-endian allocate bit 0
 * to the first declared field.
 *
 * Item #1 in the overlay coverage list.
 */
#include <stdio.h>
#include <string.h>

struct __attribute__((packed)) Flags {
  unsigned a : 3;
  unsigned b : 5;
  unsigned c : 8;
};

int main(void) {
  unsigned char buf[4];
  memset(buf, 0, sizeof buf);

  struct Flags *f = (struct Flags *)buf;
  f->a = 5;   /* 3 bits: 0b101 */
  f->b = 17;  /* 5 bits: 0b10001 */
  f->c = 0xCC;

  printf("a=%u b=%u c=%u\n", f->a, f->b, f->c);
  /* Layout (little-endian, packed): byte 0 = (b << 3) | a = (17 << 3) | 5 = 0x8D
   * byte 1 = c = 0xCC */
  printf("raw=%02x %02x\n", (unsigned)buf[0], (unsigned)buf[1]);
  return 0;
}
