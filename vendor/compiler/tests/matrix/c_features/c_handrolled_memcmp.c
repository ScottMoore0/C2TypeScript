/* Hand-rolled memcmp for spec correctness. */
#include <stdio.h>
#include <stddef.h>

int my_memcmp(const void *a, const void *b, size_t n) {
  const unsigned char *pa = a, *pb = b;
  for (size_t i = 0; i < n; i++) if (pa[i] != pb[i]) return pa[i] - pb[i];
  return 0;
}
int main(void) {
  int a[3] = { 1, 2, 3 };
  int b[3] = { 1, 2, 3 };
  int c[3] = { 1, 2, 9 };
  printf("%d %d\n",
    my_memcmp(a, b, sizeof(a)) == 0 ? 1 : 0,
    my_memcmp(a, c, sizeof(a)) < 0 ? 1 : 0);
  return 0;
}
