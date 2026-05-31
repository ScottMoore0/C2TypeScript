/* Hash fnv of "abcde". */
#include <stdio.h>
unsigned long hash(const char *s) {
  unsigned long h = 2166136261u;
  for (const char *p = s; *p; p++) { h ^= (unsigned char)*p; h *= 16777619u; }
  return h;
}
int main(void) {
  printf("%lu\n", hash("abcde"));
  return 0;
}
