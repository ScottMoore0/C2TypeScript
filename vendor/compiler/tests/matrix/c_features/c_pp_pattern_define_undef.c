/* Preprocessor pattern: define_undef. */
#include <stdio.h>
int main(void) {
#define X 1
  printf("%d ", X);
#undef X
#define X 2
  printf("%d\n", X);

  return 0;
}
