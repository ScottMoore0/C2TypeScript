/* C17 §6.7.6.2 array-of-pointers (T*[N]) decays to T** (§6.3.2.1) at the
 * call boundary. The translator must lift a JS-array-of-CPtrs to a
 * slot-bearing CPtr so callee-side arithmetic (++ inputs, *inputs) and
 * indexing (inputs[i]) both work. Mirrors BLAKE3's
 * compress_parents_parallel -> blake3_hash_many call shape.
 *
 * Verifies: callee walks the T** with post-increment + [0] deref and
 * sums the first byte of each pointee. */
#include <stdio.h>
#include <stdint.h>

static int sum_firsts(const uint8_t **arr, int n) {
  int s = 0;
  while (n > 0) {
    s += (int)arr[0][0];
    arr += 1;
    n -= 1;
  }
  return s;
}

int main(void) {
  uint8_t buf[16];
  for (int i = 0; i < 16; i++) buf[i] = (uint8_t)(i + 1);
  const uint8_t *p[4];
  for (int i = 0; i < 4; i++) p[i] = &buf[i * 4];
  /* p[0][0]=1, p[1][0]=5, p[2][0]=9, p[3][0]=13 -> 28. */
  printf("%d\n", sum_firsts(p, 4));
  return 0;
}
