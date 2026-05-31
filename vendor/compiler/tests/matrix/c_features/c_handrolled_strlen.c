/* Hand-rolled strlen for spec correctness. */
#include <stdio.h>
#include <stddef.h>

size_t my_strlen(const char *s) {
  const char *p = s;
  while (*p) p++;
  return (size_t)(p - s);
}
int main(void) {
  printf("%zu %zu %zu\n", my_strlen(""), my_strlen("a"), my_strlen("hello"));
  return 0;
}
