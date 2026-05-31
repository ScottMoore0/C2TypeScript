/* C17 §7.22.3.4 malloc with (size_t)-cast multiplicative arithmetic.
 * Pattern common in defensive C: cast operand to size_t before
 * multiplying to avoid 32-bit overflow on 64-bit platforms.
 * The translator must coerce a BigInt-shaped size back to Number
 * at the malloc/cptr_create boundary.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stddef.h>
#include <stdint.h>
int main(void) {
  int n = 16;
  /* (size_t) cast triggers BigInt path on uint64-host translators. */
  size_t bytes = (size_t)n * sizeof(int);
  int *p = malloc(bytes);
  for (int i = 0; i < n; i++) p[i] = i + 1;
  /* calloc with (size_t) too. */
  size_t count = (size_t)n;
  int *q = calloc(count, sizeof(int));
  for (int i = 0; i < n; i++) q[i] = p[i] * 2;
  int sum_p = 0, sum_q = 0;
  for (int i = 0; i < n; i++) { sum_p += p[i]; sum_q += q[i]; }
  printf("bytes=%zu sum_p=%d sum_q=%d\n", bytes, sum_p, sum_q);
  free(p);
  free(q);
  return 0;
}
