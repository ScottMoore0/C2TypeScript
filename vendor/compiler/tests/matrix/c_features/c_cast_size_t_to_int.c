/* Cast size_t → int. */
#include <stdio.h>
#include <stddef.h>
int main(void) {
  size_t src = 100;
  int dst = (int)src;
  printf("%d\n", dst);
  return 0;
}
