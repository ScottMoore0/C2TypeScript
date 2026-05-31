/* djb2 string hash. */
#include <stdio.h>
unsigned long djb2(const char *s) {
  unsigned long h = 5381;
  int c;
  while ((c = (unsigned char)*s++)) h = ((h << 5) + h) + c;
  return h;
}
int main(void) {
  printf("%lu %lu %lu\n",
    djb2("hello"), djb2("world"), djb2(""));
  return 0;
}
