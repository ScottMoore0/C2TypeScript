/* Cast int → size_t. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  int src = 42;
  size_t dst = (size_t)src;
  printf("%zu\n", dst);
  return 0;
}
