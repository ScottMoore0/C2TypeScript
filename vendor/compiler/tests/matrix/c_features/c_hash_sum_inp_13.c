/* Hash sum of "abcdef". */
#include <stdio.h>
unsigned long hash(const char *s) {
  unsigned long h = 0;
  for (const char *p = s; *p; p++) h += (unsigned char)*p;
  return h;
}
int main(void) {
  printf("%lu\n", hash("abcdef"));
  return 0;
}
