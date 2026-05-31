/* Hand-rolled strcmp for spec correctness. */
#include <stdio.h>
#include <stddef.h>

int my_strcmp(const char *a, const char *b) {
  while (*a && *a == *b) { a++; b++; }
  return (unsigned char)*a - (unsigned char)*b;
}
int main(void) {
  printf("%d %d %d\n",
    my_strcmp("a", "a") == 0 ? 1 : 0,
    my_strcmp("a", "b") < 0 ? 1 : 0,
    my_strcmp("b", "a") > 0 ? 1 : 0);
  return 0;
}
