/* Hash djb2 of "bar". */
#include <stdio.h>
unsigned long hash(const char *s) {
  unsigned long h = 5381;
  for (const char *p = s; *p; p++) h = ((h << 5) + h) + (unsigned char)*p;
  return h;
}
int main(void) {
  printf("%lu\n", hash("bar"));
  return 0;
}
