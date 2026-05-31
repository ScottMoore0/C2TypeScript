/* Hash djb2 of "hello". */
#include <stdio.h>
unsigned long hash(const char *s) {
  unsigned long h = 5381;
  for (const char *p = s; *p; p++) h = ((h << 5) + h) + (unsigned char)*p;
  return h;
}
int main(void) {
  printf("%lu\n", hash("hello"));
  return 0;
}
