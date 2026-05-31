/* C17 §6.7.9 (initialization), §6.5.3.2 (address-of), §6.7.6.2 (array
 * declarators). An array of pointers is value-initialized then each
 * element is assigned a pointer derived via &buf[i*4]. The translator
 * must lift the JS-array-of-CPtrs to a slot-bearing CPtr at any
 * cptr_clone/cptr_offset boundary so the T** view survives.
 *
 * Verifies: p[2][1] reads buf[9] when p[2] = &buf[8]. */
#include <stdio.h>
#include <stdint.h>

int main(void) {
  uint8_t buf[16];
  for (int i = 0; i < 16; i++) buf[i] = (uint8_t)(i + 100);
  const uint8_t *p[4];
  for (int i = 0; i < 4; i++) p[i] = &buf[i * 4];
  /* p[2] = &buf[8]; p[2][1] = buf[9] = 109. */
  printf("%d\n", (int)p[2][1]);
  return 0;
}
