/* Hand-rolled memcpy for spec correctness. */
#include <stdio.h>
#include <stddef.h>

void *my_memcpy(void *d, const void *s, size_t n) {
  unsigned char *db = d;
  const unsigned char *sb = s;
  for (size_t i = 0; i < n; i++) db[i] = sb[i];
  return d;
}
int main(void) {
  int src[5] = { 10, 20, 30, 40, 50 };
  int dst[5];
  my_memcpy(dst, src, sizeof(src));
  for (int i = 0; i < 5; i++) printf("%d ", dst[i]);
  printf("\n");
  return 0;
}
