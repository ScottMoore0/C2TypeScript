/* C17 §7.22.3.5 realloc with (uint64_t)-cast size arithmetic.
 * Pattern lifted from Redis intset.c:107 where size is computed via
 * `uint64_t size = (uint64_t)len * encoding;` then fed to realloc.
 * The translator emits the (uint64_t) cast as BigInt, which must be
 * coerced back to Number at the realloc/cptr_realloc boundary.
 */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
int main(void) {
  uint32_t len = 8;
  uint32_t encoding = 4;
  /* (uint64_t) cast forces 64-bit arithmetic; translator emits BigInt. */
  uint64_t size = (uint64_t)len * encoding;
  /* feed BigInt-shaped size into realloc. */
  int *p = malloc(size);
  for (uint32_t i = 0; i < len; i++) p[i] = (int)(i * 10);
  /* grow via realloc with another (uint64_t) size. */
  uint64_t new_size = (uint64_t)(len * 2) * encoding;
  p = realloc(p, new_size);
  /* preserved values intact. */
  int sum = 0;
  for (uint32_t i = 0; i < len; i++) sum += p[i];
  printf("size=%llu new_size=%llu sum=%d\n",
         (unsigned long long)size, (unsigned long long)new_size, sum);
  free(p);
  return 0;
}
