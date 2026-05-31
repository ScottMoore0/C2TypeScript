/* __attribute__((aligned(N))) on struct fields and types. Affects
 * sizeof and member layout. Common in driver headers, SIMD-using code,
 * cacheline-aligned data structures.
 *
 * Note: this is a less-strict test than packed — we only verify that
 * sizeof reports an aligned-up size (alignment >= field's natural).
 */
#include <stdio.h>

struct A {
  char tag;
  int v __attribute__((aligned(8)));
};

int main(void) {
  printf("sizeof=%zu\n", sizeof(struct A));
  /* On x86-64 LP64, aligned(8) on int forces .v to offset 8;
   * struct sizeof rounds to alignof(struct) = 8 → total 16. */
  struct A a = { .tag = 'X', .v = 42 };
  printf("tag=%c v=%d\n", a.tag, a.v);
  return 0;
}
