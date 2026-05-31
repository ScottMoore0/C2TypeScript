/* Hand-rolled strcpy for spec correctness. */
#include <stdio.h>
#include <stddef.h>

char *my_strcpy(char *dst, const char *src) {
  char *r = dst;
  while ((*dst++ = *src++)) {}
  return r;
}
int main(void) {
  char buf[16];
  my_strcpy(buf, "hello");
  printf("%s\n", buf);
  return 0;
}
