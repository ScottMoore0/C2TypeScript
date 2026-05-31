/* Hand-rolled memset for spec correctness. */
#include <stdio.h>
#include <stddef.h>

void *my_memset(void *p, int c, size_t n) {
  unsigned char *b = p;
  for (size_t i = 0; i < n; i++) b[i] = (unsigned char)c;
  return p;
}
int main(void) {
  char buf[10];
  my_memset(buf, 'X', 9);
  buf[9] = 0;
  printf("%s\n", buf);
  return 0;
}
